export class CacheService {
	

	/*function _GetListIsSavedFromHeaderRenderer(headerRenderer) {
		let saveToLibraryButton = headerRenderer.buttons.filter(v => 
			v.toggleButtonRenderer !== undefined &&
			v.toggleButtonRenderer.defaultServiceEndpoint.likeEndpoint !== undefined
		);
		let saved = null;

		if (saveToLibraryButton.length > 0 && saveToLibraryButton[0].toggleButtonRenderer !== undefined) {
			saveToLibraryButton = saveToLibraryButton[0].toggleButtonRenderer;
			saved = saveToLibraryButton.isToggled;

		} else if (saveToLibraryButton.length === 0) {
			let editButton = headerRenderer.buttons.filter(v => 
				v.buttonRenderer !== undefined &&
				(v.buttonRenderer.navigationEndpoint && v.buttonRenderer.navigationEndpoint.playlistEditorEndpoint !== undefined)
			);

			if (editButton.length > 0) return true;
		};

		return saved;
	};


	function _GetShelfFromTitle(shelves, title) {
		for (let shelf of shelves) {
			let foundTitle;

			if (shelf.musicShelfRenderer) {
				shelf = shelf.musicShelfRenderer;
				foundTitle = shelf.title.runs[0].text;

			} else if (shelf.musicCarouselShelfRenderer) {
				shelf = shelf.musicCarouselShelfRenderer;
				foundTitle = shelf.header.musicCarouselShelfBasicHeaderRenderer.title.runs[0].text;

			} else if (shelf.musicDescriptionShelfRenderer) {
				shelf = shelf.musicDescriptionShelfRenderer;
				foundTitle = shelf.header.runs[0].text;
			};

			if (foundTitle === title) return shelf;
		};
	};

	



	function _CollectPlaylistData(response) {
		let data = response.contents.twoColumnBrowseResultsRenderer;

		let headerCont = data.tabs[0].tabRenderer.content.sectionListRenderer.contents[0]; // non-editable: musicResponsiveHeaderRenderer?
		let headerRenderer = headerCont.musicResponsiveHeaderRenderer || headerCont.musicEditablePlaylistDetailHeaderRenderer.header.musicResponsiveHeaderRenderer;
	
		if (!headerRenderer) return;

		let sectionListRenderer = data.secondaryContents.sectionListRenderer;
		let items = sectionListRenderer.contents[0].musicPlaylistShelfRenderer.contents || [];
		let cleanedItems = items.map( r => UGetSongInfoFromListItemRenderer(r) ).filter( v => v !== undefined );

		let last = items[items.length - 1] || {}
		let hasContinuation = !!last.continuationItemRenderer;

		let subtitle = headerRenderer.subtitle.runs;

		return {
			name: headerRenderer.title.runs[0].text,
			creator: headerRenderer.facepile.avatarStackViewModel.text.content,
			thumb: UChooseBestThumbnail(headerRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails),
			yearStr: subtitle[subtitle.length - 1].text,
			type: response.browsePageType,
			items: cleanedItems,
			saved: (response.browseId === "VLLM" || _GetListIsSavedFromHeaderRenderer(headerRenderer)),
			id: response.browseId,
			_CONTINUATION_DATA: {
				itemsIsContinuation: false, // this scope always called from CachePage(store.state), which is always full contents
				itemsHasContinuation: hasContinuation
			}
		};
	};


	function _CollectAlbumData(response) {
		let data = response.contents.twoColumnBrowseResultsRenderer;

		let metaDataHost = data.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicResponsiveHeaderRenderer;
		if (!metaDataHost) return;

		let sectionListRenderer = data.secondaryContents.sectionListRenderer.contents;
		let items = sectionListRenderer[0].musicShelfRenderer.contents;
		let cleanedItems = items.map( r => UGetSongInfoFromListItemRenderer(r) ).filter( v => v !== undefined );


		let alternate = [];
		if (
			sectionListRenderer[1] &&
			sectionListRenderer[1].musicCarouselShelfRenderer.header.musicCarouselShelfBasicHeaderRenderer.title.runs[0].text.toLowerCase() === "other versions"
		) {

			alternate = sectionListRenderer[1].musicCarouselShelfRenderer.contents.map(v => {
				v = v.musicTwoRowItemRenderer;

				let mfId;
				if (v.thumbnailOverlay) {
					let playButton = v.thumbnailOverlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer;

					if (playButton && playButton.playNavigationEndpoint) {
						mfId = playButton.playNavigationEndpoint.watchEndpoint.playlistId;
					};
				};

				return {
					name: v.title.runs[0].text,
					artist: {
						name: v.subtitle.runs[2].text,
						id: v.subtitle.runs[2].navigationEndpoint.browseEndpoint.browseId,
						type: "ARTIST"
					},
					thumb: UChooseBestThumbnail(v.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails),
					type: "ALBUM",
					private: false,
					subType: v.subtitle.runs[0].text,
					badges: (v.subtitleBadges || []).map(b => b.musicInlineBadgeRenderer.icon.iconType),
					id: v.navigationEndpoint.browseEndpoint.browseId,
					mfId: mfId
				};
			});
		};


		let artistName = metaDataHost.straplineTextOne.runs[0].text;

		let continuation = data.secondaryContents.sectionListRenderer.continuations;

		let mfId = response.contents.microformat.microformatDataRenderer.urlCanonical.replace("https://music.youtube.com/playlist?list=", "");
		
		return {
			name: metaDataHost.title.runs[0].text,
			artist: {
				name: artistName,
				id: (artistName === U_VARIOUS_ARTISTS) ? U_VARIOUS_ARTISTS_EXTID : metaDataHost.straplineTextOne.runs[0].navigationEndpoint.browseEndpoint.browseId,
				thumb: (artistName === U_VARIOUS_ARTISTS) ? null : UChooseBestThumbnail(metaDataHost.straplineThumbnail.musicThumbnailRenderer.thumbnail.thumbnails),
				type: "ARTIST"
			},
			thumb: UChooseBestThumbnail(metaDataHost.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails),
			yearStr: metaDataHost.subtitle.runs[2].text,
			type: response.browsePageType,
			subType: metaDataHost.subtitle.runs[0].text, // Album, EP
			badges: (metaDataHost.subtitleBadge || []).map(v => v.musicInlineBadgeRenderer.icon.iconType),
			items: cleanedItems,
			saved: _GetListIsSavedFromHeaderRenderer(metaDataHost),
			private: false,
			id: response.browseId,
			mfId: mfId,
			alternate: alternate,
			_FULL_CONTENTS: (continuation || []).length === 0
		};
	};


	function _CollectPAlbumData(response) {
		let data = response.contents.singleColumnBrowseResultsRenderer;

		let metaDataHost = response.contents.header.musicDetailHeaderRenderer;
		if (!metaDataHost) return;

		let sectionListRenderer = data.tabs[0].tabRenderer.content.sectionListRenderer;
		let items = sectionListRenderer.contents[0].musicShelfRenderer.contents;
		let cleanedItems = items.map( r => UGetSongInfoFromListItemRenderer(r) ).filter( v => v !== undefined );
		
		return {
			name: metaDataHost.title.runs[0].text,
			artist: {
				name: metaDataHost.subtitle.runs[2].text,
				id: metaDataHost.subtitle.runs[2].navigationEndpoint.browseEndpoint.browseId,
				type: "ARTIST",
				private: true
			},
			thumb: UChooseBestThumbnail(metaDataHost.thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails),
			yearStr: metaDataHost.subtitle.runs[4].text,
			type: "MUSIC_PAGE_TYPE_ALBUM",
			private: true,
			subType: metaDataHost.subtitle.runs[0].text, // Album, EP
			items: cleanedItems,
			saved: true,
			id: response.browseId,
			_FULL_CONTENTS: true
		};
	};

	
	function _CollectArtistData(response) {
		let data = response.contents.singleColumnBrowseResultsRenderer;

		let metaDataHost = response.contents.header.musicImmersiveHeaderRenderer;
		if (!metaDataHost) return;
		if (!metaDataHost.playButton) {
			console.log("metaDataHost.playButton undefined, assuming is channel.. returning");
			return;
		};

		let shelves = data.tabs[0].tabRenderer.content.sectionListRenderer.contents;

		let songsShelf = _GetShelfFromTitle(shelves, "Songs") || _GetShelfFromTitle(shelves, "Top songs");
		let albumsShelf = _GetShelfFromTitle(shelves, "Albums");
		let singlesShelf = _GetShelfFromTitle(shelves, "Singles and EPs");
		let libraryShelf = _GetShelfFromTitle(shelves, "From your library");
		let artistsShelf = _GetShelfFromTitle(shelves, "Fans might also like");

		let items = [];
		if (songsShelf) items.push(	 ...songsShelf.contents.map( r => UGetSongInfoFromListItemRenderer(r) ).filter( v => v !== undefined ));
		if (albumsShelf) items.push(	...albumsShelf.contents.map( r => UGetDataFromTwoRowItemRenderer(r) ).filter( v => v !== undefined ));
		if (singlesShelf) items.push(...singlesShelf.contents.map( r => UGetDataFromTwoRowItemRenderer(r) ).filter( v => v !== undefined ));
		if (libraryShelf) items.push(...libraryShelf.contents.map( r => UGetDataFromTwoRowItemRenderer(r, { saved: true })).filter( v => v !== undefined ));
		if (artistsShelf) items.push(...artistsShelf.contents.map( r => UGetDataFromTwoRowItemRenderer(r) ).filter( v => v !== undefined ));

		
		return {
			name: metaDataHost.title.runs[0].text,
			radios: {
				allSongsRadio: metaDataHost.playButton.buttonRenderer.navigationEndpoint.watchEndpoint.playlistId,
				allSongsPlId: (songsShelf) ? songsShelf.title.runs[0].navigationEndpoint.browseEndpoint.browseId : null,
				radioRadio: metaDataHost.startRadioButton.buttonRenderer.navigationEndpoint.watchEndpoint.playlistId,
			},
			wideThumb: UChooseBestThumbnail(metaDataHost.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails),
			type: "MUSIC_PAGE_TYPE_ARTIST",
			private: false,
			items: items,
			saved: metaDataHost.subscriptionButton.subscribeButtonRenderer.subscribed,
			id: response.browseId,
			_FULL_CONTENTS: true
		};
	};

	function _GetArtistInfoFromLibraryShelfListItemRenderer(listItemRenderer) {
		listItemRenderer = listItemRenderer.musicResponsiveListItemRenderer;
		
		let name = listItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
		let thumb = UChooseBestThumbnail(listItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails);
		let id = listItemRenderer.navigationEndpoint.browseEndpoint.browseId;
		let type = UGetBrowsePageTypeFromBrowseId(id);

		return {
			name: name,
			thumb: thumb,
			id: id,
			type: type
		}
	};


	function _CollectTwoRowDataFromGridRendererOrShelfRenderer(response, tab) {
		//let items = state.navigation.mainContent.response.contents.singleColumnBrowseResultsRenderer
		//	.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].gridRenderer.items;
		let content = tab.content.sectionListRenderer.contents[0];

		let gridRenderer = content.gridRenderer ? content.gridRenderer.items : undefined;
		let shelfRenderer = content.musicShelfRenderer ? content.musicShelfRenderer.contents : undefined;

		let defaultData = UGetDefaultDataForTwoRowItemRendererFromBrowsePageType(response.browsePageType);

		let cleanedItems;

		if (gridRenderer) {
			cleanedItems = gridRenderer.map( r => UGetDataFromTwoRowItemRenderer(r, defaultData) ).filter( v => v !== undefined );

		} else if (shelfRenderer) {
			cleanedItems = shelfRenderer.map( r => _GetArtistInfoFromLibraryShelfListItemRenderer(r) );

		};
		

		return { // ID AND CONTINUATIONDATA NOT NECESSARY HERE.
			type: response.browsePageType,
			items: cleanedItems
		};
	};*/

