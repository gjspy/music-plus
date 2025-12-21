'use strict';

const EXTRA_PROPERTIES_TO_IGNORE = ["prototype"];

class Utils {
	static U_REAL_DEFAULT_STORAGE = {
		local: {
			accountInfo: {
				accountName: "",
				accountPhoto: "",
				channelHandle: ""
			},
			username: "",
			token: "",
			cachedLastResponse: {},
			lightApi: {
				endpoint: "",
				enabled: false,
				entitiesToKeys: {}
			}
		},
		
		external: {
			cache: {
				mfIdMap: {}
			},
	
			sidebar: {
				paperItemOrder: [], // [PL123, PL456, ...]
				hidden: [],
				idCounter: 0,
				folders: {
					folders:{
						//"CFMORE":{id: "CFMORE", contents: []}
					} // id: {id: `CF${id}`,title: request.title, subtitle: request.subtitle, contents: []}
				},
				separators: {
					separators: {} // id: {id: `CS${id}`,name: request.title}
				}
			},

			customisation: {
				albumLinks: {},
				primaryAlbums: {},
				hiddenSongs: {},
				skippedSongs: {},
				metadata: {},
				extraSongs: {},
				notes: {},
				tags: {
					tags: {}, // id: {id: "", name: "", colour: "", playlist: ""}
					videos: {} // videoId: [tagId]
				} 
			},

			stats: {
				watchtime: {}
			}
		}
	};

	static U_CACHE_FORMATS = {
		PLAYLIST: {
			name: "",
			creator: "",
			thumb: "",
			saved: null,
			items: [],
			id: "",
			type: "PLAYLIST",
			year: -1,
		},
		ALBUM: {
			name: "",
			artist: "",
			thumb: "",
			saved: null,
			features: [],
			items: [],
			id: "",
			mfId: "",
			year: -1,
			type: "ALBUM",
			subType: "",
			badges: [],
			privateCounterparts: [],
			alternate: [],
			private: null
		},
		ARTIST: {
			name: "",
			thumb: "",
			wideThumb: "",
			radios: {},
			saved: null,
			discography: [],
			id: "",
			type: "ARTIST",
			private: null,
			privateCounterparts: []
		},
		SONG: {
			name: "",
			album: "",
			index: "",
			artists: [],
			liked: "",
			lengthSec: -1,
			id: "",
			badges: [],
			type: "",
			views: 0,
			albumPlSetVideoId: "",
			lyricEndpoint: ""
		},
		USER_CHANNEL: {
			name: "",
			id: "",
			type: "USER_CHANNEL"
		},
		UNKNOWN: {

		}

	};

	static U_STORAGE_ENDPOINT = "https://music.gtweb.dev/api";

	static U_VARIOUS_ARTISTS = "Various Artists";
	static U_VARIOUS_ARTISTS_EXTID = "VARIOUS";

	static UGeneralCustomEventMWToEW = "extGeneralCustomEventMWToEW";
	static UGeneralCustomEventEWToMW = "extGeneralCustomEventEWToMW";
	static UEventFuncForSidebarUpdate = "sidebar-or-cache-update";

	static UTemplateElementsStrings = {};
	static _UTemplateElementsFP = "../myTemplateElements.html";

	static UMAX_EXECUTION_TIMEOUT = 10000; // ms, used for script injection timeout
	static UMAX_WAITFOR_TIMEOUT = 5000; // ms, used for WaitForbySelector

	static U_YT_FAVICON = "https://music.youtube.com/img/favicon_144.png";
	static UIMG_HEIGHT = 544;

	static U_DROPDOWN_TEXT_SIZE = "14px";
	static U_DROPDOWN_IMG_SIZE = "17px";
	static U_DROPDOWN_ROW_SIZE = 25;
	static U_DROPDOWN_VP_PAD = 40;

	//static U_YT_BADGE_ORDER = ["MUSIC_EXPLICIT_BADGE"];
	static U_TIME_WORDS = ["hour", "minute", "second"];
	static U_YT_DOT = " • ";

	static U_SHUFFLE_PLAYER_PARAMS = "wAEB8gECKAE%3D";
	static U_NORM_PLAYER_PARAMS = "wAEB";

	static UBrowseParamsByRequest = {};

	static U_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	static U_TAG_PLAYLIST_DATA = {
		titlePrefix: "Tag: ",
		description: "Auto generated playlist for this tag! Here, you can see all the songs you've added. Don't delete this playlist! All songs would lose their tag."
	};

