window.MiddlewareGetTasks = class MiddlewareGetTasks {
	static endpointToTask = {
		"/api/stats/watchtime": WatchtimeStore
	};

	static WatchtimeStore(request, response) {
		let isFinal = request.urlObj.searchParams.get("final");
		// final = video has ended, full play.

		if (!isFinal) return;

		UDispatchEventToEW({
			func: "video-watched",
			videoId: request.urlObj.searchParams.get("docid"),
			playingFrom: request.urlObj.searchParams.get("list")
		});
	}; // TODO, WHAT ABOUT SKIPS?
};



window.MiddlewareSmallTasks = class MiddlewareSmallTasks {

	static PlaylistCreateCommand(request, response) {
		let gathered = { // doesnt actually cache.
			name: request.body.title,
			type: "MUSIC_PAGE_TYPE_PLAYLIST",
			id: "VL" + response.playlistId,
			mfId: response.playlistId,
			items: request.body.videoIds || []
		};

		UDispatchEventToEW({
			func: "playlist-create",
			cacheData: gathered,
			tagData: request.cParams
		});

		return;
	}

	static PlaylistDeleteCommand(request, response) {
		let gathered = {
			id: "VL" + request.body.playlistId
		};

		UDispatchEventToEW({
			func: "playlist-delete",
			data: gathered
		});

		return;
	}

	static CacheVideoViews(request, response) {
		let gathered = {
			id: response.videoDetails.videoId,
			views: Number(response.videoDetails.viewCount),
			type: response.videoDetails.musicVideoType
		};

		UDispatchEventToEW({
			func: "cache-data",
			data: gathered
		});

		return;
	}

	static CacheDislike(request, reponse) {
		let gathered = {
			id: request.body.target.videoId,
			liked: "DISLIKE",
			type: "SONG"
		};

		if (!gathered) return;

		UDispatchEventToEW({
			func: "cache-data",
			data: gathered
		});

		return;
	}

	static OnPlaylistEdit(request, response) {
		let currentState = polymerController.store.getState();
		let browsedToId = UDigDict(currentState, UDictGet.browseIdFromPolymerState);
		if (!browsedToId) return;

		browsedToId = browsedToId.replace(/^VL/, "");
		if (browsedToId !== request.body.playlistId) return;

		let listItems = document.querySelectorAll(U_HELPFUL_QUERIES.listItemRenderersOfCurrentBrowseResponse);
		if (!listItems || listItems.length === 0) return;

		let videoIdsToListItem = {};
		for (let listItem of listItems) {
			let videoId = UDigDict(listItem, UDictGet.videoIdFromLIRElem);
			if (!videoId) continue;

			videoIdsToListItem[videoId] = listItem;
		};

		for (let action of (request.body.actions || [])) {
			if (action.action !== "ACTION_REMOVE_VIDEO") continue;

			let listItem = videoIdsToListItem[action.removedVideoId];
			if (!listItem) continue;

			listItem.remove();
		};
	}

	/*
	TOPIC CHANNELS COUNTED AS SAME, BUT DIFFERENT IDS..
	request does not have the browsed to id of the channel.
	eg, cage the elephant, endpoint = UCOk9wZlQNsWjb7gJhnvmbkQ but
		browsed to UCU3rXoHt2bCYbpV3s_sJlgw.
	static CacheSubscribe(request, response) {
		let gathered = request.body.channelIds.map( v => {
			return { id: v, saved: true, type: "C_PAGE_TYPE_CHANNEL_OR_ARTIST" };
		});

		if (!gathered) return;

		UDispatchEventToEW({
			func: "cache-data",
			data: gathered
		});

		return;
	},

	static CacheUnsubscribe(request, response) {
		let gathered = request.body.channelIds.map( v => {
			return { id: v, saved: false, type: "C_PAGE_TYPE_CHANNEL_OR_ARTIST" };
		});

		if (!gathered) return;

		UDispatchEventToEW({
			func: "cache-data",
			data: gathered
		});

		return;
	}*/


	static CacheLike(request, response, storage) {
		let gathered;
		
		if (request.body.target.videoId) {
			gathered = {
				id: request.body.target.videoId,
				liked: "LIKE",
				type: "SONG"
			};
		};

		if (request.body.target.playlistId) {
			let type = UGetBrowsePageTypeFromBrowseId(request.body.target.playlistId, true, true);
			let id = (type === "MUSIC_PAGE_TYPE_ALBUM") ? storage.cache.mfIdMap[request.body.target.playlistId]
				: "VL" + request.body.target.playlistId;
			
			gathered = {
				"id": id,
				saved: true,
				"type": type
			};
		};

		if (!gathered || !gathered.id) return;

		UDispatchEventToEW({
			func: "cache-data",
			data: gathered
		});

		return;
	}

	static CacheUnlike(request, response, storage) {
		let gathered;
		
		if (request.body.target.videoId) {
			gathered = {
				id: request.body.target.videoId,
				liked: "INDIFFERENT",
				type: "SONG"
			};
		};

		if (request.body.target.playlistId) {
			let type = UGetBrowsePageTypeFromBrowseId(request.body.target.playlistId, true, true);
			let id = (type === "MUSIC_PAGE_TYPE_ALBUM") ? storage.cache.mfIdMap[request.body.target.playlistId]
				: "VL" + request.body.target.playlistId;
			
			gathered = {
				"id": id,
				saved: false,
				"type": type
			};
		};

		if (!gathered || !gathered.id) return;

		UDispatchEventToEW({
			func: "cache-data",
			data: gathered
		});

		return;
	};


	static CacheFromNextItems(request, response, lyricPanel) {
		let lyricEndpoint = lyricPanel?.endpoint?.browseEndpoint?.browseId;

		console.log("LYRIC", {lyricPanel, lyricEndpoint});

		if (!lyricEndpoint) return;

		let playingVideoId = response.currentVideoEndpoint?.watchEndpoint?.videoId;
		console.log("LYRIC", {playingVideoId});
		if (!playingVideoId) return;

		let gathered = {
			id: playingVideoId,
			"lyricEndpoint": lyricEndpoint,
			type: "SONG"
		};
		console.log("GATHERED", gathered);

		UDispatchEventToEW({
			func: "cache-data",
			data: gathered
		});
	};


	static TidyQueueNextItems(request, response, storage) {
		// if user clicks "revert" on album page, it will play original, because no buildQueueFrom.
		// and, clicking a main song will now include the extras.

		// require cParams. declares that we want to edit this response.
		// even if clicking a song from the real album (deluxe), it still declares
		// to read the song from itself.

		let browsePage = document.querySelector("ytmusic-browse-response");
		if (browsePage && browsePage.getAttribute("c-edited") === false) {
			console.log("browse page reports no c edits. returning in /next middleware.");
			return;
		};

		let playlistPanel = UDigDict(response, UDictGet.playlistPanelFromNextResponse);
		let lyricPanel = UDigDict(response, UDictGet.lyricPanelFromNextResponse);

		try {this.CacheFromNextItems(request, response, lyricPanel); }
		catch (err) { console.trace(err); };

		if (!playlistPanel || !playlistPanel.contents) return;
		let isShuffle = request.body.watchNextType === "WATCH_NEXT_TYPE_MUSIC_SHUFFLE";

		console.log("originalPlaylistPanelcontents", structuredClone(playlistPanel.contents));
		console.log(request.cParams, (request.cParams || {}), (request.cParams || {}).buildQueueFrom);

		let [newContents, currentVideoWE] = MiddlewareEditors._EditQueueContentsFromResponse(
			storage,
			playlistPanel.contents,
			(request.cParams || {}).buildQueueFrom,
			request.body.playlistId,
			request.body.videoId,
			isShuffle,
			false
		);

		if (newContents) playlistPanel.contents = newContents;
		
		if (!currentVideoWE) return response; // changed in place (and leaving early)
		response.currentVideoEndpoint.watchEndpoint = currentVideoWE;

		let currentVideoCache = storage.cache[currentVideoWE.videoId];
		if (!currentVideoCache) return response; // changed in place

		// LYRIC EDITING
		// TODO!
		console.log({currentVideoCache}, request.body.videoId, currentVideoWE.videoId)
		if (request.body.videoId !== currentVideoWE.videoId) {
			let lyricsBID = currentVideoCache.lyricEndpoint;
			console.log({lyricsBID, lyricPanel});

			if (lyricsBID && lyricPanel) {
				lyricPanel.endpoint = UBuildEndpoint({
					navType: "browse",
					id: lyricsBID
				});
			};
		};

		lyricPanel && (lyricPanel.unselectable = false);


		let overlayButtons = UDigDict(response, UDictGet.overlayButtonsFromNextResponse);
		if (!overlayButtons) return response; // changed in place

		let like = UGetButtonFromButtons(overlayButtons, "likeButtonRenderer");
		like.likeStatus = currentVideoCache.liked;
		like.target.videoId = currentVideoWE.videoId;
		like.serviceEndpoints[0].likeEndpoint.target.videoId = currentVideoWE.videoId;
		like.serviceEndpoints[1].likeEndpoint.target.videoId = currentVideoWE.videoId;
		like.serviceEndpoints[2].likeEndpoint.target.videoId = currentVideoWE.videoId;

		console.log("newPlPancontents", playlistPanel.contents);

		return response; // was changed in-place.
	}


	static TidyGetQueueItems(request, response, storage) {
		//if (!request.cParams || !request.cParams.buildQueueFrom) return;
		// so now if user clicks "revert" on album page, it will play original.
		// and, clicking a main song will now include the extras.

		let queueDatas = response.queueDatas;
		if (!queueDatas) return;
		let buildFrom = request.cParams ? request.cParams.buildQueueFrom : undefined;

		let [newContents, currentVideoWE] = MiddlewareEditors._EditQueueContentsFromResponse(storage, queueDatas, buildFrom, request.body.playlistId, undefined, false, true, request.body.videoIds);

		if (newContents) response.queueDatas = newContents;
		return response; // was changed in-place.
	}


	static endpointToTask = {
		"/youtubei/v1/playlist/create": this.PlaylistCreateCommand,
		"/youtubei/v1/playlist/delete": this.PlaylistDeleteCommand,
		"/youtubei/v1/player": this.CacheVideoViews,
		"/youtubei/v1/like/dislike": this.CacheDislike,
		"/youtubei/v1/browse/edit_playlist": this.OnPlaylistEdit
		//"/youtubei/v1/subscription/subscribe"
		//"/youtubei/v1/subscription/unsubscribe"
	}

	static endpointToTaskCache = {
		"/youtubei/v1/like/like": this.CacheLike,
		"/youtubei/v1/like/removelike": this.CacheUnlike,
		"/youtubei/v1/next": this.TidyQueueNextItems,
		"/youtubei/v1/music/get_queue": this.TidyGetQueueItems
	}
}



