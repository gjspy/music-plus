export class MWUtils {
	static state = {
		EWEventListener: {listening: false, idCount: 0, waiters: {}},
		TemplateElems: {},
		BrowseParamsByRequest: {}
	};
	
	static MAX_EXECUTION_TIMEOUT = 10000; // ms, used for script injection timeout
	static MAX_QS_WAITFOR_TIMEOUT = 5000; // ms, used for WaitForbySelector
	static MAX_EW_WAITFOR_TIMEOUT = 15000; // ms, used for DispatchFunctionToEW

	static BRIDGE_EVENT_ID = "extGeneralCustomEventMWToEW";
	static SIDEBAR_UPDATE_EVENT_FUNC = "sidebar-or-cache-update";

	static YT_FAVICON = "https://music.youtube.com/img/favicon_144.png";
	static IMG_HEIGHT = 544;

	static DROPDOWN_STYLING = {
		textSize: "14px",
		imgSize: "17px",
		rowSize: 25,
		vpPad: 40
	};

	static ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	static HMS_WORDS = ["hour", "minute", "second"];
	static HMS_REVWORDS = this.HMS_WORDS.reverse();
	static SIZE_REVPREFIXES = ["","k","m","b","t"];

	static YT_DOT = " • ";
	static DOM_HIDDEN_CLS = "c-hidden";

	static VARIOUS_ARTISTS_ID = "VARIOUS";

	static YT_PLAYER_PARAMS = {
		shuffle: "wAEB8gECKAE%3D",
		normal: "wAEB"
	};

	static TAG_PLAYLIST_DEFAULT_METADATA = {
		titlePrefix: "Tag: ",
		description: "Auto generated playlist for this tag! Here, you can see all the songs you've added. Don't delete this playlist! All songs would lose their tag."
	};

	static GUIDE_ICON_SVG_PATHS = {
		active: {
			FEmusic_home: "M4 21V10.08l8-6.96 8 6.96V21h-6v-6h-4v6H4z",
			FEmusic_explore: "M11.23 13.08c-.29-.21-.48-.51-.54-.86-.06-.35.02-.71.23-.99.21-.29.51-.48.86-.54.35-.06.7.02.99.23.29.21.48.51.54.86.06.35-.02.71-.23.99-.21.29-.51.48-.86.54-.07.01-.15.02-.22.02-.28 0-.55-.08-.77-.25zM22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10zm-3.97-6.03L9.8 9.8l-3.83 8.23 8.23-3.83 3.83-8.23z",
			FEmusic_library_landing: "M18 21H3V6h1v14h14v1zm3-18v15H6V3h15zm-5 3h-3v5.28c-.3-.17-.63-.28-1-.28-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2V8h2V6z"
		},
		inactive: {
			FEmusic_home: "m12 4.44 7 6.09V20h-4v-6H9v6H5v-9.47l7-6.09m0-1.32-8 6.96V21h6v-6h4v6h6V10.08l-8-6.96z",
			FEmusic_explore: "m9.8 9.8-3.83 8.23 8.23-3.83 3.83-8.23L9.8 9.8zm3.28 2.97c-.21.29-.51.48-.86.54-.07.01-.15.02-.22.02-.28 0-.54-.08-.77-.25-.29-.21-.48-.51-.54-.86-.06-.35.02-.71.23-.99.21-.29.51-.48.86-.54.35-.06.7.02.99.23.29.21.48.51.54.86.06.35-.02.7-.23.99zM12 3c4.96 0 9 4.04 9 9s-4.04 9-9 9-9-4.04-9-9 4.04-9 9-9m0-1C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
			FEmusic_library_landing: "M16 6v2h-2v5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.37 0 .7.11 1 .28V6h3zm2 14H4V6H3v15h15v-1zm3-17H6v15h15V3zM7 4h13v13H7V4z"
		}
	};

	static HELPFUL_SELECTORS = {
		sidebarFolderHasVisibleActiveChild: ":has(:not(.c-hidden) > .c-paper-item > .c-active)",
		allCGuideElements: "#guide .c-paper-wrapper:not([is-primary]), #guide .c-carousel, #guide .c-sidebar-sep",
		sidebarYTButtonsCont: "#buttons.ytmusic-guide-section-renderer:has(yt-button-renderer)",
		listItemRenderersOfCurrentBrowseResponse: "ytmusic-browse-response #content-wrapper > #contents > ytmusic-two-column-browse-results-renderer > #secondary > ytmusic-section-list-renderer > #contents > :first-child > #contents > ytmusic-responsive-list-item-renderer"
	};

	
	static SafeDeepGetRoutes = {
		videoIdFromLIRData: ["playlistItemData", "videoId"],
		videoIdFromLIRElem: ["controllerProxy", "__data", "data","playlistItemData", "videoId"],
		dataFromElemDH: ["__dataHost", "__data", "data"],
		dataFromElem: ["controllerProxy", "__data", "data"],
		cDataFromElem: ["controllerProxy", "__data", "data", "cData"],
		cIsDeletedFromLIRData: ["cData", "changedByDeletion", "isDeleted"],
		userAccountInfoFromPC: ["accountService", "cachedGetAccountMenuRequestPromise", "result_", "actions", 0, "openPopupAction", "popup", "multiPageMenuRenderer", "header", "activeAccountHeaderRenderer"],
		lengthStrFromLIRData: ["fixedColumns", 0, "musicResponsiveListItemFixedColumnRenderer", "text", "runs", 0, "text"],
		watchEndpointFromLIRDataPlayButton: ["overlay", "musicItemThumbnailOverlayRenderer", "content", "musicPlayButtonRenderer", "playNavigationEndpoint", "watchEndpoint"],
		watchEndpointFromLIRDataTitle: ["flexColumns", 0, "musicResponsiveListItemFlexColumnRenderer", "text", "runs", 0, "navigationEndpoint", "watchEndpoint"],
		videoTypeFromWatchEndpoint: ["watchEndpoint", "watchEndpointMusicSupportedConfigs", "watchEndpointMusicConfig", "musicVideoType"],
		playButtonFromLIRData: ["overlay", "musicItemThumbnailOverlayRenderer", "content", "musicPlayButtonRenderer"],
		browseIdFromPolymerState: ["navigation", "mainContent", "endpoint","data", "browseId"],
		browseEndpointFromPolymerState: ["navigation", "mainContent", "endpoint","data"],
		mainContentFromPolymerState: ["navigation", "mainContent", "response"],
		cDidExtChangeResponse: ["navigation", "mainContent", "response", "cMusicFixerExtChangedResponse"],
		cExtCoolBkg: ["navigation", "mainContent", "response", "cMusicFixerExtCoolBkg"],
		playlistPanelFromNextResponse: ["contents", "singleColumnMusicWatchNextResultsRenderer", "tabbedRenderer","watchNextTabbedResultsRenderer", "tabs", 0,"tabRenderer", "content", "musicQueueRenderer","content", "playlistPanelRenderer"],
		lyricPanelFromNextResponse: ["contents", "singleColumnMusicWatchNextResultsRenderer", "tabbedRenderer","watchNextTabbedResultsRenderer", "tabs", 1,"tabRenderer"],
		overlayButtonsFromNextResponse: ["playerOverlays", "playerOverlayRenderer", "actions"],
		pageTypeFromNavigationEndpoint: ["browseEndpoint", "browseEndpointContextSupportedConfigs", "browseEndpointContextMusicConfig", "pageType"],
		browseIdFromNavigationEndpoint: ["browseEndpoint", "browseId"],
		reloadContinuationDataFromNavigationEndpoint: ["browseSectionListReloadEndpoint", "continuation", "reloadContinuationData"],
		watchEndpointFromVideoRenderer: ["navigationEndpoint", "watchEndpoint"],
		menuItemsFromAnything: ["menu", "menuRenderer", "items"],
		firstMenuItem: ["menu", "menuRenderer", "items", 0],
		serviceEndpointFromMenuItem: ["menuServiceItemRenderer", "serviceEndpoint"],
		serviceActionPlaylistEditEndpointFromMenuItem: ["menuServiceItemRenderer", "serviceEndpoint", "playlistEditEndpoint", "actions", 0],
		endpointOnConfirmDialogFromNavigationMenuItem: ["menuNavigationItemRenderer", "navigationEndpoint", "confirmDialogEndpoint", "content", "confirmDialogRenderer", "confirmButton", "buttonRenderer", "command"],
		backingPlaylistIdFromVideoRenderer: ["queueNavigationEndpoint", "queueAddEndpoint", "queueTarget", "backingQueuePlaylistId"],
		albumListItemShelfRendererFromBrowseResponse: ["contents", "twoColumnBrowseResultsRenderer", "secondaryContents", "sectionListRenderer", "contents", 0, "musicShelfRenderer"],
		albumHeaderRendererFromBrowseResponse: ["contents", "twoColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "musicResponsiveHeaderRenderer"],
		playlistHeaderRendererFromBrowseResponseUserOwned: ["contents", "twoColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "musicEditablePlaylistDetailHeaderRenderer", "header", "musicResponsiveHeaderRenderer"],
		playlistHeaderRendererFromBrowseResponse: ["contents", "twoColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "musicResponsiveHeaderRenderer"],
		sectionListRendererFromBrowseResponseForBasicGrid: ["contents", "singleColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer"],
		listItemsFromBrowseResponseForListPage: ["contents", "twoColumnBrowseResultsRenderer", "secondaryContents", "sectionListRenderer", "contents", 0, "musicPlaylistShelfRenderer", "contents"],
		sortOptionsFromSectionListRendererForBasicGrid: ["header", "musicSideAlignedItemRenderer", "endItems", 0, "musicSortFilterButtonRenderer", "menu", "musicMultiSelectMenuRenderer", "options"],
		commandsFromMultiSelectItemRenderer: ["selectedCommand", "commandExecutorCommand", "commands"],
		gridRendererFromContinuationResponse: ["continuationContents", "sectionListContinuation", "contents", 0, "gridRenderer"],
		gridContinuationDataFromResponse: ["continuationContents", "gridContinuation"],
		headerFromSectionListShelf: ["musicCarouselShelfRenderer", "header", "musicCarouselShelfBasicHeaderRenderer"],
		titleTextFromAnything: ["title", "runs", 0, "text"],
		titleTextFromLIR: ["flexColumns", 0, "musicResponsiveListItemFlexColumnRenderer", "text", "runs", 0, "text"],
		PPVRThroughVideoWrapper: ["playlistPanelVideoWrapperRenderer", "primaryRenderer", "playlistPanelVideoRenderer"],
		PPVRFromGetQueueData: ["content", "playlistPanelVideoRenderer"],
		PPVRFromGetQueueDataThroughVideoWrapper: ["content", "playlistPanelVideoWrapperRenderer", "primaryRenderer", "playlistPanelVideoRenderer"],
		continuationAppendItems: ["contents", "appendContinuationItemsAction", "continuationItems"],
		continuationSectionListGrid: ["contents", "sectionListContinuation", "contents", 0, "gridRenderer"],
		continuationGrid: ["contents", "gridContinuation"],
		thumbnailsFromItem: ["thumbnail", "musicThumbnailRenderer", "thumbnail", "thumnails"],
		isLikedFromItem: ["menu", "menuRenderer", "topLevelButtons", 0, "likeButtonRenderer", "likeStatus"],
	};

	static async InitTemplateElements() {
		const data = await this.DispatchFunctionToEW({
			func: "get-template-elements"
		});

		const cont = document.head.querySelector(`#${data.contId}`);

		window.musicFixer.state.TemplateElements = Object.fromEntries(
			Array.from(cont.children)
				.map(v => [v.classList[0], v])
		);
	};

	static GetTemplateElem = (className) => this.state.TemplateElements[className].cloneNode(true);
	static GetSVG = (icon) => this.GetTemplateElem(icon);

	static SafeDeepGet = (obj, sequence) => sequence.reduce((data, key) => data?.[key], obj || {});

	static AddToClass = (elem, cls) => elem.classList.contains(cls) || elem.classList.add(cls);
	static RemoveFromClass = (elem, cls) => elem.classList.remove(cls); // DOES REMOVE ALL IF DUPLICTATES EXIST.

	static HideElem = (elem) => this.AddToClass(elem, this.DOM_HIDDEN_CLS);
	static UnhideElem = (elem) => this.RemoveFromClass(elem, this.DOM_HIDDEN_CLS);

	static RandInt = (minInc, maxInc) => minInc + Math.round(Math.random() * (maxInc - minInc));
	static ArrayInsert = (array, obj, index) => [...array.slice(0, index), obj, ...array.slice(index)];
	static ArrayGetIndexOfMaxValue = (array) => array.indexOf(Math.max(array));
	static ArrayNLast = (array, n) => array[array.length - (n || 1)];

	static WaitForBySelector(selector, parent, shouldTimeout) {
		function Waiter(resolve) {
			let found = parent.querySelectorAll(selector);
			if (found.length > 0) resolve(found);
	
			const observer = new MutationObserver(function() {
				found = parent.querySelectorAll(selector);
	
				if (found.length > 0) {
					observer.disconnect();
					resolve(found);
				};
			});
	
			observer.observe(parent, {childList:true, subtree:true});
		};

		const Timeouter = (_,reject) => {
			setTimeout(
				() => reject(new Error("WaitFor TIMEOUT " + selector)),
				this.MAX_QS_WAITFOR_TIMEOUT
			);
		};

		if (!parent) parent = document.body;
		if (!shouldTimeout) return new Promise(Waiter);

		return Promise.race([
			new Promise(Waiter),
			new Promise(Timeouter)
		]);
	};

	static UpscaleImgQuality(imgUrl) {
		// regex matches = or - and char (w or h) and then digits.
		// all are capture groups so can re-place contents while replacing num to 544.
		// return imgUrl.replace(/(\=|\-)(w|h)(\d+)/g, `$1$2${IMG_HEIGHT}`);
		// was good regex, but if -w(\d) or -h(\d) was present in img id, would be a problem.
		const newImg = imgUrl.replace(/=.*?w\d+-h\d+/g, `=w${this.IMG_HEIGHT}-h${this.IMG_HEIGHT}`);
		if (imgUrl !== newImg) return newImg;

		return imgUrl.replace(/=s\d+/g, `=s${this.IMG_HEIGHT}`);
	};

	static ChooseBestThumbnail = (thumbnails) => thumbnails[this.ArrayGetIndexOfMaxValue(thumbnails.map((v) => (v.width || 1) * (v.height || 1)))];
	static GetEndpointByNameFromArray = (arrayofOuterEndps, endpName) => (arrayofOuterEndps.filter( v => v[endpName] )[0] || {})[endpName];

	static CreateButtonElem(icon, textContent, style, id) {
		const btn = document.createElement("div");
		btn.setAttribute("class", `${style} c-button`);
		btn.setAttribute("id", id || textContent.toLowerCase().replace(" ","-"));

		if (icon) {
			const svg = this.GetSVG(icon);
			svg.setAttribute("class", "c-btn-icon");
			btn.append(svg);
		};

		if (textContent) {
			const text = document.createElement("a");
			text.setAttribute("class", "c-btn-text");
			text.textContent = textContent;
			btn.append(text);
		};	

		return btn;
	};

	static CreateTextElemFromRuns(cont, runs, badges) {
		(badges || []).forEach((badge) => cont.append(this.GetSVG(badge)));
		
		runs = (runs || []).filter(v => v.text && v.text !== this.YT_DOT);

		for (let [i,v] of runs.entries()) {
			const a = document.createElement("a");
			a.textContent = v.text;

			if (v.navigationEndpoint) {
				a.__cData = { navigationEndpoint: v.navigationEndpoint };
				a.setAttribute("href", "browse/" + v.navigationEndpoint.browseEndpoint.browseId);
				this.NavigateOnClick({elem: a, navEndpOuter: v.navigationEndpoint});
			};

			cont.append(a);
			if (i === runs.length - 1) continue; // DON'T DRAW DOT IF IS LAST RUN.

			const dot = document.createElement("a");
			dot.textContent = this.YT_DOT;
			cont.append(dot);
		};

		return cont;
	};


	// CUSTOMEVENT RECEIVED BY CONTENT SCRIPT IN ISO, THEN MESSAGED TO BKG.
	static DispatchEventToEW = (detail) => window.dispatchEvent(new CustomEvent(this.BRIDGE_EVENT_ID, {detail: detail}));
	static DispatchFunctionToEW(detail) {
		// DEFINES WHERE THE RESPONSE OF AN EWEVENT SHOULD RESOLVE TO.

		return new Promise((resolve, reject) => {
			const listenerId = this.RegisterEWFunction({
				detail: detail,
				resolve: resolve,
				once: true
			});

			detail.functionResponseCorrelation = listenerId;

			this.DispatchEventToEW(detail);

			setTimeout(() => {
				// ALREADY RESOLVED
				if (!this.state.EWEventListener.waiters[listenerId]) return;

				fconsole.error(["TIMEOUT WAITING FOR EW RESPONSE", detail]);
				reject("TIMEOUT");

				this.RemoveRegisteredEWWaiter(listenerId);
			}, this.MAX_EW_WAITFOR_TIMEOUT);
		});
	};

	static LaunchListenerOfEWEvents() {
		const listener = (event) => {
			const corr = event.data.functionResponseCorrelation;
			const waiter = this.state.EWEventListener.waiters[corr];

			if (!waiter) return;
			if (waiter.once === true) this.RemoveRegisteredEWWaiter(corr);

			if (waiter.scope) waiter.resolve.call(waiter.scope, event.data);
			else waiter.resolve(event.data);
		};

		this.state.EWEventListener.listening = true;
		window.addEventListener("message", listener);
	};

	/**
	 * waiter: {detail: {data}, resolve: function, scope: "this", once: bool}
	 */
	static RegisterEWFunction(waiter) {
		if (!this.state.EWEventListener.listening) this.LaunchListenerOfEWEvents();

		const id = this.state.EWEventListener.idCount;
		this.state.EWEventListener.idCount ++;

		waiter.id = id;
		this.state.EWEventListener.waiters[id] = waiter;

		return id;
	};
	static RemoveRegisteredEWWaiter = (id) => delete this.state.EWEventListener.waiters[id];


	static async StorageGet(forceRefresh, path) {
		return (await this.DispatchFunctionToEW({
			func: "get-storage",
			path: path,
			forceRefresh: forceRefresh
		})).storage;
	};

	static FilterStorageResults(storage, filterFunction) {
		const values = Object.values(storage.cache);
		return values.filter(filterFunction);
	};


	static SortStorageResults(entireStorage, filteredResults) {
		// GROUP BY PRIVACY -> TYPE -> (ARTIST ID)? -> ITEM NAME

		const organisation = [{}, {}]; // NOT AND PRIVATE

		filteredResults.forEach((v) => {
			if (v.type !== "ARTIST" && v.type !== "ALBUM" && v.type !== "PLAYLIST") return;
			if (v.id === this.VARIOUS_ARTISTS_ID) return;

			const indexByPrivacy = Number(Boolean(v.private));
			let group = organisation[indexByPrivacy];

			if (!group[v.type]) group[v.type] = {};
			group = group[v.type];

			if (v.type === "ALBUM") {
				if (!group[v.artist]) group[v.artist] = {};
				group = group[v.artist];
			};

			group[v.id] = {
				id: v.id,
				name: v.name
			};
		});

		for (const privateGroup of organisation) {
			for (const [type, group] of Object.entries(privateGroup)) { // ALBUM: [], ARTIST: [], PLAYLIST: []
				if (type === "ALBUM") {
					const alphabeticalArtists = Object.values(group).sort((a,b) => {
						a = entireStorage.cache[a].name;
						b = entireStorage.cache[b].name;
						return a.localeCompare(b);
					});

					for (const artistGroup of Object.values(alphabeticalArtists)) {
						const alphabeticalReleases = Object.values(artistGroup).sort((a, b) => a.name.localeCompare(b.name));

						alphabeticalReleases.forEach((v) => {
						//	_CreateOVFPaperItem(paperService, ovf, v.id);
						});
							
					};

					continue;
				};

				let alphabetical = Object.values(group).sort((a, b) => a.name.localeCompare(b.name));

				alphabetical.forEach((v) => {
					//_CreateOVFPaperItem(paperService, ovf, v.id);
				});				
			};
		};
	};


	static GenerateValueColsArr = (n, base) => Array.from(Array(Math.ceil(Math.log(n)/Math.log(base))).keys()).reverse().reduce((acc, pow) => ( acc.push(Math.floor(n / (base ** pow))), (n %= (base ** pow)), acc), []).filter((v, index) => !(v === 0 && index === 0));
	static LengthStrToSeconds = (lengthStr) => (lengthStr || "").split(":").reverse().reduce((seg, tot, index) => tot += (Number(seg) * (60 ** index), 0));
	static SecondsToHMSArr = (seconds) => this.GenerateValueColsArr(seconds, 60);
	static SecondsToHMSStr = (seconds, maxFigs) => this.SecondsToHMSArr(seconds).splice(0, maxFigs || 3).map(v => String(v).padStart(2, "0")).join(":");
	static SecondsToWordyHMS = (seconds, maxFigs) => this.SecondsToHMSArr(seconds).reverse().map((v, index) => `${v} ` + this.HMS_REVWORDS[index] + ((v === 1) ? "" : "s")).reverse().splice(0, maxFigs || 3).join(", ");
	static BigNumToStr(n) {
		if (!n || isNaN(n)) return "0";

		const sig = Math.min(this.SIZE_REVPREFIXES.length, Math.floor(Math.log10(n) / 3));
		n = n / 10 ** (sig * 3);

		return String(n >= 9.95 ? Math.round(n) : Math.round(n*10)/10) + this.SIZE_REVPREFIXES[sig];
	};



	static GetTotalDurationOfList(storage, cachedListPage, excludeHidden, excludeSkipped) {
		const toExclude = [];

		if (excludeHidden)  toExclude.push(...(storage.customisation.hiddenSongs[cachedListPage.id] || []));
		if (excludeSkipped) toExclude.push(...(storage.customisation.skippedSongs[cachedListPage.id] || []));

		return (cachedListPage.items
			.filter(v => toExclude.indexOf(v) === -1)
			.reduce((acc, v) => {
				v = storage.cache[v];
				return (!v || v.lengthSec === -1) ? acc : acc + v.lengthSec;
			}, 0)
		);
	};

	static IsEntryPrivateSingle(storage, bId) {
		let cachedEntry = storage.cache[bId];
		if (!cachedEntry) return null;

		if (!cachedEntry.private) return false;
		if (cachedEntry.items.length > 1) return false;

		let item = cachedEntry.items[0];
		let cachedItem = storage.cache[item];
		if (!cachedItem) return;

		if (cachedItem.name !== cachedEntry.name) return false;

		return true;
	};



	static GetPolymerController() {
		if (window.polymerController) return window.polymerController;
		if (!window.apiComponent) window.apiComponent = document.querySelector("ytmusic-app");

		// @ts-ignore
		window.polymerController = window.apiComponent.polymerController;
		return window.polymerController;
	};

	static GetMenuServiceItemBehaviour() {
		let elem = document.createElement("ytmusic-menu-service-item-renderer");
		let serviceMenuItemBehaviour = elem.ytmusicServiceMenuItemBehavior;
		serviceMenuItemBehaviour.hostElement = window.apiComponent;

		window.menuServiceItemBehaviour = serviceMenuItemBehaviour;
		return window.menuServiceItemBehaviour;
	};
	
	static WaitForPolymerController() {
		return new Promise((resolve) => {
			if (window.polymerController) {
				resolve(window.polymerController);
				return;
			};

			const interval = setInterval(() => {
				let utilsGot = this.GetPolymerController();
				if (!utilsGot) return;

				resolve(utilsGot);
				clearInterval(interval);
			}, 50);
		});
	};



	/**
	 * options: {navType}
	 * 
	 * 	navType: browse - id, browsePageType?
	 * 			 watch - playlistId, firstVideo, playlistSetVideoid, index, shuffle
	 * 			 queueAdd - position["next", "end"], playlistId, listPageType
	 * 			 toast - successTextRuns
	 * 			 menuNavItemRenderer - icon, text, endpoint
	 * 			 confirmDialog - title, prompt, confirmText, endpoint, cParamsOnConfirm?
	 * 			 confirmButton - text, endpoint
	 * 			 cancelButton - /
	 * 			 createPlaylist - title, privacyStatus[?], videoIds, sourcePlaylistId, description
	 * 
	 */
	static BuildEndpoint(opts) {
		const BrowseEndpoint = () => {
			const browsePageType = opts.browsePageType || this.GetBrowsePageTypeFromBrowseId(opts.id, true, true);

			const v = {
				browseEndpoint: { browseId: opts.id}
			};

			if (browsePageType) v.browseEndpoint.browseEndpointContextSupportedConfigs = {
				browseEndpointContextMusicConfig: { pageType: browsePageType }
			};

			return v;
		};

		const WatchEndpoint = () => {
			let v = { watchEndpoint: {}};

			if (opts.playlistId) v.watchEndpoint.playlistId = opts.playlistId;
			if (opts.firstVideo) {
				v.watchEndpoint.videoId = opts.firstVideo.id;
				v.watchEndpoint.watchEndpointMusicSupportedConfigs = {
					watchEndpointMusicConfig: {
						musicVideoType: opts.firstVideo.type
					}
				};
			};
			if (opts.playlistSetVideoId) v.watchEndpoint.playlistSetVideoId = opts.playlistSetVideoId;
			if (opts.index) v.watchEndpoint.index = opts.index;

			if (opts.shuffle === true) v.watchEndpoint.params = this.YT_PLAYER_PARAMS.shuffle;
			else v.watchEndpoint.params = this.YT_PLAYER_PARAMS.normal;

			return v;
		};

		const QueueAdd = () => {
			return { queueAddEndpoint: {
				queueInsertPosition: opts.position === "next",
				queueTarget: {
					playlistId: opts.playlistId,
					onEmptyQueue: this.BuildEndpoint({
						navType: "watch",
						playlistId: opts.playlistId
					})
				},
				commands: [ this.BuildEndpoint({
					navType: "toast",
					successTextRuns: [{
						text: (opts.listPageType === "MUSIC_PAGE_TYPE_PLAYLIST" ? "Playlist" : "Album") + " added to queue."
					}]
				})]
			}};
		};

		const Toast = () => {
			return { addToToastAction: {
				item: { notificationTextRenderer: {
					successResponseText: {
						runs: opts.successTextRuns
					}
				}}
			}};
		};

		const MenuNavItemRenderer = () => {
			return { menuNavigationItemRenderer: {
				icon: { iconType: opts.icon },
				text: { runs: [ { text: opts.text } ] },
				navigationEndpoint: opts.endpoint
			}};
		};

		const ConfirmDialog = () => {
			return { confirmDialogEndpoint: {
				content: { confirmDialogRenderer: {
					title: { runs: [ { text: opts.title} ] },
					dialogMessages: [{ runs: [ { text: opts.prompt } ] }],
					confirmButton: this.BuildEndpoint({
						navType: "confirmButton",
						text: opts.confirmText,
						endpoint: opts.endpoint,
						cParams: opts.cParamsOnConfirm
					}),
					cancelButton: this.BuildEndpoint({ navType: "cancelButton" })
				}}
			}};
		};

		const ConfirmButton = () => {
			return { buttonRenderer: {
				style: "STYLE_LIGHT_TEXT",
				size: "SIZE_DEFAULT",
				isDisabled: false,
				text: { runs: [ { text: opts.text } ] },
				serviceEndpoint: opts.endpoint
			}};
		};

		const CancelButton = () => {
			return { buttonRenderer: {
				style: "STYLE_LIGHT_TEXT",
				size: "SIZE_DEFAULT",
				isDisabled: false,
				text: { runs: [ { text: "Cancel" } ] }
			}};
		};

		const CreatePlaylist = () => {
			return { createPlaylistServiceEndpoint: {
				title: opts.title,
				privacyStatus: opts.privacyStatus,
				videoIds: opts.videoIds,
				sourcePlaylistId: opts.sourcePlaylistId,
				description: opts.description
			}};
		};

		
		const navType = opts.navType;

		let created =
			(navType === "browse") ? BrowseEndpoint() :
			(navType === "watch") ? WatchEndpoint() :
			(navType === "queueAdd") ? QueueAdd() :
			(navType === "toast") ? Toast() :
			(navType === "menuNavItemRenderer") ? MenuNavItemRenderer() :
			(navType === "confirmDialog") ? ConfirmDialog() :
			(navType === "confirmButton") ? ConfirmButton() :
			(navType === "cancelButton") ? CancelButton() :
			(navType === "createPlaylist") ? CreatePlaylist() : {};

		if (opts.cParams) created.cParams = opts.cParams;

		return created;
	};



	static Navigate(navEndpOuter) {
		if (!window.polymerController) this.GetPolymerController();

		if (navEndpOuter.cParams) {
			const id = 
				navEndpOuter.browseEndpoint?.browseId ||
				navEndpOuter.watchEndpoint?.playlistId ||
				navEndpOuter.queueAddEndpoint?.queueTarget?.playlistId ||
				navEndpOuter.createPlaylistServiceEndpoint?.title;
			
			this.state.BrowseParamsByRequest[id] = structuredClone(navEndpOuter.cParams);
		};

		// SERVICE ENDPOINTS
		if (navEndpOuter.queueAddEndpoint || navEndpOuter.createPlaylistServiceEndpoint) {
			if (!window.menuServiceItemBehaviour) this.GetMenuServiceItemBehaviour();

			window.menuServiceItemBehaviour.handleCommand(navEndpOuter);
			return;
		};

		window.polymerController.handleNavigateAction({
			navigateAction: { endpoint: navEndpOuter}
		});
	};

	static NavigateOnClick({elem, navEndpOuter, preventPropagation = false, useCapture = false, verifyFunc = undefined, runAfter = undefined, runAfterParams = []}) {
		elem.addEventListener("click", (e) => {
			e.preventDefault();

			if (preventPropagation || (navEndpOuter?.cParams?.stopPropagation)) e.stopImmediatePropagation();
			if (verifyFunc && !verifyFunc(e)) return;
			if (runAfter) runAfter(...(runAfterParams || []));

			this.Navigate(navEndpOuter);
		}, { useCapture: useCapture});
	};

	

	static GetBrowsePageTypeFromBrowseId(browseId, excludeCTypes, resultisImportant, hasEditedResponse) {
		if (!browseId) browseId = "";

		if (!excludeCTypes) {

			if (browseId === "FEmusic_home") return "C_PAGE_TYPE_HOME";
			if (browseId.match(/privately_owned_release_detail/) && !hasEditedResponse) return "C_PAGE_TYPE_PRIVATE_ALBUM"; // NEED c_type because yt does not distinguish PRIVATE_ALBUM from ALBUM.
			if (browseId.match(/privately_owned_artist_detail/)) return "C_PAGE_TYPE_PRIVATE_ARTIST";

			if (browseId.match(/^UC/)) return "C_PAGE_TYPE_CHANNEL_OR_ARTIST"; // have tested, no way to tell.
		};

		if (browseId.match(/privately_owned_release_detail/) && hasEditedResponse) return "MUSIC_PAGE_TYPE_ALBUM";

		if (
			browseId === "FEmusic_library_landing" ||
			browseId === "FEmusic_liked_albums" ||
			browseId === "FEmusic_liked_playlists"
			//browseId === "FEmusic_library_corpus_track_artists" useless (doesnt give artist id)
			//browseId === "FEmusic_liked_videos" bad
		) return "MUSIC_PAGE_TYPE_LIBRARY_CONTENT_LANDING_PAGE"; // NEED c_TYPE for when clicking library from sidebar..

		if (browseId === "FEmusic_offline") return "MUSIC_PAGE_TYPE_DOWNLOADS_CONTENT_LANDING_PAGE";
		if (
			browseId === "FEmusic_library_privately_owned_landing" ||
			browseId === "FEmusic_library_privately_owned_releases" ||
			browseId === "FEmusic_library_privately_owned_artists" // does give artist id here
			//browseId === "FEmusic_library_privately_owned_tracks"
		) return "MUSIC_PAGE_TYPE_PRIVATELY_OWNED_CONTENT_LANDING_PAGE";

		//if (browseId.match(/^VL(?:(?:PL)|(?:LM)|(?:SS))/)) return "MUSIC_PAGE_TYPE_PLAYLIST";
		if (browseId.match(/^VL/)) return "MUSIC_PAGE_TYPE_PLAYLIST";
		if (browseId.match(/^MPREb_/) || browseId.match("^(?:VL){0,1}OL")) return "MUSIC_PAGE_TYPE_ALBUM";
		//if (browseId.match("^UC"))

		if (browseId.match(/^MPADUC/)) return "MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY";
		//if (browseId.match("^VLOL")) return "artist \"songs\" playlist"; //returns "MUSIC_PAGE_TYPE_PLAYLIST, doesnt work as a playlist page.";, can be album behind the scenes?
		// VLRD = radio, does not work in browse
		if (browseId.match(/^MPLYt/)) return "MUSIC_PAGE_TYPE_TRACK_LYRICS";

		if (resultisImportant) {
			if (browseId.match(/privately_owned_release_detail/)) return "MUSIC_PAGE_TYPE_ALBUM"; // NEED c_type because yt does not distinguish PRIVATE_ALBUM from ALBUM.
			if (browseId.match(/^VL/) || browseId.match("^(?:VL){0,1}PL")) return "MUSIC_PAGE_TYPE_PLAYLIST";
		};


		return null;
	};

	static GetBrowsePageType(stateOrNavEndp) {
		let browseEndpoint = stateOrNavEndp;

		if (stateOrNavEndp.navigation) { // get browseEndpoint from store.state
			browseEndpoint = musicFixer.SafeDeepGet(stateOrNavEndp, musicFixer.SafeDeepGetRoutes.browseEndpointFromPolymerState);

		} else if (stateOrNavEndp.browseEndpoint) { // get from whatever else (navEndpoint?)
			browseEndpoint = stateOrNavEndp.browseEndpoint;
		};

		if (!browseEndpoint) return null;

		const browseId = musicFixer.SafeDeepGet(browseEndpoint, musicFixer.SafeDeepGetRoutes.browseIdFromNavigationEndpoint);
		const fromId = this.GetBrowsePageTypeFromBrowseId(browseId);
		if (fromId) return fromId;

		return musicFixer.SafeDeepGet(browseEndpoint, this.SafeDeepGetRoutes.pageTypeFromNavigationEndpoint);

	};

	static GetMicroformatIdFromBrowseId(browseId) {
		let browsePageType = this.GetBrowsePageTypeFromBrowseId(browseId, false, true);

		switch (browsePageType) {
			case "C_PAGE_TYPE_PRIVATE_ALBUM":
				return browseId.replace("FEmusic_library_privately_owned_release_detail", "MLPR");
			
			case "MUSIC_PAGE_TYPE_PLAYLIST":
				return browseId.replace(/^VL/, "");
		};
	};
};