export class CacheService {

	static GetDefaultDataForTRIRFromPageType(browsePageType) {
		const isSaved = browsePageType === "MUSIC_PAGE_TYPE_LIBRARY_CONTENT_LANDING_PAGE" || // library
			browsePageType === "MUSIC_PAGE_TYPE_PRIVATELY_OWNED_CONTENT_LANDING_PAGE";
		
		const isPrivate = browsePageType === "MUSIC_PAGE_TYPE_PRIVATELY_OWNED_CONTENT_LANDING_PAGE";
		
		return {saved: isSaved, private: isPrivate};
	};

	static GetListIsSavedFromHeaderRenderer(headerRenderer) {
		const saveToLibraryButton = (headerRenderer.buttons || []).filter( v => 
			v.toggleButtonRenderer?.defaultServiceEndpoint?.likeEndpoint !== undefined
		)?.[0];

		if (saveToLibraryButton) return !!saveToLibraryButton.toggleButtonRenderer?.isToggled;

		const editButton = headerRenderer.buttons.filter(v => 
			v.buttonRenderer?.navigationEndpoint?.playlistEditorEndpoint !== undefined
		)?.[0];

		return !!editButton;
	};

	static GetShelfFromTitle(shelves, title) {
		for (let shelf of shelves) {
			let foundTitle;

			if (shelf.musicShelfRenderer) {
				shelf = shelf.musicShelfRenderer;
				foundTitle = ext.SafeDeepGet(shelf, ext.Structures.titleText);

			} else if (shelf.musicCarouselShelfRenderer) {
				foundTitle = ext.SafeDeepGet(shelf, ext.Structures.headerTitleFromSectionListShelf());
				shelf = shelf.musicCarouselShelfRenderer;

			} else if (shelf.musicDescriptionShelfRenderer) {
				shelf = shelf.musicDescriptionShelfRenderer;
				foundTitle = shelf.header.runs[0].text;
			};

			if (foundTitle === title) return shelf;
		};
	};


	static GetArtistsFromTextRuns(runs) {
		if (!runs) return []; // COLUMN ONLY APPEARS IF IS COLLABORATIVE ALBUM.

		const artistsData = [];

		runs.forEach((run) => {
			const n = run.navigationEndpoint;
			if (!n) {
				if (run.text === ext.VARIOUS_ARTISTS_NAME) return [{id: ext.VARIOUS_ARTISTS_ID, name: ext.VARIOUS_ARTISTS_NAME}];
			};

			const id = ext.SafeDeepGet(n, ext.Structures.browseIdFromNavigationEndpoint);
			let type = ext.SafeDeepGet(n, ext.Structures.pageTypeFromOuterNavigationEndpoint());

			if (type === "MUSIC_PAGE_TYPE_UNKNOWN" && id.match("^FEmusic_library_privately_owned_artist_detail")) {
				type = "MUSIC_PAGE_TYPE_ARTIST";
			};

			artistsData.push({ name: run.text, id, type });
		});

		return artistsData;
	};

	static GetDataFromSubtitleRuns(runs) {
		if (!runs) return {};
		if (runs.runs) runs = runs.runs;
		runs.filter((v) => v.text !== ext.YT_DOT);

		const data = {};

		const navigables = runs.filter((v) => (v.navigationEndpoint !== undefined || v.text === ext.VARIOUS_ARTISTS_NAME))
			.map((v) => {
				if (v.text === ext.VARIOUS_ARTISTS_NAME) return {name: ext.VARIOUS_ARTISTS_NAME, id: ext.VARIOUS_ARTISTS_ID};
				
				let type = ext.SafeDeepGet(v.navigationEndpoint, ext.Structures.pageTypeFromOuterNavigationEndpoint());
				const id = ext.SafeDeepGet(v.navigationEndpoint, ext.Structures.browseIdFromNavigationEndpoint);

				if (ext.BrowsePageTypes.isUnknown(type)) type = ext.GetBrowsePageTypeFromBrowseId(id);
				return {name: v.text, id, type};
			});

		navigables.forEach((v) => {
			if (ext.BrowsePageTypes.isArtist(v.type)) (data.artists ??= []).push(v);
			else if (ext.BrowsePageTypes.isChannel(v.type)) data.creator = v.name;
			else if (ext.BrowsePageTypes.isRegularAlbum(v.type)) data.album = v;
		});
		
		const subType = runs.filter((v) => (!v.navigationEndpoint) && v.text.toLowerCase().match(ext.RELEASE_SUBTYPES_REGEX));
		data.subType = subType[0]?.text;

		const yearStr = runs.filter((v) => !v.navigationEndpoint && !isNaN(Number(v.text)));
		data.yearStr = yearStr[0]?.text;

		return data;
	};

