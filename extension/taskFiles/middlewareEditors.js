export class GETEditors {
	static WatchtimeStore(request, response) {
		// final = video has ended, full play.
		let isFinal = request.urlObj.searchParams.get("final");
		if (!isFinal) return;

		// pe = playbackEnding. 1 = autoplay, 0 (or omitted) = skip
		let pe = Number(request.urlObj.searchParams.get("pe"));
		// cmt = current media time
		let cmt = Number(request.urlObj.searchParams.get("cmt"));
		// len = total media length
		let len = Number(request.urlObj.searchParams.get("len"));

		// ALLOW IF CONFIRMED AUTOPLAY (NOT SKIP), OR PLAYED 80%+
		let validWatch = (pe === 1) || (cmt >= (len * 0.8));
		console.log("WATCHTIME STATS", validWatch, "pe", pe === 1, "cmt", cmt >= (len * 0.8));

		//if (!validWatch) return; want to cache when was skipped! don't return :)

		ext.DispatchEventToEW({
			func: "add-watchtime",
			videoId: request.urlObj.searchParams.get("docid"),
			playingFrom: request.urlObj.searchParams.get("list"),
			completeWatch: validWatch // TODO: add to bkgScript
		});
	};

	static endpointToTask = {
		"/api/stats/watchtime": this.WatchtimeStore
	};
};



export class SmallPOSTEditors {

	/*static PlaylistCreateCommand(request, response) {
		let gathered = { // doesnt actually cache.
			name: request.body.title,
			type: "MUSIC_PAGE_TYPE_PLAYLIST",
			id: "VL" + response.playlistId,
			mfId: response.playlistId,
			items: request.body.videoIds || []
		};

		ext.DispatchEventToEW({
			func: "playlist-create",
			cacheData: gathered,
			tagData: request.cParams
		});

		return;
	};

	static PlaylistDeleteCommand(request, response) {
		let gathered = {
			id: "VL" + request.body.playlistId
		};

		ext.DispatchEventToEW({
			func: "playlist-delete",
			data: gathered
		});

		return;
	}; PUT IN WHEN SIDEBAR EDITABLE AGAIN. */

	static async CacheVideoViews(request, response) {
		let gathered = {
			id: response.videoDetails.videoId,
			views: Number(response.videoDetails.viewCount),
			type: response.videoDetails.musicVideoType
		};

		ext.DispatchEventToEW({
			func: "set-cache",
			data: [{"data": gathered}]
		});

		return;
	};

	static async CacheDislike(request, reponse) {
		let gathered = {
			id: request.body.target.videoId,
			liked: "DISLIKE",
			type: "SONG"
		};

		if (!gathered) return;

		ext.DispatchEventToEW({
			func: "set-cache",
			data: [{"data": gathered}]
		});

		return;
	};


	static async CacheLike(request, response) {//, storage) {
		let gathered;
		
		if (request.body.target.videoId) {
			gathered = {
				id: request.body.target.videoId,
				liked: "LIKE",
				type: "SONG"
			};
		};

		/*if (request.body.target.playlistId) {
			let type = ext.GetBrowsePageTypeFromBrowseId(request.body.target.playlistId, true, true);
			let id = (type === "MUSIC_PAGE_TYPE_ALBUM") ? storage.cache.mfIdMap[request.body.target.playlistId]
				: "VL" + request.body.target.playlistId;
			
			gathered = {
				"id": id,
				saved: true,
				"type": type
			};
		};*/

		if (!gathered || !gathered.id) return;

		ext.DispatchEventToEW({
			func: "set-cache",
			data: [{"data": gathered}]
		});

		return;
	};

	static async CacheUnlike(request, response) {//, storage) {
		let gathered;
		
		if (request.body.target.videoId) {
			gathered = {
				id: request.body.target.videoId,
				liked: "INDIFFERENT",
				type: "SONG"
			};
		};

		/*if (request.body.target.playlistId) {
			let type = ext.GetBrowsePageTypeFromBrowseId(request.body.target.playlistId, true, true);
			let id = (type === "MUSIC_PAGE_TYPE_ALBUM") ? storage.cache.mfIdMap[request.body.target.playlistId]
				: "VL" + request.body.target.playlistId;
			
			gathered = {
				"id": id,
				saved: false,
				"type": type
			};
		}; WANT THIS! TODO! */

		if (!gathered || !gathered.id) return;

		ext.DispatchEventToEW({
			func: "set-cache",
			data: [{"data": gathered}]
		});

		return;
	}; // TODO