	static GetDefaultDataForTRIRFromPageType(browsePageType) {
		const isSaved = browsePageType === "MUSIC_PAGE_TYPE_LIBRARY_CONTENT_LANDING_PAGE" || // library
			browsePageType === "MUSIC_PAGE_TYPE_PRIVATELY_OWNED_CONTENT_LANDING_PAGE";
		
		const isPrivate = browsePageType === "MUSIC_PAGE_TYPE_PRIVATELY_OWNED_CONTENT_LANDING_PAGE";
		
		return {saved: isSaved, private: isPrivate};
	};


	static GetArtistsFromTextRuns(runs) {
		if (!runs) return []; // COLUMN ONLY APPEARS IF IS COLLABORATIVE ALBUM.

		const artistsData = [];

		runs.forEach((run) => {
			const n = run.navigationEndpoint;
			if (!n) return;

			const id = musicFixer.SafeDeepGet(n, musicFixer.SafeDeepGetRoutes.browseIdFromNavigationEndpoint);
			let type = musicFixer.SafeDeepGet(n, musicFixer.SafeDeepGetRoutes.pageTypeFromNavigationEndpoint);

			if (type === "MUSIC_PAGE_TYPE_UNKNOWN" && id.match("^FEmusic_library_privately_owned_artist_detail")) {
				type = "MUSIC_PAGE_TYPE_ARTIST";
			};

			artistsData.push({ name: run.text, id, type });
		});

		return artistsData;
	};


