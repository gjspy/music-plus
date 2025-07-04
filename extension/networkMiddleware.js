MiddlewareEditors = class MiddlewareEditors {
	static urlsToEdit = [
		"/youtubei/v1/browse",
		"/youtubei/v1/playlist/create",
		"/youtubei/v1/playlist/delete",
		"/youtubei/v1/like/like",
		"/youtubei/v1/like/removelike",
		"/youtubei/v1/next",
		"/youtubei/v1/player"
	];

	static _ShouldModifyURL(url) {
		for (let toEdit of this.urlsToEdit) {
			if (url.match(RegExp(`^${toEdit}`, "g"))) return true;
		};
	};

	static _GetDictOfButtonTypesFromOldAlbumPage(oldMenuRenderer) {
		let buttons = {topLevel: {}, menu: {}};

		for (let button of oldMenuRenderer.topLevelButtons) {
			let [k, v] = Object.entries(button)[0];

			if (v && v.icon && v.icon.iconType) {
				buttons.topLevel[v.icon.iconType] = button;
			} else if (v && v.accessibilityData) {
				buttons.topLevel[v.accessibilityData.accessibilityData.label] = button;
			} else {
				buttons.topLevel[k] = button;
			};

			//buttons.topLevel[Object.values(button)[0].icon.iconType] = button;
		};

		for (let button of oldMenuRenderer.items) {
			let [k, v] = Object.entries(button)[0];

			if (v && v.icon && v.icon.iconType) {
				buttons.menu[v.icon.iconType] = button;
			} else if (v && v.accessibilityData) {
				buttons.menu[v.accessibilityData.accessibilityData.label] = button;
			} else {
				buttons.menu[k] = button;
			};

			//buttons.menu[Object.values(button)[0].icon.iconType] = button;
		};

		return buttons;
	};

	static _ConvertOldAlbumPageToNew(response, id, cache) {
		let thumbnailRenderer = {
			thumbnail: {
				thumbnails: response.header.musicDetailHeaderRenderer.thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails
			},
			thumbnailCrop: "MUSIC_THUMBNAIL_CROP_UNSPECIFIED",
			thumbnailScale: "MUSIC_THUMBNAIL_SCALE_UNSPECIFIED"
		};


		let subtitleOneData = UGetDataFromSubtitleRuns({}, response.header.musicDetailHeaderRenderer.subtitle);
		let subtitleOneRuns = [];

		if (subtitleOneData.subType && subtitleOneData.yearStr) {
			subtitleOneRuns = [
				{text: subtitleOneData.subType}, 
				{text: U_YT_DOT},
				{text: subtitleOneData.yearStr}
			];

		} else if (subtitleOneData.subType) {
			subtitleOneRuns = [subtitleOneData.subType];

		} else if (subtitleOneData.yearStr) {
			subtitleOneRuns = [subtitleOneData.yearStr];

		};

		let creator = ((subtitleOneData.artists) ? subtitleOneData.artists[0] : undefined) || subtitleOneData.creator;
		let cachedCreator = cache[creator.id];

		// DOING COUNTERPART STUFF, LINK TO MAIN ARTIST PAGE
		if (cachedCreator.privateCounterparts && cachedCreator.privateCounterparts.length > 0) {

			for (let counterpart of cachedCreator.privateCounterparts) {
				if (!cache[counterpart]) continue;

				cachedCreator = cache[counterpart];
				break;
			};

		};

		let cachedCreatorThumb = (cachedCreator) ? cachedCreator.thumb : undefined; 

		let straplineTextOne = {};
		let straplineThumbnail = {};


		if (creator) {
			straplineTextOne = {
				runs: [
					{
						text: (cachedCreator || creator).name
					}
				]
			}

			if (creator.id !== U_VARIOUS_ARTISTS_EXTID) {
				straplineTextOne.runs[0].navigationEndpoint = UBuildEndpoint({
					navType: "browse",
					id: cachedCreator.id
				})
			};		
			
			
			straplineThumbnail = {
				musicThumbnailRenderer: {
					thumbnail: {
						thumbnails: [
							{
								url: cachedCreatorThumb,
								width: UIMG_HEIGHT,
								header: UIMG_HEIGHT
							}
						]
					},
					thumbnailCrop: "MUSIC_THUMBNAIL_CROP_UNSPECIFIED",
					thumbnailScale: "MUSIC_THUMBNAIL_SCALE_UNSPECIFIED"
				}
			}
		};


		let oldButtons = this._GetDictOfButtonTypesFromOldAlbumPage(response.header.musicDetailHeaderRenderer.menu.menuRenderer);

		delete oldButtons.topLevel.Download.downloadButtonRenderer.trackingParams; // idk if i need this, didnt try wihout..
		delete oldButtons.topLevel.Download.downloadButtonRenderer.command.clickTrackingParams;
		delete oldButtons.topLevel.Download.downloadButtonRenderer.command.offlinePlaylistEndpoint.onAddCommand.clickTrackingParams;
		delete oldButtons.topLevel.Download.downloadButtonRenderer.command.offlinePlaylistEndpoint.offlineability.offlineabilityRenderer.clickTrackingParams;

		let buttons = [
			oldButtons.topLevel.Download,
			{
				buttonRenderer: {
					style: "STYLE_DARK_ON_WHITE", // white with border
					size: "SIZE_SMALL",
					isDisabled: false,
					icon: {
						iconType: "LIBRARY_SAVED"
					},
					accessibility: {
						label: "Delete album"
					},
					accessibilityData: {
						accessibilityData: {
							label: "Delete album"
						}
					},
					command: oldButtons.topLevel.LIBRARY_REMOVE.buttonRenderer.navigationEndpoint
				},
			},
			{
				musicPlayButtonRenderer: {
					playNavigationEndpoint: oldButtons.topLevel.PLAY_ARROW.buttonRenderer.navigationEndpoint,
					playIcon: {
						iconType: "PLAY_ARROW"
					},
					pauseIcon: {
						iconType: "PAUSE"
					},
					iconColor: 4294967295,
					backgroundColor: 0,
					activeBackgroundColor: 0,
					loadingIndicatorColor: 14745645,
					playingIcon: {
						iconType: "PAUSE"
					},
					iconLoadingColor: 0,
					activeScaleFactor: 1,
					accessibilityPlayData: {
						accessibilityData: {
							label: "Play full album"
						}
					},
					accessibilityPauseData: {
						accessibilityData: {
							label: "Pause album"
						}
					}
				},
			},
			{
				buttonRenderer: {
					style: "STYLE_DARK_ON_WHITE", // GOOD
					icon: {
						iconType: "MUSIC_SHUFFLE"
					},
					accessibility: {
						label: "Shuffle play"
					},
					accessibilityData: {
						accessibilityData: {
							label: "Shuffle play"
						}
					},
					command: oldButtons.menu.MUSIC_SHUFFLE.menuNavigationItemRenderer.navigationEndpoint
				},
			},
			{
				menuRenderer: {
					items: [
						oldButtons.menu.MUSIC_SHUFFLE,
						oldButtons.menu.QUEUE_PLAY_NEXT,
						oldButtons.menu.ADD_TO_REMOTE_QUEUE,
						oldButtons.menu.ADD_TO_PLAYLIST,
						oldButtons.menu.ARTIST,
						{
							menuServiceItemDownloadRenderer: {
								serviceEndpoint: oldButtons.topLevel.Download.downloadButtonRenderer.command
							}
						},
						oldButtons.menu.DELETE
					],
					accessibility: {
						accessibilityData: {
							label: "Action menu"
						}
					}
				}
			}
		];
		

		let contents = {
			twoColumnBrowseResultsRenderer: {
				secondaryContents: {
					sectionListRenderer: response.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer
				},
				tabs: [
					{
						tabRenderer: {
							content: {
								sectionListRenderer: {
									contents: [
										{
											musicResponsiveHeaderRenderer: {
												thumbnail: {
													musicThumbnailRenderer: thumbnailRenderer
												},
												buttons: buttons,//response.header.musicDetailHeaderRenderer.menu.menuRenderer.topLevelButtons, // NEED A LOT OF WORK!!
												title: response.header.musicDetailHeaderRenderer.title,
												subtitle: {
													runs: subtitleOneRuns
												},
												straplineTextOne: straplineTextOne,
												straplineThumbnail: straplineThumbnail,
												//description: not doing, is not possible with private releases. add with cache later.
												secondSubtitle: response.header.musicDetailHeaderRenderer.secondSubtitle
											}
										}
									]
								}
							}
						}
					}
				]
			}
		};

		let layerColors = ["0","0"];

		for (let listItem of contents.twoColumnBrowseResultsRenderer.secondaryContents.sectionListRenderer.contents[0].musicShelfRenderer.contents) {
			listItem = listItem.musicResponsiveListItemRenderer;

			listItem.overlay.musicItemThumbnailOverlayRenderer.background.verticalGradient.gradientLayerColors = layerColors;
			
			let i = -1;
			for (let flexColumn of listItem.flexColumns) {
				i ++;

				let runs = flexColumn.musicResponsiveListItemFlexColumnRenderer.text.runs;
				if (!runs || runs.length === 0) continue;
				if (!runs[0].navigationEndpoint) continue;

				if ((runs[0].navigationEndpoint.browseEndpoint || {}).browseId === id) {
					delete listItem.flexColumns[i]; // delete run that says album name
				};
			};

			let videoId = UDigDict(listItem, ["playlistItemData", "videoId"]);
			if (!videoId) continue;

			let cachedVideo = cache[videoId];
			if (!cachedVideo) continue;

			let views = cachedVideo.views;
			views = (isNaN(views)) ? 0 : views;

			listItem.flexColumns.push({
				musicResponsiveListItemFlexColumnRenderer: {
					displayPriority: "MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_MEDIUM",
					text: { runs: [ { text: UBigNumToText(views) + " plays"}] }
				}
			});
		};


		response.contents = contents;
		delete response.header;

		response.background = {
			musicThumbnailRenderer: thumbnailRenderer
		};

		response.cButtons = [
			{
				icon: "doc-revert",
				actions: [
					UBuildEndpoint({
						navType: "browse",
						id: id,
						cParams: {
							returnOriginal: true
						}
					})
				]
			}
		];

		return response;
	};

	static SmallTasks = {
		"/youtubei/v1/playlist/create": function PlaylistCreateCommand(request, response) {
			let gathered = {
				name: request.body.title,
				type: "MUSIC_PAGE_TYPE_PLAYLIST",
				id: "VL" + response.playlistId,
				mfId: response.playlistId,
				items: request.body.videoIds || []
			};

			UDispatchEventToEW({
				func: "playlist-create",
				data: gathered
			});

			return response;
		},

		"/youtubei/v1/playlist/delete": function PlaylistDeleteCommand(request, response) {
			let gathered = {
				id: "VL" + request.body.playlistId
			};

			UDispatchEventToEW({
				func: "playlist-delete",
				data: gathered
			});

			return response;
		},

		"/youtubei/v1/player": function CacheVideoViews(request, response) {
			let gathered = {
				id: response.videoDetails.videoId,
				views: Number(response.videoDetails.viewCount),
				type: response.videoDetails.musicVideoType
			};

			UDispatchEventToEW({
				func: "cache-data",
				data: gathered
			});

			return response;
		}
	};


	static SmallTasksRequireCache = {
		"/youtubei/v1/next": function TidyQueueNextItems(request, response, cache) {
			let playlistPanelContents = UDigDict(response, [
				"contents", "singleColumnMusicWatchNextResultsRenderer", "tabbedRenderer",
				"watchNextTabbedResultsRenderer", "tabs", 0,
				"tabRenderer", "content", "musicQueueRenderer",
				"content", "playlistPanelRenderer", "contents"
			]);

			if (!playlistPanelContents) return response;

			for (let item of playlistPanelContents) {
				let videoRenderer = item.playlistPanelVideoRenderer
					|| UDigDict(item, ["playlistPanelVideoWrapperRenderer", "primaryRenderer", "playlistPanelVideoRenderer"]);

				if (!videoRenderer) continue;

				let longBylineData = UGetDataFromSubtitleRuns({}, videoRenderer.longBylineText);

				let songCacheData = cache[videoRenderer.videoId];
				let albumId = (longBylineData.album) ? longBylineData.album.id :
							  (songCacheData) ? songCacheData.album : undefined;
				let albumCacheData = (albumId) ? cache[albumId] : {};

				let artistId = (longBylineData.artists) ? longBylineData.artists[0].id :
							   (songCacheData) ? songCacheData.artists[0] : undefined;
				let artistCacheData = (artistId) ? cache[artistId] : {};

				if (albumCacheData && albumCacheData.year && !longBylineData.yearStr) {
					videoRenderer.longBylineText.runs.push(
						{ text: U_YT_DOT },
						{ text: String(albumCacheData.year)}
					);
				};

				if ((albumCacheData && albumCacheData.private === true) || (artistCacheData && artistCacheData.private === true)) {

					for (let run of videoRenderer.longBylineText.runs) {
						if (!run.navigationEndpoint) continue;
						
						let type = UDigDict(run.navigationEndpoint, ["browseEndpoint", "browseEndpointContextSupportedConfigs", "browseEndpointContextMusicConfig", "pageType"]);
						if (!type) continue;

						if (!type || type === "MUSIC_PAGE_TYPE_UNKNOWN") {
							let id = UDigDict(run.navigationEndpoint, ["browseEndpoint", "browseId"]);
							if (!id) continue;

							type = UGetBrowsePageTypeFromBrowseId(id, false, true);
						};

						let counterpartId, counterpartData;


						if (type.includes("ALBUM") && (albumCacheData.privateCounterparts || []).length > 0) {
							counterpartId = albumCacheData.privateCounterparts[0];
							counterpartData = cache[counterpartId];
						};

						if (type === "C_PAGE_TYPE_PRIVATE_ARTIST" && (artistCacheData.privateCounterparts || []).length > 0) {
							counterpartId = artistCacheData.privateCounterparts[0];
							counterpartData = cache[counterpartId];

							if (counterpartId && item.shortBylineText) {
								item.shortBylineText.runs[0] = {
									text: (counterpartData) ? counterpartData.name : run.text
								}
							};							
						};

						if (!counterpartId) continue;

						run.text = (counterpartData) ? counterpartData.name : run.text;
						run.navigationEndpoint = UBuildEndpoint({
							navType: "browse",
							id: counterpartId
						});						
					};

				};
			};
			

			let headerButtons = UDigDict(response, [
				"contents", "singleColumnMusicWatchNextResultsRenderer", "tabbedRenderer",
				"watchNextTabbedResultsRenderer", "tabs", 0,
				"tabRenderer", "content", "musicQueueRenderer",
				"header", "musicQueueHeaderRenderer", "buttons"
			]);

			if (!headerButtons) return;

			headerButtons.push({
				chipCloudChipRenderer: {
					style: { styleType: "STYLE_DEFAULT" },
					text: { runs: [ {text: "Clear Queue Actually" } ] },
					navigationEndpoint: { dismissQueueCommand: {} },
					icon: { iconType: "DISMISS_QUEUE" },
					accessibilityData: { accessibilityData: { label: "Clear Queue" } },
					isSelected: false,
					uniqueId: "Clear"
				}
			});

			return response;

		}
	};


	static C_PAGE_TYPE_PRIVATE_ALBUM(response, id, cache) {
		// need to edit album subtitleTwo total minutes based on contents.

		let albumLike = this._ConvertOldAlbumPageToNew(response, id, cache);
		let newResp = this.MUSIC_PAGE_TYPE_ALBUM(albumLike, id, cache);

		return newResp;
	};

	static MUSIC_PAGE_TYPE_ALBUM(response, id, cache) {
		// caching stuff
		// need to edit album subtitleTwo total minutes based on contents.

		// make toplevelbuttons better:  have shuffle instead of share!

		if (!response.cButtons) response.cButtons = [];

		response.cButtons.push({
			icon: "pencil",
			actions: [
				{
					miscAction: {name: "open-edit"}
				}
			]
		});

		let type = UGetBrowsePageTypeFromBrowseId(id);
		if (type === "C_PAGE_TYPE_PRIVATE_ALBUM") return response;

		let cachedAlbum = cache[id];
		if (!cachedAlbum || (cachedAlbum.privateCounterparts || []).length === 0) return response;

		let counterpart = cachedAlbum.privateCounterparts[0];
		if (!counterpart || !cache[counterpart]) return response;

		let counterpartData = cache[counterpart];

		let indexesToReplace = {};

		for (let videoId of counterpartData.items) {
			if (!videoId) continue;

			let cachedVideo = cache[videoId];
			if (!cachedVideo || !cachedVideo.index) continue;

			indexesToReplace[cachedVideo.index] = cachedVideo;
		};

		let listItems = UDigDict(response, [
			"contents", "twoColumnBrowseResultsRenderer", "secondaryContents",
			"sectionListRenderer", "contents", 0,
			"musicShelfRenderer", "contents"
		]);
		if (!listItems) return response;

		for (let i of listItems) {
			let data = UGetSongInfoFromListItemRenderer(i);

			let cachedVideo = indexesToReplace[data.index];
			if (!cachedVideo) continue;
			
			i = UModifyListItemRendererFromData(cachedVideo, cachedAlbum, i);
		};

		// now add extra to end
		// need to do stuff so when click play, si added to que correcct;y

		return response;
	};


	static MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY(response, id) {
		// THIS ONLY HAPPENS THE FIRST TIME. NAVIGATION = THROUGH CONTINUATIONS

		let sectionListRenderer = UDigDict(response, [
			"contents", "singleColumnBrowseResultsRenderer", "tabs",
			0, "tabRenderer", "content", "sectionListRenderer"
		]);
		if (!sectionListRenderer) return response;

		let sortOptions = UDigDict(sectionListRenderer, [
			"header", "musicSideAlignedItemRenderer", "endItems",
			0, "musicSortFilterButtonRenderer", "menu",
			"musicMultiSelectMenuRenderer", "options"
		]);

		if (!sortOptions) return response;
		let recencyOpt;

		for (let sortOpt of sortOptions) {
			sortOpt = sortOpt.musicMultiSelectMenuItemRenderer;

			if (sortOpt.title.runs[0].text !== "Recency") continue;
			recencyOpt = sortOpt;
			break;
		};
		if (!recencyOpt) return;

		let cmds = UDigDict(recencyOpt, ["selectedCommand", "commandExecutorCommand", "commands"]);
		let navEndp;

		for (let cmd of cmds) {
			if (!cmd.browseSectionListReloadEndpoint) continue;
			navEndp = cmd;
			break;
		};

		let continuation = UDigDict(navEndp, ["browseSectionListReloadEndpoint", "continuation", "reloadContinuationData"]);

		//gridRenderer.items = [];
		sectionListRenderer.contents = [];
		sectionListRenderer.continuations = [{
			nextContinuationData: {
				["continuation"]: continuation.continuation,
				clickTrackingParams: continuation.clickTrackingParams,
				autoloadEnabled: true,
				autoloadImmediately: true,
				showSpinnerOverlay: true
			}
		}];

		return response;
	};

	static CONT_MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY(response, id, cache) {
		let artist = id.replace("MPAD", "");
		
		let cachedArtist = cache[artist];
		if (!cachedArtist || (cachedArtist.privateCounterparts || []).length === 0) return response;

		let privateArtist = cache[cachedArtist.privateCounterparts[0]];
		if (!privateArtist) return response;

		let releaseToYear = {};

		for (let album of privateArtist.discography) {
			album = cache[album];
			if (!album) continue;

			releaseToYear[album.id] = album.year;
		};

		let gridRenderer = UDigDict(response, [
			"continuationContents", "sectionListContinuation", "contents",
			0, "gridRenderer"
		]);

		if (!gridRenderer) {
			gridRenderer = UDigDict(response, ["continuationContents", "gridContinuation"]);

			if (!gridRenderer) return response;
		};

		let doneYears = [];

		let newItems = [];

		for (let i of gridRenderer.items) {
			let data = UGetDataFromTwoRowItemRenderer(i);
			console.log(data);

			if (!data.yearStr || doneYears.indexOf(data.yearStr) !== -1) {
				newItems.push(i);
				continue;
			};

			doneYears.push(data.yearStr);

			for (let [album, year] of Object.entries(structuredClone(releaseToYear))) {
				console.log(data.yearStr, year, data.name);
				if (Number(year) <= Number(data.yearStr)) continue;
				
				let twoRow = UBuildTwoRowItemRendererFromData(cache[album]);
				newItems.push(twoRow);

				delete releaseToYear[album];
			};

			newItems.push(i);
		};

		if (!gridRenderer.continuation) {
			for (let i of Object.keys(releaseToYear)) {
				let twoRow = UBuildTwoRowItemRendererFromData(cache[i]);
				newItems.push(twoRow);
			};
		};

		gridRenderer.items = newItems;
		return response;
	};


	static MUSIC_PAGE_TYPE_ARTIST(response, id) {
		let sectionListContents = UDigDict(response, [
			"contents", "singleColumnBrowseResultsRenderer", "tabs",
			0, "tabRenderer", "content", "sectionListRenderer", "contents"
		]);
		if (!sectionListContents) return response;

		for (let shelf of sectionListContents) {
			if (!shelf.musicCarouselShelfRenderer) continue;

			let header = shelf.musicCarouselShelfRenderer.header.musicCarouselShelfBasicHeaderRenderer;
			let title = UDigDict(header, ["title", "runs", 0, "text"]);

			if (title !== "Albums" && title !== "Singles and EPS") continue;
			if (header.moreContentButton) continue;

			header.moreContentButton = {
				buttonRenderer: {
					style: "STYLE_TEXT",
					text: { runs: [ { text: "More" } ] },
					navigationEndpoint: UBuildEndpoint({
						navType: "browse",
						id: "MPAD" + id
					}),
					accessibilityData: {
						accessibilityData: { label: "More" }
					}
				}
			};
		};

		return response;
	};

	static C_PAGE_TYPE_CHANNEL_OR_ARTIST(response, id) {
		return this.MUSIC_PAGE_TYPE_ARTIST.apply(this, arguments);
	};
};