	static GetArtistIdsFromMenuItems = (menuItems) => (menuItems || [])
		.filter( v => ext.BrowsePageTypes.isArtist( ext.SafeDeepGet(v, ext.Structures.pageTypeFromMenuNavigationItem()) ) )
		.map( v => ext.SafeDeepGet(v, ext.Structures.browseIdFromMenuNavigationEndpoint()) );

	static GetSelectedTab = (tabs) => (tabs.length === 1) ? tabs[0].tabRenderer : (tabs || []).filter( v => v.tabRenderer?.selected )[0]?.tabRenderer;


	static GetInfoFromLIR(lir) {
		if (lir.musicResponsiveListItemRenderer) lir = lir.musicResponsiveListItemRenderer;
		if (!lir) return;

		const thumbnails = ext.SafeDeepGet(lir, ext.Structures.thumbnailsFromThumbnail());
		const thumb = ext.ChooseBestThumbnail(thumbnails);

		const watchEndpoint = ext.SafeDeepGet(lir, ext.Structures.watchEndpointFromLIRDataPlayButton());
		const type = ext.SafeDeepGet(watchEndpoint, ext.Structures.videoTypeFromWatchEndpoint) || "SONG";

		const artistRuns = ext.SafeDeepGet(lir, ext.Structures.artistsFromAlbumLIR);
		const artists = this.GetDataFromSubtitleRuns(artistRuns)?.artists;//this.GetArtistsFromTextRuns(artistRuns);

		const badges = (lir.badges || []).map( v => ext.SafeDeepGet(v, ext.Structures.badgeIconFromBadge) );

		const name = ext.SafeDeepGet(lir, ext.Structures.titleTextFromLIR);
		const lengthStr = ext.SafeDeepGet(lir, ext.Structures.lengthStrFromLIRData);
		const liked = ext.SafeDeepGet(lir, ext.Structures.isLikedFromMenu);
		const index = ext.SafeDeepGet(lir, ext.Structures.indexFromLIR);

		let id, playlistSetVideoId;

		if (lir.playlistItemData) {
			id = lir.playlistItemData.videoId;
			playlistSetVideoId = lir.playlistItemData.playlistSetVideoId;
		
		} else if (lir.menu) {
			const menu = ext.SafeDeepGet(lir, ext.Structures.menuItems);
			id = ext.SafeDeepGet(menu?.[0], ext.Structures.serviceActionPlaylistEditEndpointFromMenuItem())?.removedVideoId;
		
		} else {
			fconsole.log(`CANNOT GET DATA FOR ${lir} HAS DISPLAY POLICY AND NO MENU.`);
			return;
		};

		let album;

		// ALL BECAUSE OF ARTIST PAGE TOP SONGS SHELF, col 2 = n plays, 3 = album
		for (let i = 2; i < lir.flexColumns.length; i++) {
			let albumListItem = lir.flexColumns[i];
			if (!albumListItem) break;
			
			albumListItem = albumListItem.musicResponsiveListItemFlexColumnRenderer.text;
			if (!albumListItem || !albumListItem.runs) break;
			
			albumListItem = albumListItem.runs[0];
			if (!albumListItem.navigationEndpoint) continue; 

			album = {
				name: albumListItem.text,
				id: albumListItem.navigationEndpoint.browseEndpoint.browseId
			};

			break;
		};

		return {
			name, lengthStr, artists, index, badges,
			album, thumb, id, type, liked, playlistSetVideoId,
			_displayPolicy: lir.musicItemRendererDisplayPolicy
		};
	};