	static GetSongInfoFromLIR(lir) {
		if (lir.musicResponsiveListItemRenderer) lir = lir.musicResponsiveListItemRenderer;
		if (!lir) return;

		const thumbnails = musicFixer.SafeDeepGet(lir, musicFixer.SafeDeepGetRoutes.thumbnailsFromItem);
		const thumb = (thumbnails) ? musicFixer.ChooseBestThumbnail(thumbnails) : "";

		const watchEndpoint = musicFixer.SafeDeepGet(lir, musicFixer.SafeDeepGetRoutes.watchEndpointFromLIRDataPlayButton);
		const type = musicFixer.SafeDeepGet(watchEndpoint, musicFixer.SafeDeepGetRoutes.videoTypeFromWatchEndpoint) || "SONG";

		const name = musicFixer.SafeDeepGet(lir, musicFixer.SafeDeepGetRoutes.titleTextFromLIR);
		const lengthStr = musicFixer.SafeDeepGet(lir, musicFixer.SafeDeepGetRoutes.lengthStrFromLIRData);
		const artists = this.GetArtistsFromTextRuns(listItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs)
		const liked = musicFixer.SafeDeepGet(lir, musicFixer.SafeDeepGetRoutes.isLikedFromItem);


		let id, playlistSetVideoId;

		if (lir.playlistItemData) {
			id = lir.playlistItemData.videoId;
			playlistSetVideoId = lir.playlistItemData.playlistSetVideoId;
		
		} else if (lir.menu) {
			const menu = musicFixer.SafeDeepGet(lir, musicFixer.SafeDeepGetRoutes.firstMenuItem);
			id = musicFixer.SafeDeepGet(menu, musicFixer.SafeDeepGetRoutes.serviceActionPlaylistEditEndpointFromMenuItem)?.removedVideoId;
		
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
			name,
			lengthStr,
			artists:  		 ,
			index: 	  		(listItemRenderer.index || { runs: [ { } ] }).runs[0].text,
			badges:		    (listItemRenderer.badges || []).map(v => v.musicInlineBadgeRenderer.icon.iconType),
			album, thumb, id, type, liked, playlistSetVideoId,
			_DISPLAY_POLICY: lir.musicItemRendererDisplayPolicy
		}
	};