function initiateDelayedCacheOfOldResp(browseId, pageType, responseIsContinuation, toCacheOriginal) {
	setTimeout(function() { // CACHE ORIGINAL!
		if (!browseId) return;

		let contents = toCacheOriginal.contents;

		if (toCacheOriginal.onResponseReceivedActions) {
			contents = toCacheOriginal.onResponseReceivedActions[0];

		} else if (toCacheOriginal.continuationContents) {
			contents = toCacheOriginal.continuationContents;
		};

		let response = {
			browseId: browseId,
			browsePageType: pageType,
			responseIsContinuation: responseIsContinuation,
			contents: contents
		};
		if (toCacheOriginal.header) response.contents.header = toCacheOriginal.header;
		if (toCacheOriginal.microformat) response.contents.microformat = toCacheOriginal.microformat;

		CachePageContents(response);
	}, 100);
};


async function FetchModifyResponse(request, oldResp, xhr) {
	console.log(request.url);

	if (
		(!xhr && oldResp.status !== 200) ||
		(!xhr && !(oldResp.headers.get("Content-Type") || "").includes("application/json")) ||
		!request ||
		!request.body ||
		request.method !== "POST"
	) {
		return oldResp;
	};

	let urlObj;
	try { urlObj = new URL(request.url); }
	catch {};

	if (!urlObj || MiddlewareEditors.urlsToEdit.indexOf(urlObj.pathname) === -1) {
		return oldResp;
	};

	let changed = false;
	let clonedResp = (!xhr) ? oldResp.clone() : undefined;
	let respText = (xhr) ? structuredClone(oldResp.responseText) : (await clonedResp.text());

	let respBody = JSON.parse(respText);
	let toCacheOriginal = structuredClone(respBody);

	let browseId = request.body.browseId ||
		UGetBrowseIdFromResponseContext(toCacheOriginal.responseContext);
	
	let responseIsContinuation = !!(
		request.body.continuation ||
		urlObj.searchParams.get("ctoken") ||
		urlObj.searchParams.get("continuation")
	);
	
	let cParams = (UBrowseParamsByRequest || {})[browseId];

	if (cParams) {
		if (cParams.returnOriginal) return oldResp;

		delete cParams;
	};

	console.log("ORIGINAL RESP", browseId, toCacheOriginal, "is continuation:", responseIsContinuation);


	if (MiddlewareEditors.SmallTasks[urlObj.pathname]) {
		respBody = MiddlewareEditors.SmallTasks[urlObj.pathname](request, respBody);
		changed = true;
	};


	if (MiddlewareEditors.SmallTasksRequireCache[urlObj.pathname]) {
		let cache = await UMWStorageGet("cache") || {};

		respBody = MiddlewareEditors.SmallTasksRequireCache[urlObj.pathname](request, respBody, cache);
		changed = true;
	};

	let pageType = UGetBrowsePageTypeFromBrowseId(browseId);

	initiateDelayedCacheOfOldResp(browseId, pageType, responseIsContinuation, toCacheOriginal);

	if (!changed && browseId) {
		if (!pageType) return oldResp;
		if (responseIsContinuation) pageType = "CONT_" + pageType;

		let f = MiddlewareEditors[pageType];

		if (!f) return oldResp;

		// functions MUST take response, browseId. MAY take cache, that's the only change.
		if (f.length === 3) { // only get cache for functions that need it.
			let cache = await UMWStorageGet("cache") || {};

			respBody = f.apply(MiddlewareEditors, [respBody, browseId, cache]);

		} else {
			respBody = f.apply(MiddlewareEditors, [respBody, browseId]);
		};
		
		changed = true;
	};

	if (!changed) return oldResp;

	console.log("NEW RESP BODY", respBody);

	if (!respBody) return oldResp;

	if (changed) {
		respBody.cMusicFixerExtChangedResponse = true;
		let finalStr = JSON.stringify(respBody);

		if (xhr) {
			Object.defineProperty(oldResp, "responseText", {
				get() {
					return finalStr;
				}
			});

			Object.defineProperty(oldResp, "response", {
				get() {
					return finalStr;
				}
			});

			return oldResp;
		};

		return new Response(finalStr, {
			headers: clonedResp.headers,
			ok: clonedResp.ok,
			redirected: clonedResp.redirected,
			status: clonedResp.status,
			statusText: clonedResp.statusText,
			type: clonedResp.type,
			url: clonedResp.url
		});
	};

	return oldResp;
};