	static GetInfoFromTRIR(trir, loadedPageType) {
		if (trir.musicTwoRowItemRenderer) trir = trir.musicTwoRowItemRenderer;
		if (!trir) return;

		const navEndp = trir.navigationEndpoint;
		let type;

		if (navEndp.browseEndpoint) type = ext.SafeDeepGet(navEndp, ext.Structures.pageTypeFromOuterNavigationEndpoint());
		else if (navEndp.watchEndpoint) type = ext.SafeDeepGet(navEndp, ext.Structures.videoTypeFromWatchEndpoint);
		else fconsole.error(`WHAT IS THIS navEndp FOR TRIR cache ${navEndp}`);			

		if (ext.BrowsePageTypes.isChannel(type)) return;
		if (ext.BrowsePageTypes.isVideo(type)) return;

		const thumbnails = ext.SafeDeepGet(trir, ext.Structures.thumbnailsFromThumbnailRenderer());
		const thumb = ext.ChooseBestThumbnail(thumbnails);

		const name = ext.SafeDeepGet(trir, ext.Structures.titleText);
		const id = ext.SafeDeepGet(trir.navigationEndpoint, ext.Structures.browseIdFromNavigationEndpoint);

		let data = { name, thumb, id, type };

		if (ext.BrowsePageTypes.isLibraryPage(loadedPageType)) data["saved"] = true;
		if (ext.BrowsePageTypes.isPrivatePage(loadedPageType) && !ext.BrowsePageTypes.isPlaylist(type)) data["private"] = true;


		if (ext.BrowsePageTypes.isArtist(type)) return data; // LEAVE

		const badges = (trir.subtitleBadges || []).map( v => ext.SafeDeepGet(v, ext.Structures.badgeIconFromBadge) );

		data = { ...data, badges, ...this.GetDataFromSubtitleRuns(trir.subtitle) };

		if (!data.artists) data.artists = this.GetArtistIdsFromMenuItems(ext.SafeDeepGet(trir, ext.Structures.menuItems));
		
		const playNavEndp = ext.SafeDeepGet(trir, ext.Structures.playButtonFromTRIRData())?.playNavigationEndpoint;
		data.mfId = (playNavEndp?.watchPlaylistEndpoint || playNavEndp?.watchEndpoint)?.playlistId;

		return data;
	};

	static GetInfoFromLibraryShelfLIR(lir) {
		if (lir.musicResponsiveListItemRenderer) lir = lir.musicResponsiveListItemRenderer;

		const thumbnails = ext.SafeDeepGet(lir, ext.Structures.thumbnailsFromThumbnail());
		const thumb = ext.ChooseBestThumbnail(thumbnails);
		
		const name = ext.SafeDeepGet(lir, ext.Structures.titleTextFromLIR);
		const id = lir.navigationEndpoint?.browseEndpoint.browseId;
		const type = ext.GetBrowsePageTypeFromBrowseId(id);

		return { name, thumb, id, type };
	};




	static CollectContinuationData(response) {
		function GetItems() {
			const appendItems = ext.SafeDeepGet(response, ext.Structures.continuationAppendItems);
			if (appendItems) return [appendItems, !!ext.ArrayNLast(items).continuationItemRenderer];

			const sectionList = ext.SafeDeepGet(response, ext.Structures.continuationSectionListGrid);
			if (sectionList) return [sectionList.items, !!sectionList.continuations];

			const grid = ext.SafeDeepGet(response, ext.Structures.continuationGrid);
			if (grid) return [grid.items, !!grid.continuations];

			return [[], null];
		};

		const [items, hasContinuation] = GetItems();
		if (items.length === 0) return;
		
		const gathered = {
			id: response.browseId,
			type: response.browsePageType,
			items: [],
			_ContinuationData: {
				itemsIsContinuation: true, // WE KNOW WE ARE. "CollectContinuationData"
				itemsHasContinuation: hasContinuation
			}
		};

		items.forEach((v) => {
			if (v.musicResponsiveListItemRenderer) gathered.items.push(this.GetInfoFromLIR(v));
			else if (v.musicTwoRowItemRenderer) gathered.items.push(this.GetInfoFromTRIR(v, response.browsePageType));
			else if (v.continuationItemRenderer) return;
			else fconsole.log(`WHAT IS THIS item FOR CONTINUATIONDATA ${response.browseId} ${v}`);
		});

		return gathered;
	};