	static async OnPlaylistEdit(request, response) {
		let currentState = polymerController.store.getState();
		let browsedToId = ext.SafeDeepGet(currentState, ext.Structures.browseIdFromPolymerState());
		if (!browsedToId) return;

		browsedToId = browsedToId.replace(/^VL/, "");
		if (browsedToId !== request.body.playlistId) return;

		let listItems = document.querySelectorAll(ext.HELPFUL_SELECTORS.listItemRenderersOfCurrentBrowseResponse);
		if (!listItems || listItems.length === 0) return;

		let videoIdsToListItem = {};
		for (let listItem of listItems) {
			let videoId = ext.SafeDeepGet(listItem, ext.Structures.videoIdFromLIRElem());
			if (!videoId) continue;

			videoIdsToListItem[videoId] = listItem;
		};

		for (let action of (request.body.actions || [])) {
			if (action.action !== "ACTION_REMOVE_VIDEO") continue;

			let listItem = videoIdsToListItem[action.removedVideoId];
			if (!listItem) continue;

			listItem.remove();
		};
	};


	static async CacheFromNextItems(request, response, lyricPanel) {
		let lyricEndpoint = lyricPanel?.endpoint?.browseEndpoint?.browseId;
		if (!lyricEndpoint) return;

		let playingVideoId = response.currentVideoEndpoint?.watchEndpoint?.videoId;
		if (!playingVideoId) return;

		let gathered = {
			id: playingVideoId,
			"lyricEndpoint": lyricEndpoint,
			type: "SONG"
		};
		console.log("GATHERED", gathered);

		ext.DispatchEventToEW({
			func: "set-cache",
			data: [{"data": gathered}]
		});
	};


	static async TidyQueueNextItems(request, response) {		
		// SET PLAYER PAGE COLOURS
		const thumbs = ext.SafeDeepGet(response, ext.Structures.thumbnailsFromNextResponse);
		document.querySelector(":root").style.setProperty("--playing-thumbnail", ext.ChooseBestThumbnail(thumbs));

		let browsePage = document.querySelector("ytmusic-browse-response");
		if (browsePage && browsePage.getAttribute("c-edited") === false) {
			console.log("browse page reports no c edits. returning in /next middleware.");
			return;
		};

		let playlistPanel = ext.SafeDeepGet(response, ext.Structures.playlistPanelFromNextResponse());
		let lyricPanel = ext.SafeDeepGet(response, ext.Structures.lyricPanelFromNextResponse());

		try {this.CacheFromNextItems(request, response, lyricPanel); }
		catch (err) { console.trace(err); };

		if (!playlistPanel || !playlistPanel.contents) return;
		let isShuffle = request.body.watchNextType === "WATCH_NEXT_TYPE_MUSIC_SHUFFLE";

		console.log("originalPlaylistPanelcontents", structuredClone(playlistPanel.contents));
		console.log(request.cParams, (request.cParams || {}), (request.cParams || {}).buildQueueFrom);

		let [newContents, currentVideoWE, currentData] = await middlewareEditors.MainPOSTEditors._EditQueueContentsFromResponse(
			playlistPanel.contents,
			(request.cParams || {}).buildQueueFrom,
			request.body.videoId,
			false
		);

		if (newContents) playlistPanel.contents = newContents;
		
		if (!currentVideoWE) return response; // changed in place (and leaving early)
		response.currentVideoEndpoint.watchEndpoint = currentVideoWE;

		/*let currentVideoCache = storage.cache[currentVideoWE.videoId];
		if (!currentVideoCache) return response; // changed in place

		// LYRIC EDITING
		// TODO!
		console.log({currentVideoCache}, request.body.videoId, currentVideoWE.videoId)
		if (request.body.videoId !== currentVideoWE.videoId) {
			let lyricsBID = currentVideoCache.lyricEndpoint;
			console.log({lyricsBID, lyricPanel});

			if (lyricsBID && lyricPanel) {
				lyricPanel.endpoint = ext.BuildEndpoint({
					navType: "browse",
					id: lyricsBID
				});
			};
		};

		lyricPanel && (lyricPanel.unselectable = false);*/


		let overlayButtons = ext.SafeDeepGet(response, ext.Structures.overlayButtonsFromNextResponse);
		if (!overlayButtons) return response; // changed in place

		let like = ext.GetEndpointByNameFromArray(overlayButtons, "likeButtonRenderer");
		like.likeStatus = currentData.newData.liked;
		like.target.videoId = currentVideoWE.videoId;
		like.serviceEndpoints[0].likeEndpoint.target.videoId = currentVideoWE.videoId;
		like.serviceEndpoints[1].likeEndpoint.target.videoId = currentVideoWE.videoId;
		like.serviceEndpoints[2].likeEndpoint.target.videoId = currentVideoWE.videoId;

		console.log("newPlPancontents", playlistPanel.contents);

		return response; // was changed in-place.
	};