window.MiddlewareEditors = class MiddlewareEditors {
	static urlsToEdit = [
		"/youtubei/v1/browse",
		...Object.keys(MiddlewareSmallTasks.endpointToTask),
		...Object.keys(MiddlewareSmallTasks.endpointToTaskCache)
	];

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
		let cachedCreator = cache[creator.id] || {};

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
					iconColor: 4278387459,
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
												description: {
													musicDescriptionShelfRenderer: {
														description: { runs: [ ] },
														shelfStyle: "MUSIC_SHELF_STYLE_OPEN_DIALOG_ON_CLICK",
														moreButton: {
															toggleButtonRenderer: {
																isDisabled: false,
																isToggled: false,
																defaultIcon: { iconType: "EXPAND" },
																defaultText: { runs: [{ text: "More" }] },
																toggledIcon: { iconType: "COLLAPSE" },
																toggledText: { runs: [{ text: "Less" }] }
															}
														}
													}	
												},
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

			let videoId = UDigDict(listItem, UDictGet.videoIdFromLIRData);
			if (!videoId) continue;

			let cachedVideo = cache[videoId];
			if (!cachedVideo) continue;

			listItem.flexColumns.push({
				musicResponsiveListItemFlexColumnRenderer: {
					displayPriority: "MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_MEDIUM",
					text: { runs: [ { text: UBigNumToText(cachedVideo.views) + " plays" } ] }
				}
			});
		};


		response.contents = contents;
		delete response.header;

		response.background = {
			musicThumbnailRenderer: thumbnailRenderer
		};

		return response; // changed in-place
	};


	static _EditLongBylineOfPlaylistPanelVideoRenderer(storage, videoRenderer, realAlbum) {
		let cache = storage.cache;

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

		let albumMetadata = storage.customisation.metadata[realAlbum.id] || {};

		let newRuns = [];

		for (let run of videoRenderer.longBylineText.runs) {
			newRuns.push(run);

			if (!run.navigationEndpoint) continue;

			let type = UDigDict(run.navigationEndpoint, UDictGet.pageTypeFromNavigationEndpoint);
			let id;
			if (!type) continue;

			if (!type || type === "MUSIC_PAGE_TYPE_UNKNOWN") {
				id = UDigDict(run.navigationEndpoint, UDictGet.browseIdFromNavigationEndpoint);
				if (!id) continue;

				type = UGetBrowsePageTypeFromBrowseId(id, false, true);
			};

			let counterpartData;

			if (type === "MUSIC_PAGE_TYPE_ALBUM" && realAlbum.id) {
				if (albumMetadata.title) run.text = albumMetadata.title;

				run.navigationEndpoint = UBuildEndpoint({
					navType: "browse",
					id: realAlbum.id
				});
			};

			if (type === "C_PAGE_TYPE_PRIVATE_ARTIST") {
				counterpartData = UGetCounterpartFromData(cache, artistCacheData);

				if (videoRenderer.shortBylineText) {
					videoRenderer.shortBylineText.runs[0] = {
						text: (counterpartData) ? counterpartData.name : run.text
					};
				};

				if (!counterpartData) continue;
				let counterpartCustomisation = storage.customisation.metadata[counterpartData.id] || {};

				run.text = counterpartCustomisation.name || counterpartData.name;
				run.navigationEndpoint = UBuildEndpoint({
					navType: "browse",
					id: counterpartData.id
				});

				type = "MUSIC_PAGE_TYPE_ARTIST";
			};

			if (type === "MUSIC_PAGE_TYPE_ARTIST") {
				if (!id) id = UDigDict(run.navigationEndpoint, UDictGet.browseIdFromNavigationEndpoint);
				if (!id) continue;

				let artistCustomisation = storage.customisation.metadata[id] || {};

				if (artistCustomisation.title) {
					run.text = artistCustomisation.title;

					if (videoRenderer.shortBylineText) {
						videoRenderer.shortBylineText.runs[0] = {
							text: artistCustomisation.title
						};
					};
				};
			};
		};

		videoRenderer.longBylineText.runs = newRuns;
		return songCacheData;
	};

	static _DeleteRemoveFromPlaylistButtonFromPPVR(videoRenderer) {
		let buttons = UDigDict(videoRenderer, UDictGet.menuItemsFromAnything);
		if (!buttons) return;

		let i = -1;
		for (let b of structuredClone(buttons)) {
			i ++;

			let serviceAction = UDigDict(b, UDictGet.serviceActionPlaylistEditEndpointFromMenuItem);
			if (serviceAction === "ACTION_REMOVE_VIDEO" ) {
				buttons.splice(i, 1);
				i--;
				continue;
			};

			let navigateActionOnConfirm = UDigDict(b, UDictGet.endpointOnConfirmDialogFromNavigationMenuItem);
			if (navigateActionOnConfirm && navigateActionOnConfirm.musicDeletePrivatelyOwnedEntityCommand) {
				buttons.splice(i, 1)
				i--;
				continue;
			};
		};
	};

	static _EditQueueContentsFromResponse(storage, queueContents, buildQueueFromBId, loadedQueueFromMfId, videoIdToSelect, isShuffle, areQueueDatas, queueDataRequestIds) {
		let buildFromAlbum = (buildQueueFromBId) ? storage.cache[buildQueueFromBId] || {} : {}; // cache[undefined] may exist. do ternary.
		let loadedFromAlbum = UGetObjFromMfId(storage.cache, loadedQueueFromMfId) || {};
		console.log(buildQueueFromBId, loadedQueueFromMfId, buildFromAlbum, loadedFromAlbum);

		let idsToReplace = UGetIdsToReplaceFromRealAlbum(storage, buildQueueFromBId, loadedFromAlbum.id) || {};
		console.log("replacements", idsToReplace);
		console.log("queueContentsBefore", structuredClone(queueContents));

		let indexToVideoIdOfThis = idsToReplace.indexToVideoIdOfThis;

		let cachedArtist = (buildFromAlbum.artist) ? storage.cache[buildFromAlbum.artist] : undefined;
		let hiddenSongs = storage.customisation.hiddenSongs[buildQueueFromBId] || [];
		let skippedSongs = storage.customisation.skippedSongs[buildQueueFromBId] || [];

		//hiddenSongs.push(...skippedSongs);

		let backingPlaylistId; // for use later. get it in this loop from anything we can!
		let videoRenderersData = queueContents.map((v) => {
			let vr = UGetPlaylistPanelVideoRenderer(v);

			if (!backingPlaylistId) backingPlaylistId = UDigDict(vr, UDictGet.backingPlaylistIdFromVideoRenderer);

			return (vr) ? [vr.videoId, [v,vr]] : [undefined, undefined]
		});
		let videoRenderersByVideoId = Object.fromEntries(videoRenderersData);


		// ITER 1: NORMAL STUFF
		for (let [videoId, data] of videoRenderersData) {
			if (!data) continue;
			let [item, vr] = data;

			let replacement = idsToReplace[videoId];

			console.log(structuredClone({videoId, data, item, vr, replacement}));

			if (replacement) UModifyPlaylistPanelRendererFromData(vr, replacement, buildFromAlbum, cachedArtist);
			else if (vr) {
				let cachedVideo = this._EditLongBylineOfPlaylistPanelVideoRenderer(storage, vr, buildFromAlbum);
				vr.cData = { video: cachedVideo, from: buildFromAlbum };// why did we set cData here? dont think it worked?
				console.log("ADD NotReplacemtn")
				this._DeleteRemoveFromPlaylistButtonFromPPVR(vr);
			};

			if (videoIdToSelect) vr.selected = vr.videoId === videoIdToSelect;
		};


		// USER HAS CLICKED TO LOAD FROM A PLAYLIST, OR
		// AN ALBUM ENDPOINT WITHOUT buildFrom CPARAM.
		// ONLY WANTED TO DO FIRST ITERATION, TO EDIT LONGBYLINE + BUTTONS.
		if (!buildQueueFromBId || buildFromAlbum?.type !== "ALBUM") {
			console.log("leaving early!");
			return [undefined, undefined];
		};


		let lastItem; // REMOVE AUTOMIX ITEM, ADD BACK LATER.
		if (queueContents[queueContents.length - 1].automixPreviewVideoRenderer) {
			lastItem = queueContents.pop();
		};

		let byIndex = idsToReplace.extraByIndex || {};
		let orderedExtraIndexes = Object.keys(byIndex).sort((a, b) => Number(a) - Number(b));
		let maxIndex = Math.max(...Object.keys(indexToVideoIdOfThis).map(v => Number(v)));

		let gappy = [];
		for (let i = 0; i <= maxIndex + orderedExtraIndexes.length; i++) {
			gappy[i] = videoRenderersByVideoId[indexToVideoIdOfThis[String(i)]] || [undefined, undefined];
		};

		let shuffleItemsToAdd = [];

		console.log(structuredClone({videoRenderersByVideoId, byIndex, gappy}));

		// ITER 2: CREATE NEW AND ADD IN PLACE, USING GAPS.
		let i_ = -1;
		for (let [item, vr] of gappy) { // NOT STRUCUTREDCLONE, IF IS THEN NO EDIT!
			i_ ++;

			console.log("ITER 1", structuredClone(item), structuredClone(vr));
			let createNew = byIndex[String(i_)];

			if (createNew) {
				let newItem = UBuildPlaylistPanelRendererFromData(createNew, buildFromAlbum, cachedArtist, backingPlaylistId);
				if (areQueueDatas) newItem = { content: newItem };

				// INSERT IN RANDOM POSITION FOR SHUFFLE!
				if (isShuffle) {
					shuffleItemsToAdd.push(newItem);
					continue;
				};

				vr = UGetPlaylistPanelVideoRenderer(newItem);
				gappy[i_] = [newItem, vr];
			};

			if (videoIdToSelect && vr) vr.selected = vr.videoId === videoIdToSelect;
		};

		console.log("GAPPY AFTER", structuredClone(gappy));
		queueContents = gappy.filter((v) => v[0] !== undefined && v[1] !== undefined).map((v) => v[0]);

		for (let v of shuffleItemsToAdd) {
			queueContents.splice(URandInt(1, queueContents.length), 0, v);
		};

		if (lastItem) queueContents.push(lastItem);

		console.log("queueContents now", structuredClone(queueContents));

		let newContents = [];
		let currentVideoWE;
		let indexCount = 0;

		if (hiddenSongs.includes(videoIdToSelect)) {
			videoIdToSelect = undefined;
		};
		// videoIdToSelect ONLY PROVIDED WHEN WE CLICK THEIR PLAY BUTTON ON ALBUM PAGE
		// OR USER PICKS AN INDIVIDUAL SONG.
		// SKIPPED SONGS: DON'T SKIP IF IS videoIdToSelect.

		// get_queue REQUEST HAS videoIds IF USER SELECTED, OR playlistId TO DO ALL.

		// LAST ITERATION. HIDE ANY WE NEED TO, AND UPDATE ENDPOINT INDEXES.
		// THIS CLEANS THE MESS FOR US, SO WE CAN ADD SONGS WHEREVER WE WANT!
		for (let item of queueContents) {
			let videoRenderer = UGetPlaylistPanelVideoRenderer(item);

			console.log(structuredClone(item), structuredClone(videoRenderer), "START OF EDIT ITERTAION(3)");

			if (!videoRenderer) {
				newContents.push(item);
				continue;
			};

			let we = UDigDict(videoRenderer, UDictGet.watchEndpointFromVideoRenderer);

			/*console.log(
				item,
				videoRenderer,
				videoIdToSelect,
				(videoRenderer) ? [videoRenderer.selected, videoRenderer.videoId] : undefined,
				we,
				"deleting",
				hiddenSongs.includes(we.videoId),
				(!videoRenderer.cData) || (videoRenderer.cData && videoRenderer.cData.from.id === loadedFromAlbum.id)
			);*/

			if (
				hiddenSongs.includes(we.videoId) &&
				(!videoRenderer.cData || 
					(videoRenderer.cData && videoRenderer.cData.from.id === loadedFromAlbum.id)
				)
			) continue; // dont add to new list

			if (
				skippedSongs.includes(we.videoId) && // SONG SHOULD BE SKIPPED
				videoIdToSelect !== we.videoId && // USER HASN'T CLICKED THIS SONG SPECIFICALLY
				!(queueDataRequestIds || []).includes(we.videoId) // USER HASNT SPECIFICALLY ADDED TO QUEUE
			) continue;

			if (we.index !== 0) we.index = indexCount;
			newContents.push(item);

			if (videoIdToSelect === undefined) { // if first item in playlist deleted.
				videoIdToSelect = we.videoId;
			};

			if (videoIdToSelect) videoRenderer.selected = videoRenderer.videoId === videoIdToSelect;
			if (we.videoId === videoIdToSelect) currentVideoWE = we;

			indexCount ++; // do after, to match yt queue starting at 0
		};

		console.log("newContents", newContents, hiddenSongs);

		return [newContents, currentVideoWE];
	};


	static C_PAGE_TYPE_PRIVATE_ALBUM(response, id, storage) {
		let albumLike = this._ConvertOldAlbumPageToNew(response, id, storage.cache);
		let newResp = this.MUSIC_PAGE_TYPE_ALBUM(albumLike, id, storage);

		return newResp || albumLike;
	};

	static MUSIC_PAGE_TYPE_ALBUM(response, id, storage) {
		// caching stuff
		// need to edit album subtitleTwo total minutes based on contents.

		let idsToReplace = UGetIdsToReplaceFromRealAlbum(storage, id, id) || {};
		console.log("replacements", structuredClone(idsToReplace));

		let musicShelfRenderer = UDigDict(response, UDictGet.albumListItemShelfRendererFromBrowseResponse);
		if (!musicShelfRenderer || !musicShelfRenderer.contents) return;

		let cachedAlbum = storage.cache[id] || {};
		let hiddenSongs = storage.customisation.hiddenSongs[id] || [];
		let skippedSongs = storage.customisation.skippedSongs[id] || [];

		UBrowseParamsByRequest.pageSpecific[cachedAlbum.mfId] = { buildQueueFrom: cachedAlbum.id };
		console.log("listitems before", structuredClone(musicShelfRenderer.contents));

		// iter thru each existing item, modify if necessary
		let newContents = [];
		let maxIndex = 0; // Number
		let lirsByIndex = {} // Number: object

		for (let item of structuredClone(musicShelfRenderer.contents)) { // structuredClone, so wont edit ref of original!
			let data = UGetSongInfoFromListItemRenderer(item);
			let replacement = idsToReplace[data.id];

			let listItemRenderer = item.musicResponsiveListItemRenderer;
			let thisIndex = Number(listItemRenderer?.index?.runs[0].text);
			if (thisIndex > maxIndex) maxIndex = thisIndex;
			lirsByIndex[thisIndex] = item;
			console.log(data.id, replacement, listItemRenderer);

			// should remove base version of song.
			// (use this to force building listitem instead of modify)
			let delBaseVideo = hiddenSongs.includes(data.id);

			if (delBaseVideo) {
				

				if (!replacement) { // can delete base video, but have replacement. do this for custom view count.
					UModifyListItemRendererForAnyPage(storage, "MUSIC_PAGE_TYPE_ALBUM", item);
					UFillCDataOfListItem(storage, item, data);
					listItemRenderer.cData.changedByDeletion = { isDeleted: true };
					
					newContents.push(item);
					continue;
				};

				let newListItem = UBuildListItemRendererFromDataForAlbumPage(replacement, cachedAlbum);
				UModifyListItemRendererForAnyPage(storage, "MUSIC_PAGE_TYPE_ALBUM", newListItem);
				UFillCDataOfListItem(storage, newListItem, replacement.video);

				newContents.push(newListItem); // as if overwritten
				continue;
			};

			if (!replacement) {
				UModifyListItemRendererForAnyPage(storage, "MUSIC_PAGE_TYPE_ALBUM", item);
				UFillCDataOfListItem(storage, item, data);

				newContents.push(item);
				continue;
			};

			UModifyListItemRendererFromDataForAlbumPage(replacement, cachedAlbum, item);
			UModifyListItemRendererForAnyPage(storage, "MUSIC_PAGE_TYPE_ALBUM", item);
			UFillCDataOfListItem(storage, item, replacement.video);

			newContents.push(item);
		};
		
		musicShelfRenderer.contents = newContents;

		// ADD EXTRA ITEMS TO START/END
		let byIndex = idsToReplace.extraByIndex || {};
		let orderedExtraIndexes = Object.keys(byIndex).sort((a, b) => Number(a) - Number(b));

		// NEED TO MAKE IT WITH GAPS THEN REMOVE AT THE END
		let gappy = [];
		for (let i = 0; i <= maxIndex + orderedExtraIndexes.length; i++) gappy[i] = lirsByIndex[i] || undefined;

		// GAPPY WORKS PERFECTLY! CREATES AN ARR WITH GAPS, LENGTH UP TO MAX FOUND INDEX + ALL EXTRA INDEXES
		// FILL IN WITH GAPS, THEN REMOVE GAPS, AND UPDAT EINDEX TEXTS.
		let i_ = -1;
		for (let v of structuredClone(gappy)) {
			i_ ++;

			let replacement = byIndex[String(i_)];
			if (!replacement) continue;

			// use cachedAlbum from before, to keep public playlistIds etc.
			let newListItem = UBuildListItemRendererFromDataForAlbumPage(replacement, cachedAlbum);
			UModifyListItemRendererForAnyPage(storage, "MUSIC_PAGE_TYPE_ALBUM", newListItem);
			UFillCDataOfListItem(storage, newListItem, replacement.video);
			newListItem.musicResponsiveListItemRenderer.index.runs[0].text = String(i_)

			gappy[i_] = newListItem;
		};

		musicShelfRenderer.contents = gappy.filter((v) => v !== undefined);

	
		// ALL REPLACEMENT NOW DONE, NOW UPDATE DELETION ATTRIBUTES AND FILL GAPS OF INDEXES.
		let indexCount = 0;
		let totalSeconds = 0;
		let songCount = 0;
		let skippedTime = 0;

		console.log("listItems now", musicShelfRenderer.contents);

		for (let lir of musicShelfRenderer.contents) {
			let subLir = lir.musicResponsiveListItemRenderer;
			if (subLir) lir = subLir;
			let lirId = lir.playlistItemData.videoId;

			// add per video id. used to do "all", but if clicked play from sidebar, would replace
			// whatever with this. dont want.
			UBrowseParamsByRequest.pageSpecific[lirId] = { buildQueueFrom: cachedAlbum.id };
			
			// hiding song stuff. dont delete, just give hidden attr, so can readd in edit mode.
			let hideThis = hiddenSongs.includes(lirId);
			let thisIndex = Number(lir.index.runs[0].text);

			let thisLenStr = UDigDict(lir, UDictGet.lengthStrFromLIRData);

			let skipThis = skippedSongs.includes(lirId);
			if (skipThis) {
				if (!lir.cData) lir.cData = {};
				lir.cData.skip = true;
				skippedTime += ULengthStrToSeconds(thisLenStr);
			};

			if (hideThis && (!lir.cData || !lir.cData.changedByDeletion)) {
				if (!lir.cData) lir.cData = { changedByDeletion: {} };
				if (!lir.cData.changedByDeletion) lir.cData.changedByDeletion = {};

				lir.cData.changedByDeletion.isDeleted = true;
				continue; // DONT increment, will fill the gap
			};

			// INDEX CORRECTION. FILLS GAPS, AND ACCOMMODATES FOR DELETED ITEMS.
			// continue if is deleted dont want to increment.
			if (UDigDict(lir, UDictGet.cIsDeletedFromLIRData)) continue;

			

			
			totalSeconds += ULengthStrToSeconds(thisLenStr);
			songCount ++;

			// EDIT INDEXES IF INCORRECT.
			if ((thisIndex !== 0 && thisIndex !== indexCount) || isNaN(thisIndex)) {
				lir.index.runs[0].text = String(indexCount+1);

				if (!lir.cData) lir.cData = { changedByDeletion: {} };
				if (!lir.cData.changedByDeletion) lir.cData.changedByDeletion = {};

				lir.cData.changedByDeletion.originalIndex = thisIndex;
				lir.cData.changedByDeletion.updatedIndex = indexCount;

				let we = UDigDict(lir, UDictGet.watchEndpointFromLIRDataPlayButton);
				if (we) we.index = indexCount;

				let titleEndpoint = UDigDict(lir, UDictGet.watchEndpointFromLIRDataTitle);
				if (titleEndpoint) titleEndpoint.index = indexCount;
			};

			indexCount ++; // do after, as if playing priv album (tloas deluxe), yt starts at 0

		};


		// EDIT HEADER DETAILS, AUTOMATICALLY, BASED ON NEW CONTENTS.
		let customMetadata = storage.customisation.metadata[id] || {};

		let headerRenderer = UDigDict(response, UDictGet.albumHeaderRendererFromBrowseResponse);

		if (customMetadata.title) headerRenderer.title.runs = [ { text: customMetadata.title } ];
		if (customMetadata.desc) {
			headerRenderer.description.musicDescriptionShelfRenderer.description.runs = [
				{ text: customMetadata.desc }
			];
		};

		let coolBkg = customMetadata.bkg;

		if (coolBkg || customMetadata.thumb) {
			let thumbnails = [
				{ url: coolBkg || customMetadata.thumb, width: UIMG_HEIGHT, height: UIMG_HEIGHT }
			];

			headerRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails = thumbnails;
			response.background.musicThumbnailRenderer.thumbnail.thumbnails = thumbnails;

			if (coolBkg) response.cMusicFixerExtCoolBkg = true;
		};

		let albumType = customMetadata.type;
		if (!albumType && UIsEntryPrivateSingle(storage, cachedAlbum.id)) albumType = "Single";
		
		if (albumType) headerRenderer.subtitle.runs[0].text = albumType;
		if (customMetadata.year) headerRenderer.subtitle.runs[2].text = customMetadata.year;

		if (customMetadata.artist) {
			let cacheOfNewArtist = storage.cache[customMetadata.artist];

			if (cacheOfNewArtist) {
				headerRenderer.straplineTextOne = {
					runs: [{
						text: cacheOfNewArtist.name,
						navigationEndpoint: UBuildEndpoint({
							navType: "browse",
							browseId: customMetadata.id
						})
					}]
				};
			};
			
			headerRenderer.straplineThumbnail = {
				musicThumbnailRenderer: {
					thumbnail: {
						thumbnailCrop: "MUSIC_THUMBNAIL_CROP_UNSPECIFIED",
						thumbnailScale: "MUSIC_THUMBNAIL_SCALE_UNSPECIFIED",
						thumbnails: [{
							url: cacheOfNewArtist.thumb,
							width: UIMG_HEIGHT,
							height: UIMG_HEIGHT
						}]
					}
				}
			};
		};

		headerRenderer.secondSubtitle.runs[0].text = `${songCount} songs`;
		headerRenderer.secondSubtitle.runs[2].text = USecondsToLengthStr(totalSeconds, true, false);

		if (skippedTime !== 0) headerRenderer.secondSubtitle.runs.push(
			{text: U_YT_DOT},
			{text: `${USecondsToLengthStr(totalSeconds - skippedTime, true, false)} unskipped`}
		);

		let playButton = UGetButtonFromButtons(headerRenderer.buttons, "musicPlayButtonRenderer");
		let firstLIR = musicShelfRenderer.contents[0].musicResponsiveListItemRenderer;
		let firstWE = UDigDict(firstLIR, UDictGet.watchEndpointFromLIRDataPlayButton);

		playButton.playNavigationEndpoint.watchEndpoint = structuredClone(firstWE);
		delete playButton.playNavigationEndpoint.watchEndpoint.videoId;
		delete playButton.playNavigationEndpoint.watchEndpoint.playlistSetVideoId;
		delete playButton.playNavigationEndpoint.watchEndpoint.index;

		console.log("listitems after", structuredClone(musicShelfRenderer.contents));

		return response; // was changed in-place
	};


	static MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY(response, id) {
		// THIS ONLY HAPPENS THE FIRST TIME. NAVIGATION = THROUGH CONTINUATIONS
		// SO ADDING OUR CUSTOM ELEMS IS IN THE CONTINUATION!

		let sectionListRenderer = UDigDict(response, UDictGet.sectionListRendererFromBrowseResponseForBasicGrid);
		if (!sectionListRenderer) return;

		let sortOptions = UDigDict(sectionListRenderer, UDictGet.sortOptionsFromSectionListRendererForBasicGrid);

		if (!sortOptions) return;
		let recencyOpt;

		for (let sortOpt of sortOptions) {
			sortOpt = sortOpt.musicMultiSelectMenuItemRenderer;

			if (sortOpt.title.runs[0].text !== "Recency") continue;
			recencyOpt = sortOpt;
			break;
		};
		if (!recencyOpt) return;

		let cmds = UDigDict(recencyOpt, UDictGet.commandsFromMultiSelectItemRenderer);
		let navEndp;

		for (let cmd of cmds) {
			if (!cmd.browseSectionListReloadEndpoint) continue;
			navEndp = cmd;
			break;
		};

		let continuation = UDigDict(navEndp, UDictGet.reloadContinuationDataFromNavigationEndpoint);

		//gridRenderer.items = [];
		sectionListRenderer.contents = [];
		sectionListRenderer.continuations = [{
			nextContinuationData: {
				"continuation": continuation.continuation,
				clickTrackingParams: continuation.clickTrackingParams,
				autoloadEnabled: true,
				autoloadImmediately: true,
				showSpinnerOverlay: true
			}
		}];

		return response; // was changed in-place
	};

	static CONT_MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY(response, id, cache) {
		let artist = id.replace("MPAD", "");

		let cachedArtist = cache[artist];
		if (!cachedArtist || (cachedArtist.privateCounterparts || []).length === 0) return;

		let privateArtist = cache[cachedArtist.privateCounterparts[0]];
		if (!privateArtist) return;

		let releaseToYear = {};

		for (let album of privateArtist.discography) {
			album = cache[album];
			if (!album) continue;
			if (album.privateCounterparts) continue; // dont show duplicates

			releaseToYear[album.id] = album.year;
		};

		let gridRenderer = UDigDict(response, UDictGet.gridRendererFromContinuationResponse);

		if (!gridRenderer) {
			gridRenderer = UDigDict(response, UDictGet.gridContinuationDataFromResponse);

			if (!gridRenderer) return;
		};

		let doneYears = [];

		let newItems = [];

		for (let i of gridRenderer.items) {
			let data = UGetDataFromTwoRowItemRenderer(i);

			if (!data.yearStr || doneYears.indexOf(data.yearStr) !== -1) {
				newItems.push(i);
				continue;
			};

			doneYears.push(data.yearStr);

			for (let [album, year] of Object.entries(structuredClone(releaseToYear))) {
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
		return newItems;
	};


	static MUSIC_PAGE_TYPE_ARTIST(response, id) {
		let sectionList = UDigDict(response, UDictGet.sectionListRendererFromBrowseResponseForBasicGrid);
		if (!sectionList || !sectionList.contents) return;

		let sectionListContents = sectionList.contents;

		for (let shelf of sectionListContents) {
			if (!shelf.musicCarouselShelfRenderer) continue;

			let header = UDigDict(shelf, UDictGet.headerFromSectionListShelf);
			let title = UDigDict(header, UDictGet.titleTextFromAnything);

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

		return response; // changed in-place
	};

	static C_PAGE_TYPE_CHANNEL_OR_ARTIST(response, id) {
		return this.MUSIC_PAGE_TYPE_ARTIST.apply(this, arguments);
	};

	static MUSIC_PAGE_TYPE_PLAYLIST(response, id, storage) {
		let listItems = UDigDict(response, UDictGet.listItemsFromBrowseResponseForListPage) || [];

		for (let lir of listItems) {
			lir = lir.musicResponsiveListItemRenderer;
			if (!lir) continue;

			UModifyListItemRendererForAnyPage(storage, "MUSIC_PAGE_TYPE_PLAYLIST", lir);

			let indexToAddNew = -1;
			let removingServiceEndpoint;

			let menuItems = UDigDict(lir, UDictGet.menuItemsFromAnything);
			if (!menuItems) continue;

			let i = -1;
			for (let serviceItem of menuItems) {
				i ++;

				let serviceEndpoint = UDigDict(serviceItem, UDictGet.serviceEndpointFromMenuItem);
				if (!serviceEndpoint) continue;

				let action = UDigDict(serviceItem, UDictGet.serviceActionPlaylistEditEndpointFromMenuItem);
				if (action !== "ACTION_REMOVE_VIDEO") continue;
				
				indexToAddNew = i;
				removingServiceEndpoint = serviceEndpoint;

				break;
			};

			if (indexToAddNew === -1) continue;

			let songName = UDigDict(lir, UDictGet.titleTextFromLIR) || "this song";

			let toAdd = UBuildEndpoint({
				navType: "menuNavigationItemRenderer",
				icon: "REMOVE_FROM_PLAYLIST",
				text: "Remove from playlist",
				endpoint: UBuildEndpoint({
					navType: "confirmDialog",
					title: "Delete from playlist",
					prompt: `Are you sure you want to remove "${songName}" from this playlist?`,
					confirmText: "Remove",
					endpoint: removingServiceEndpoint,
				})
			});

			menuItems.splice(indexToAddNew, 1, toAdd);
		};

		let customMetadata = storage.customisation.metadata[id] || {};

		let userOwnedHeaderRenderer = UDigDict(response, UDictGet.playlistHeaderRendererFromBrowseResponseUserOwned);
		let otherHeaderRenderer = UDigDict(response, UDictGet.playlistHeaderRendererFromBrowseResponse);
		let headerRenderer = userOwnedHeaderRenderer || otherHeaderRenderer;

		let coolBkg = customMetadata.bkg;

		if (coolBkg || customMetadata.thumb) {
			let thumbnails = [
				{ url: coolBkg || customMetadata.thumb, width: UIMG_HEIGHT, height: UIMG_HEIGHT }
			];

			headerRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails = thumbnails;
			response.background.musicThumbnailRenderer.thumbnail.thumbnails = thumbnails;

			if (coolBkg) response.cMusicFixerExtCoolBkg = true;
		};

		if (customMetadata.year) {
			if (userOwnedHeaderRenderer) headerRenderer.subtitle.runs[4].text = customMetadata.year;
			if (otherHeaderRenderer) headerRenderer.subtitle.runs[2].text = customMetadata.year;
		};

		return response; // changed in place, still return so acknowledges change
	};
};

["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = a class, non clonable, so throws err in bkgScript.)