	static CollectPlaylistData(response) {
		const headerRenderer = ext.SafeDeepGet(response, ext.Structures.listPageHeaderRenderer()) || ext.SafeDeepGet(response, ext.Structures.listPageHeaderRendererUserOwned());
		if (!headerRenderer) return;
		
		const allListItems = (ext.SafeDeepGet(response, ext.Structures.playlistListItems()) || []);
		const items = allListItems.map( v => this.GetInfoFromLIR(v) ).filter( v => v !== undefined );

		const thumbnails = ext.SafeDeepGet(headerRenderer, ext.Structures.thumbnailsFromThumbnail());
		const thumb = ext.ChooseBestThumbnail(thumbnails);

		const name = ext.SafeDeepGet(headerRenderer, ext.Structures.titleText);
		const creator = ext.SafeDeepGet(headerRenderer, ext.Structures.creatorNameFromFacepile);
		
		const subtitleData = this.GetDataFromSubtitleRuns(headerRenderer.subtitle.runs); // yearStr

		const saved = response.browseId === "VLLM" || this.GetListIsSavedFromHeaderRenderer(headerRenderer);
		const hasContinuation = !!(ext.ArrayNLast(allListItems)?.continuationItemRenderer);

		return {
			name, creator, thumb, saved, items,
			type: ext.BrowsePageTypes.playlist,
			id: response.browseId,
			_ContinuationData: {
				itemsIsContinuation: false, // THIS SCOPE ALWAYS CALLED FROM CachePage(store.state), WHICH IS ALWAYS FULL CONTENTS
				itemsHasContinuation: hasContinuation
			},
			...subtitleData
		};
	};


	static CollectAlbumData(response) {
		const headerRenderer = ext.SafeDeepGet(response, ext.Structures.listPageHeaderRenderer());
		if (!headerRenderer) return;

		const sectionListContents = ext.SafeDeepGet(response, ext.Structures.listPageItemsSectionRendererContents());

		const allListItems = (ext.SafeDeepGet(response, ext.Structures.albumListItems()) || []);
		const items = allListItems.map( v => this.GetInfoFromLIR(v) ).filter( v => v !== undefined );

		const defaultTRIRData = this.GetDefaultDataForTRIRFromPageType(ext.BrowsePageTypes.playlist);

		const alternate = [];
		sectionListContents.forEach((v, i) => {
			if (i === 0) return;

			const header = (ext.SafeDeepGet(v, ext.Structures.headerTitleFromSectionListShelf()) || "").toLowerCase();
			if (header !== ext.ALBUM_PAGE_ALT_CAROUSEL_TITLE) return;

			alternate.push(...(v.musicCarouselShelfRenderer.contents.map( r => this.GetInfoFromTRIR(r, defaultTRIRData) )));
		});

		const thumbnails = ext.SafeDeepGet(headerRenderer, ext.Structures.thumbnailsFromThumbnail());
		const thumb = ext.ChooseBestThumbnail(thumbnails);

		const name = ext.SafeDeepGet(headerRenderer, ext.Structures.titleText);

		const subtitleData = this.GetDataFromSubtitleRuns(headerRenderer.subtitle.runs); // subType, yearStr
		const artists = this.GetDataFromSubtitleRuns(headerRenderer.straplineTextOne?.runs)?.artists || [];

		if (artists.length !== 0 && headerRenderer.straplineThumbnail) {
			const artistThumbs = ext.SafeDeepGet(headerRenderer.straplineThumbnail, ext.Structures.thumbnailsFromMTR);
			artists[0].thumb = ext.ChooseBestThumbnail(artistThumbs);
		};

		const badges = (headerRenderer.subtitleBadge || []).map( v => ext.SafeDeepGet(v, ext.Structures.badgeIconFromBadge) );
		const saved = this.GetListIsSavedFromHeaderRenderer(headerRenderer);

		const mfId = (ext.SafeDeepGet(response, ext.Structures.mfUrlFromResponse) || "").replace("https://music.youtube.com/playlist?list=", "");
		const continuation = ext.SafeDeepGet(response, ext.Structures.continuationsFromListPage());
		
		return {
			name, artists, thumb, saved,
			items, badges, mfId, alternate,
			type: response.browsePageType,
			id: ext.BrowsePageTypes.album,
			private: false,
			_ContinuationData: {
				itemsIsContinuation: false, // THIS SCOPE ALWAYS CALLED FROM CachePage(store.state), WHICH IS ALWAYS FULL CONTENTS
				itemsHasContinuation: (continuation || []).length !== 0
			},
			...subtitleData
		};
	};