	static async TidyGetQueueItems(request, response) {
		//if (!request.cParams || !request.cParams.buildQueueFrom) return;
		// so now if user clicks "revert" on album page, it will play original.
		// and, clicking a main song will now include the extras.

		let queueDatas = response.queueDatas;
		if (!queueDatas) return;
		let buildFrom = request.cParams ? request.cParams.buildQueueFrom : undefined;

		let [newContents, currentVideoWE, currentData] = await middlewareEditors.MainPOSTEditors._EditQueueContentsFromResponse(queueDatas, buildFrom, undefined, true, request.body.videoIds);

		if (newContents) response.queueDatas = newContents;
		return response; // was changed in-place.
	};


	static endpointToTask = {
//		"/youtubei/v1/playlist/create": this.PlaylistCreateCommand,
//		"/youtubei/v1/playlist/delete": this.PlaylistDeleteCommand,
		"/youtubei/v1/player": this.CacheVideoViews,
		"/youtubei/v1/like/dislike": this.CacheDislike,
		"/youtubei/v1/browse/edit_playlist": this.OnPlaylistEdit,
		//"/youtubei/v1/subscription/subscribe"
		//"/youtubei/v1/subscription/unsubscribe"
		"/youtubei/v1/next": this.TidyQueueNextItems,
		"/youtubei/v1/music/get_queue": this.TidyGetQueueItems,

		"/youtubei/v1/like/like": this.CacheLike,
		"/youtubei/v1/like/removelike": this.CacheUnlike,
		
	};
};



export class MainPOSTEditors {
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

