export function MWCaching() {
	function _GetArtistsFromTextRuns(runs) {
		if (runs === undefined) return []; // flexColumn only appears if collaborative album (eg teddy part2)

		let artistsData = [];

		for (let run of runs) {
			if (!run.navigationEndpoint) continue;

			let id = run.navigationEndpoint.browseEndpoint.browseId;
			let type = run.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType;

			if (type === "MUSIC_PAGE_TYPE_UNKNOWN" && id.match("^FEmusic_library_privately_owned_artist_detail")) {
				type = "MUSIC_PAGE_TYPE_ARTIST";
			};

			artistsData.push({
				name: run.text,
				id: id,
				type: type
			});
		};

		return artistsData;
	};


	function _GetArtistsFromDropdown(menuRenderer) {
		for (let item of menuRenderer.items) {
			if (!item.menuNavigationItemRenderer) continue;
			if (!item.menuNavigationItemRenderer.navigationEndpoint) continue;
			if (!item.menuNavigationItemRenderer.navigationEndpoint.browseEndpoint) continue;
			if (!item.menuNavigationItemRenderer.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs) continue;
			if (item.menuNavigationItemRenderer.navigationEndpoint.browseEndpoint
				.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType !== "MUSIC_PAGE_TYPE_ARTIST") continue;
			

			return [{
				id: item.menuNavigationItemRenderer.navigationEndpoint.browseEndpoint.browseId
			}];
		};
	};

	function _GetListIsSavedFromHeaderRenderer(headerRenderer) {
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

	function _GetDefaultDataForTwoRowItemRendererFromBrowsePageType(browsePageType) {
		let defaultData = {};

		if (browsePageType === "MUSIC_PAGE_TYPE_PRIVATELY_OWNED_CONTENT_LANDING_PAGE") {
			defaultData = {private: true};
		} else {
			defaultData = {private: false};
		};

		if (browsePageType === "MUSIC_PAGE_TYPE_LIBRARY_CONTENT_LANDING_PAGE" || // library
			browsePageType === "MUSIC_PAGE_TYPE_PRIVATELY_OWNED_CONTENT_LANDING_PAGE" // private releases
		) {
			defaultData = Object.assign(defaultData, {saved: true});
		};

		return defaultData;
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

	function _GetSongInfoFromListItemRenderer(listItemRenderer) {
		listItemRenderer = listItemRenderer.musicResponsiveListItemRenderer;
		if (!listItemRenderer) return;

		let thumb;
		if (listItemRenderer.thumbnail) {
			thumb = UChooseBestThumbnail(listItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails);
		};

		let songType = "SONG";
		if (listItemRenderer.overlay) {
			let playButton = listItemRenderer.overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer;

			if (playButton && playButton.playNavigationEndpoint) {
				songType = playButton.playNavigationEndpoint.watchEndpoint
					.watchEndpointMusicSupportedConfigs.watchEndpointMusicConfig.musicVideoType;
			};
		};

		let id;
		if (listItemRenderer.playlistItemData) {
			id = listItemRenderer.playlistItemData.videoId
		
		} else if (listItemRenderer.menu) {
			id = listItemRenderer.menu.menuRenderer.items[0].menuServiceItemRenderer.serviceEndpoint.playlistEditEndpoint.actions[0].removedVideoId;
		
		} else {
			console.log("CANNOT GET DATA FOR",listItemRenderer,"HAS DISPLAY POLICY AND NO MENU.");
			return;
			
		};

		let liked = null;
		if (listItemRenderer.menu && listItemRenderer.menu.menuRenderer && listItemRenderer.menu.menuRenderer.topLevelButtons) {
			liked = listItemRenderer.menu.menuRenderer.topLevelButtons[0].likeButtonRenderer.likeStatus;
		};

		let album = {};
		let albumListItem;

		// all for artist page singles shelf, col 2 = n plays, 3 = album
		for (let i = 2; i < listItemRenderer.flexColumns.length; i++) {
			albumListItem = listItemRenderer.flexColumns[i];
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

		let lengthStr;
		if (listItemRenderer.fixedColumns) {
			lengthStr = listItemRenderer.fixedColumns[0].musicResponsiveListItemFixedColumnRenderer.text.runs[0].text;
		};


		return {
			name:      		 listItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
			lengthStr: 		 lengthStr,
			artists:  		 _GetArtistsFromTextRuns(listItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs),
			index: 	  		(listItemRenderer.index || { runs: [ { } ] }).runs[0].text,
			badges:		    (listItemRenderer.badges || []).map(v => v.musicInlineBadgeRenderer.icon.iconType),
			album:			 album,
			thumb:			 thumb,
			id:				 id,
			type:			 songType,
			liked:			 liked,
			_DISPLAY_POLICY: listItemRenderer.musicItemRendererDisplayPolicy
		}
	};



	function _GetItemInfoFromTwoRowItemRenderer(twoRowItemRenderer, defaultData) {
		function __BaseListData() { // ALBUM or PLAYLIST
			return {
				name: twoRowItemRenderer.title.runs[0].text,
				thumb: UChooseBestThumbnail(twoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails),
				id: twoRowItemRenderer.navigationEndpoint.browseEndpoint.browseId,
				type: twoRowItemRenderer.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType,
				badges: (twoRowItemRenderer.subtitleBadges || []).map(v => v.musicInlineBadgeRenderer.icon.iconType)
			};
		};

		function __BaseArtistData() {
			return {
				name: twoRowItemRenderer.title.runs[0].text,
				thumb: UChooseBestThumbnail(twoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails),
				id: twoRowItemRenderer.navigationEndpoint.browseEndpoint.browseId,
				type: twoRowItemRenderer.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType
			};
		};
		
		twoRowItemRenderer = twoRowItemRenderer.musicTwoRowItemRenderer;
		if (!twoRowItemRenderer) return;

		let itemType;

		let browseEndpoint = twoRowItemRenderer.navigationEndpoint.browseEndpoint;
		if (browseEndpoint) {
			itemType = browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType;

		} else {
			let watchEndpoint = twoRowItemRenderer.navigationEndpoint.watchEndpoint;

			if (!watchEndpoint) {
				console.log("WHAT IS THIS? NO ENDPOINT?", twoRowItemRenderer);
				return;
			};

			itemType = watchEndpoint.watchEndpointMusicSupportedConfigs.watchEndpointMusicConfig.musicVideoType;
		};			

		if (itemType === "MUSIC_PAGE_TYPE_USER_CHANNEL") return undefined; // FOR NOW. DONT WANT TO SAVE THEM.
		if (itemType.match("^MUSIC_VIDEO_TYPE")) return undefined; // FOR NOW ISH..

		if (itemType === "MUSIC_PAGE_TYPE_ARTIST") {
			let baseData = __BaseArtistData();

			if (defaultData) {
				for (let [k,o] of Object.entries(defaultData)) {
					baseData[k] = o;
				};
			};

			return baseData;
		};

		let baseData = __BaseListData();
		let allData = UGetDataFromSubtitleRuns(baseData, twoRowItemRenderer.subtitle);

		if (allData.subType === "Song") return;

		if (defaultData) {
			for (let [k,o] of Object.entries(defaultData)) {
				// playlist isnt private only because its in private lib page. just contains some priv songs.
				// only apply default value to albums and artists.
				if (k === "private" && itemType === "MUSIC_PAGE_TYPE_PLAYLIST") continue;

				allData[k] = o;
			};
		};

		if (!allData.artists) { // send as artists from here, bkg converts -> artist.
			allData.artists = _GetArtistsFromDropdown(twoRowItemRenderer.menu.menuRenderer);
		};

		try {
			let playNavEndp = twoRowItemRenderer.thumbnailOverlay.musicItemThumbnailOverlayRenderer.content
				.musicPlayButtonRenderer.playNavigationEndpoint;

			allData.mfId = (playNavEndp.watchPlaylistEndpoint || playNavEndp.watchEndpoint).playlistId;

		} catch {};

		return allData;
	};


	function _CollectPlaylistData(response) {
		let data = response.contents.twoColumnBrowseResultsRenderer;

		let headerCont = data.tabs[0].tabRenderer.content.sectionListRenderer.contents[0]; // non-editable: musicResponsiveHeaderRenderer?
		let headerRenderer = headerCont.musicResponsiveHeaderRenderer || headerCont.musicEditablePlaylistDetailHeaderRenderer.header.musicResponsiveHeaderRenderer;
	
		if (!headerRenderer) return;

		let sectionListRenderer = data.secondaryContents.sectionListRenderer;
		let items = sectionListRenderer.contents[0].musicPlaylistShelfRenderer.contents || [];
		let cleanedItems = items.map( r => _GetSongInfoFromListItemRenderer(r) ).filter( v => v !== undefined );

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
		let cleanedItems = items.map( r => _GetSongInfoFromListItemRenderer(r) ).filter( v => v !== undefined );


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
		let cleanedItems = items.map( r => _GetSongInfoFromListItemRenderer(r) ).filter( v => v !== undefined );
		
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

		let songsShelf = _GetShelfFromTitle(shelves, "Songs");
		let albumsShelf = _GetShelfFromTitle(shelves, "Albums");
		let singlesShelf = _GetShelfFromTitle(shelves, "Singles and EPs");
		let libraryShelf = _GetShelfFromTitle(shelves, "From your library");
		let artistsShelf = _GetShelfFromTitle(shelves, "Fans might also like");

		let items = [];
		if (songsShelf) items.push(	 ...songsShelf.contents.map( r => _GetSongInfoFromListItemRenderer(r) ).filter( v => v !== undefined ));
		if (albumsShelf) items.push(	...albumsShelf.contents.map( r => _GetItemInfoFromTwoRowItemRenderer(r) ).filter( v => v !== undefined ));
		if (singlesShelf) items.push(...singlesShelf.contents.map( r => _GetItemInfoFromTwoRowItemRenderer(r) ).filter( v => v !== undefined ));
		if (libraryShelf) items.push(...libraryShelf.contents.map( r => _GetItemInfoFromTwoRowItemRenderer(r, { saved: true })).filter( v => v !== undefined ));
		if (artistsShelf) items.push(...artistsShelf.contents.map( r => _GetItemInfoFromTwoRowItemRenderer(r) ).filter( v => v !== undefined ));

		
		return {
			name: metaDataHost.title.runs[0].text,
			radios: {
				allSongsRadio: metaDataHost.playButton.buttonRenderer.navigationEndpoint.watchEndpoint.playlistId,
				allSongsPlId: songsShelf.title.runs[0].navigationEndpoint.browseEndpoint.browseId,
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

		let defaultData = _GetDefaultDataForTwoRowItemRendererFromBrowsePageType(response.browsePageType);

		let cleanedItems;

		if (gridRenderer) {
			cleanedItems = gridRenderer.map( r => _GetItemInfoFromTwoRowItemRenderer(r, defaultData) ).filter( v => v !== undefined );

		} else if (shelfRenderer) {
			cleanedItems = shelfRenderer.map( r => _GetArtistInfoFromLibraryShelfListItemRenderer(r) );

		};
		

		return { // ID AND CONTINUATIONDATA NOT NECESSARY HERE.
			type: response.browsePageType,
			items: cleanedItems
		};
	};

	function _CollectContinuationData(response) {
		let items = [];
		let hasContinuation = null;

		if (response.contents.appendContinuationItemsAction) {
			items = response.contents.appendContinuationItemsAction.continuationItems;
			hasContinuation = !!items[items.length - 1].continuationItemRenderer;

		} else if (response.contents.sectionListContinuation) {
			let contents = response.contents.sectionListContinuation.contents[0];

			if (contents.gridRenderer) {
				items = contents.gridRenderer.items;
				hasContinuation = !!contents.gridRenderer.continuations;

			} /*else if (contents.musicShelfRenderer) { THIS BAD, PLAYLIST PAGE, "SUGGESTIONS", GETS CONFUSED AND ADDS TO PLAYLIST CONTENTS
				items = contents.musicShelfRenderer.contents;
				hasContinuation = !!contents.musicShelfRenderer.continuations;

			};*/

		} else if (response.contents.gridContinuation) {
			items = response.contents.gridContinuation.items;
			hasContinuation = !!response.contents.gridContinuation.continuations;

		};

		if (items.length === 0) return;
		
		gathered = {
			id: response.browseId,
			type: response.browsePageType,
			items: [],
			_CONTINUATION_DATA: {
				itemsIsContinuation: true, // we're in the "if" statement of "if is continuation" :)
				itemsHasContinuation: hasContinuation
			}
		};

		let defaultData = _GetDefaultDataForTwoRowItemRendererFromBrowsePageType(response.browsePageType);

		for (let item of items) {
			if (item.musicResponsiveListItemRenderer) {
				gathered.items.push(_GetSongInfoFromListItemRenderer(item));

			} else if (item.musicTwoRowItemRenderer) {
				gathered.items.push(_GetItemInfoFromTwoRowItemRenderer(item, defaultData));

			} else if (!item.continuationItemRenderer) {
				console.log("WHAT is this item? [CachePageContents from continuation data]", response.browseId, item);
			
			};
		};

		return gathered;
	};


	window.CachePageContents = function(responseOrStateOrNone) {
		// provide: undefined to use polymerController.store.getState()
		//			state to use provided store.state
		//			response to use respBody of api call


		if (!responseOrStateOrNone) responseOrStateOrNone = polymerController.store.getState();

		let response = responseOrStateOrNone;

		if (responseOrStateOrNone.navigation && responseOrStateOrNone.navigation.mainContent) { // IS STATE
			browseIdOrNone = responseOrStateOrNone.navigation.mainContent.endpoint.data.browseId;

			response = {
				browseId: browseIdOrNone,
				browsePageType: UGetBrowsePageType(responseOrStateOrNone),
				responseIsContinuation: false, // polymerController always returns full state
				contents: responseOrStateOrNone.navigation.mainContent.response.contents
			};

			if (responseOrStateOrNone.navigation.mainContent.response.header) {
				response.contents.header = responseOrStateOrNone.navigation.mainContent.response.header;
			};

			if (responseOrStateOrNone.navigation.mainContent.response.microformat) {
				response.contents.microformat = responseOrStateOrNone.navigation.mainContent.response.microformat;
			};
		};

		console.log("response", response);


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

	window.CachePageContents();
};