	static CollectPAlbumData(response) {
		const headerRenderer = response.header?.musicDetailHeaderRenderer;
		if (!headerRenderer) return;

		const allListItems = ext.SafeDeepGet(response, ext.Structures.privAlbumListItems());
		const items = allListItems.map( v => this.GetInfoFromLIR(v) ).filter( v => v !== undefined );

		const thumbnails = ext.SafeDeepGet(headerRenderer, ext.Structures.thumbnailsFromCroppedSquare);
		const thumb = ext.ChooseBestThumbnail(thumbnails);

		const subtitleData = this.GetDataFromSubtitleRuns(headerRenderer.subtitle.runs); // artists, subType, yearStr
		const name = ext.SafeDeepGet(headerRenderer, ext.Structures.titleText);
		
		return {
			name, thumb, items,
			type: ext.BrowsePageTypes.album,
			id: response.browseId,
			private: true,
			saved: true,			
			_ContinuationData: {
				itemsIsContinuation: false, // THIS SCOPE ALWAYS CALLED FROM CachePage(store.state), WHICH IS ALWAYS FULL CONTENTS
				itemsHasContinuation: false
			},
			...subtitleData
		};
	};

	
	static CollectArtistData(response) {
		const headerRenderer = response.header?.musicImmersiveHeaderRenderer;
		const loadedPageType = response.browsePageType;

		if (!headerRenderer) return;
		if (!headerRenderer.playButton) {
			fconsole.log("headerRenderer.playButton undefined, assuming is channel.. returning");
			return;
		};

		const shelves = ext.SafeDeepGet(response, ext.Structures.sectionListRendererFromSingleColumn)?.contents;

		const songsShelf = this.GetShelfFromTitle(shelves, "Songs") || this.GetShelfFromTitle(shelves, "Top songs");
		const albumsShelf = this.GetShelfFromTitle(shelves, "Albums");
		const singlesShelf = this.GetShelfFromTitle(shelves, "Singles and EPs");
		const libraryShelf = this.GetShelfFromTitle(shelves, "From your library");
		const artistsShelf = this.GetShelfFromTitle(shelves, "Fans might also like");

		const items = [
			...(songsShelf?.contents || []).map( v => this.GetInfoFromLIR(v) ),
			...(albumsShelf?.contents || []).map( v => this.GetInfoFromTRIR(v, loadedPageType) ),
			...(singlesShelf?.contents || []).map( v => this.GetInfoFromTRIR(v, loadedPageType) ),
			...(libraryShelf?.contents || []).map( v => this.GetInfoFromTRIR(v, loadedPageType) ),
			...(artistsShelf?.contents || []).map( v => this.GetInfoFromTRIR(v, loadedPageType) )
		].filter( v => v !== undefined );

		const thumbnails = ext.SafeDeepGet(headerRenderer, ext.Structures.thumbnailsFromThumbnail());
		const wideThumb = ext.ChooseBestThumbnail(thumbnails);

		const name = ext.SafeDeepGet(headerRenderer, ext.Structures.titleText);
		const saved = ext.SafeDeepGet(headerRenderer, ext.Structures.isSubscribedFromArtistHeaderRenderer);
		
		return {
			name, wideThumb, items, saved,
			radios: {
				allSongsRadio: headerRenderer.playButton?.buttonRenderer.navigationEndpoint.watchEndpoint.playlistId,
				allSongsPlId: (songsShelf) ? songsShelf.title.runs[0].navigationEndpoint.browseEndpoint.browseId : null,
				radioRadio: headerRenderer.startRadioButton?.buttonRenderer.navigationEndpoint.watchEndpoint.playlistId,
			},
			type: ext.BrowsePageTypes.artist,
			id: response.browseId,
			private: false,
			_ContinuationData: {
				itemsIsContinuation: false, // THIS SCOPE ALWAYS CALLED FROM CachePage(store.state), WHICH IS ALWAYS FULL CONTENTS
				itemsHasContinuation: false
			}
		};
	};