	static CollectContinuationData(response) {
		function GetItems() {
			const appendItems = musicFixer.SafeDeepGet(response, musicFixer.SafeDeepGetRoutes.continuationAppendItems);
			if (appendItems) return [appendItems, !!musicFixer.ArrayNLast(items).continuationItemRenderer];

			const sectionList = musicFixer.SafeDeepGet(response, musicFixer.SafeDeepGetRoutes.continuationSectionListGrid);
			if (sectionList) return [sectionList.items, !!sectionList.continuations];

			const grid = musicFixer.SafeDeepGet(response, musicFixer.SafeDeepGetRoutes.continuationGrid);
			if (grid) return [grid.items, !!grid.continuations];

			return [[], null];
		};

		function GetDataFromItem(item) {
			if (item.musicResponsiveListItemRenderer) retur 
		};


		const [items, hasContinuation] = GetItems();
		if (items.length === 0) return;
		
		const gathered = {
			id: response.browseId,
			type: response.browsePageType,
			items: [],
			_CONTINUATION_DATA: {
				itemsIsContinuation: true, // WE KNOW WE ARE. "CollectContinuationData"
				itemsHasContinuation: hasContinuation
			}
		};

		const defaultData = this.GetDefaultDataForTRIRFromPageType(response.browsePageType);

		items.forEach((v) => {
			const formatted;

			if (v.musicResponsiveListItemRenderer)
		})

		for (let item of items) {
			if (item.musicResponsiveListItemRenderer) {
				gathered.items.push(UGetSongInfoFromListItemRenderer(item));

			} else if (item.musicTwoRowItemRenderer) {
				gathered.items.push(UGetDataFromTwoRowItemRenderer(item, defaultData));

			} else if (!item.continuationItemRenderer) {
				console.log("WHAT is this item? [CachePageContents from continuation data]", response.browseId, item);
			
			};
		};

		return gathered;
	};


