MiddlewareEditors = class MiddlewareEditors {
	static urlsToEdit = [
		"/youtubei/v1/browse",
		"/youtubei/v1/playlist/create",
		"/youtubei/v1/playlist/delete",
		"/youtubei/v1/like/like",
		"/youtubei/v1/like/removelike",
		"/youtubei/v1/next",
		"/youtubei/v1/player",
		"/youtubei/v1/music/get_queue",
		"/youtubei/v1/subscription/subscribe",
		"/youtubei/v1/subscription/unsubscribe"
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

			return;
		},

		"/youtubei/v1/playlist/delete": function PlaylistDeleteCommand(request, response) {
			let gathered = {
				id: "VL" + request.body.playlistId
			};

			UDispatchEventToEW({
				func: "playlist-delete",
				data: gathered
			});

			return;
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

			return;
		},

		"/youtubei/v1/like/dislike": function CacheDislike(request, reponse) {
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
		},

		/* this is bad, think theres something going on with topic channels?
		request does not have the browsed to id of the channel. eg, cage the elephant, endpoint = UCOk9wZlQNsWjb7gJhnvmbkQ but
		browsed to UCU3rXoHt2bCYbpV3s_sJlgw.
		"/youtubei/v1/subscription/subscribe": function CacheSubscribe(request, response) {
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

		"/youtubei/v1/subscription/unsubscribe": function CacheUnsubscribe(request, response) {
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
	};


	static SmallTasksRequireCache = {
		"/youtubei/v1/like/like": function CacheLike(request, response, storage) {
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
		},

		"/youtubei/v1/like/removelike": function CacheUnlike(request, response, storage) {
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
		},

		"/youtubei/v1/next": function TidyQueueNextItems(request, response, storage) {
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

			let playlistPanel = UDigDict(response, [
				"contents", "singleColumnMusicWatchNextResultsRenderer", "tabbedRenderer",
				"watchNextTabbedResultsRenderer", "tabs", 0,
				"tabRenderer", "content", "musicQueueRenderer",
				"content", "playlistPanelRenderer"//, "contents"
			]);

			if (!playlistPanel || !playlistPanel.contents) return;
			let isShuffle = request.body.watchNextType === "WATCH_NEXT_TYPE_MUSIC_SHUFFLE";

			console.log("originalPlaylistPanelcontents", structuredClone(playlistPanel.contents));
			console.log(request.cParams, (request.cParams || {}), (request.cParams || {}).buildQueueFrom);

			let [newContents, currentVideoWE] = this._EditQueueContentsFromResponse(
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

			let overlayButtons = UDigDict(response, ["playerOverlays", "playerOverlayRenderer", "actions"]);
			if (!overlayButtons) return response; // changed in place

			let like = UGetButtonFromButtons(overlayButtons, "likeButtonRenderer");
			like.likeStatus = currentVideoCache.liked;
			like.target.videoId = currentVideoWE.videoId;
			like.serviceEndpoints[0].likeEndpoint.target.videoId = currentVideoWE.videoId;
			like.serviceEndpoints[1].likeEndpoint.target.videoId = currentVideoWE.videoId;
			like.serviceEndpoints[2].likeEndpoint.target.videoId = currentVideoWE.videoId;

			console.log("newPlPancontents", playlistPanel.contents);

			/*DONT DELETE THIS. ONGOING STRUGGLE, KEEP THE CODE!  let headerButtons = UDigDict(response, [
				"contents", "singleColumnMusicWatchNextResultsRenderer", "tabbedRenderer",
				"watchNextTabbedResultsRenderer", "tabs", 0,
				"tabRenderer", "content", "musicQueueRenderer",
				"header", "musicQueueHeaderRenderer", "buttons"
			]);

			if (!headerButtons) return response; // has been changed in place.

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
			});*/

			return response; // was changed in-place.

		},

		"/youtubei/v1/music/get_queue": function TidyGetQueueItems(request, response, storage) {
			//if (!request.cParams || !request.cParams.buildQueueFrom) return;
			// so now if user clicks "revert" on album page, it will play original.
			// and, clicking a main song will now include the extras.

			let queueDatas = response.queueDatas;
			if (!queueDatas) return;

			let [newContents, currentVideoWE] = this._EditQueueContentsFromResponse(storage, queueDatas, request.cParams.buildQueueFrom, request.body.playlistId, undefined, false, true);
			
			if (newContents) response.queueDatas = newContents;
			return response; // was changed in-place.
		}
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

		// used to only edit priv, not anymore.if (!(albumCacheData && albumCacheData.private === true) && !(artistCacheData && artistCacheData.private === true)) return;

		let albumMetadata = storage.customisation.metadata[realAlbum.id] || {};

		let newRuns = [];

		for (let run of videoRenderer.longBylineText.runs) {
			newRuns.push(run);

			if (!run.navigationEndpoint) continue;

			let type = UDigDict(run.navigationEndpoint, ["browseEndpoint", "browseEndpointContextSupportedConfigs", "browseEndpointContextMusicConfig", "pageType"]);
			let id;
			if (!type) continue;

			if (!type || type === "MUSIC_PAGE_TYPE_UNKNOWN") {
				id = UDigDict(run.navigationEndpoint, ["browseEndpoint", "browseId"]);
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

				run.text = (counterpartData) ? counterpartData.name : run.text;
				run.navigationEndpoint = UBuildEndpoint({
					navType: "browse",
					id: counterpartData.id
				});

				type = "MUSIC_PAGE_TYPE_ARTIST";
			};

			if (type === "MUSIC_PAGE_TYPE_ARTIST") {
				if (!id) id = UDigDict(run.navigationEndpoint, ["browseEndpoint", "browseId"]);
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
		let buttons = UDigDict(videoRenderer, [
			"menu", "menuRenderer", "items"
		]);
		if (!buttons) return;

		let i = -1;
		for (let b of structuredClone(buttons)) {
			i ++;

			let serviceAction = UDigDict(b, [
				"menuServiceItemRenderer", "serviceEndpoint", "playlistEditEndpoint",
				"actions", 0, "action"
			]);
			if (!serviceAction) continue;
			if (serviceAction !== "ACTION_REMOVE_VIDEO") continue

			buttons.splice(i, 1);
		};
	};

	static _EditQueueContentsFromResponse(storage, queueContents, buildQueueFromBId, loadedQueueFromMfId, videoIdToSelect, isShuffle, areQueueDatas) {
		let buildFromAlbum = storage.cache[buildQueueFromBId] || {};
		let loadedFromAlbum = UGetObjFromMfId(storage.cache, loadedQueueFromMfId) || {};
		console.log(buildQueueFromBId, loadedQueueFromMfId, buildFromAlbum, loadedFromAlbum);

		let idsToReplace = UGetIdsToReplaceFromRealAlbum(storage, buildFromAlbum.id, loadedFromAlbum.id) || {};
		console.log("replacements", idsToReplace);
		console.log("queueContentsBefore", structuredClone(queueContents));

		let cachedArtist = (buildFromAlbum.artist) ? storage.cache[buildFromAlbum.artist] : undefined;
		let hiddenSongs = storage.customisation.hiddenSongs[buildQueueFromBId] || [];
		let skippedSongs = storage.customisation.skippedSongs[buildQueueFromBId] || [];

		hiddenSongs.push(...skippedSongs);

		let backingPlaylistId; // for use later. get it in this loop from anything we can!

		// FIRST ITERATION. REPLACE WHATEVER, IF NOT REPLACED EDIT LONG BYLINE.
		for (let item of queueContents) {
			let videoRenderer = UGetPlaylistPanelVideoRenderer(item);
			if (!videoRenderer) continue;

			let replacement = idsToReplace[videoRenderer.videoId];

			console.log(item, replacement);

			if (replacement) UModifyPlaylistPanelRendererFromData(videoRenderer, replacement, buildFromAlbum, cachedArtist);
			else {
				let cachedVideo = this._EditLongBylineOfPlaylistPanelVideoRenderer(storage, videoRenderer, buildFromAlbum);
				videoRenderer.cData = { video: cachedVideo, from: buildFromAlbum };// why did we set cData here? dont think it worked?

				this._DeleteRemoveFromPlaylistButtonFromPPVR(videoRenderer);
			};

			if (!backingPlaylistId) backingPlaylistId = UDigDict(videoRenderer, [
				"queueNavigationEndpoint", "queueAddEndpoint",
				"queueTarget", "backingQueuePlaylistId"
			]);

			if (videoIdToSelect) videoRenderer.selected = videoRenderer.videoId === videoIdToSelect;
		};

		if (!buildQueueFromBId) {
			// USER HAS CLICKED TO LOAD FROM ORIGINAL, OR OTHER.
			// ONLY WANTED TO DO FIRST ITERATION, TO EDIT LONGBYLINE.
			console.log("leaving early!");
			return [undefined, undefined];
		};

		// dont need to worry about other items in queue. any response only ever gives the new bit.
		// next: only runs on first click, else just does hack: true
		// get_queue: only returns the new section.

		let lastItem; // REMOVE AUTOMIX ITEM, ADD BACK LATER.
		if (queueContents[queueContents.length - 1].automixPreviewVideoRenderer) {
			lastItem = queueContents.pop();
		};

		// ADD EXTRA TO START/END
		let byIndex = idsToReplace.extraByIndex || {};
		let orderedExtraIndexes = Object.keys(byIndex).sort((a, b) => Number(a) - Number(b));
		
		for (let index of orderedExtraIndexes) {
			let replacement = byIndex[index];

			let newVideoItem = UBuildPlaylistPanelRendererFromData(replacement, buildFromAlbum, cachedArtist, backingPlaylistId);

			if (areQueueDatas) newVideoItem = { content: newVideoItem };

			// INSERT IN RANDOM POSITION FOR SHUFFLE!
			if (isShuffle) {
				queueContents = UArrayInsert(queueContents, newVideoItem, URandInt(1, queueContents.length));
				continue;
			};

			if (index === "0") queueContents.unshift(newVideoItem);
			else queueContents.push(newVideoItem);
		};

		if (lastItem) queueContents.push(lastItem);

		console.log("queueContents now", structuredClone(queueContents));

		let newContents = [];
		let currentVideoWE;
		let indexCount = 0;

		if (hiddenSongs.includes(videoIdToSelect)) {
			videoIdToSelect = undefined;
		};

		// LAST ITERATION. HIDE ANY WE NEED TO, AND UPDATE ENDPOINT INDEXES.
		// THIS CLEANS THE MESS FOR US, SO WE CAN ADD SONGS WHEREVER WE WANT!
		for (let item of queueContents) {
			let videoRenderer = UGetPlaylistPanelVideoRenderer(item);

			if (!videoRenderer) {
				newContents.push(item);
				continue;
			};

			let we = UDigDict(videoRenderer, ["navigationEndpoint", "watchEndpoint"]);

			console.log(
				item,
				videoRenderer,
				videoIdToSelect,
				(videoRenderer) ? [videoRenderer.selected, videoRenderer.videoId] : undefined,
				we,
				"deleting",
				hiddenSongs.includes(we.videoId),
				(!videoRenderer.cData) || (videoRenderer.cData && videoRenderer.cData.from.id === loadedFromAlbum.id)
			);

			if (
				hiddenSongs.includes(we.videoId) &&
				(!videoRenderer.cData || 
					(videoRenderer.cData && videoRenderer.cData.from.id === loadedFromAlbum.id)
				)
			) continue; // dont add to new list

			indexCount ++;

			if (we.index !== 0) we.index = indexCount;
			newContents.push(item);

			if (videoIdToSelect === undefined) { // if first item in playlist deleted.
				videoIdToSelect = we.videoId;
			};

			if (videoIdToSelect) videoRenderer.selected = videoRenderer.videoId === videoIdToSelect;
			if (we.videoId === videoIdToSelect) currentVideoWE = we;
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

		let type = UGetBrowsePageTypeFromBrowseId(id);

		let idsToReplace = UGetIdsToReplaceFromRealAlbum(storage, id, id) || {};

		console.log("replacements", structuredClone(idsToReplace));

		let musicShelfRenderer = UDigDict(response, [
			"contents", "twoColumnBrowseResultsRenderer", "secondaryContents",
			"sectionListRenderer", "contents", 0,
			"musicShelfRenderer"
		]);
		if (!musicShelfRenderer || !musicShelfRenderer.contents) return;

		let cachedAlbum = storage.cache[id] || {};
		let hiddenSongs = storage.customisation.hiddenSongs[id] || [];
		let skippedSongs = storage.customisation.skippedSongs[id] || [];

		UBrowseParamsByRequest.pageSpecific[cachedAlbum.mfId] = { buildQueueFrom: cachedAlbum.id };

		console.log("listitems before", structuredClone(musicShelfRenderer.contents));

		// iter thru each existing item, modify if necessary
		let newContents = [];

		let i = -1;
		for (let item of structuredClone(musicShelfRenderer.contents)) { // structuredClone, so wont edit ref of original!
			i ++;

			let data = UGetSongInfoFromListItemRenderer(item);
			let replacement = idsToReplace[data.id];

			let listItemRenderer = item.musicResponsiveListItemRenderer;
			console.log(i, data.id, replacement, listItemRenderer);

			// should remove base version of song.
			// (use this to force building listitem instead of modify)
			let delBaseVideo = hiddenSongs.includes(data.id);

			if (delBaseVideo) {
				if (!replacement) {
					if (!listItemRenderer.cData) listItemRenderer.cData = {};

					listItemRenderer.cData.changedByDeletion = { isDeleted: true };
					
					newContents.push(item);
					continue;
				};

				let newListItem = UBuildListItemRendererFromData(replacement, cachedAlbum);
				newContents.push(newListItem); // actually delete this, as if overwritten
				continue;
			};

			if (!replacement) {
				newContents.push(item);
				continue;
			};

			UModifyListItemRendererFromData(replacement, cachedAlbum, item);
			newContents.push(item);
		};
		
		musicShelfRenderer.contents = newContents;

		// ADD EXTRA ITEMS TO START/END
		let byIndex = idsToReplace.extraByIndex || {};

		let orderedExtraIndexes = Object.keys(byIndex).sort((a, b) => Number(a) - Number(b));
		for (let index of orderedExtraIndexes) {
			let replacement = byIndex[index];

			// use cachedAlbum from before, to keep public playlistIds etc.
			let newListItem = UBuildListItemRendererFromData(replacement, cachedAlbum);

			if (index === "0") musicShelfRenderer.contents.unshift(newListItem);
			else musicShelfRenderer.contents.push(newListItem);
		};

		// ALL REPLACEMENT NOW DONE, NOW UPDATE DELETION ATTRIBUTES
		let indexCount = 0;
		let totalSeconds = 0;
		let songCount = 0;

		console.log("listItems now", musicShelfRenderer.contents);

		for (let lir of musicShelfRenderer.contents) {
			lir = lir.musicResponsiveListItemRenderer;
			let lirId = lir.playlistItemData.videoId;

			// add per video id. used to do "all", but if clicked play from sidebar, would replace
			// whatever with this. dont want.
			UBrowseParamsByRequest.pageSpecific[lirId] = { buildQueueFrom: cachedAlbum.id };
			
			// hiding song stuff. dont delete, just give hidden attr, so can readd in edit mode.
			let hideThis = hiddenSongs.includes(lirId);
			let thisIndex = Number(lir.index.runs[0].text);

			let skipThis = skippedSongs.includes(lirId);
			if (skipThis) {
				if (!lir.cData) lir.cData = {};
				lir.cData.skip = true;
			};

			if (hideThis && (!lir.cData || !lir.cData.changedByDeletion)) {
				if (!lir.cData) lir.cData = { changedByDeletion: {} };
				if (!lir.cData.changedByDeletion) lir.cData.changedByDeletion = {};

				lir.cData.changedByDeletion.isDeleted = true;
				continue; // DONT increment, will fill the gap
			};

			// INDEX CORRECTION. FILLS GAPS, AND ACCOMMODATES FOR DELETED ITEMS.
			// continue if is deleted dont want to increment.
			if (UDigDict(lir, ["cData", "changedByDeletion", "isDeleted"])) continue;

			let thisLenStr = UDigDict(lir, [
				"fixedColumns", 0, "musicResponsiveListItemFixedColumnRenderer",
				"text", "runs", 0, "text"
			]);

			indexCount ++;
			totalSeconds += ULengthStrToSeconds(thisLenStr);
			songCount ++;

			// EDIT INDEXES IF INCORRECT.
			if (thisIndex !== 0 && thisIndex !== indexCount) {
				lir.index.runs[0].text = String(indexCount);

				if (!lir.cData) lir.cData = { changedByDeletion: {} };
				if (!lir.cData.changedByDeletion) lir.cData.changedByDeletion = {};

				lir.cData.changedByDeletion.originalIndex = thisIndex;
				lir.cData.changedByDeletion.updatedIndex = indexCount;

				let we = UDigDict(lir, [
					"overlay", "musicItemThumbnailOverlayRenderer", "content",
					"musicPlayButtonRenderer", "playNavigationEndpoint", "watchEndpoint"
				]);
				if (we) we.index = indexCount;

				let titleEndpoint = UDigDict(lir, [
					"flexColumns", 0, "musicResponsiveListItemFlexColumnRenderer",
					"text", "runs", 0,
					"navigationEndpoint", "watchEndpoint"
				]);
				if (titleEndpoint) titleEndpoint.index = indexCount;
			};

		};


		// EDIT HEADER DETAILS, AUTOMATICALLY, BASED ON NEW CONTENTS.
		let customMetadata = storage.customisation.metadata[id] || {};

		let headerRenderer = UDigDict(response, [
			"contents", "twoColumnBrowseResultsRenderer", "tabs",
			0, "tabRenderer", "content",
			"sectionListRenderer", "contents", 0,
			"musicResponsiveHeaderRenderer"
		]);

		if (customMetadata.title) headerRenderer.title.runs = [ { text: customMetadata.title } ];
		if (customMetadata.description) {
			headerRenderer.description.musicDescriptionShelfRenderer.description.runs = [
				{ text: customMetadata.description }
			];
		};
		
		if (customMetadata.thumb) {
			let thumbnails = [
				{ url: customMetadata.thumb, width: UIMG_HEIGHT, height: UIMG_HEIGHT }
			];

			headerRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails = thumbnails;
			response.background.musicThumbnailRenderer.thumbnail.thumbnails = thumbnails;
		};

		let albumType = customMetadata.type;
		if (!albumType && UIsEntryPrivateSingle(storage, cachedAlbum.id)) albumType = "Single";
		
		if (albumType) headerRenderer.subtitle.runs[0].text = albumType;
		if (customMetadata.year) headerRenderer.subtitle.runs[2].text = customMetadata.year;

		headerRenderer.secondSubtitle.runs[0].text = `${songCount} songs`;
		headerRenderer.secondSubtitle.runs[2].text = USecondsToLengthStr(totalSeconds, true, false);

		let playButton = UGetButtonFromButtons(headerRenderer.buttons, "musicPlayButtonRenderer");
		let firstLIR = musicShelfRenderer.contents[0].musicResponsiveListItemRenderer;
		let firstWE = UDigDict(firstLIR, [
			"overlay", "musicItemThumbnailOverlayRenderer", "content",
			"musicPlayButtonRenderer", "playNavigationEndpoint", "watchEndpoint"
		]);

		playButton.playNavigationEndpoint.watchEndpoint = firstWE;

		console.log("listitems after", structuredClone(musicShelfRenderer.contents));

		return response; // was changed in-place
	};


	static MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY(response, id) {
		// THIS ONLY HAPPENS THE FIRST TIME. NAVIGATION = THROUGH CONTINUATIONS
		// SO ADDING OUR CUSTOM ELEMS IS IN THE CONTINUATION!

		let sectionListRenderer = UDigDict(response, [
			"contents", "singleColumnBrowseResultsRenderer", "tabs",
			0, "tabRenderer", "content", "sectionListRenderer"
		]);
		if (!sectionListRenderer) return;

		let sortOptions = UDigDict(sectionListRenderer, [
			"header", "musicSideAlignedItemRenderer", "endItems",
			0, "musicSortFilterButtonRenderer", "menu",
			"musicMultiSelectMenuRenderer", "options"
		]);

		if (!sortOptions) return;
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

		let gridRenderer = UDigDict(response, [
			"continuationContents", "sectionListContinuation", "contents",
			0, "gridRenderer"
		]);

		if (!gridRenderer) {
			gridRenderer = UDigDict(response, ["continuationContents", "gridContinuation"]);

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
		let sectionListContents = UDigDict(response, [
			"contents", "singleColumnBrowseResultsRenderer", "tabs",
			0, "tabRenderer", "content", "sectionListRenderer", "contents"
		]);
		if (!sectionListContents) return;

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

		return response; // changed in-place
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
	function _GetCParams(request, browseId) {
		let cParams = request.cParams;

		if (cParams) return [cParams, undefined];
		if (!UBrowseParamsByRequest) return [undefined, undefined];

		let refs = [
			browseId,
			(request.body) ? request.body.videoId : undefined,
			(request.body) ? request.body.playlistId : undefined
		];

		for (let ref of refs) {
			if (ref === undefined) continue;

			cParams = UBrowseParamsByRequest[ref];
			if (cParams) return [cParams, ref];
		};

		if (!UBrowseParamsByRequest.pageSpecific) return [undefined, undefined];

		for (let ref of refs) {
			cParams = UBrowseParamsByRequest.pageSpecific[ref];
			if (cParams) return [cParams, undefined]; // PAGESPEFIC MUST BE PERSISTENT, NO DELETE.
		};

		cParams = UBrowseParamsByRequest.pageSpecific.all
		if (cParams) return [cParams, undefined]; 

		return [undefined, undefined]
	};

	if (
		(!xhr && oldResp.status !== 200) ||
		(!xhr && !(oldResp.headers.get("Content-Type") || "").includes("application/json")) ||
		!request ||
		!request.body ||
		request.method !== "POST" ||
		NETWORK_EDITING_ENABLED === false
	) {
		return oldResp;
	};

	let urlObj;
	try { urlObj = new URL(request.url); }
	catch {};

	if (!urlObj || MiddlewareEditors.urlsToEdit.indexOf(urlObj.pathname) === -1) {
		return oldResp;
	};

	console.log(request.url);

	let changed = false;
	let clonedResp = (!xhr) ? oldResp.clone() : undefined;
	let respText = (xhr) ? structuredClone(oldResp.responseText) : (await clonedResp.text());

	let respBody = JSON.parse(respText);
	let toCacheOriginal = structuredClone(respBody);

	let browseId = request.body.browseId ||
		UGetBrowseIdFromResponseContext(toCacheOriginal.responseContext);
	let pathname = urlObj.pathname;

	let responseIsContinuation = !!(
		request.body.continuation ||
		urlObj.searchParams.get("ctoken") ||
		urlObj.searchParams.get("continuation")
	);

	let [cParams, cParamsRef] = _GetCParams(request, browseId);
	console.log("CPARAMS", cParams, cParamsRef);

	if (cParams) {
		cParams = structuredClone(cParams);

		if (cParamsRef) delete UBrowseParamsByRequest[cParamsRef];
		if (cParams.returnOriginal) return oldResp;

		request["cParams"] = cParams;
	};

	console.log("ORIGINAL RESP", browseId, toCacheOriginal, "is continuation:", responseIsContinuation, request);

	let smallTask = MiddlewareEditors.SmallTasks[pathname];
	let newBody;

	if (smallTask) {
		newBody = smallTask.apply(MiddlewareEditors, [request, respBody]);
	};


	let smallTaskWithCache = MiddlewareEditors.SmallTasksRequireCache[pathname];

	if (smallTaskWithCache) {
		let storage = await UMWStorageGet();

		newBody = smallTaskWithCache.apply(MiddlewareEditors, [request, respBody, storage]);
	};


	let pageType = UGetBrowsePageTypeFromBrowseId(browseId);

	initiateDelayedCacheOfOldResp(browseId, pageType, responseIsContinuation, toCacheOriginal);

	if (newBody) {
		respBody = newBody;
		changed = true;
	};


	if (!changed && browseId) {
		if (!pageType) return oldResp;
		if (responseIsContinuation) pageType = "CONT_" + pageType;

		let f = MiddlewareEditors[pageType];

		if (!f) return oldResp;

		// functions MUST take response, browseId. MAY take cache, that's the only change.
		if (f.length === 3) { // only get cache for functions that need it.
			let storage = await UMWStorageGet();

			newBody = f.apply(MiddlewareEditors, [respBody, browseId, storage]);

		} else {
			newBody = f.apply(MiddlewareEditors, [respBody, browseId]);
		};

		if (newBody) {
			respBody = newBody;
			changed = true;
		};
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

	if (resourceIsStr) { // used for random stuff
		request = {
			"url": resource,
			"method": options.method || "GET"
		};

	} else {
		request = { // used for JSON things like browsing.
			"url": resource.url,
			"method": resource.method || "GET"
		};

	};

	// REFRESHES PAGESPECIFIC HERE!!
	if (request.url.includes("/browse")) UBrowseParamsByRequest.pageSpecific = {};

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

XMLHttpRequest.prototype.send = function(body) { // used for player/next/atr/qoe.
	const xhr = this;

	const originalOnReadyStateEvent = xhr.onreadystatechange;

	xhr.onreadystatechange = async function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			try {
				await FetchModifyResponse({
					url: xhr._url,
					method: xhr._method,
					body: JSON.parse(body)
				}, xhr, true);
			} catch {};
		};

		if (originalOnReadyStateEvent) originalOnReadyStateEvent.apply(this, arguments);
	};

	return originalXHRSend.apply(this, arguments);
};

["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = window.fetch, non clonable.)