	static CollectGenericGridOrShelfData(response) {
		const tabs = response.contents?.singleColumnBrowseResultsRenderer?.tabs;
		const tab = this.GetSelectedTab(tabs);
		if (!tab) return;

		const content = tab.content?.sectionListRenderer?.contents?.[0];

		const gridRenderer = content?.gridRenderer ? content.gridRenderer.items : undefined;
		const shelfRenderer = content?.musicShelfRenderer ? content.musicShelfRenderer.contents : undefined;

		let items;

		if (gridRenderer) items = gridRenderer.map( r => this.GetInfoFromTRIR(r, response.browsePageType) );
		else if (shelfRenderer) items = shelfRenderer.map( r => this.GetInfoFromLibraryShelfLIR(r) );

		items = items.filter( v => v !== undefined);
		return { type: response.browsePageType, items };
	};


	/**
	 * 
	 * @param {*} response
	 * provide: `undefined` to use polymerController.store.getState(), your own store.state, or a response from an api call.
	 * @returns 
	 */
	static CachePageContents(response) {
		if (!response) response = polymerController.store.getState();
		if (response.navigation) { // IS POLYMERSTATE, MAKE IT LIKE A RESPONSE
			const browseId = ext.SafeDeepGet(response, ext.Structures.browseIdFromPolymerState());
			const mainContentResponse = ext.SafeDeepGet(response, ext.Structures.mainContentFromPolymerState);
			const browsePageType = ext.GetBrowsePageType(response);

			response = {
				browseId, browsePageType,
				responseIsContinuation: false, // POLYMER ALWAYS RETURNS FULL STATE
				contents: mainContentResponse.contents,
				header: mainContentResponse.header, // MOVED OTUSIDE CONTENTS
				microformat: mainContentResponse.microformat // MOVED OTUSIDE CONTENTS
			};
		};

		let gathered;
		const type = response.browsePageType;

		if (response.responseIsContinuation) gathered = this.CollectContinuationData(response);
		else if (ext.BrowsePageTypes.isPlaylist(type)) gathered = this.CollectPlaylistData(response);
		else if (ext.BrowsePageTypes.isRegularAlbum(type)) gathered = this.CollectAlbumData(response);
		else if (ext.BrowsePageTypes.isPrivAlbum(type)) gathered = this.CollectPAlbumData(response);
		else if (ext.BrowsePageTypes.isPublicArtist(type)) gathered = this.CollectArtistData(response);
		else if (ext.BrowsePageTypes.isGenericGrid(type)) gathered = this.CollectGenericGridOrShelfData(response);
		else fconsole.warn(`What is this value of store.getState() browsePageType for cachePage ${response.browsePageType}`);

		fconsole.log("gathered", gathered);
		if (!gathered) return;

		ext.DispatchEventToEW({
			func: "cache-data",
			data: gathered
		});
	};
};