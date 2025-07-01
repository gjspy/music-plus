MiddlewareEditors = class MiddlewareEditors {
	static urlsToEdit = [
		"/youtubei/v1/browse",
		"/youtubei/v1/playlist/create",
		"/youtubei/v1/playlist/delete",
		"/youtubei/v1/like/like",
		"/youtubei/v1/like/removelike"//,
		//"/youtubei/v1/next"
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

		//let menuCopy = structuredClone(response.header.musicDetailHeaderRenderer.menu.menuRenderer);
		//delete menuCopy.topLevelButtons;

		//contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicResponsiveHeaderRenderer.buttons.push({menuRenderer: menuCopy});

		let layerColors = ["0","0"];

		for (let listItem of contents.twoColumnBrowseResultsRenderer.secondaryContents.sectionListRenderer.contents[0].musicShelfRenderer.contents) {
			listItem = listItem.musicResponsiveListItemRenderer;

			listItem.overlay.musicItemThumbnailOverlayRenderer.background.verticalGradient.gradientLayerColors = layerColors;
			
			/*let i = -1; KEEP THIS, FOR WHEN WE CAN ADD OUR OWN VIEW COUNTS!!
			for (let flexColumn of listItem.flexColumns) {
				i ++;

				let runs = flexColumn.musicResponsiveListItemFlexColumnRenderer.text.runs;
				if (!runs || runs.length === 0) continue;
				if (!runs[0].navigationEndpoint) continue;

				if ((runs[0].navigationEndpoint.browseEndpoint || {}).browseId === id) {
					delete listItem.flexColumns[i]; // delete run that says album name
				};
			};*/
		}


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
		},

		"/youtubei/v1/playlist/delete": function PlaylistDeleteCommand(request, response) {
			let gathered = {
				id: "VL" + request.body.playlistId
			};

			UDispatchEventToEW({
				func: "playlist-delete",
				data: gathered
			});
		}
		/*"/youtubei/v1/next": function test(request, response) {
			response.playerOverlays.playerOverlayRenderer.browserMediaSession.browserMediaSessionRenderer.album.runs[0].text = "thisisfunny";
			return response
		}*/
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
		// make it standard between private album and normal!

		if (!response.cButtons) response.cButtons = [];

		response.cButtons.push({
			icon: "pencil",
			actions: [
				{
					miscAction: {name: "open-edit"}
				}
			]
		});

		return response;
	};



}

async function FetchModifyResponse(request, oldResp) {
	console.log(request.url);
	if (
		oldResp.status !== 200 ||
		!(oldResp.headers.get("Content-Type") || "").includes("application/json") ||
		!request ||
		request.method !== "POST" ||
		//!request.url.includes("browse") ||
		//!MiddlewareEditors._ShouldModifyURL(request.url) ||
		!request.body
		//MiddlewareEditors.urlsToEdit.indexOf(request.urlObj.pathname) === -1
		//(!request.body.browseId && !request.body.continuation)
	) {
		return oldResp;
	};

	let urlObj;
	try { urlObj = new URL(request.url); }
	catch {};

	if (!urlObj || MiddlewareEditors.urlsToEdit.indexOf(urlObj.pathname) === -1) {
		return oldResp;
	};
	
	console.log("passed tests, modifying", request.url);

	let changed = false;
	let clonedResp = oldResp.clone();
	let respText = await clonedResp.text();

	let respBody = JSON.parse(respText);
	let toCacheOriginal = structuredClone(respBody);

	let browseId = request.body.browseId ||
		UGetBrowseIdFromResponseContext(toCacheOriginal.responseContext);
	
	let cParams = (UBrowseParamsByRequest || {})[browseId];

	if (cParams) {
		if (cParams.returnOriginal) return oldResp;

		delete cParams;
	};


	if (MiddlewareEditors.SmallTasks[urlObj.pathname]) {
		let newResp = MiddlewareEditors.SmallTasks[urlObj.pathname](request, respBody);

		return newResp || oldResp;
	};

	
	if (!browseId) return oldResp;

	let pageType = UGetBrowsePageTypeFromBrowseId(browseId);	


	let continuationInRequest = request.body.continuation ||
		urlObj.searchParams.get("ctoken") ||
		urlObj.searchParams.get("continuation");


	let responseIsContinuation = !!continuationInRequest;


	console.log("ORIGINAL RESP", browseId, respBody, "continuation:", continuationInRequest);


	// EDITING FOR INITIAL PAGE DATAS
	if (!responseIsContinuation && MiddlewareEditors[pageType]) {
		let cache = await UMWStorageGet("cache") || {};

		respBody = MiddlewareEditors[pageType](respBody, browseId, cache);

		changed = true;
	};

	console.log("NEW RESP BODY", respBody);

	setTimeout(function() { // CACHE ORIGINAL!
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


	if (changed) {
		respBody.cMusicFixerExtChangedResponse = true;

		return new Response(JSON.stringify(respBody), {
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
			
		} catch (err){
			//console.warn("ERR GETTING BODY", request.url, resourceIsStr, err);
			//console.log("errGettingBody", resource, options, reqText);
		};
	};

	let response = await originalFetch(resource, options);
	//console.log(".fetch response", response);

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

window.fetch = async function(resource, opts) {
	try {
		return await newFetch(resource, opts);

	} catch(err) { // try/catch vital here. walsy have backup otherwise site breaks.
		console.warn("ERR IN NEWFETCH",err);
		return await originalFetch(resource, opts);

	};
};

["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = window.fetch, non clonable.)