	static CachePageContents(responseOrStateOrNone) {
		// provide: undefined to use polymerController.store.getState()
		//			state to use provided store.state
		//			response to use respBody of api call


		if (!responseOrStateOrNone) responseOrStateOrNone = polymerController.store.getState();

		let response = responseOrStateOrNone;

		if (responseOrStateOrNone.navigation) { // IS POLYMERSTATE
			const browseIdOrNone = musicFixer.SafeDeepGet(response, musicFixer.SafeDeepGetRoutes.browseIdFromPolymerState);
			const mainContentResponse = musicFixer.SafeDeepGet(response, musicFixer.SafeDeepGetRoutes.mainContentFromPolymerState);

			response = {
				browseId: browseIdOrNone,
				browsePageType: musicFixer.GetBrowsePageType(responseOrStateOrNone),
				responseIsContinuation: false, // POLYMER ALWAYS RETURNS FULL STATE
				contents: mainContentResponse.contents,
				header: mainContentResponse.header, // MOVED OTUSIDE CONTENTS
				microformat: mainContentResponse.microformat // MOVED OTUSIDE CONTENTS
			};
		};

		let gathered, tab;
		let condition = response.browsePageType;

		if (response.responseIsContinuation) condition = "CONTINUATION";

		switch (condition) {
			case "CONTINUATION":
				gathered = _CollectContinuationData(response);
				break;

			case "MUSIC_PAGE_TYPE_PLAYLIST":
				gathered = _CollectPlaylistData(response);
				break;

			case "MUSIC_PAGE_TYPE_ALBUM":
				gathered = _CollectAlbumData(response);
				break;

			case "C_PAGE_TYPE_PRIVATE_ALBUM":
				gathered = _CollectPAlbumData(response);
				break;

			case "C_PAGE_TYPE_CHANNEL_OR_ARTIST":
			case "MUSIC_PAGE_TYPE_ARTIST":
				gathered = _CollectArtistData(response);
				break;

			case "MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY":
			//case "MUSIC_PAGE_TYPE_DOWNLOADS_CONTENT_LANDING_PAGE": // ("offlineItemSectionRenderer" not "gridRenderer", not doing it)
			case "MUSIC_PAGE_TYPE_LIBRARY_CONTENT_LANDING_PAGE":
			case "MUSIC_PAGE_TYPE_PRIVATELY_OWNED_CONTENT_LANDING_PAGE":
				tab = UGetSelectedTab(response.contents.singleColumnBrowseResultsRenderer.tabs);

				gathered = _CollectTwoRowDataFromGridRendererOrShelfRenderer(response, tab);
				break;

			default:
				console.warn("What is this value of store.getState() browsePageType for cachePage", response.browsePageType);
				break;
		};

		console.log("gathered", gathered);
		if (!gathered) return;

		UDispatchEventToEW({
			func: "cache-data",
			data: gathered
		});
	};
};