async function newFetch(resource, options) {
	let request;
	let resourceIsStr = typeof(resource) === "string";
	
	if (resourceIsStr) {
		request = {
			url: resource,
			//urlObj: new URL(resource),
			method: options.method || "GET"
		};

	} else {
		request = {
			url: resource.url,
			//THIS IS NOT a urlObj, it is a Request obj: resource,
			method: resource.method || "GET"
		};
		
	};

	if (request.method === "POST") { // have to do this first, or body is used in originalFetch.
		try {
			if (resourceIsStr && options && options.body && typeof(options.body) === "string") {
				request.body = JSON.parse(options.body);
				// will err 90-100% of time, Request obj used for JSON things.

			} else if (!resourceIsStr) {
				let clonedResource = resource.clone();
				let reqText = await clonedResource.text();

				request.body = JSON.parse(reqText);

			};
			
		} catch {};
	};

	let response = await originalFetch(resource, options);

	try {
		response = await FetchModifyResponse(request, response);

	} catch (err) {
		console.warn("couldnt modify fetch response", err);
		
	};

	return response;
};

window.cacheContinuations = {};

Object.defineProperty(window, "originalFetch", {
	value: window.fetch,
	writable: false,
	configurable: false
});

Object.defineProperty(window, "originalXHROpen", {
	value: XMLHttpRequest.prototype.open,
	writable: false,
	configurable: false
});

Object.defineProperty(window, "originalXHRSend", {
	value: XMLHttpRequest.prototype.send,
	writable: false,
	configurable: false
});


window.fetch = async function(resource, opts) {
	try {
		return await newFetch(resource, opts);

	} catch(err) { // try/catch vital here. walsy have backup otherwise site breaks.
		console.warn("ERR IN NEWFETCH",err);
		return await originalFetch(resource, opts);

	};
};

XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
	this._url = url;
	this._method = method;

	if (url.startsWith("/")) {
		this._url = "https://music.youtube.com" + url; 
	};

	return originalXHROpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) {
	const xhr = this;

	const originalOnReadyStateEvent = xhr.onreadystatechange;

	xhr.onreadystatechange = async function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			await FetchModifyResponse({
				url: xhr._url,
				method: xhr._method,
				body: body
			}, xhr, true);
		};

		if (originalOnReadyStateEvent) originalOnReadyStateEvent.apply(this, arguments);
	};

	return originalXHRSend.apply(this, arguments);
};

["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = window.fetch, non clonable.)