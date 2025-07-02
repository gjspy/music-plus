export function MWCaching() {
	

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

		let defaultData = UGetDefaultDataForTwoRowItemRendererFromBrowsePageType(response.browsePageType);

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

		//console.log("response", response);

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