	static _ConvertOldAlbumPageToNew(response, id, data) {
		let thumbnailRenderer = {
			thumbnail: {
				thumbnails: response.header.musicDetailHeaderRenderer.thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails
			},
			thumbnailCrop: "MUSIC_THUMBNAIL_CROP_UNSPECIFIED",
			thumbnailScale: "MUSIC_THUMBNAIL_SCALE_UNSPECIFIED"
		};


		let subtitleOneData = cacheService.GetDataFromSubtitleRuns(response.header.musicDetailHeaderRenderer.subtitle);
		let subtitleOneRuns = [];

		if (subtitleOneData.subType && subtitleOneData.year) {
			subtitleOneRuns = [
				{text: subtitleOneData.subType},
				{text: ext.YT_DOT},
				{text: subtitleOneData.year}
			];

		} else if (subtitleOneData.subType) {
			subtitleOneRuns = [{text: subtitleOneData.subType}];

		} else if (subtitleOneData.year) {
			subtitleOneRuns = [{test: subtitleOneData.yrar}]; // TODO had to chane fom yearStr, check elsewhere

		};

		let creator = ((subtitleOneData.artists) ? subtitleOneData.artists[0] : undefined) || subtitleOneData.creator;
		let cachedCreator = data.privateCounterpart || (data.artists || [])[0];

		let cachedCreatorThumb = cachedCreator?.thumb;

		let straplineTextOne = {};
		let straplineThumbnail = {};


		if (creator) {
			straplineTextOne = {
				runs: [
					{
						text: (cachedCreator || creator).name
					}
				]
			};

			if (creator.id !== ext.VARIOUS_ARTISTS_ID) {
				straplineTextOne.runs[0].navigationEndpoint = ext.BuildEndpoint({
					navType: "browse",
					id: cachedCreator.id || creator.id
				});
			};


			straplineThumbnail = {
				musicThumbnailRenderer: {
					thumbnail: {
						thumbnails: [
							{
								url: cachedCreatorThumb,
								width: ext.IMG_HEIGHT,
								header: ext.IMG_HEIGHT
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

			let videoId = ext.SafeDeepGet(listItem, ext.Structures.videoIdFromLIRData);
			if (!videoId) continue;

			let cachedVideo = (data.items.filter( v => v.id === videoId) || [])[0];
			if (!cachedVideo) continue;

			listItem.flexColumns.push({
				musicResponsiveListItemFlexColumnRenderer: {
					displayPriority: "MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_MEDIUM",
					text: { runs: [ { text: ext.BigNumToStr(cachedVideo.views) + " plays" } ] }
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

		let longBylineData = cacheService.GetDataFromSubtitleRuns(videoRenderer.longBylineText);

		let songCacheData = cache[videoRenderer.videoId];
		let albumId = (longBylineData.album) ? longBylineData.album.id :
					  (songCacheData) ? songCacheData.album : undefined;
		let albumCacheData = (albumId) ? cache[albumId] : {};

		let artistId = (longBylineData.artists) ? longBylineData.artists[0].id :
					   (songCacheData) ? songCacheData.artists[0] : undefined;
		let artistCacheData = (artistId) ? cache[artistId] : {};

		if (albumCacheData && albumCacheData.year && !longBylineData.yearStr) {
			videoRenderer.longBylineText.runs.push(
				{ text: ext.YT_DOT },
				{ text: String(albumCacheData.year)}
			);
		};

		let albumMetadata = storage.customisation.metadata[realAlbum.id] || {};

		let newRuns = [];

		for (let run of videoRenderer.longBylineText.runs) {
			newRuns.push(run);

			if (!run.navigationEndpoint) continue;

			let type = ext.SafeDeepGet(run.navigationEndpoint, ext.Structures.pageTypeFromNavigationEndpoint);
			let id;
			if (!type) continue;

			if (!type || type === "MUSIC_PAGE_TYPE_UNKNOWN") {
				id = ext.SafeDeepGet(run.navigationEndpoint, ext.Structures.browseIdFromNavigationEndpoint);
				if (!id) continue;

				type = ext.GetBrowsePageTypeFromBrowseId(id, false, true);
			};

			let counterpartData;

			if (type === "MUSIC_PAGE_TYPE_ALBUM" && realAlbum.id) {
				if (albumMetadata.title) run.text = albumMetadata.title;

				run.navigationEndpoint = ext.BuildEndpoint({
					navType: "browse",
					id: realAlbum.id
				});
			};

			if (type === "C_PAGE_TYPE_PRIVATE_ARTIST") {
				counterpartData = ext.GetCounterpartFromData(cache, artistCacheData);

				if (videoRenderer.shortBylineText) {
					videoRenderer.shortBylineText.runs[0] = {
						text: (counterpartData) ? counterpartData.name : run.text
					};
				};

				if (!counterpartData) continue;
				let counterpartCustomisation = storage.customisation.metadata[counterpartData.id] || {};

				run.text = counterpartCustomisation.name || counterpartData.name;
				run.navigationEndpoint = ext.BuildEndpoint({
					navType: "browse",
					id: counterpartData.id
				});

				type = "MUSIC_PAGE_TYPE_ARTIST";
			};

			if (type === "MUSIC_PAGE_TYPE_ARTIST") {
				if (!id) id = ext.SafeDeepGet(run.navigationEndpoint, ext.Structures.browseIdFromNavigationEndpoint);
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
		let buttons = ext.SafeDeepGet(videoRenderer, ext.Structures.menuItems);
		if (!buttons) return;

		let i = -1;
		for (let b of structuredClone(buttons)) {
			i ++;

			let serviceAction = ext.SafeDeepGet(b, ext.Structures.serviceActionPlaylistEditEndpointFromMenuItem())?.action;
			if (serviceAction === "ACTION_REMOVE_VIDEO" ) {
				buttons.splice(i, 1);
				i--;
				continue;
			};

			let navigateActionOnConfirm = ext.SafeDeepGet(b, ext.Structures.endpointOnConfirmDialogFromNavigationMenuItem);
			if (navigateActionOnConfirm && navigateActionOnConfirm.musicDeletePrivatelyOwnedEntityCommand) {
				buttons.splice(i, 1);
				i--;
				continue;
			};
		};
	};

	//static async _EditQueueContentsFromRespon(storage, queueContents, buildQueueFromBId, loadedQueueFromMfId, videoIdToSelect, isShuffle, areQueueDatas, queueDataRequestIds) {
	static async _EditQueueContentsFromResponse(queueContents, id, videoIdToSelect, areQueueDatas, queueDataRequestIds) {
		if (id === undefined) return [undefined, undefined, undefined];
		if (!queueDataRequestIds) queueDataRequestIds = [];
		
		const newList = await ext.StorageGet({ storageFunc: "edit-list", id });

		const newItemOrder = [];
		let currentWatchEndpoint;
		let currentData;
		let indexOffset = newList.minIndex;

		console.log("queueContents now", structuredClone(queueContents));

		const vrByIndex = {};
		let backingPlaylistId;

		for (const item of queueContents) {
			const vr = ext.GetPPVR(item);
			if (!vr) continue; // AUTOPLAY

			const thisIndex = vr.navigationEndpoint?.watchEndpoint?.index; // ALWAYS ZERO-BASED, NUMBER.

			vrByIndex[thisIndex] = item; // NOT vr

			if (!backingPlaylistId) backingPlaylistId = ext.SafeDeepGet(vr, ext.Structures.backingPlaylistIdFromVideoRenderer);
		};

		for (const newData of newList.listItems) {
			if (!newData.id) continue; // PLACEHOLDERS OF {}
			if ((newData.hidden || newData.skipped) && (id !== newData.id) && (queueDataRequestIds.indexOf(newData.id) === -1)) {
				indexOffset ++;
				continue;
			}; // DON'T CREATE SKIPPED. ADD INDEX OFFSET. TODO: USE INDEXOFFSET TO SET watchEndpoint indexes.

			let item = vrByIndex[newData.displayIndex - newList.minIndex];
			let vr;

			if (item && newData.changed) item = ext.BuildPlaylistPanelRendererFromData(newData, newList.albumData, newList.artistData, backingPlaylistId, newList.minIndex);// ext.AddPlaylistPanelRendererReplacements(item, newData, newList.albumData, newList.artistData, backingPlaylistId, newList.minIndex);
			else if (item) {
				vr = ext.GetPPVR(item);
				vr.longBylineText.runs = ext.CreateLongBylineForPlaylistPanel(newList.albumData, newList.albumData, newList.artistData);
				// TODO: metadata thumb, name.
				// old method ModifyPlaylistPanelRendererNotReplacement

			} else item = ext.BuildPlaylistPanelRendererFromData(newData, newList.albumData, newList.artistData, backingPlaylistId, newList.minIndex);

			
			if (!vr) vr = ext.GetPPVR(item);
			vr.cData = {
				albumData: newList.albumData,
				artistData: newList.artistData,
				thisData: newData
			};

			this._DeleteRemoveFromPlaylistButtonFromPPVR(vr);

			const isCurrent = vr.videoId === videoIdToSelect;
			if (videoIdToSelect) vr.selected = isCurrent;
			if (isCurrent) {
				currentWatchEndpoint = vr.navigationEndpoint.watchEndpoint;
				currentData = newData;
			};

			newItemOrder.push((areQueueDatas) ? { content: item } : item);
		};

		console.log("newContents", newItemOrder);

		return [newItemOrder, currentWatchEndpoint, currentData];
	};


	static async C_PAGE_TYPE_PRIVATE_ALBUM(response, id) {
		const data = await ext.StorageGet({storageFunc: "get-populated", id });
		let albumLike = this._ConvertOldAlbumPageToNew(response, id, data);
		let newResp = this.MUSIC_PAGE_TYPE_ALBUM(albumLike, id);

		return newResp || albumLike;
	};

	static async MUSIC_PAGE_TYPE_ALBUM(response, id) {
		// caching stuff
		// need to edit album subtitleTwo total minutes based on contents.

		const newList = await ext.StorageGet({ storageFunc: "edit-list", id });

		let musicShelfRenderer = ext.SafeDeepGet(response, ext.Structures.albumMusicShelfRenderer());
		if (!musicShelfRenderer?.contents) return;

		const lirByIndex = {};
		let originalLengthSec = 0;

		for (const item of musicShelfRenderer.contents) {
			const lir = item.musicResponsiveListItemRenderer;
			const thisIndex = Number(lir?.index?.runs?.[0].text);

			lirByIndex[thisIndex] = item; // NOT lir

			const thisLenStr = ext.SafeDeepGet(lir, ext.Structures.lengthStrFromLIRData);
			if (thisLenStr) originalLengthSec += ext.LengthStrToSeconds(thisLenStr);
		};

		console.log("listitems before", structuredClone(musicShelfRenderer.contents));

		const newItemOrder = [];
		let newLengthSec = 0;
		let playableSongs = 0;

		for (const newData of newList.listItems) {
			if (!newData.id) continue; // PLACEHOLDERS OF {}

			let lir = lirByIndex[newData.displayIndex];

			if (lir) ext.AddListItemReplacements(lir, newData, newList.albumData, newList.artistData, newList.minIndex);
			else lir = ext.BuildListItemRendererFromDataForAlbumPage(newData, newList.albumData, newList.artistData, newList.minIndex);

			const thisCData = {
				albumData: newList.albumData,
				artistData: newList.artistData,
				thisData: newData
			};

			if (lir.musicResponsiveListItemRenderer) lir.musicResponsiveListItemRenderer.cData = thisCData
			else lir.cData = thisCData;

			ext.ModifyListItemRendererForAnyPage(lir, newList.albumData, newList.artistData, "MUSIC_PAGE_TYPE_ALBUM");

			newItemOrder.push(lir);
			newLengthSec += newData.newData.lengthSec;
			if (!(newData.hidden || newData.skipped)) playableSongs ++;
			
			// AddListItemReplacements sets lir.cData = newData, has hidden and skipped in it.
		};

		
		if (newItemOrder.length !== 0) musicShelfRenderer.contents = newItemOrder;
		if (playableSongs === 0) playableSongs = musicShelfRenderer.contents.length;

		// EDIT HEADER DETAILS, AUTOMATICALLY, BASED ON NEW CONTENTS.
		const headerRenderer = ext.SafeDeepGet(response, ext.Structures.listPageHeaderRenderer());

		if (newList.albumData.title) headerRenderer.title.runs = [ { text: newList.albumData.title } ];
		if (newList.albumData.desc) {
			headerRenderer.description.musicDescriptionShelfRenderer.description.runs = [
				{ text: newList.albumData.desc }
			];
		};

		const coolBkg = newList.albumData.bkg;

		if (coolBkg || newList.albumData.thumb) {
			const thumbnails = [
				{ url: coolBkg || newList.albumData.thumb, width: ext.IMG_HEIGHT, height: ext.IMG_HEIGHT }
			];

			headerRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails = thumbnails;
			response.background.musicThumbnailRenderer.thumbnail.thumbnails = thumbnails;

			if (coolBkg) response.cMusicFixerExtCoolBkg = true;
		};

		let albumType = newList.albumData.subType;
		if (!albumType && newList.albumData.private && playableSongs === 1) albumType = "Single";
		
		if (albumType) headerRenderer.subtitle.runs[0].text = albumType;
		if (newList.albumData.year) headerRenderer.subtitle.runs[2].text = newList.albumData.year;


		if (newList.artistData.name) headerRenderer.straplineTextOne = {
			runs: [{
				text: newList.artistData.name,
				navigationEndpoint: ext.BuildEndpoint({
					navType: "browse",
					browseId: newList.artistData.id
				})
			}]
		};

	
		headerRenderer.straplineThumbnail = {
			musicThumbnailRenderer: {
				thumbnail: {
					thumbnailCrop: "MUSIC_THUMBNAIL_CROP_UNSPECIFIED",
					thumbnailScale: "MUSIC_THUMBNAIL_SCALE_UNSPECIFIED",
					thumbnails: [{
						url: newList.artistData.thumb,
						width: ext.IMG_HEIGHT,
						height: ext.IMG_HEIGHT
					}]
				}
			}
		};


		headerRenderer.secondSubtitle.runs[0].text = `${playableSongs} songs`;
		headerRenderer.secondSubtitle.runs[2].text = ext.SecondsToWordyHMS(originalLengthSec);

		if (originalLengthSec !== newLengthSec && newLengthSec) headerRenderer.secondSubtitle.runs.push(
			{text: ext.YT_DOT},
			{text: `${ext.SecondsToWordyHMS(newLengthSec)} edited`}
		);

		const playButton = ext.GetEndpointByNameFromArray(headerRenderer.buttons, "musicPlayButtonRenderer");
		const firstLIR = musicShelfRenderer.contents[0].musicResponsiveListItemRenderer;
		const firstWE = ext.SafeDeepGet(firstLIR, ext.Structures.watchEndpointFromLIRDataPlayButton());

		playButton.playNavigationEndpoint.watchEndpoint = structuredClone(firstWE);
		delete playButton.playNavigationEndpoint.watchEndpoint.videoId;
		delete playButton.playNavigationEndpoint.watchEndpoint.playlistSetVideoId;
		delete playButton.playNavigationEndpoint.watchEndpoint.index;

		console.log("listitems after", musicShelfRenderer.contents);

		return response; // was changed in-place
	};


	/*static async MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY(response, id) {
		// THIS ONLY HAPPENS THE FIRST TIME. NAVIGATION = THROUGH CONTINUATIONS
		// SO ADDING OUR CUSTOM ELEMS IS IN THE CONTINUATION!

		let sectionListRenderer = ext.SafeDeepGet(response, ext.Structures.sectionListRendererFromSingleColumn);
		if (!sectionListRenderer) return;

		let sortOptions = ext.SafeDeepGet(sectionListRenderer, ext.Structures.sortOptionsFromSectionListRendererForBasicGrid);

		if (!sortOptions) return;
		let recencyOpt;

		for (let sortOpt of sortOptions) {
			sortOpt = sortOpt.musicMultiSelectMenuItemRenderer;

			if (sortOpt.title.runs[0].text !== "Recency") continue;
			recencyOpt = sortOpt;
			break;
		};
		if (!recencyOpt) return;

		let cmds = ext.SafeDeepGet(recencyOpt, ext.Structures.commandsFromMultiSelectItemRenderer);
		let navEndp;

		for (let cmd of cmds) {
			if (!cmd.browseSectionListReloadEndpoint) continue;
			navEndp = cmd;
			break;
		};

		let continuation = ext.SafeDeepGet(navEndp, ext.Structures.reloadContinuationDataFromNavigationEndpoint);

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

	static async CONT_MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY(response, id, cache) {
		// THIS DOES NOT WORK ANYWAY TODO
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

		let gridRenderer = ext.SafeDeepGet(response, ext.Structures.gridRendererFromContinuationResponse);

		if (!gridRenderer) {
			gridRenderer = ext.SafeDeepGet(response, ext.Structures.gridContinuationDataFromResponse);

			if (!gridRenderer) return;
		};

		let doneYears = [];

		let newItems = [];

		for (let i of gridRenderer.items) {
			let data = cacheService.GetInfoFromTRIR(i, ext.BrowsePageTypes.artistDiscography);

			if (!data.yearStr || doneYears.indexOf(data.yearStr) !== -1) {
				newItems.push(i);
				continue;
			};

			doneYears.push(data.yearStr);

			for (let [album, year] of Object.entries(structuredClone(releaseToYear))) {
				if (Number(year) <= Number(data.yearStr)) continue;

				let twoRow = ext.BuildTwoRowItemRendererFromData(cache[album]);
				newItems.push(twoRow);

				delete releaseToYear[album];
			};

			newItems.push(i);
		};

		if (!gridRenderer.continuation) {
			for (let i of Object.keys(releaseToYear)) {
				let twoRow = ext.BuildTwoRowItemRendererFromData(cache[i]);
				newItems.push(twoRow);
			};
		};

		gridRenderer.items = newItems;
		return newItems;
	};*/


	static async MUSIC_PAGE_TYPE_ARTIST(response, id) {
		let sectionList = ext.SafeDeepGet(response, ext.Structures.sectionListRendererFromSingleColumn);
		if (!sectionList || !sectionList.contents) return;

		let sectionListContents = sectionList.contents;

		for (let shelf of sectionListContents) {
			if (!shelf.musicCarouselShelfRenderer) continue;

			let header = ext.SafeDeepGet(shelf, ext.Structures.headerFromSectionListShelf);
			let title = ext.SafeDeepGet(header, ext.Structures.titleText);

			if (title !== "Albums" && title !== "Singles and EPS") continue;
			if (header.moreContentButton) continue;

			header.moreContentButton = {
				buttonRenderer: {
					style: "STYLE_TEXT",
					text: { runs: [ { text: "More" } ] },
					navigationEndpoint: ext.BuildEndpoint({
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

	static async C_PAGE_TYPE_CHANNEL_OR_ARTIST(response, id) {
		return this.MUSIC_PAGE_TYPE_ARTIST.apply(this, arguments);
	};

	/*static async MUSIC_PAGE_TYPE_PLAYLIST(response, id, storage) {
		const listItems = ext.SafeDeepGet(response, ext.Structures.playlistListItems()) || [];

		for (let lir of listItems) {
			lir = lir.musicResponsiveListItemRenderer;
			if (!lir) continue;

			ext.ModifyListItemRendererForAnyPage(storage, "MUSIC_PAGE_TYPE_PLAYLIST", lir);

			let indexToAddNew = -1;
			let removingServiceEndpoint;

			let menuItems = ext.SafeDeepGet(lir, ext.Structures.menuItems);
			if (!menuItems) continue;

			let i = -1;
			for (let serviceItem of menuItems) {
				i ++;

				let serviceEndpoint = ext.SafeDeepGet(serviceItem, ext.Structures.serviceEndpointFromMenuItem);
				if (!serviceEndpoint) continue;

				let action = ext.SafeDeepGet(serviceItem, ext.Structures.serviceActionPlaylistEditEndpointFromMenuItem())?.action;
				if (action !== "ACTION_REMOVE_VIDEO") continue;
				
				indexToAddNew = i;
				removingServiceEndpoint = serviceEndpoint;

				break;
			};

			if (indexToAddNew === -1) continue;

			let songName = ext.SafeDeepGet(lir, ext.Structures.titleTextFromLIR) || "this song";

			let toAdd = ext.BuildEndpoint({
				navType: "menuNavigationItemRenderer",
				icon: "REMOVE_FROM_PLAYLIST",
				text: "Remove from playlist",
				endpoint: ext.BuildEndpoint({
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

		let userOwnedHeaderRenderer = ext.SafeDeepGet(response, ext.Structures.listPageHeaderRendererUserOwned());
		let otherHeaderRenderer = ext.SafeDeepGet(response, ext.Structures.listPageHeaderRenderer());
		let headerRenderer = userOwnedHeaderRenderer || otherHeaderRenderer;

		let coolBkg = customMetadata.bkg;

		if (coolBkg || customMetadata.thumb) {
			let thumbnails = [
				{ url: coolBkg || customMetadata.thumb, width: ext.IMG_HEIGHT, height: ext.IMG_HEIGHT }
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
	};*/
};

export const urlsToEdit = [
	"/youtubei/v1/browse",
	...Object.keys(SmallPOSTEditors.endpointToTask)
];

["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = a class, non clonable, so throws err in bkgScript.)