	static U_GUIDE_ICONS = {
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

	static U_HELPFUL_QUERIES = {
		listItemRenderersOfCurrentBrowseResponse: "ytmusic-browse-response #content-wrapper > #contents > ytmusic-two-column-browse-results-renderer > #secondary > ytmusic-section-list-renderer > #contents > :first-child > #contents > ytmusic-responsive-list-item-renderer"
	};

	static UDictGet = {
		videoIdFromLIRData: ["playlistItemData", "videoId"],
		videoIdFromLIRElem: ["controllerProxy", "__data", "data","playlistItemData", "videoId"],
		dataFromElem: ["controllerProxy", "__data", "data"],
		cDataFromElem: ["controllerProxy", "__data", "data", "cData"],
		cIsDeletedFromLIRData: ["cData", "changedByDeletion", "isDeleted"],
		lengthStrFromLIRData: ["fixedColumns", 0, "musicResponsiveListItemFixedColumnRenderer", "text", "runs", 0, "text"],
		watchEndpointFromLIRDataPlayButton: ["overlay", "musicItemThumbnailOverlayRenderer", "content", "musicPlayButtonRenderer", "playNavigationEndpoint", "watchEndpoint"],
		watchEndpointFromLIRDataTitle: ["flexColumns", 0, "musicResponsiveListItemFlexColumnRenderer", "text", "runs", 0, "navigationEndpoint", "watchEndpoint"],
		playButtonFromLIRData: ["overlay", "musicItemThumbnailOverlayRenderer", "content", "musicPlayButtonRenderer"],
		browseIdFromPolymerState: ["navigation", "mainContent", "endpoint","data", "browseId"],
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
		serviceEndpointFromMenuItem: ["menuServiceItemRenderer", "serviceEndpoint"],
		serviceActionPlaylistEditEndpointFromMenuItem: ["menuServiceItemRenderer", "serviceEndpoint", "playlistEditEndpoint", "actions", 0, "action"],
		endpointOnConfirmDialogFromNavigationMenuItem: ["menuNavigationItemRenderer", "navigationEndpoint", "confirmDialogEndpoint", "content", "confirmDialogRenderer", "confirmButton", "buttonRenderer", "command"],
		backingPlaylistIdFromVideoRenderer: ["queueNavigationEndpoint", "queueAddEndpoint", "queueTarget", "backingQueuePlaylistId"],
		albumListItemShelfRendererFromBrowseResponse: ["contents", "twoColumnBrowseResultsRenderer", "secondaryContents", "sectionListRenderer", "contents", 0, "musicShelfRenderer"],
		albumHeaderRendererFromBrowseResponse: ["contents", "twoColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "musicResponsiveHeaderRenderer"],
		playlistHeaderRendererFromBrowseResponseUserOwned: ["contents", "twoColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "musicEditablePlaylistDetailHeaderRenderer", "header", "musicResponsiveHeaderRenderer"],
		playlistHeaderRendererFromBrowseResponse: ["contents", "twoColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "musicResponsiveHeaderRenderer"],
		sectionListRendererFromSingleColumn: ["contents", "singleColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer"],
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
		PPVRFromGetQueueDataThroughVideoWrapper: ["content", "playlistPanelVideoWrapperRenderer", "primaryRenderer", "playlistPanelVideoRenderer"]
	};

	static async _ULoadTemplateElements() {
		let file = await fetch(this._UTemplateElementsFP);
		file = await file.text();

		file = file.replaceAll("\n","").replaceAll("\t","");

		const tempCont = document.createElement("div");
		tempCont.innerHTML = file; // do not be teempted to change to otuerhtml, is doing for whole file.

		for (let elem of tempCont.children) {
			if (elem.tagName.toLowerCase() === "svg") {
				this.UTemplateElementsStrings["svg-" + elem.getAttribute("class")] = elem.outerHTML;

			} else {
				this.UTemplateElementsStrings[elem.className] = elem.outerHTML;
			};
		};

		tempCont.remove();
	};

	static UAddToClass(elem, classPart) {
		elem.setAttribute("class", [classPart, ...elem.classList].join(" "));
	};

	static URemoveFromClass(elem, classPart) {
		elem.setAttribute("class", [...elem.classList].filter((v) => { return v !== classPart; }).join(" ")); // replaceAll but for arrays
	};

	static UHideElem(elem) { this.UAddToClass(elem, "c-hidden"); };
	static UUnHideElem(elem) { this.URemoveFromClass(elem, "c-hidden"); };

	static async UWaitForBySelector(selector, obj, mayWaitForever) {
		function Waiter(resolve) {
			let found = obj.querySelectorAll(selector);
			if (found.length > 0) { resolve(found); };
	
			let observer = new MutationObserver(function() {
				found = obj.querySelectorAll(selector);
	
				if (found.length > 0) {
					observer.disconnect();
					resolve(found);
				};
			});
	
			observer.observe(obj, {childList:true, subtree:true});
		};

		function Timeouter(_,reject) {
			setTimeout(
				() => reject(new Error("WaitFor TIMEOUT "+ selector)),
				UMAX_WAITFOR_TIMEOUT
			);
		};

		if (!obj) obj = document.body;

		if (mayWaitForever) {
			return new Promise(Waiter);
		};

		return Promise.race([
			new Promise(Waiter),
			new Promise(Timeouter)
		]);
	};


	static UDigDict(dict, sequence) {
		let data = dict || {};

		for (let k of sequence) {
			data = data[k];

			if (!data) return data;
		};

		return data;
	};


	static URandInt(minInc, maxInc) {
		return minInc + Math.round(Math.random() * (maxInc - minInc));
	};

	static UArrayInsert(array, item, index) {
		return [...array.slice(0, index), item, ...array.slice(index)];
	};



	// recursively check that every dir has the keys it should
	static UCheckHasKeys(cont, shouldHave) {
		let shouldHaveKeys = Object.keys(shouldHave);
		shouldHave = structuredClone(shouldHave);

		// check has all keys, add default vals if not
		for (let k of shouldHaveKeys) {
			if (cont[k] === undefined || cont[k] === null) {
				cont[k] = shouldHave[k]; // does not have, give default.
				
				continue;
			};

			if (typeof(cont[k]) === "object") { // has children
				cont[k] = this.UCheckHasKeys(cont[k], shouldHave[k]); // check children
			};
			
		};

		return cont;
	};

	static async UStorageGetLocal() {
		let storage = await browser.storage.local.get();

		if (Object.keys(storage).length === 0) {
			return this.U_REAL_DEFAULT_STORAGE.local;
		};

		return this.UCheckHasKeys(storage, this.U_REAL_DEFAULT_STORAGE.local);
	};

	static UStorageGetExternal(fetchNew, localStorage) {
		// HAVE TO USE "THIS" IN EXTERNAL, IS A MODULE, NOT GLOBAL FUNCTIONS.
		let that = this;

		return new Promise(async function(resolve, reject) {
			if (!localStorage) localStorage = await that.UStorageGetLocal();

			let allowUsingCachedResponse = true;
			if (!fetchNew && localStorage.cachedLastResponse) {
				let sessionStorage = await browser.storage.session.get() || {};
				allowUsingCachedResponse = sessionStorage.fetchedThisSession;
			};

			if (fetchNew || !localStorage.cachedLastResponse || !allowUsingCachedResponse) {
				console.log("getting new because", fetchNew, !localStorage.cachedLastResponse, !allowUsingCachedResponse);

				let username = localStorage.username;
				let token = localStorage.token;

				if (!username || !token) {
					reject("no credentials");
					return;
				};

				let fetched = await fetch(that.U_STORAGE_ENDPOINT + `/storage/get?user_id=${username}&token=${token}`);
				//if (fetched.status !== 200) reject("External storage response was", fetched.status,"for get", fetched);

				let json = JSON.parse(await fetched.text());
				json = that.UCheckHasKeys(json, that.U_REAL_DEFAULT_STORAGE.external)

				resolve(json);

				localStorage.cachedLastResponse = json;
				that.UStorageSetLocal(localStorage);

				browser.storage.session.set({ fetchedThisSession: true });
				return;
			};

			resolve(that.UCheckHasKeys(localStorage.cachedLastResponse, that.U_REAL_DEFAULT_STORAGE.external));
		});
		
	};

	static async UStorageSetLocal(toStore) {
		let defaultData = this.U_REAL_DEFAULT_STORAGE.local;
		let storageLocal = {};

		for (let key of Object.keys(defaultData)) {
			let val = toStore[key];
			
			storageLocal[key] = (val) ? val : defaultData[key];
		};

		console.log("toStore", toStore)

		await browser.storage.local.set(toStore);
	};

	static async UStorageSetExternal(toStore, localStorage) {
		if (!localStorage) {
			localStorage = await this.UStorageGetLocal();
		};
		
		let username = localStorage.username;
		let token = localStorage.token;

		if (!username || !token) {
			console.log("no credetials");
			throw Error("No credentials");
		};

		let defaultData = this.U_REAL_DEFAULT_STORAGE.external;
		let storageExt = {};

		for (let key of Object.keys(defaultData)) {
			let val = toStore[key];
			
			storageExt[key] = (val) ? val : defaultData[key];
		};

		// even though errors could happen, do this before, to stop
		// a spam of requests being misaligned, eg request 1 then 2 then 3,
		// if 2 took longer for whatever reason, cachedLastResponse would be 2 and not 3.
		localStorage.cachedLastResponse = storageExt;

		// DO THIS BEFORE. SO WHILE WAITING FOR RESP FROM
		// SERVER, IF ANOTHER EDIT HAPPENS, IT IS ADDED TO THESE CHANGES.
		// BEFORE, THAT CHANGE WOULD BE ADDED TO THE OLD STORAGE VER, AND
		// THIS WOULD BE LOST.
		this.UStorageSetLocal(localStorage);

		let response = await fetch(this.U_STORAGE_ENDPOINT + `/storage/set?user_id=${username}&token=${token}`, {
			method: "POST",
			body: JSON.stringify(storageExt),
			headers: {"Content-Type": "application/json"}
		});

		if (response.status !== 200) throw Error("External response was", response.status,"for POST.", response);

		
		browser.storage.session.set({ fetchedThisSession: true });
	};


	static UGetUserAccountInfo() {
		if (!polymerController) this.UGetPolymerController();
		
		let juicyInfo = polymerController.accountService.cachedGetAccountMenuRequestPromise.result_.actions[0]. 
		openPopupAction.popup.multiPageMenuRenderer.header.activeAccountHeaderRenderer;		

		return {
			accountName: juicyInfo.accountName.runs[0].text,
			accountPhoto: juicyInfo.accountPhoto.thumbnails[0].url,
			channelHandle: juicyInfo.channelHandle.runs[0].text
		};
	};

	static UUpscaleThumbQualityStr(imgUrl) {
		// regex matches = or - and char (w or h) and then digits.
		// all are capture groups so can re-place contents while replacing num to 544.
		// return imgUrl.replace(/(\=|\-)(w|h)(\d+)/g, `$1$2${IMG_HEIGHT}`);
		// was good regex, but if -w(\d) or -h(\d) was present in img id, would be a problem.
		newImg = imgUrl.replace(/=.*?w\d+-h\d+/g, `=w${this.UIMG_HEIGHT}-h${this.UIMG_HEIGHT}`);
		if (imgUrl !== newImg) return newImg;

		newImg = imgUrl.replace(/=s\d+/g, `=s${this.UIMG_HEIGHT}`);
		return newImg;
	};

	static UChooseBestThumbnail(thumbnails) {
		let maxArea = 0;
		let maxUrl;

		for (let thumb of thumbnails) {
			let area = (thumb.width || 1) * (thumb.height || 1);

			if (area > maxArea) maxUrl = thumb.url;
		};

		return maxUrl;
	};

	static UGetButtonFromButtons(buttons, buttonName) {
		return (buttons.filter( v => v[buttonName] )[0] || {})[buttonName];
	};

	static UGetSVGFromRaw(name, returnDiv, returnHTMLString) {
		/* Returns copy of requested SVG by finding in UTemplateElementsStrings */

		let htmlString = this.UTemplateElementsStrings["svg-" + name];

		if (!htmlString) return undefined;
		if (returnHTMLString) return htmlString;

		let div = document.createElement("div");
		div.innerHTML = htmlString;

		if (returnDiv) return div;

		let svg = div.querySelector("svg").cloneNode(true);
		div.remove();

		return svg;
	};

	static UCreateButton(icon, textContent, style, id) {
		let btn = document.createElement("div");
		btn.setAttribute("class", `${style} c-button`);
		btn.setAttribute("id", id || textContent.toLowerCase().replace(" ","-"));

		if (icon) {
			let svg = this.UGetSVGFromRaw(icon);
			svg.setAttribute("class", "c-btn-icon");
			btn.append(svg);
		};

		if (textContent) {
			let text = document.createElement("a");
			text.setAttribute("class", "c-btn-text");
			text.textContent = textContent;
			btn.append(text);
		};	

		return btn;
	};

	static URemovePopup(popup, fadeOut) {
		if (!fadeOut) {
			popup.remove();
			return;
		};

		this.URemoveFromClass(popup, "active");

		setTimeout(function() {
			popup.remove();
		}, 300);
	};

	// messy function, but it creates a popup :)
	static UCreatePopup(layout) {
		function _TextInputFloating(inputElem, label, underline) {
			if (inputElem.type !== "text") return;

			// move label when typing begins, move back if empty
			let isFocused = false;
			inputElem.addEventListener("input", function(event) {
				if (isFocused) {
					if (inputElem.value === "") { URemoveFromClass(label, "floating"); isFocused = false; }
					return;
				};

				UAddToClass(label, "floating");
				isFocused = true;
			});

			// show underline on click
			inputElem.addEventListener("focus", function(event) {
				UAddToClass(underline, "active");
			});

			// hide underline on focus loss
			inputElem.addEventListener("blur", function(event) {
				URemoveFromClass(underline, "active");
			});
		};


		if (Object.keys(UTemplateElementsStrings).length === 0) {
			console.error("UTILS CreatePopup called but TemplateElementsStrings does not exist.");
			return;
		};

		// create popup from template, by seting the (outer to maintain classnames)HTML of a new div.
		const mainTemplate = UTemplateElementsStrings["c-popup-bkg"]; // with OPACITY 1

		let popup = document.createElement("div"); // temporary
		document.body.append(popup);
		popup.outerHTML = mainTemplate;

		popup = document.body.querySelector(".c-popup-bkg");
		
		// set header content.
		const titleText = popup.querySelector(".c-popup-text");
		titleText.textContent = layout.title.text;

		// set icon content
		const iconCont = popup.querySelector(".c-popup-icon");

		if (layout.title.icon) {	 
			const svg = UGetSVGFromRaw(layout.title.icon, false);

			iconCont.append(svg);
		} else {
			iconCont.remove();
		};


		// main content of popup.
		const contentCont = popup.querySelector(".c-popup-content");
		let lastElem;
		let group = 1;

		for (let rowInfo of layout.content) {
			if (rowInfo.type === "gap") {
				let curMarginBtm = Number(lastElem.style.marginBottom)
				lastElem.style.marginBottom = curMarginBtm + rowInfo.gapSize;
				continue;
			};

			if (rowInfo.class === "c-popup-button") {
				let btn = UCreateButton(...rowInfo.buttonConfig);
				contentCont.append(btn);
				continue;
			};

			let rowClass = rowInfo.class;
			let rowElem = document.createElement("div");

			contentCont.append(rowElem);
			rowElem.outerHTML = UTemplateElementsStrings[rowClass];

			rowElem = contentCont.lastElementChild;  // redefine, elem changes with outerHTML change

			if (rowElem.querySelector("input")) {
				for (let elem of rowElem.querySelectorAll("[_group=\"0\"]")) {
					elem.setAttribute("_group", String(group));
				};

				group ++;
			};

			for (let [selector, attribute, value] of rowInfo.config || []) { // change attributes like textContent
				rowElem.querySelector(selector)[attribute] = value;
			};

			for (let [selector, style] of rowInfo.style || []) { // set styles per element
				if (selector === "") rowElem.setAttribute("style", style);
				else rowElem.querySelector(selector).setAttribute("style", style);
			};

			for (let underline of rowElem.querySelectorAll(".c-underline")) {
				underline.innerHTML = this.UTemplateElementsStrings["c-underline"];
			};

			for (let input of rowElem.querySelectorAll("input")) {
				let group = input.getAttribute("_group");
				let selector = `[_group="${group}"]`;

				_TextInputFloating(
					input,
					rowElem.querySelector("label"+selector),
					rowElem.querySelector(".c-underline"+selector+">*")
				);
			};

			if (rowInfo.id) rowElem.setAttribute("id", rowInfo.id);

			if (rowInfo.class === "c-popup-scroll-rows") {
				let template = UTemplateElementsStrings["c-popup-scroll-row"];
				let cont = rowElem.querySelector(".cont");

				for (let item of rowInfo.contents.items) {
					let div = document.createElement("div");
					cont.append(div);

					div.outerHTML = template;
					div = cont.lastElementChild;

					rowInfo.contents.generator(div, item);
				};
			};
		};

		console.log("POPPUUU", popup);

		const actionsCont = popup.querySelector(".c-popup-actions");

		for (let actionInfo of layout.actions) {
			const btn = UCreateButton(actionInfo.icon, actionInfo.text, actionInfo.style, actionInfo.id || actionInfo.text.toLowerCase().replaceAll(" ","-"));
			actionsCont.append(btn);

			const defaultAction = actionInfo.defaultAction;

			if (defaultAction === "close") {
				btn.addEventListener("click", function(e) {
					URemovePopup(popup, true);
				});
			};
		};

		setTimeout(function() {
			UAddToClass(popup, "active");
		}, 50);

		console.log("RETURNING", popup)

		return popup;
	};

	static UDrawDropdown(buttons, clickEvent, onClickContext, onClickParams, onClickAlwaysRun) {
		let cont = document.createElement("div");
		cont.className = "c-popup-bkg";

		let div = document.createElement("div");
		div.className = "c-dropdown";

		for (let button of buttons) {
			let b = document.createElement("div");
			b.className = button.type + "-btn c-drop-btn";

			if (button.icon) {
				let i = this.UGetSVGFromRaw(button.icon, false, false);
				i.style.height = this.U_DROPDOWN_IMG_SIZE;
				i.style.width = this.U_DROPDOWN_IMG_SIZE;
				
				b.append(i);
			};
			
			let t = document.createElement("a");
			t.innerHTML = button.text;
			t.style.fontSize = this.U_DROPDOWN_TEXT_SIZE;

			if (button.onclick) b.onclick = function() {
				if (onClickAlwaysRun) onClickAlwaysRun();

				cont.remove();
				button.onclick.call(onClickContext, ...onClickParams, button.type);
			};

			b.style.height = String(this.U_DROPDOWN_ROW_SIZE) + "px";
			b.append(t);

			div.append(b);
		};

		let bounds = {
			x: document.documentElement.clientWidth,
			y: document.documentElement.clientHeight
		};	

		setTimeout(() => {
			cont.append(div);
			div.style.opacity = "0";
			document.body.append(cont);
		}, 1);

		setTimeout(() => {
			let size = div.getBoundingClientRect();

			divPos = {
				x: Math.min(clickEvent.x, bounds.x - size.width - this.U_DROPDOWN_VP_PAD),
				y: Math.min(clickEvent.y + 30, bounds.y - size.height - this.U_DROPDOWN_VP_PAD),
			};

			div.style.left = String(divPos.x) + "px";
			div.style.top = String(divPos.y) + "px";
			div.style.opacity = "1";

		}, 2);
	};


	static USaveNewOrder(cont) {
		function ProcessDir(elems, info, parentId) {
			for (let paper of elems) {
				if (!paper.matches(".c-paper-wrapper, .c-sidebar-sep, .c-carousel")) continue;
				let id = paper.getAttribute("plId");

				if (id === "CFMORE") continue; // MUST STILL DO THIS, DONT WANT CFMORE IN paperItemOrder, only folder info (got later).

				if (paper.matches(".c-paper-folder")) {
					info = ProcessDir(paper.querySelector(".c-paper-folder-cont").children, info, id);
				};

				if (paper.matches(".c-carousel")) {
					info = ProcessDir(paper.children, info, id);
				};

				//let parentId = paper.parentElement.getAttribute("plId") || "paperItemOrder";

				if (!info[parentId]) info[parentId] = [];
				info[parentId].push(id);
			};

			return info;
		};


		let newInfo = ProcessDir(cont.children, {}, "paperItemOrder");

		this.UDispatchEventToEW({
			func: "sidebar-save-changes",
			newInfo: newInfo
		});
	};





	static UDispatchEventToEW(detail) {
		// dispatch custom event, received by isolated contentscript, messaged to bkg
		let newEvent = new CustomEvent(this.UGeneralCustomEventMWToEW, {detail: detail});
		window.dispatchEvent(newEvent);
	};

	static UEventListenerInMWFromEW() {
		function listener(event) {
			let i = -1;

			for (let customer of Object.values(UWaitingForRespFromEW.waiting)) {
				i ++;
				if (customer.detail.func !== event.data.func || (customer.detail.time !== -1 && customer.detail.time !== event.data.time)) continue;

				if (customer.once === true) {
					delete UWaitingForRespFromEW.waiting[customer.id]; // remove this from list, dont need again
				};

				if (customer.scope) customer.resolve.call(customer.scope, event.data);
				else customer.resolve(event.data);
				return;
			};
		};

		window.UWaitingForRespFromEW = {idCount: 0, waiting: {}};
		window.addEventListener("message", listener);
	};

	static UDispatchFunctionToEW(detail) {
		// Function that defines where the response of an EWEvent can be resolved to.
		// stores context detail in UWaitingForRespFromEW[Array],
		// then calls UDispatch*EVENT*ToEW, uni-directional MW to EW.
		// 
		// UEventListenerInMWFromEW listens for a response sent by EW back to MW.
		// this resolves through the promise generated here.

		return new Promise(function(resolve, reject) {
			detail.time = Date.now();

			this.URegisterListener({
				detail: detail,
				resolve: resolve,
				once: true
			});

			this.UDispatchEventToEW(detail);

			setTimeout(function() {
				reject("TIMEOUT WAITING FOR EW RESPONSE", detail);
			}, this.UMAX_WAITFOR_TIMEOUT);
		});
	};

	static URegisterListener(detail) {
		if (!window.UWaitingForRespFromEW) this.UEventListenerInMWFromEW();

		let id = UWaitingForRespFromEW.idCount;
		UWaitingForRespFromEW.idCount ++;

		detail.id = id;
		UWaitingForRespFromEW.waiting[id] = detail;

		return detail;
	};

	static URemoveListener(id) {
		delete UWaitingForRespFromEW.waiting[id];
	};

	static EWSendRefreshContSignalToMW(storage, tabId) {
		// tabs, not runtime, bcs cant send to contentscripts with runtime
		let response = {
			func: this.UEventFuncForSidebarUpdate,
			time: -1,

			storage: storage,
			action: "refreshCont"
		};

		browser.tabs.sendMessage(tabId, response);
	};

	static async UMWStorageGet(path, fetchNew) {
		// path: string . separated, eg sidebar.folders.folders

		let response = await this.UDispatchFunctionToEW({
			func: "get-storage",
			path: path,
			fetchNew: fetchNew
		});

		return response.storage;
	};

	static UConvertCPaperItemToCGridItem(paperElem) {
		URemoveFromClass(paperElem, "c-paper-wrapper");
		UAddToClass(paperElem, "c-ovf-elem");
	};

	static UAddEditButtonsToPaperItem(elem, visibleIcon, invisibleIcon, pencilIcon, moveIcon, deleteIcon, expandIcon) {
		const actualPaper = elem.querySelector(".c-paper-item");
		const isFolder = elem.matches(".c-paper-folder");

		elem.setAttribute("c-draggable","true");

		const normButtonCont = elem.querySelector(".c-paper-button-cont");
		const editButtonCont = normButtonCont.cloneNode(true);
		UHideElem(normButtonCont);
		UUnHideElem(editButtonCont);

		actualPaper.append(editButtonCont);

		UAddToClass(editButtonCont, "c-editing");
		editButtonCont.innerHTML = "";

		let bkgCont = normButtonCont.querySelector(".bkg-cont");
		bkgCont = bkgCont.cloneNode(true);
		
		editButtonCont.append(bkgCont);

		// add svg buttons to editButtonCont

		// visibility button
		// if paper is normally hidden, put correct SVG!!
		let thisVisibilityButton;
		let isVisible = !elem.matches(".c-hidden");

		if (isVisible) {
			thisVisibilityButton = visibleIcon.cloneNode(true);

		} else {
			thisVisibilityButton = invisibleIcon.cloneNode(true);
		};

		editButtonCont.append(thisVisibilityButton);

		thisVisibilityButton.addEventListener("click", function(e) {
			e.preventDefault();
			e.stopImmediatePropagation();

			isVisible = !isVisible;

			if (isVisible) {
				thisVisibilityButton.innerHTML = UGetSVGFromRaw("visible", false, true);
				UUnHideElem(elem);
			} else {
				thisVisibilityButton.innerHTML = UGetSVGFromRaw("invisible", false, true);
				UHideElem(elem);
			};

			UDispatchEventToEW({
				func: "sidebar-visibility-change",
				change: {
					id: elem.getAttribute("plId"),
					isVisible: isVisible
				} 
			});
		});

		// movable icon (not button)
		let thisMoveIcon = moveIcon.cloneNode(true);
		editButtonCont.append(thisMoveIcon);

		// only add delete button for folders. cba with apis
		// only add edit button for folders, u edit playlist metadata on the page now.
		if (isFolder) {
			let thisPencilIcon = pencilIcon.cloneNode(true);
			editButtonCont.append(thisPencilIcon);

			thisPencilIcon.addEventListener("click", function(e) {
				e.preventDefault();
				e.stopImmediatePropagation();

				UPopupRename(elem);
			});

			let thisDeleteButton = deleteIcon.cloneNode(true);
			editButtonCont.insertBefore(thisDeleteButton, editButtonCont.firstElementChild);

			thisDeleteButton.addEventListener("click", function(e) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				
				let name = elem.querySelector(".c-paper-text-cont .c-paper-title").textContent;
				UPopupDeleteFolder(elem.parentElement, name, elem.getAttribute("plId"), elem);
			});

			let expandButton = expandIcon.cloneNode(true);
			editButtonCont.insertBefore(expandButton, editButtonCont.firstElementChild);

			if (elem.matches(".open")) {
				expandButton.style.rotate = "180deg";
			};

			expandButton.addEventListener("click", function(e) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				if (elem.matches(":has(:not(.c-hidden) > .c-paper-item > .c-active)")) return;

				if (elem.matches(".open")) {
					UAddToClass(elem, "closed");
					URemoveFromClass(elem, "open");
					expandButton.style.rotate = "";

				} else {
					UAddToClass(elem, "open");
					URemoveFromClass(elem, "closed");
					expandButton.style.rotate = "180deg";
				};
			});
		};
	};

	static UShowGridOfMusicItems(musicItemFilter, editButtons, includeFolders, areDraggable, onClick, pStorage, purpose, title, subtitle) {
		function _CreateOVFPaperItem(paperService, ovf, id) {
			let isFolder = id.match(/^CF/);
			let paperElem;

			if (isFolder) paperElem = paperService.CreateAndPopulateFolderPaperItem(id, ovf.elemCont);
			else paperElem = paperService.CreatePaperElem(id, ovf.elemCont);

			UConvertCPaperItemToCGridItem(paperElem);
			if (areDraggable) {
				paperElem.setAttribute("c-draggable", "true");
				paperElem.removeAttribute("href");

				if (editButtons) UAddEditButtonsToPaperItem(paperElem, ...editButtons);
			};

			if (onClick) paperElem.addEventListener("click", () => onClick(id));
		};

		function OnStorageGet(storage) {
			let organisation = [{},{}];

			let paperService = new InjectMyPaperItems();
			paperService.storage = storage;

			// sort by private -> type -> artistId(albums) -> alphabetical name			
			// o = [{type: {artist: {id: undefined, id: undefined

			let values = Object.values(storage.cache);
			if (musicItemFilter) values = values.filter(musicItemFilter);

			for (let v of values) {
				if (v.type !== "ARTIST" && v.type !== "ALBUM" && v.type !== "PLAYLIST") continue;
				if (v.id === U_VARIOUS_ARTISTS_EXTID) continue;

				let privateI = Number(!!v.private);
				let group = organisation[privateI];

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
			};

			if (includeFolders) {
				let folders = Object.values(storage.sidebar.folders.folders);
				if (musicItemFilter) folders = folders.filter(musicItemFilter);

				for (let folder of folders) {
					_CreateOVFPaperItem(paperService, ovf, folder.id);
				};
			};


			for (let privateGroup of organisation) { // isPrivate: {}, notPrivate: {}
				for (let [type, group] of Object.entries(privateGroup)) { // ALBUM: [], ARTIST: [], PLAYLIST: []

					if (type === "ALBUM") {
						for (let artistGroup of Object.values(group)) {
							let alphabetical = Object.values(artistGroup).sort((a, b) => a.name.localeCompare(b.name));

							for (let v of alphabetical) {
								_CreateOVFPaperItem(paperService, ovf, v.id);
							};
						};

						continue;
					};

					let alphabetical = Object.values(group).sort((a, b) => a.name.localeCompare(b.name));

					for (let v of alphabetical) {
						_CreateOVFPaperItem(paperService, ovf, v.id);
					};					
				};
			};
		};

		let ovfcont = document.createElement("div");
		ovfcont.innerHTML = UTemplateElementsStrings["c-popup-elem-overflow"];

		let ovf = {
			ovf: ovfcont.firstElementChild,
			elemCont: ovfcont.querySelector(".elem-cont"),
			paperStorage: ovfcont.querySelector(".paper-storage")
		};

		if (purpose) ovf.ovf.setAttribute("func", purpose);

		if (title) ovf.ovf.querySelector(".header a:first-child").textContent = title;
		if (subtitle) ovf.ovf.querySelector(".header a:last-child").textContent = subtitle;

		document.body.append(ovfcont);

		ovf.promiseOfFillingGrid = async function() {
			if (!pStorage) pStorage = await this.UMWStorageGet();

			OnStorageGet(pStorage);
		}();
		

		return ovf;
	};

	static ULengthStrToSeconds(lengthStr) {
		if (lengthStr === undefined) return;

		let segs = lengthStr.split(":").reverse();
		let pow = 0;
		let seconds = 0;

		for (let seg of segs) {
			seconds += (Number(seg) * (60 ** pow));
			pow ++;
		};

		return seconds;
	};

	static UBigNumToText(n) {
		n = (isNaN(n)) ? 0 : n;

		let letter = "";
		if (n > 1_000_000_000) {
			n /= 1_000_000_000;
			letter = "B";
		
		} else if (n > 1_000_000) {
			n /= 1_000_000;
			letter = "M"
		
		} else if (n > 1_000) {
			n /= 1_000;
			letter = "K";
		};

		if (n >= 9.95) {
			return String(Math.round(n)) + letter;

		} else {
			return String(Math.round(n * 10) / 10) + letter;
		};
	};

	static USecondsToLengthDetail(seconds) {
		let lengthDet = [];

		for (let i = 2; i > -1; i--) {
			let thisCol = Math.floor(seconds / (60 ** i));
			seconds = seconds % (60 ** i);

			//if ((lengthDet.length !== 0) || (lengthDet.length === 0 && thisCol !== 0)) {
				lengthDet.push(thisCol);
			//}; only use this for string later, stops 00:01:32, when zero hours

			if (i == 1 && seconds < 60) {
				lengthDet.push(seconds);
				return lengthDet;
			};
		};

		return lengthDet;
	};

	static USecondsToLengthStr(seconds, wordy, includeSeconds) {
		let lengthDet = this.USecondsToLengthDetail(seconds);


		if (wordy) {
			let lengthStrs = [];

			for (let i = 2; i >= 0; i--) {
				let thisL = lengthDet[i];

				if (thisL === 0) continue;
				if (i === 2 && !includeSeconds) continue;

				if (thisL === 1) lengthStrs.unshift("1 " + this.U_TIME_WORDS[i]);
				else lengthStrs.unshift(String(thisL) + " " + this.U_TIME_WORDS[i] + "s");
			};

			return lengthStrs.join(", ");
		};

		let strs = [];

		for (let i = 0; i < lengthDet.length; i++) {
			let v = String(lengthDet[i]);

			if (strs.length === 0 && v === "0") continue;

			if (strs.length === 0) {
				strs.push(v); // dont zero-pad the first column
			} else {
				strs.push(v.padStart(2, "0"))
			}
		};

		return strs.join(":");
	};

	static UGetTotalSecondsOfList(storage, cachedListPage) {
		let hiddenSongs = storage.customisation.hiddenSongs[cachedListPage.id] || [];
		// DONT exclude skipped songs. theyre still part of the album.

		let total = 0;

		for (let trackId of cachedListPage.items) {
			if (hiddenSongs.includes(trackId)) continue;

			let track = storage.cache[trackId];
			if (!track || track.lengthSec === -1) continue;

			total += track.lengthSec;
		};

		return total;
	};


	static UGetCompleteCacheEntry(cache, id) {
		let base = cache[id];

		// worry about recursion, only use this to overwrite with different values
		// dont use to create one big object with all info
	};

	/*static UReturnPlayableIdFromCachedInfo(info) {
		if (info.type === "ALBUM") {
			if (info.private === true || )
			return info.mfId;
		}
		if (info.type === "PLAYLIST") return info.if.replace(/^VL/,"");

	};*/

	static UGenerateArtificialPlaylistSetId() {
		let str = "";

		for (let i = 0;  i < 17; i++) { // 17 on purpose, so never clashes with yt?
			let n = Math.round(Math.random() * 15);

			if (n < 10) str += String(n);
			else str += this.U_ALPHABET[n - 10];
		};

		return str;
	};

	static UGetPlaylistPanelVideoRenderer(obj) {
		if (!obj) return {};

		return obj.playlistPanelVideoRenderer
			|| UDigDict(obj, this.UDictGet.PPVRThroughVideoWrapper)
			|| UDigDict(obj, this.UDictGet.PPVRFromGetQueueData)
			|| UDigDict(obj, this.UDictGet.PPVRFromGetQueueDataThroughVideoWrapper);
	};

	static UGetBrowsePageTypeFromBrowseId(browseId, excludeCTypes, resultisImportant, hasEditedResponse) {
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

	static UGetBrowsePageType(stateOrNavEndp) {
		let browseEndpoint = stateOrNavEndp;

		if (stateOrNavEndp.navigation) { // get browseEndpoint from store.state
			let mainContent = stateOrNavEndp.navigation.mainContent;
			browseEndpoint = mainContent.endpoint.data;
			if (!browseEndpoint) return null;

		} else if (stateOrNavEndp.browseEndpoint) { // get from whatever else (navEndpoint?)
			browseEndpoint = stateOrNavEndp.browseEndpoint;
		};

		let browseId = browseEndpoint.browseId;
		let supportedConfigs = browseEndpoint.browseEndpointContextSupportedConfigs;

		let fromBrowse = this.UGetBrowsePageTypeFromBrowseId(browseId);
		if (fromBrowse) return fromBrowse;

		if (!supportedConfigs) return null;
		

		let pageType = supportedConfigs.browseEndpointContextMusicConfig.pageType;
		return pageType;
		
		/*if (browseId) {
			if (browseId === "FEmusic_home") return "C_PAGE_TYPE_HOME";
			if (browseId.match("privately_owned_release_detail")) return "C_PAGE_TYPE_PRIVATE_ALBUM";
			if (browseId.match("privately_owned_artist_detail")) return "C_PAGE_TYPE_PRIVATE_ARTIST";
			if (browseId === "FEmusic_library_landing") return "C_PAGE_TYPE_LIBRARY_CONTENT_LANDING_PAGE"; // DOWNLOADS_CONTENT, PRIVATELY_OWNED_CONTENT yt has. NEED c_TYPE for when clicking library from sidebar..
			if (browseId === "FEmusic_library_privately_owned_landing") return "C_PAGE_TYPE_PRIVATELY_OWNED_CONTENT_LANDING_PAGE";
		};*/
	

		//if (pageType === "MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY") {
			/*let chips = mainContent.response.contents.singleColumnBrowseResultsRenderer
				.tabs[0].tabRenderer.content.sectionListRenderer.header.musicSideAlignedItemRenderer
				.startItems[0].chipCloudRenderer.chips;

			let selected;

			for (let chip of chips) {
				chip = chip.chipCloudChipRenderer;
				if (!chip.isSelected) continue;

				selected = chip.uniqueId.toLowerCase();
				break;
			};

			if (selected.match("album")) return "C_PAGE_TYPE_ARTIST_DISCOG_ALBUMS";
			if (selected.match("single")) return "C_PAGE_TYPE_ARTIST_DISCOG_SINGLES";*/
		//};

	};

	static UGetBrowseIdFromResponseContext(responseContext) {
		let GFEEDBACK = responseContext.serviceTrackingParams.filter( v => v.service === "GFEEDBACK" )[0];
		if (!GFEEDBACK) return null;

		let browseEntry = GFEEDBACK.params.filter( v => v.key === "browse_id" )[0];
		if (!browseEntry) return null;

		return browseEntry.value;
	};

	static UGetSelectedTab(tabs) {
		if (tabs.length === 1) return tabs[0].tabRenderer;

		for (let tab of tabs) {
			if (tab.tabRenderer.selected === true) return tab.tabRenderer;
		};
	};

	static UGetSelectedChip(chips) {
		for (let chip of chips) {
			chip = chip.chipCloudChipRenderer;
			if (!chip.isSelected) continue;

			return chip.uniqueId.toLowerCase();
		};
	};

	static UGetCleanTypeFromPageType(pageType, retainPrivate) {
		let n = (pageType || "")
			.replace("MUSIC_PAGE_TYPE_","")
			.replace("C_PAGE_TYPE_","");

		if (!retainPrivate) n = n.replace("PRIVATE_","");
		return n;
	};

	static UGetDataFromSubtitleRuns(baseData, subtitle) {
		subtitle = subtitle.runs.filter((v) => v.text !== this.U_YT_DOT);

		let artist = subtitle.filter((v) => (v.navigationEndpoint !== undefined || v.text === U_VARIOUS_ARTISTS));
		if (artist.length !== 0) {
			if (artist[0].text === U_VARIOUS_ARTISTS) {

				baseData.artists = [{
					name: U_VARIOUS_ARTISTS,
					id: U_VARIOUS_ARTISTS_EXTID,
				}];

			} else {
				let type = artist[0].navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType;

				if (type === "MUSIC_PAGE_TYPE_UNKNOWN") {
					type = this.UGetBrowsePageTypeFromBrowseId(artist[0].navigationEndpoint.browseEndpoint.browseId);
				};

				let data = {
					name: artist[0].text,
					id: artist[0].navigationEndpoint.browseEndpoint.browseId,
					type: type
				};

				if (type === "MUSIC_PAGE_TYPE_ARTIST" || type === "C_PAGE_TYPE_PRIVATE_ARTIST") {
					baseData.artists = [data];

				} else if (type === "MUSIC_PAGE_TYPE_USER_CHANNEL") {
					baseData.creator = data.name;

				} else if (type === "MUSIC_PAGE_TYPE_ALBUM") {
					baseData.album = data;

				};

				baseData.creatorNavigationEndpoint = artist[0].navigationEndpoint;
			};				
		};

		let subType = subtitle.filter((v) => !v.navigationEndpoint && v.text.toLowerCase().match(/(single)|(ep)|(album)|(radio)/));
		if (subType.length !== 0) {
			baseData.subType = subType[0].text;
		};

		let yearStr = subtitle.filter((v) => !v.navigationEndpoint && !isNaN(Number(v.text)));
		if (yearStr.length !== 0) {
			baseData.yearStr = yearStr[0].text;
		};

		return baseData;
	};

	static UNavigate(navigationEndpointOuterDict) {
		if (polymerController) this.UGetPolymerController();

		// "outerDict" = requires "endpoint type";
		// eg param: {
		//	browseEndpoint:{
		//		browseId:"VLLM",
		//		browseEndpointContextSupportedConfigs: {...}
		//	}
		//}
		// HAVE TESTED, DOES REQUIRE BROWSECONFIGS

		if (navigationEndpointOuterDict.cParams) {
			let id;

			if (navigationEndpointOuterDict.browseEndpoint) id = navigationEndpointOuterDict.browseEndpoint.browseId;
			if (navigationEndpointOuterDict.watchEndpoint) id = navigationEndpointOuterDict.watchEndpoint.playlistId;
			if (navigationEndpointOuterDict.queueAddEndpoint) id = navigationEndpointOuterDict.queueAddEndpoint.queueTarget.playlistId;
			if (navigationEndpointOuterDict.createPlaylistServiceEndpoint) id = navigationEndpointOuterDict.createPlaylistServiceEndpoint.title;
			
			this.UBrowseParamsByRequest[id] = structuredClone(navigationEndpointOuterDict.cParams);
			delete navigationEndpointOuterDict.cParams;
		};

		if (navigationEndpointOuterDict.queueAddEndpoint || navigationEndpointOuterDict.createPlaylistServiceEndpoint) {
			if (!window.menuServiceItemBehaviour) this.UGetMenuServiceItemBehaviour();

			menuServiceItemBehaviour.handleCommand(navigationEndpointOuterDict); // TODO see commandExecutorCommands?

			return;
		};


		polymerController.handleNavigateAction({
			navigateAction: {
				endpoint: navigationEndpointOuterDict
			}
		});

		
	};

	static UNavigateOnClick(elem, navigationEndpointOuterDict, excessFunc, excessParams, verifyFunc, useCapture, preventPropagation) {
		// "outerDict" = requires "endpoint type";

		elem.addEventListener("click", function(e) {
			console.log(elem, "CLICKED navigating to", navigationEndpointOuterDict, "and doing", excessFunc);

			e.preventDefault();
			if (navigationEndpointOuterDict.cParams && navigationEndpointOuterDict.cParams.stopPropagation) preventPropagation = true;
			if (preventPropagation) e.stopImmediatePropagation();

			if (verifyFunc && verifyFunc(e) === false) {
				console.log("navevent cancelling due to negative result of verifyFunc");
				return;
			};

			if (excessFunc) excessFunc(...excessParams);

			UNavigate(navigationEndpointOuterDict);
		}, {["useCapture"]: useCapture});
	};

	static UGetPolymerController() {
		// used to ytmusic-player-bar.controllerProxy;
		// then was ytmusic-app.navigator;
		// now ytmusic-app.polymerController, this has EVERYTHING EVER.
		if (window.polymerController) return window.polymerController;

		if (!window.apiComponent) {
			window.musicApp = document.querySelector("ytmusic-app");
		};

		window.polymerController = musicApp.polymerController;
		
		return window.polymerController;
	};

	static UGetMenuServiceItemBehaviour() {
		if (window.menuServiceItemBehaviour) return window.menuServiceItemBehaviour;

		this.UGetPolymerController();
		if (!window.polymerController) return;

		let elem = document.createElement("ytmusic-menu-service-item-renderer");
		let serviceMenuItemBehaviour = elem.ytmusicServiceMenuItemBehavior;
		serviceMenuItemBehaviour.hostElement = window.musicApp;

		window.menuServiceItemBehaviour = serviceMenuItemBehaviour;

		return window.menuServiceItemBehaviour;
	};

	static UWaitForPolymerController() {
		return new Promise((resolve, reject) => {
			if (window.polymerController) {
				resolve(window.polymerController);
				return;
			};

			interval = setInterval(function() {
				let utilsGot = this.UGetPolymerController();
				if (!utilsGot) return;
		
				console.log("got polymerController in uwaitfor");
				resolve(utilsGot);
		
				clearInterval(interval);
			}, 50);
		});
	};
	
	static UGetMicroformatIdFromBrowseData(browseId, browsePageTypeOrNotIncludesCTypes) {
		let browsePageType = (!!browsePageTypeOrNotIncludesCTypes) ? browsePageTypeOrNotIncludesCTypes
			: this.UGetBrowsePageTypeFromBrowseId(browseId, false, true);

		switch (browsePageType) {
			case "C_PAGE_TYPE_PRIVATE_ALBUM":
				return browseId.replace("FEmusic_library_privately_owned_release_detail", "MLPR");
			
			case "MUSIC_PAGE_TYPE_PLAYLIST":
				return browseId.replace(/^VL/, "");
			
			case "MUSIC_PAGE_TYPE_ALBUM":
				//console.error(`Cannot get mfId from browseId when browsePageType is ${browsePageType}`);
				return;
		};
	};

	static UBuildEndpoint(opts) {
		let browsePageType = opts.browsePageType || this.UGetBrowsePageTypeFromBrowseId(opts.id, true, true);

		if (opts.navType === "browse") {
			let v = {
				browseEndpoint: {
					browseId: opts.id
				}
			};

			if (browsePageType) {
				v.browseEndpoint.browseEndpointContextSupportedConfigs = {
					browseEndpointContextMusicConfig: {
						pageType: browsePageType
					}
				}
			};

			if (opts.cParams) v.cParams = opts.cParams;

			return v;
		};

		if (opts.navType === "watch") {
			let v = {
				watchEndpoint: {}
			};

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

			if (opts.shuffle === true) v.watchEndpoint.params = U_SHUFFLE_PLAYER_PARAMS;
			else v.watchEndpoint.params = this.U_NORM_PLAYER_PARAMS;

			if (opts.cParams) v.cParams = opts.cParams;

			return v;
		};

		if (opts.navType === "queueAdd") {
			return {
				queueAddEndpoint: {
					queueInsertPosition: opts.position === "next" ? "INSERT_AFTER_CURRENT_VIDEO" : "INSERT_AT_END",

					queueTarget: {
						playlistId: opts.playlistId,
						onEmptyQueue: this.UBuildEndpoint({
							playlistId: opts.playlistId,
							navType: "watch"
						})
					},

					commands: [
						this.UBuildEndpoint({
							successTextRuns: [
								{text: (opts.listType === "MUSIC_PAGE_TYPE_PLAYLIST" ? "Playlist" : "Album") + " added to queue."}
							],
							navType: "toast"
						})
					]
				},
				cParams: opts.cParams
			};
		};

		if (opts.navType === "toast") {
			return {
				addToToastAction: {
					item: {
						notificationTextRenderer: {
							successResponseText: {
								runs: opts.successTextRuns
							}
						}
					}
				}
			};
		};

		if (opts.navType === "menuNavigationItemRenderer") {
			return {
				menuNavigationItemRenderer: {
					icon: { iconType: opts.icon },
					text: { runs: [ { text: opts.text } ] },
					navigationEndpoint: opts.endpoint
				}
			};
		};

		if (opts.navType === "confirmDialog") {
			return {
				confirmDialogEndpoint: {
					content: {
						confirmDialogRenderer: {
							title: { runs: [ { text: opts.title } ] },
							dialogMessages: [{ runs: [ { text: opts.prompt } ] }],
							confirmButton: this.UBuildEndpoint({
								navType: "confirmButton",
								text: opts.confirmText,
								endpoint: opts.endpoint,
								cParams: opts.cParamsOnConfirm
							}),
							cancelButton: this.UBuildEndpoint({
								navType: "cancelButton"
							})
						}
					}
				}
			};
		};

		if (opts.navType === "confirmButton") {
			return {
				buttonRenderer: {
					style: "STYLE_LIGHT_TEXT",
					size: "SIZE_DEFAULT",
					isDisabled: false,
					text: { runs: [ { text: opts.text } ] },
					serviceEndpoint: opts.endpoint
				},
				cParams: opts.cParams
			};
		};

		if (opts.navType === "cancelButton") {
			return {
				buttonRenderer: {
					style: "STYLE_LIGHT_TEXT",
					size: "SIZE_DEFAULT",
					isDisabled: false,
					text: { runs: [ { text: "Cancel" } ] }
				}
			};
		};

		if (opts.navType === "createPlaylist") {
			return {
				createPlaylistServiceEndpoint: {
					title: opts.title,
					privacyStatus: opts.privacyStatus,
					videoIds: opts.videoIds,
					sourcePlaylistId: opts.sourcePlaylistId,
					description: opts.description
				},
				cParams: opts.cParams
			};
		};
	};

	static USoftClearQueue() {
		this.UGetPolymerController();

		let s = polymerController.store;

		console.log("soft clear");

		s.dispatch({
			type: "CLEAR_STEERING_CHIPS" 
		}); // remove?

		s.dispatch({
			type: "SET_IS_INFINITE",
			payload: !1
		});

		s.dispatch({
			type: "SET_QUEUE_CONTEXT_PARAMS",
			payload: "" 
		}); // remove?

		s.dispatch({
			type: "SET_WATCH_NEXT_TYPE",
			payload: null
		});

		s.dispatch({
			type: "HAS_SHOWN_AUTOPLAY",
			payload: !1
		});

		s.dispatch({
			type: "SET_IS_FETCHING_CHIP_STEER",
			payload: !1
		});

		/*s.dispatch({
			type: "SET_HEADER",
			payload: null
		})*/

		s.dispatch({
			type: "CLEAR",
			payload: [
				polymerController.queue.getCurrentItemIndex()
			]
		});

		s.dispatch({
			type: 'SET_IS_RAAR_ENABLED',
			payload: !1
		});

		s.dispatch({
			type: 'SET_PLAYER_PAGE_WATCH_NEXT_AUTOMIX_PARAMS',
			payload: "NONE"
		});

		s.dispatch({
			type: "SET_IS_PREFETCHING_CONTINUATIONS",
			payload: !1
		});
		
		/*VERY BAD, spams multiple web requests to server queue.
		let controllerProxy = document.querySelector("ytmusic-player-bar").controllerProxy;
		
		for (let item of controllerProxy.queue.getItems()) {
			let videoRenderer = this.UGetVideoRenderer(item);
			let detail = videoRenderer.playlistPanelVideoRenderer;
			
			if (detail.selected === true) continue;
			
			let stringIndexForDeleting = String(detail.navigationEndpoint.watchEndpoint.index);
			
			controllerProxy.queue.removeItem(stringIndexForDeleting);
		};*/
	};
	
	static UCreateTextElemFromRuns(cont, runs, badges) {
		if (badges) {
			for (let badge of badges) {
				cont.append(this.UGetSVGFromRaw(badge));
			};
		};
		
		runs = (runs || []).filter( v => !!v.text && v.text !== this.U_YT_DOT);

		for (let i = 0; i < runs.length; i++) {
			let v = runs[i];

			let a = document.createElement("a");
			a.textContent = v.text;

			if (v.navigationEndpoint) {
				
				a.__cData = {navigationEndpoint: v.navigationEndpoint};
				a.setAttribute("href", "browse/" + v.navigationEndpoint.browseEndpoint.browseId);

				this.UNavigateOnClick(a, v.navigationEndpoint);
			};

			cont.append(a);

			if (i === runs.length - 1) continue;

			let dot = document.createElement("a");
			dot.textContent = U_YT_DOT;
			cont.append(dot);
		};

		return cont;
	};

	static UCacheItemIsSong(cacheItem) {
		return cacheItem.type.match("VIDEO_TYPE");
	};


	static UGetArtistsFromDropdown(menuRenderer) {
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


	static UGetDefaultDataForTwoRowItemRendererFromBrowsePageType(browsePageType) {
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

	static UGetDataFromTwoRowItemRenderer(twoRowItemRenderer, defaultData) {
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
			allData.artists = UGetArtistsFromDropdown(twoRowItemRenderer.menu.menuRenderer);
		};

		try {
			let playNavEndp = twoRowItemRenderer.thumbnailOverlay.musicItemThumbnailOverlayRenderer.content
				.musicPlayButtonRenderer.playNavigationEndpoint;

			allData.mfId = (playNavEndp.watchPlaylistEndpoint || playNavEndp.watchEndpoint).playlistId;

		} catch {};

		return allData;
	};


	static UGetArtistsFromTextRuns(runs) {
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


	static UGetSongInfoFromListItemRenderer(listItemRenderer) {
		if (listItemRenderer.musicResponsiveListItemRenderer) listItemRenderer = listItemRenderer.musicResponsiveListItemRenderer;
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
		let setVideoId;
		if (listItemRenderer.playlistItemData) {
			id = listItemRenderer.playlistItemData.videoId;
			setVideoId = listItemRenderer.playlistItemData.playlistSetVideoId;
		
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

		let album = undefined;
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
			artists:  		 UGetArtistsFromTextRuns(listItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs),
			index: 	  		(listItemRenderer.index || { runs: [ { } ] }).runs[0].text,
			badges:		    (listItemRenderer.badges || []).map(v => v.musicInlineBadgeRenderer.icon.iconType),
			album:			 album,
			thumb:			 thumb,
			id:				 id,
			type:			 songType,
			liked:			 liked,
			playlistSetVideoId: setVideoId,
			_DISPLAY_POLICY: listItemRenderer.musicItemRendererDisplayPolicy
		}
	};

	static UGetCounterpartFromData(cache, data) {
		if (!data || (data.privateCounterparts || []).length === 0) return;

		return (cache || {})[data.privateCounterparts[0]];
	};

	static UGetPrimaryVersions(storage, nonMainId) {
		let linked = [];

		for (let [mainVer, alts] of Object.entries(storage.customisation.primaryAlbums)) {
			if (mainVer === nonMainId) continue; // do we want to do anything here? provided album IS the prim ver.
			if (!alts.includes(nonMainId)) continue;

			linked.push(mainVer);
		};

		return linked;
	};

	static UGetIdsToReplaceFromRealAlbum(storage, buildQueueFrom, loadedBulkFrom) {
		// buildQueueFrom is the real nav playlist. (deluxe)
		// loadedBulkFrom is the perspective, playlist of song that was clicked. (could be non-deluxe) 
		if (buildQueueFrom === undefined || loadedBulkFrom === undefined) return;

		let cache = storage.cache;
		let buildingFromAlbum = cache[buildQueueFrom];
		let loadedFromAlbum = cache[loadedBulkFrom];
		let indexToVideoIdOfThis = {}; // list of indexes to videoIds in REAL ALBUM (loadedFrom) only.

		if (!buildingFromAlbum || !loadedFromAlbum) return;
		//TESTING WITHOUT THIS. WORKS OK! if (buildingFromAlbum.private) return;

		// MAP INDEX TO VIDEO OF ALBUM WE HAVE LOADED.
		// DO ALL BASED ON CACHE NOW, SO SHUFFLING DOESNT MATTER.
		console.log("LOADEDFROMALBUM", {loadedFromAlbum});

		for (let video of (loadedFromAlbum.items || [])) {
			video = cache[video] || {};
			indexToVideoIdOfThis[video.index] = video.id;
		};
		console.log(structuredClone({indexToVideoIdOfThis}), "FIRST TIME");

		let albumsToUse = [];
		let primaryVersions = this.UGetPrimaryVersions(storage, buildQueueFrom) || [];
		let linkedAlbums = storage.customisation.albumLinks[buildQueueFrom] || [];
		let counterparts = buildingFromAlbum.privateCounterparts || [];

		let extraSongs = storage.customisation.extraSongs[buildQueueFrom] || [];
		
		// priority order (later overwrite earlier)
		if (primaryVersions) albumsToUse.push(...primaryVersions);
		if (linkedAlbums) {
			linkedAlbums = linkedAlbums
				.map( v => { return { obj: cache[typeof(v) === "string" ? v : v.linkedId], off: v.offsetIndex }} ) // docs: "a and b will never be undefined", so no placeholder.
				.sort( (a, b) => (a.obj.private && !b.obj.private) ? 1 : (!a.obj.private && b.obj.private) ? -1 : b.obj.items.length - a.obj.items.length )
				.map( v => {return { id: v.obj.id, off: v.off }} );

			// sort: (a,b): negative = a before b, positive = a after b, 0 or NaN = equal
			// a is private and b is not: put a after always
			// a is not and b is private: put b after always
			// privacy is same (both are or both arent): do based on items length.

			albumsToUse.push(...linkedAlbums);
		};
		if (counterparts) albumsToUse.push(...counterparts);

		// if loading from smaller (eg original), need to add extra from deluxe.
		// add to start of list, so is low priority.
		if (buildingFromAlbum.id !== loadedFromAlbum.id) {
			albumsToUse.unshift(buildingFromAlbum.id);
		};

		console.log(albumsToUse);

		let changesByIndex = {};

		for (let data of albumsToUse) {
			let dataDatatype = typeof(data);
			let album = (dataDatatype === "string") ? data : data.id;
			let offsetIndex = (dataDatatype === "string") ? undefined : data.off;

			album = cache[album];
			if (!album || album.items.length === 0) continue;

			for (let item of album.items) {
				item = cache[item];
				if (!item) continue;

				let index = (offsetIndex) ? String(Number(item.index) + Number(offsetIndex)) : item.index;

				let alreadyChanging = changesByIndex[index];
				if (alreadyChanging) {
					if (alreadyChanging.from.private === true) continue;
					// removed this. instead, made priority of albumsToUse correct. most important last.
					// if (album.private === false) continue; 
				};

				// why change if its the same?
				// because midnights. queue built from original, replaced by 3am. 
				// need to bring back to original.

				changesByIndex[index] = {
					video: item,
					from: album
				};
			};
		};

		let changesByOriginalId = {extraByIndex: {}, "indexToVideoIdOfThis": indexToVideoIdOfThis};

		console.log("indexToVideoIdOfThis", indexToVideoIdOfThis);
		console.log("changesByIndex", structuredClone(changesByIndex));

		for (let [k,v] of Object.entries(changesByIndex)) {
			let originalId = indexToVideoIdOfThis[k];

			if (originalId) changesByOriginalId[originalId] = v;
			else changesByOriginalId.extraByIndex[k] = v;
		};

		// ADD EXTRA SONGS
		for (let song of extraSongs) {
			let item = cache[song.videoId];
			if (!item) continue;

			let fromAlbum = cache[item.album];
			if (!fromAlbum) continue;

			// WON'T HAVE AN originalId AS IS NEW TO ALBUM
			//let existingHere = changesByOriginalId[song.index];
			//if (existingHere && song.overwrite) {
			//	changesByOriginalId[song.index]
			//}
			changesByOriginalId.extraByIndex[song.index] = {
				video: item,
				from: fromAlbum,
				manualExtra: true,
				overwrite: song.overwrite
			};
		};

		return changesByOriginalId;
	};

	static UGetObjFromMfId(cache, mfId) {
		if (!mfId) return;

		if (mfId.startsWith("PL")) {
			return cache["VL" + mfId];
		};

		let id = cache.mfIdMap[mfId];
		if (!id) return undefined;

		return cache[id];
	};



	static UTestingShowStorage() {
		UMWStorageGet().then(v => console.log(v));
	};

	static UTestingShowEntireCache() {
		UMWStorageGet("cache").then(v => console.log(v));
	};

	static UTestingShowCacheEntry(id) {
		UMWStorageGet("cache").then(v => console.log(v[id]))
	};


	static UCreateLongBylineForPlaylistPanel(replacement, buildingFromAlbum, artist) {
		return [
			{
				text: artist.name,
				navigationEndpoint: this.UBuildEndpoint({
					navType: "browse",
					id: artist.id
				})
			},
			{ text: this.U_YT_DOT },
			{
				text: replacement.from.name,
				navigationEndpoint: this.UBuildEndpoint({
					navType: "browse",
					id: buildingFromAlbum.id
				})
			},
			{ text: this.U_YT_DOT },
			{ text: buildingFromAlbum.year }
		];
	};


	static UCreateToggleMenuItemForLikeButton(cacheItem) {
		if (!cacheItem) return;

		if (cacheItem.type === "ALBUM") {
			if (cacheItem.saved) return {
				"toggleMenuServiceItemRenderer": {
					"defaultText": {
						"runs": [
							{
								"text": "Remove album from library"
							}
						]
					},
					"defaultIcon": {
						"iconType": "LIBRARY_SAVED"
					},
					"defaultServiceEndpoint": {
						"likeEndpoint": {
							"status": "INDIFFERENT",
							"target": {
								"playlistId": cacheItem.mfId
							}
						}
					},
					"toggledText": {
						"runs": [
							{
								"text": "Save album to library"
							}
						]
					},
					"toggledIcon": {
						"iconType": "LIBRARY_ADD"
					},
					"toggledServiceEndpoint": {
						"likeEndpoint": {
							"status": "LIKE",
							"target": {
								"playlistId": cacheItem.mfId
							}
						}
					}
				}
			};

			return {
				"toggleMenuServiceItemRenderer": {
					"defaultText": {
						"runs": [
							{
								"text": "Save album to library"
							}
						]
					},
					"defaultIcon": {
						"iconType": "LIBRARY_ADD"
					},
					"defaultServiceEndpoint": {
						"likeEndpoint": {
							"status": "LIKE",
							"target": {
								"playlistId": cacheItem.mfId
							}
						}
					},
					"toggledText": {
						"runs": [
							{
								"text": "Remove album from library"
							}
						]
					},
					"toggledIcon": {
						"iconType": "LIBRARY_SAVED"
					},
					"toggledServiceEndpoint": {
						"likeEndpoint": {
							"status": "INDIFFERENT",
							"target": {
								"playlistId": cacheItem.mfId
							}
						}
					}
				}
			};
		};

		if (this.UCacheItemIsSong(cacheItem)) {
			if (cacheItem.liked === "LIKE") return {
				"toggleMenuServiceItemRenderer": {
					"defaultText": {
						"runs": [
							{
								"text": "Remove from liked songs"
							}
						]
					},
					"defaultIcon": {
						"iconType": "UNFAVORITE"
					},
					"defaultServiceEndpoint": {
						
						"likeEndpoint": {
							"status": "INDIFFERENT",
							"target": {
								"videoId": cacheItem.id
							}
						}
					},
					"toggledText": {
						"runs": [
							{
								"text": "Add to liked songs"
							}
						]
					},
					"toggledIcon": {
						"iconType": "FAVORITE"
					},
					"toggledServiceEndpoint": {
						"likeEndpoint": {
							"status": "LIKE",
							"target": {
								"videoId": cacheItem.id
							}
						}
					}
				}
			};

			return { // ALSO DO THIS IF DISLIKED.
				"toggleMenuServiceItemRenderer": {
					"defaultText": {
						"runs": [
							{
								"text": "Add to liked songs"
							}
						]
					},
					"defaultIcon": {
						"iconType": "FAVORITE"
					},
					"defaultServiceEndpoint": {
						"likeEndpoint": {
							"status": "LIKE",
							"target": {
								"videoId": cacheItem.id
							}
						}
					},
					"toggledText": {
						"runs": [
							{
								"text": "Remove from liked songs"
							}
						]
					},
					"toggledIcon": {
						"iconType": "UNFAVORITE"
					},
					"toggledServiceEndpoint": {
						"likeEndpoint": {
							"status": "INDIFFERENT",
							"target": {
								"videoId": cacheItem.id
							}
						}
					}
				}
			};
		};
	};

	static UCreateWriteNoteMenuItemRenderer(videoId) {
		return {
			"menuServiceItemRenderer": {
				"text": {
					"runs": [
						{
							"text": "Write note"
						}
					]
				},
				"icon": {
					"cSvg": "note"
				},
				"serviceEndpoint": {
					"customEndpoint": {
						"action": "writeNotePopup",
						"videoId": videoId
					}
				}
			}
		};
	};

	static UCreateAddTagMenuItemRenderer(videoId) {
		console.log(videoId);
		return {
			"menuServiceItemRenderer": {
				"text": {
					"runs": [
						{
							"text": "Add tag"
						}
					]
				},
				"icon": {
					"cSvg": "tag"
				},
				"serviceEndpoint": {
					"customEndpoint": {
						"action": "addTagPopup",
						"videoId": videoId
					}
				}
			}
		};
	};


	static UBuildTwoRowItemRendererFromData(data) {
		return {				
			"musicTwoRowItemRenderer": {
				"thumbnailRenderer": {
					"musicThumbnailRenderer": {
						"thumbnail": {
							"thumbnails": [
								{
									"url": data.thumb,
									"width": UIMG_HEIGHT,
									"height": UIMG_HEIGHT
								}
							]
						},
						"thumbnailCrop": "MUSIC_THUMBNAIL_CROP_UNSPECIFIED",
						"thumbnailScale": "MUSIC_THUMBNAIL_SCALE_ASPECT_FILL"
					}
				},
				"aspectRatio": "MUSIC_TWO_ROW_ITEM_THUMBNAIL_ASPECT_RATIO_SQUARE",
				"title": {
					"runs": [
						{
							"text": data.name,
							"navigationEndpoint": this.UBuildEndpoint({
								browseId: data.id,
								navType: "browse"
							})
						}
					]
				},
				"subtitle": {
					"runs": [
						{
							"text": data.subType
						},
						{
							"text": this.U_YT_DOT
						},
						{
							"text": data.year
						}
					]
				},
				"navigationEndpoint": this.UBuildEndpoint({
					browseId: data.id,
					navType: "browse"
				}),
				"menu": {
					"menuRenderer": {
						"items": [
							{
								"menuNavigationItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Shuffle play"
											}
										]
									},
									"icon": {
										"iconType": "MUSIC_SHUFFLE"
									},
									"navigationEndpoint": {
										"watchPlaylistEndpoint": {
											"playlistId": data.mfId,
											"params": this.U_SHUFFLE_PLAYER_PARAMS
										}
									}
								}
							},
							{
								"menuNavigationItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Start radio"
											}
										]
									},
									"icon": {
										"iconType": "MIX"
									},
									"navigationEndpoint": {
										"watchPlaylistEndpoint": {
											"playlistId": "RDAMPL" + data.mfId,
											"params": this.U_NORM_PLAYER_PARAMS
										}
									}
								}
							},
							{
								"menuServiceItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Play next"
											}
										]
									},
									"icon": {
										"iconType": "QUEUE_PLAY_NEXT"
									},
									"serviceEndpoint": {
										"queueAddEndpoint": {
											"queueTarget": {
												"playlistId": data.mfId,
												"onEmptyQueue": {
													"watchEndpoint": {
														"playlistId": data.mfId
													}
												}
											},
											"queueInsertPosition": "INSERT_AFTER_CURRENT_VIDEO",
											"commands": [
												{
													"addToToastAction": {
														"item": {
															"notificationTextRenderer": {
																"successResponseText": {
																	"runs": [
																		{
																			"text": "Album will play next"
																		}
																	]
																}
															}
														}
													}
												}
											]
										}
									}
								}
							},
							{
								"menuServiceItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Add to queue"
											}
										]
									},
									"icon": {
										"iconType": "ADD_TO_REMOTE_QUEUE"
									},
									"serviceEndpoint": {
										"queueAddEndpoint": {
											"queueTarget": {
												"playlistId": data.mfId,
												"onEmptyQueue": {
													"watchEndpoint": {
														"playlistId": data.mfId
													}
												}
											},
											"queueInsertPosition": "INSERT_AT_END",
											"commands": [
												{
													"addToToastAction": {
														"item": {
															"notificationTextRenderer": {
																"successResponseText": {
																	"runs": [
																		{
																			"text": "Album added to queue"
																		}
																	]
																}
															}
														}
													}
												}
											]
										}
									}
								}
							},
							UCreateToggleMenuItemForLikeButton(data),
							{
								"menuServiceItemDownloadRenderer": {
									"serviceEndpoint": {
										"offlinePlaylistEndpoint": {
											"playlistId": data.mfId,
											"action": "ACTION_ADD",
											"offlineability": {
												"offlineabilityRenderer": {
													"offlineable": true
												}
											},
											"onAddCommand": {
												"getDownloadActionCommand": {
													"playlistId": data.mfId,
													"params": "CAI%3D"
												}
											}
										}
									}
								}
							},
							{
								"menuNavigationItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Save to playlist"
											}
										]
									},
									"icon": {
										"iconType": "ADD_TO_PLAYLIST"
									},
									"navigationEndpoint": {
										"addToPlaylistEndpoint": {
											"playlistId": data.mfId
										}
									}
								}
							},
							{
								"menuNavigationItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Go to artist"
											}
										]
									},
									"icon": {
										"iconType": "ARTIST"
									},
									"navigationEndpoint": {
										"browseEndpoint": {
											"browseId": data.artist,
											"browseEndpointContextSupportedConfigs": {
												"browseEndpointContextMusicConfig": {
													"pageType": "MUSIC_PAGE_TYPE_ARTIST"
												}
											}
										}
									}
								}
							}
						],
						"accessibility": {
							"accessibilityData": {
								"label": "Action menu"
							}
						}
					}
				},
				"thumbnailOverlay": {
					"musicItemThumbnailOverlayRenderer": {
						"background": {
							"verticalGradient": {
								"gradientLayerColors": [
									"2147483648",
									"0",
									"0"
								]
							}
						},
						"content": {
							"musicPlayButtonRenderer": {
								"playNavigationEndpoint": {
									"watchEndpoint": {
										"playlistId": data.mfId,
										"watchEndpointMusicSupportedConfigs": {
											"watchEndpointMusicConfig": {
												"musicVideoType": "MUSIC_VIDEO_TYPE_ATV"
											}
										}
									}
								},
								"playIcon": {
									"iconType": "PLAY_ARROW"
								},
								"pauseIcon": {
									"iconType": "PAUSE"
								},
								"iconColor": 4294967295,
								"backgroundColor": 2566914048,
								"activeBackgroundColor": 4278190080,
								"loadingIndicatorColor": 14745645,
								"playingIcon": {
									"iconType": "VOLUME_UP"
								},
								"iconLoadingColor": 1308622847,
								"activeScaleFactor": 1.2,
								"buttonSize": "MUSIC_PLAY_BUTTON_SIZE_MEDIUM",
								"rippleTarget": "MUSIC_PLAY_BUTTON_RIPPLE_TARGET_SELF",
								"accessibilityPlayData": {
									"accessibilityData": {
										"label": "Play " + data.name
									}
								},
								"accessibilityPauseData": {
									"accessibilityData": {
										"label": "Pause " + data.name
									}
								}
							}
						},
						"contentPosition": "MUSIC_ITEM_THUMBNAIL_OVERLAY_CONTENT_POSITION_BOTTOM_RIGHT",
						"displayStyle": "MUSIC_ITEM_THUMBNAIL_OVERLAY_DISPLAY_STYLE_HOVER"
					}
				}
			}
		}
	};

	static UModifyListItemRendererFromDataForAlbumPage(replacement, realAlbum, current) {
		// realAlbum is the album we've navigated to. replacement.from is where the replacement came from (duh)
		// eg, realAlbum = deluxe, replacement.from = original.

		if (current.musicResponsiveListItemRenderer) current = current.musicResponsiveListItemRenderer;
		let playButton = this.UDigDict(current, this.UDictGet.playButtonFromLIRData);

		let vId = replacement.video.id;
		let setPlId = replacement.video.albumPlSetVideoId;

		// want to make play button work with playlistId being base, then adding extra from deluze version.
		// different relationship, dont want deluxe to be overwriting.

		playButton.playNavigationEndpoint.watchEndpoint.videoId = vId;
		if (setPlId) playButton.playNavigationEndpoint.watchEndpoint.playlistSetVideoId = setPlId;

		if (replacement.from.private === true) playButton.playNavigationEndpoint.watchEndpoint.watchEndpointMusicSupportedConfigs.watchEndpointMusicConfig.musicVideoType = "MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK";
		else playButton.playNavigationEndpoint.watchEndpoint.playlistId = replacement.from.mfId; // keep this, want to play from the main versions!!

		playButton.accessibilityPlayData.accessibilityData.label = "Play " + replacement.video.name;
		playButton.accessibilityPauseData.accessibilityData.label = "Pause " + replacement.video.name;

		current.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text = replacement.video.name;
		current.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].navigationEndpoint.watchEndpoint = playButton.playNavigationEndpoint.watchEndpoint;

		current.fixedColumns[0].musicResponsiveListItemFixedColumnRenderer.text.runs[0].text = this.USecondsToLengthStr(replacement.video.lengthSec);
		current.fixedColumns[0].musicResponsiveListItemFixedColumnRenderer.text.accessibility.accessibilityData.label = this.USecondsToLengthStr(replacement.video.lengthSec, true);

		current.menu.menuRenderer.items = [
			{
				"menuServiceItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Play next"
							}
						]
					},
					"icon": {
						"iconType": "QUEUE_PLAY_NEXT"
					},
					"serviceEndpoint": {
						"queueAddEndpoint": {
							"queueTarget": {
								"videoId": vId,
								"onEmptyQueue": {
									"watchEndpoint": {
										"videoId": vId
									}
								}
							},
							"queueInsertPosition": "INSERT_AFTER_CURRENT_VIDEO",
							"commands": [
								{
									"addToToastAction": {
										"item": {
											"notificationTextRenderer": {
												"successResponseText": {
													"runs": [
														{
															"text": "Song will play next"
														}
													]
												}
											}
										}
									}
								}
							]
						}
					}
				}
			},
			{
				"menuServiceItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Add to queue"
							}
						]
					},
					"icon": {
						"iconType": "ADD_TO_REMOTE_QUEUE"
					},
					"serviceEndpoint": {
						"queueAddEndpoint": {
							"queueTarget": {
								"videoId": vId,
								"onEmptyQueue": {
									"watchEndpoint": {
										"videoId": vId
									}
								}
							},
							"queueInsertPosition": "INSERT_AT_END",
							"commands": [
								{
									"addToToastAction": {
										"item": {
											"notificationTextRenderer": {
												"successResponseText": {
													"runs": [
														{
															"text": "Song added to queue"
														}
													]
												}
											}
										}
									}
								}
							]
						}
					}
				}
			},
			{
				"menuServiceItemDownloadRenderer": {
					"serviceEndpoint": {
						"offlineVideoEndpoint": {
							"videoId": vId,
							"onAddCommand": {
								"getDownloadActionCommand": {
									"videoId": vId,
									"params": "CAI%3D"
								}
							}
						}
					}
				}
			},
			{
				"menuNavigationItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Save to playlist"
							}
						]
					},
					"icon": {
						"iconType": "ADD_TO_PLAYLIST"
					},
					"navigationEndpoint": {
						"addToPlaylistEndpoint": {
							"videoId": vId
						}
					}
				}
			},
			{
				"menuNavigationItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Go to original album"
							}
						]
					},
					"icon": {
						"iconType": "ALBUM"
					},
					"navigationEndpoint": this.UBuildEndpoint({
						navType: "browse",
						id: replacement.from.id
					})
				}
			},
			{
				"menuNavigationItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Go to artist"
							}
						]
					},
					"icon": {
						"iconType": "ARTIST"
					},
					"navigationEndpoint": this.UBuildEndpoint({
						navType: "browse",
						id: realAlbum.artist
					})
				}
			}
		];

		let l = current.menu.menuRenderer.topLevelButtons[0].likeButtonRenderer;

		if (l && l.likesAllowed) {
			l.likeStatus = replacement.video.liked;
			l.target.videoId = vId;
			l.serviceEndpoints[0].likeEndpoint.target.videoId = vId;
			l.serviceEndpoints[1].likeEndpoint.target.videoId = vId;
			l.serviceEndpoints[2].likeEndpoint.target.videoId = vId;
		};

		current.playlistItemData.videoId = vId;

		current.cData = replacement;

		return current;
	};

	static UModifyListItemRendererForAnyPage(storage, browsePageType, lir) {
		if (lir.musicResponsiveListItemRenderer) lir = lir.musicResponsiveListItemRenderer;

		lir.menu.menuRenderer.items.push(this.UCreateWriteNoteMenuItemRenderer(lir.playlistItemData.videoId));
		lir.menu.menuRenderer.items.push(this.UCreateAddTagMenuItemRenderer(lir.playlistItemData.videoId));

		if (browsePageType === "MUSIC_PAGE_TYPE_PLAYLIST") {
			let id = lir.playlistItemData?.videoId;
			if (!id) return lir;

			let cacheThis = storage.cache[id];
			if (!cacheThis.album || (cacheThis.artists || []).length === 0) return lir;

			let customisationAlbum = storage.customisation.metadata[cacheThis.album] || {};
			let artistId = customisationAlbum.artist || (cacheThis.type === "MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK") ? (storage.cache[cacheThis.artists[0]].privateCounterparts[0]) : cacheThis.artists[0];
			let customisationArtist = storage.customisation.metadata[artistId] || {};

			let artistCache = storage.cache[artistId];

			if (customisationAlbum.thumb) {
				lir.thumbnail.musicThumbnailRenderer = {
					"thumbnail": {
						"thumbnails": [
							{
								"url": customisationAlbum.thumb,
								"width": this.UIMG_HEIGHT,
								"height": this.UIMG_HEIGHT
							}
						]
					},
					"thumbnailCrop": "MUSIC_THUMBNAIL_CROP_UNSPECIFIED",
					"thumbnailScale": "MUSIC_THUMBNAIL_SCALE_ASPECT_FIT"
				};
			};

			if (customisationAlbum.title) lir.flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text = customisationAlbum.title;

			lir.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs = [{
				text: customisationArtist.name || artistCache.name,
				navigationEndpoint: this.UBuildEndpoint({navType: "browse", id: artistId})
			}];

			// TODO: CHECK THESE WORK WHEN ADDING ARTIST CUSTOMISATIOn
			// TODO: ADD DEFINING EXPLICIT SONGS
			// TODO customisationSong FOR SONG NAME ETCs
		};

		return lir;
	};

	static UModifyPlaylistPanelRendererFromData(current, replacement, realAlbum, artist) {
		let vId = replacement.video.id;
		let plSetId = replacement.video.albumPlSetVideoId;

		current.title.runs[0].text = replacement.video.name;

		// no longer run editlongbyline, so do here
		current.longBylineText.runs = this.UCreateLongBylineForPlaylistPanel(replacement, realAlbum, artist);

		current.thumbnail = {
			thumbnails: [
				{ url: replacement.from.thumb, width: this.UIMG_HEIGHT, height: this.UIMG_HEIGHT }
			]
		};
		
		current.lengthText.runs[0].text = this.USecondsToLengthStr(replacement.video.lengthSec);
		current.lengthText.accessibility.accessibilityData.label = this.USecondsToLengthStr(replacement.video.lengthSec, true);

		let we = current.navigationEndpoint.watchEndpoint;
		we.videoId = vId;
		we.watchEndpointMusicSupportedConfigs.watchEndpointMusicConfig.musicVideoType = (realAlbum.private === true) ? "MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK" : "MUSIC_VIDEO_TYPE_ATV";
		if (plSetId) we.playlistSetVideoId = plSetId;

		current.videoId = vId;
		current.queueNavigationEndpoint.queueAddEndpoint.videoId = vId;

		current.menu.menuRenderer.items = [
			{
				"menuServiceItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Play next"
							}
						]
					},
					"icon": {
						"iconType": "QUEUE_PLAY_NEXT"
					},
					"serviceEndpoint": {
						"queueAddEndpoint": {
							"queueTarget": {
								"videoId": vId,
								"onEmptyQueue": {
									"watchEndpoint": {
										"videoId": vId
									}
								},
								"backingQueuePlaylistId": current.queueNavigationEndpoint.queueAddEndpoint.queueTarget.backingQueuePlaylistId
							},
							"queueInsertPosition": "INSERT_AFTER_CURRENT_VIDEO",
							"commands": [
								{
									"addToToastAction": {
										"item": {
											"notificationTextRenderer": {
												"successResponseText": {
													"runs": [
														{
															"text": "Song will play next"
														}
													]
												}
											}
										}
									}
								}
							]
						}
					}
				}
			},
			{
				"menuServiceItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Add to queue"
							}
						]
					},
					"icon": {
						"iconType": "ADD_TO_REMOTE_QUEUE"
					},
					"serviceEndpoint": {
						"queueAddEndpoint": {
							"queueTarget": {
								"videoId": vId,
								"onEmptyQueue": {
									"watchEndpoint": {
										"videoId": vId
									}
								},
								"backingQueuePlaylistId": current.queueNavigationEndpoint.queueAddEndpoint.queueTarget.backingQueuePlaylistId
							},
							"queueInsertPosition": "INSERT_AT_END",
							"commands": [
								{
									"addToToastAction": {
										"item": {
											"notificationTextRenderer": {
												"successResponseText": {
													"runs": [
														{
															"text": "Song added to queue"
														}
													]
												}
											}
										}
									}
								}
							]
						}
					}
				}
			},
			this.UCreateToggleMenuItemForLikeButton(replacement.video),
			{
				"menuServiceItemDownloadRenderer": {
					"serviceEndpoint": {
						"offlineVideoEndpoint": {
							"videoId": vId,
							"onAddCommand": {
								"getDownloadActionCommand": {
									"videoId": vId,
									"params": "CAI%3D"
								}
							}
						}
					}
				}
			},
			{
				"menuNavigationItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Save to playlist"
							}
						]
					},
					"icon": {
						"iconType": "ADD_TO_PLAYLIST"
					},
					"navigationEndpoint": {
						"addToPlaylistEndpoint": {
							"videoId": vId
						}
					}
				}
			},
			{
				"menuServiceItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Remove from queue"
							}
						]
					},
					"icon": {
						"iconType": "REMOVE"
					},
					"serviceEndpoint": {
						"removeFromQueueEndpoint": {
							"videoId": vId,
							"commands": [
								{
									"addToToastAction": {
										"item": {
											"notificationTextRenderer": {
												"successResponseText": {
													"runs": [
														{
															"text": "Item removed from queue"
														}
													]
												}
											}
										}
									}
								}
							]
						}
					}
				}
			},
			{
				"menuNavigationItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Go to album"
							}
						]
					},
					"icon": {
						"iconType": "ALBUM"
					},
					"navigationEndpoint": this.UBuildEndpoint({
						navType: "browse",
						id: replacement.from.id
					})
				}
			},
			{
				"menuNavigationItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Go to artist"
							}
						]
					},
					"icon": {
						"iconType": "ARTIST"
					},
					"navigationEndpoint": this.UBuildEndpoint({
						navType: "browse",
						id: artist.id
					})
				}
			},
			{
				"menuServiceItemRenderer": {
					"text": {
						"runs": [
							{
								"text": "Dismiss queue"
							}
						]
					},
					"icon": {
						"iconType": "DISMISS_QUEUE"
					},
					"serviceEndpoint": {
						"deletePlaylistEndpoint": {
							"playlistId": current.queueNavigationEndpoint.queueAddEndpoint.queueTarget.backingQueuePlaylistId,
							"command": {
								"dismissQueueCommand": {}
							}
						}
					}
				}
			}
		];

		return current;
	};

	static UModifyPlaylistPanelRendererNotReplacement(storage, videoId, ppr) {
		if (lir.musicResponsiveListItemRenderer) lir = lir.musicResponsiveListItemRenderer;

		lir.menu.menuRenderer.items.push(this.UCreateWriteNoteMenuItemRenderer(lir.playlistItemData.videoId));
		lir.menu.menuRenderer.items.push(this.UCreateAddTagMenuItemRenderer(lir.playlistItemData.videoId));

		let id = lir.playlistItemData?.videoId;
		if (!id) return;

		let cacheThis = storage.cache[id];
		if (!cacheThis.album || (cacheThis.artists || []).length === 0) return;

		let customisationAlbum = storage.customisation.metadata[cacheThis.album] || {};
		let artistId = customisationAlbum.artist || (cacheThis.type === "MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK") ? (storage.cache[cacheThis.artists[0]].privateCounterparts[0]) : cacheThis.artists[0];
		let customisationArtist = storage.customisation.metadata[artistId] || {};

		let artistCache = storage.cache[artistId];

		if (customisationAlbum.thumb) {
			lir.thumbnail.musicThumbnailRenderer = {
				"thumbnail": {
					"thumbnails": [
						{
							"url": customisationAlbum.thumb,
							"width": this.UIMG_HEIGHT,
							"height": this.UIMG_HEIGHT
						}
					]
				},
				"thumbnailCrop": "MUSIC_THUMBNAIL_CROP_UNSPECIFIED",
				"thumbnailScale": "MUSIC_THUMBNAIL_SCALE_ASPECT_FIT"
			};
		};

		if (customisationAlbum.title) lir.flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text = customisationAlbum.title;

		lir.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs = [{
			text: customisationArtist.name || artistCache.name,
			navigationEndpoint: this.UBuildEndpoint({navType: "browse", id: artistId})
		}];

		// TODO: CHECK THESE WORK WHEN ADDING ARTIST CUSTOMISATIOn
		// TODO: ADD DEFINING EXPLICIT SONGS
		// TODO customisationSong FOR SONG NAME ETCs
	};

	static UBuildListItemRendererFromDataForAlbumPage(replacement, realAlbum) {
		let video = replacement.video;

		let index = Number(video.index);
		if (index !== 0) index --;

		let playEndp = this.UBuildEndpoint({
			navType: "watch",
			playlistId: realAlbum.mfId,
			firstVideo: video,
			index: index, // zero base index. TODO IS THIS THE ISSUE
			playlistSetVideoId: video.albumPlSetVideoId
		});

		return {
			musicResponsiveListItemRenderer: {
				overlay: {
					musicItemThumbnailOverlayRenderer: {
						background: { verticalGradient: { gradientLayerColors: ["0", "0"] } },
						content: {
							"musicPlayButtonRenderer": {
								"playNavigationEndpoint": playEndp,
								"playIcon": {
									"iconType": "PLAY_ARROW"
								},
								"pauseIcon": {
									"iconType": "PAUSE"
								},
								"iconColor": 4294967295,
								"backgroundColor": 0,
								"activeBackgroundColor": 0,
								"loadingIndicatorColor": 14745645,
								"playingIcon": {
									"iconType": "VOLUME_UP"
								},
								"iconLoadingColor": 0,
								"activeScaleFactor": 1,
								"buttonSize": "MUSIC_PLAY_BUTTON_SIZE_SMALL",
								"rippleTarget": "MUSIC_PLAY_BUTTON_RIPPLE_TARGET_SELF",
								"accessibilityPlayData": {
									"accessibilityData": {
										"label": "Play " + video.name
									}
								},
								"accessibilityPauseData": {
									"accessibilityData": {
										"label": "Pause " + video.name
									}
								}
							}
						},
						contentPosition: "MUSIC_ITEM_THUMBNAIL_OVERLAY_CONTENT_POSITION_CENTERED",
						displayStyle: "MUSIC_ITEM_THUMBNAIL_OVERLAY_DISPLAY_STYLE_PERSISTENT"
					}
				},
				flexColumns: [
					{
						musicResponsiveListItemFlexColumnRenderer: {
							text: {
								runs: [{
									text: video.name,
									navigationEndpoint: playEndp
								}]
							},
							displayPriority: "MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH"
						}
					},
					{
						musicResponsiveListItemFlexColumnRenderer: {
							text: {},
							displayPriority: "MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH"
						}
					},
					{
						musicResponsiveListItemFlexColumnRenderer: {
							text: {
								runs: [{
									text: this.UBigNumToText(video.views) + " plays"
								}]
							},
							displayPriority: "MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH"
						}
					}
				],
				fixedColumns: [
					{
						musicResponsiveListItemFixedColumnRenderer: {
							text: {
								runs: [{
									text: this.USecondsToLengthStr(video.lengthSec)
								}],
								accessibility: {
									accessibilityData: {
										label: this.USecondsToLengthStr(video.lengthSec, true, true)
									}
								}
							},
							displayPriority: "MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH",
							size: "MUSIC_RESPONSIVE_LIST_ITEM_FIXED_COLUMN_SIZE_SMALL"
						}
					}
				],
				"menu": {
					"menuRenderer": {
						"items": [
							{
								"menuServiceItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Play next"
											}
										]
									},
									"icon": {
										"iconType": "QUEUE_PLAY_NEXT"
									},
									"serviceEndpoint": {
										"queueAddEndpoint": {
											"queueTarget": {
												"videoId": video.id,
												"onEmptyQueue": {
													"watchEndpoint": {
														"videoId": video.id
													}
												}
											},
											"queueInsertPosition": "INSERT_AFTER_CURRENT_VIDEO",
											"commands": [
												{
													"addToToastAction": {
														"item": {
															"notificationTextRenderer": {
																"successResponseText": {
																	"runs": [
																		{
																			"text": "Song will play next"
																		}
																	]
																}
															}
														}
													}
												}
											]
										}
									}
								}
							},
							{
								"menuServiceItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Add to queue"
											}
										]
									},
									"icon": {
										"iconType": "ADD_TO_REMOTE_QUEUE"
									},
									"serviceEndpoint": {
										"queueAddEndpoint": {
											"queueTarget": {
												"videoId": video.id,
												"onEmptyQueue": {
													"watchEndpoint": {
														"videoId": video.id
													}
												}
											},
											"queueInsertPosition": "INSERT_AT_END",
											"commands": [
												{
													"addToToastAction": {
														"item": {
															"notificationTextRenderer": {
																"successResponseText": {
																	"runs": [
																		{
																			"text": "Song added to queue"
																		}
																	]
																}
															}
														}
													}
												}
											]
										}
									}
								}
							},
							{
								"menuServiceItemDownloadRenderer": {
									"serviceEndpoint": {
										"offlineVideoEndpoint": {
											"videoId": video.id,
											"onAddCommand": {
												"getDownloadActionCommand": {
													"videoId": video.id,
													"params": "CAI%3D"
												}
											}
										}
									}
								}
							},
							{
								"menuNavigationItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Save to playlist"
											}
										]
									},
									"icon": {
										"iconType": "ADD_TO_PLAYLIST"
									},
									"navigationEndpoint": {
										"addToPlaylistEndpoint": {
											"videoId": video.id
										}
									}
								}
							},
							{
								"menuNavigationItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Go to album"
											}
										]
									},
									"icon": {
										"iconType": "ALBUM"
									},
									"navigationEndpoint": this.UBuildEndpoint({
										navType: "browse",
										id: replacement.from.id
									})
								}
							},
							{
								"menuNavigationItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Go to artist"
											}
										]
									},
									"icon": {
										"iconType": "ARTIST"
									},
									"navigationEndpoint": this.UBuildEndpoint({
										navType: "browse",
										id: realAlbum.artist
									})
								}
							}
						],
						"topLevelButtons": [
							{
								"likeButtonRenderer": {
									"target": {
										"videoId": video.id
									},
									"likeStatus": video.liked || "INDIFFERENT",
									"likesAllowed": true,
									"serviceEndpoints": [
										{
											"likeEndpoint": {
												"status": "LIKE",
												"target": {
													"videoId": video.id
												}
											}
										},
										{
											"likeEndpoint": {
												"status": "DISLIKE",
												"target": {
													"videoId": video.id
												}
											}
										},
										{
											"likeEndpoint": {
												"status": "INDIFFERENT",
												"target": {
													"videoId": video.id
												}
											}
										}
									]
								}
							}
						],
						"accessibility": {
							"accessibilityData": {
								"label": "Action menu"
							}
						}
					}
				},
				playlistItemData: {
					playlistSetVideoId: video.albumPlSetVideoId,
					videoId: video.id
				},
				itemHeight: "MUSIC_RESPONSIVE_LIST_ITEM_HEIGHT_MEDIUM",
				index: {
					runs: [ { text: String(video.index) } ]
				}
			}
		};
	};

	static UBuildPlaylistPanelRendererFromData(replacement, realAlbum, artist, queuePlaylistId) {
		// realAlbum is the album we've navigated to. replacement.from is where the replacement came from (duh)

		let video = replacement.video;

		let index = Number(video.index);
		if (index !== 0) index --;

		return {
			"playlistPanelVideoRenderer": {
				"title": {
					"runs": [
						{
							"text": video.name
						}
					]
				},
				"longBylineText": {
					"runs": this.UCreateLongBylineForPlaylistPanel(replacement, realAlbum, artist)
				},
				"thumbnail": {
					"thumbnails": [
						{
							"url": this.UUpscaleThumbQualityStr(replacement.from.thumb),
							"width": this.UIMG_HEIGHT,
							"height": this.UIMG_HEIGHT
						}
					]
				},
				"lengthText": {
					"runs": [
						{
							"text": this.USecondsToLengthStr(video.lengthSec)
						}
					],
					"accessibility": {
						"accessibilityData": {
							"label": this.USecondsToLengthStr(video.lengthSec, true, true)
						}
					}
				},
				"selected": false,
				"navigationEndpoint": {
					"watchEndpoint": {
						"videoId": video.id,
						"playlistId": realAlbum.mfId,
						"index": index,
						"playlistSetVideoId": video.albumPlSetVideoId,
						"watchEndpointMusicSupportedConfigs": {
							"watchEndpointMusicConfig": {
								"hasPersistentPlaylistPanel": true,
								"musicVideoType": (realAlbum.private) ? "MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK" : "MUSIC_VIDEO_TYPE_ATV"
							}
						}
					}
				},
				"videoId": video.id,
				"shortBylineText": {
					"runs": [
						{
							"text": artist.name
						}
					]
				},
				"menu": {
					"menuRenderer": {
						"items": [
							{
								"menuServiceItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Play next"
											}
										]
									},
									"icon": {
										"iconType": "QUEUE_PLAY_NEXT"
									},
									"serviceEndpoint": {
										"queueAddEndpoint": {
											"queueTarget": {
												"videoId": video.id,
												"onEmptyQueue": {
													"watchEndpoint": {
														"videoId": video.id
													}
												},
												"backingQueuePlaylistId": queuePlaylistId
											},
											"queueInsertPosition": "INSERT_AFTER_CURRENT_VIDEO",
											"commands": [
												{
													"addToToastAction": {
														"item": {
															"notificationTextRenderer": {
																"successResponseText": {
																	"runs": [
																		{
																			"text": "Song will play next"
																		}
																	]
																}
															}
														}
													}
												}
											]
										}
									}
								}
							},
							{
								"menuServiceItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Add to queue"
											}
										]
									},
									"icon": {
										"iconType": "ADD_TO_REMOTE_QUEUE"
									},
									"serviceEndpoint": {
										"queueAddEndpoint": {
											"queueTarget": {
												"videoId": video.id,
												"onEmptyQueue": {
													"watchEndpoint": {
														"videoId": video.id
													}
												},
												"backingQueuePlaylistId": queuePlaylistId
											},
											"queueInsertPosition": "INSERT_AT_END",
											"commands": [
												{
													"addToToastAction": {
														"item": {
															"notificationTextRenderer": {
																"successResponseText": {
																	"runs": [
																		{
																			"text": "Song added to queue"
																		}
																	]
																}
															}
														}
													}
												}
											]
										}
									}
								}
							},
							this.UCreateToggleMenuItemForLikeButton(video),
							{
								"menuServiceItemDownloadRenderer": {
									"serviceEndpoint": {
										"offlineVideoEndpoint": {
											"videoId": video.id,
											"onAddCommand": {
												"getDownloadActionCommand": {
													"videoId": video.id,
													"params": "CAI%3D"
												}
											}
										}
									}
								}
							},
							{
								"menuNavigationItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Save to playlist"
											}
										]
									},
									"icon": {
										"iconType": "ADD_TO_PLAYLIST"
									},
									"navigationEndpoint": {
										"addToPlaylistEndpoint": {
											"videoId": video.id
										}
									}
								}
							},
							{
								"menuServiceItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Remove from queue"
											}
										]
									},
									"icon": {
										"iconType": "REMOVE"
									},
									"serviceEndpoint": {
										"removeFromQueueEndpoint": {
											"videoId": video.id,
											"commands": [
												{
													"addToToastAction": {
														"item": {
															"notificationTextRenderer": {
																"successResponseText": {
																	"runs": [
																		{
																			"text": "Item removed from queue"
																		}
																	]
																}
															}
														}
													}
												}
											]
										}
									}
								}
							},
							{
								"menuNavigationItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Go to album"
											}
										]
									},
									"icon": {
										"iconType": "ALBUM"
									},
									"navigationEndpoint": this.UBuildEndpoint({
										navType: "browse",
										id: replacement.from.id
									}),
								}
							},
							{
								"menuNavigationItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Go to artist"
											}
										]
									},
									"icon": {
										"iconType": "ARTIST"
									},
									"navigationEndpoint": this.UBuildEndpoint({
										navType: "browse",
										id: artist.id
									})
								}
							},
							{
								"menuServiceItemRenderer": {
									"text": {
										"runs": [
											{
												"text": "Dismiss queue"
											}
										]
									},
									"icon": {
										"iconType": "DISMISS_QUEUE"
									},
									"serviceEndpoint": {
										"deletePlaylistEndpoint": {
											"playlistId": queuePlaylistId,
											"command": {
												"dismissQueueCommand": {}
											}
										}
									}
								}
							}
						],
						"accessibility": {
							"accessibilityData": {
								"label": "Action menu"
							}
						}
					}
				},
				"playlistSetVideoId": video.albumPlSetVideoId,
				"canReorder": true,
				"queueNavigationEndpoint": {
					"queueAddEndpoint": {
						"queueTarget": {
							"videoId": video.id,
							"backingQueuePlaylistId": queuePlaylistId
						},
						"queueInsertPosition": "INSERT_AT_END"
					}
				},
				cData: replacement
			}
		}
	};


	static UAddEditButtonsToListItemPage(browsePage, purpose, icon, onClick) {
		browsePage.setAttribute("c-editing", purpose);

		let iconElem = this.UGetSVGFromRaw(icon, true, false);
		this.UAddToClass(iconElem, "c-edit-btn");

		for (let item of browsePage.querySelectorAll(U_HELPFUL_QUERIES.listItemRenderersOfCurrentBrowseResponse)) {
			let newButton = iconElem.cloneNode(true);
			
			let fixedCols = item.querySelector("div.fixed-columns");
			if (fixedCols) fixedCols.append(newButton);

			let videoId = this.UDigDict(item, this.UDictGet.videoIdFromLIRElem);

			if (videoId) newButton.onclick = () => onClick(item, videoId);
		};
	};

	static UAddSkipIconsToListItems(listItems) {
		for (let item of listItems) {
			let isSkipped = item.getAttribute("c-skipped");
			if (!isSkipped) continue;

			item.setAttribute("c-skipped", "true");
			item.setAttribute("unplayable", "true");

			let icon = this.UGetSVGFromRaw("no-circle", true, false);
			this.UAddToClass(icon, "c-skip-icon");

			item.querySelector(".left-items").append(icon);
		};
	};

	static UAddTitleIconToListItem(listItem, svgName, elemClass, thisData) {
		console.log("TITLEICON LISTITEM", listItem);
		let appendAt = listItem.querySelector(".flex-columns .title-column yt-formatted-string.title");
		
		let svg = this.UGetSVGFromRaw(svgName, false, false);
		this.UAddToClass(svg, elemClass);

		if (svgName === "tag") svg.style.fill = thisData.colour;
		appendAt.append(svg);

		svg.onmouseenter = function() {
			for (let elem of listItem.querySelectorAll(".secondary-flex-columns yt-formatted-string")) {
				UHideElem(elem);
			};

			let newText = document.createElement("a");
			let cData = UDigDict(listItem, UDictGet.cDataFromElem);

			newText.textContent = (svgName === "note") ? cData.customNote :
				(svgName === "tag") ? thisData.text :
				undefined;
			
			
			
			newText.setAttribute("class", "c-lir-subtitle");
			listItem.querySelector(".secondary-flex-columns").append(newText);
		};

		svg.onmouseleave = function() {
			for (let elem of listItem.querySelectorAll(".secondary-flex-columns yt-formatted-string")) {
				UUnHideElem(elem);
			};

			listItem.querySelector(".c-lir-subtitle").remove();
		};
	};

	static UAddTitleIconsToListItems(listItems) {
		console.log("TITLEICON LISTITEMS", listItems);
		for (let item of listItems) {
			let data = UDigDict(item, this.UDictGet.cDataFromElem);
			if (!data) continue;

			if (data.customNote && !item.querySelector(".c-lir-title-note")) {
				this.UAddTitleIconToListItem(item, "note", "c-lir-title-note");
			};
			
			for (let tag of (data.tags || [])) {
				this.UAddTitleIconToListItem(item, "tag", "c-lir-title-tag", tag);
			};
		};
	};


	static UFillCDataOfListItem(storage, lir, data) {
		if (lir.musicResponsiveListItemRenderer) lir = lir.musicResponsiveListItemRenderer;

		if (!lir.cData) lir.cData = {};
		
		lir.cData.customNote = storage.customisation.notes[data.id];
		lir.cData.tags = (storage.customisation.tags.videos[data.id] || []).map(v => storage.customisation.tags.tags[v]);

	};

	static UEndListItemPageEditMode(browsePage) {
		browsePage.removeAttribute("c-editing");

		for (let item of browsePage.querySelectorAll(".c-edit-btn")) {
			item.remove();
		};

		let listItems = browsePage.querySelectorAll(U_HELPFUL_QUERIES.listItemRenderersOfCurrentBrowseResponse);

		let indexCount = 0;
		for (let item of listItems) {
			let data = this.UDigDict(item, this.UDictGet.dataFromElem);
			if (!data) continue;			

			let isDeleted = this.UDigDict(data, this.UDictGet.cIsDeletedFromLIRData);
			if (isDeleted) continue;
			indexCount ++;

			data.index.runs[0].text = String(indexCount);

			let indexElem = item.querySelector("yt-formatted-string.index");
			if (indexElem) indexElem.textContent = String(indexCount);

			let thisIndex = Number(data.index.runs[0].text);
			if (thisIndex !== 0 && thisIndex !== indexCount) {
				if (!data.cData) data.cData = { changedByDeletion: {} };
				if (!data.cData.changedByDeletion) data.cData.changedByDeletion = {};

				data.cData.changedByDeletion.originalIndex = thisIndex;
				data.cData.changedByDeletion.updatedIndex = indexCount;
			};
		};

		this.UAddSkipIconsToListItems(listItems);
	};

	static UIsEntryPrivateSingle(storage, bId) {
		let cachedEntry = storage.cache[bId];
		if (!cachedEntry) return;

		if (!cachedEntry.private) return false;
		if (cachedEntry.items.length > 1) return false;

		let item = cachedEntry.items[0];
		let cachedItem = storage.cache[item];
		if (!cachedItem) return;

		if (cachedItem.name !== cachedEntry.name) return false;

		return true;
	};


	static UProcessSearchParams(urlString) {
		let queryIndex = urlString.indexOf("?");
		if (queryIndex === -1) return [urlString, {}];

		let queryString = urlString.slice(queryIndex + 1); // continues to end

		let matches = [...queryString.matchAll(/(.+?)\=(.+?)(?:&|$)/g)];
		matches = matches.map( v => v.slice(1) ); // remove first item (full match str), only want cap groups
		matches = Object.fromEntries(matches);

		return [urlString.slice(0, queryIndex), matches];
	};



	static UCreateTagSVG(text, col) {
		let head = this.UGetSVGFromRaw("c-tag-head", false, false);
		let body = this.UGetSVGFromRaw("c-")
	};


	static UPopupDeleteFolder(cont, folderName, folderId, folderElem) {
		let popup = UCreatePopup({
			title: {
				text: "Delete Folder",
				icon: "folder"
			},
			content: [{
				class: "c-popup-text-line",
				config: [
					["label", "innerHTML", `Are you sure you want to delete your folder "${folderName}"?<br/>Your playlists will not be deleted.`]
				]
			}],
			actions: [
				{
					icon: null,
					text: "Cancel",
					style: "text-only",
					defaultAction: "close"
				},
				{
					icon: null,
					text: "Confirm",
					style: "light"
				}
			]
		});

		popup.querySelector("#confirm").addEventListener("click", function(e) {
			// here, is easy to keep edit mode.
			// move all elems out of folder. insert above where folder was.
			let subElems = folderElem.querySelectorAll(".c-paper-folder-cont > *");

			for (let elem of subElems) {
				folderElem.parentElement.insertBefore(elem, folderElem);
				// will go in order, bcs folderElem keeps moving down.
				// no need to reverse. just remove folder after.
			};

			folderElem.remove();
			
			// send event to delete folder from storage
			// dispatch custom event, received by isolated contentscript, messaged to bkg
			UDispatchEventToEW({
				func: "sidebar-delete-folder",
				folderId: folderId
			});

			URemovePopup(popup, true);

			// save new order in separate event..
			setTimeout(function() {
				USaveNewOrder(cont);
			}, 500); // delay this, to ensure previous event happens first.
		});
	};

	static UPopupRename(paperWrapper) {
		function __RenameFolder() {
			return UCreatePopup({
				title: {
					text: "Edit Folder",
					icon: "pencil"
				},
				content: [
					{
						class: "c-text-input",
						config: [
							["label", "textContent", "Name"]
						]
					},
					{
						class: "c-text-input",
						id: "subtitle",
						config: [
							["label", "textContent", "Subtitle"]
						]
					},
					{
						class: "c-check-input",
						id: "def_subtitle",
						config: [
							["label", "textContent", "Reset to default"]
						]
					},
					{
						class: "c-text-input",
						id: "thumb",
						config: [
							["label", "textContent", "Icon"]
						]
					},
					{
						class: "c-check-input",
						id: "def_thumb",
						config: [
							["label", "textContent", "Reset to default"]
						]
					},
				],
				actions: [
					{
						icon: null,
						text: "Cancel",
						style: "text-only",
						defaultAction: "close"
					},
					{
						icon: null,
						text: "Submit",
						style: "light"
					}
				]
			});
		};


		const plId = paperWrapper.getAttribute("plId");
		let popup = __RenameFolder();

		for (let check of popup.querySelectorAll(".c-check-input")) {
			let id = check.getAttribute("id").replace("def_", "");
			let textInput = popup.querySelector(`#${id}`);

			check.addEventListener("change", function(e) {
				if (e.target.checked) UAddToClass(textInput, "c-uninteractable");
				else URemoveFromClass(textInput, "c-uninteractable");
			});
		};
		
		popup.querySelector("#submit").addEventListener("click", function(e) {
			let data = {};

			for (let text of popup.querySelectorAll(".c-text-input")) {
				let id = text.getAttribute("id");
				let reset = popup.querySelector(`.c-check-input#def_${id} input`).checked;

				if (reset) {
					data["reset_" + id] = true;
					continue;
				};

				let value = text.querySelector("input").value;
				if (value !== "") data[id] = value;
			};

			UDispatchEventToEW({
				func: "sidebar-rename-folder",
				editInfo: data,
				plId: plId
			});

			URemovePopup(popup, true);
			paperWrapper.querySelector(".c-paper-title").textContent = titleVal;
			paperWrapper.querySelector(".c-paper-subtitle").textContent = subVal;
			
		});	
	};

	static FunctionToString(f, property) {
		// String(function) of a class does not give "function" statement
		// so we need to put in ourselves
		let functionString = String(f);

		// new method defines functions globally within window
		// we now run eval() on 'window["property"] = function() {...}'
		let functionPrefix;

		if (functionString.startsWith("async")) {
			functionPrefix = "async function";
		} else {
			functionPrefix = "function";
		};

		let openBracketIndex = functionString.indexOf("("); // get where function starts in string
		let actualFunction = functionString.slice(openBracketIndex, functionString.length); // remove start of string

		functionString = `window["${property}"] = ${functionPrefix}${actualFunction}`;
		
		return functionString;
	};

	// convert the Utils class into a string we can use to pass down to other worlds.
	// returns a dict.
	static toString() {
		// get prototype of this and list properties
		let defaultProperties = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).concat(EXTRA_PROPERTIES_TO_IGNORE); 
		let allProperties = Object.getOwnPropertyNames(this);
		let stringAble = {};

		for (let property of allProperties) {
			if (defaultProperties.indexOf(property) !== -1) continue; // eg prototype, name, length, constructor
			if (property.charAt(0) === "_") continue; // ignore internal/temp functions.

			let value = this[property];

			// basically just want to stringify functions, shouldnt have anything else
			// incompatible with structred clone alg
			if (typeof value !== "function") {
				stringAble[property] = value; //JSON.stringify(value);
			} else {
				let functionString = this.FunctionToString(value, property);
				functionString = functionString.replaceAll("this.",""); // for variables which will be made global

				stringAble[property] = functionString;
			};
		};

		return stringAble;
	};
};

export { Utils };