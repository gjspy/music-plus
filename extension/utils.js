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
			cache: {
				//playlists: {} // {PL123: "https.youtube.com/images/....?"}
			},

			syncEnabled: true,
			syncContents: {}
		},
		
		sync: {
			config:{
				masterToggle: true
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
				},
				fakeNames: {}
			},

			bannedSongsIds: []
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
			artists: [],
			liked: "",
			lengthSec: -1,
			id: "",
			badges: [],
			type: "",
			views: 0
		},
		USER_CHANNEL: {
			name: "",
			id: "",
			type: "USER_CHANNEL"
		},
		UNKNOWN: {

		}

	};

	static U_VARIOUS_ARTISTS = "Various Artists";
	static U_VARIOUS_ARTISTS_EXTID = "VARIOUS";

	static UDEFAULT_STORAGE = Object.assign({}, this.U_REAL_DEFAULT_STORAGE.sync, this.U_REAL_DEFAULT_STORAGE.local);

	static UGeneralCustomEventMWToEW = "extGeneralCustomEventMWToEW";
	static UGeneralCustomEventEWToMW = "extGeneralCustomEventEWToMW";
	static UEventFuncForSidebarUpdate = "sidebar-or-cache-update";

	static UTemplateElementsStrings = {};
	static _UTemplateElementsFP = "../myTemplateElements.html";

	static UMAX_EXECUTION_TIMEOUT = 10000; // ms, used for script injection timeout
	static UMAX_WAITFOR_TIMEOUT = 5000; // ms, used for WaitForbySelector

	static U_YT_FAVICON = "https://music.youtube.com/img/cairo/favicon_144.png";
	static UIMG_HEIGHT = 544;

	//static U_YT_BADGE_ORDER = ["MUSIC_EXPLICIT_BADGE"];
	static U_TIME_WORDS = ["hour", "minute", "second"];
	static U_YT_DOT = " • ";

	static UBrowseParamsByRequest = {};

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

	static async UWaitForBySelector(selector, obj) {
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

		return Promise.race([
			new Promise(Waiter),
			new Promise(Timeouter)
		]);
	};



	// recursively check that every dir has the keys it should
	static UCheckHasKeys(cont, shouldHave) {
		let shouldHaveKeys = Object.keys(shouldHave);
		shouldHave = structuredClone(shouldHave);

		// check has all keys, add default vals if not
		for (let k of shouldHaveKeys) {
			if (cont[k]) { // does have
				if (typeof(cont[k]) === "object") { // has children
					cont[k] = this.UCheckHasKeys(cont[k], shouldHave[k]); // check children
				};

				continue;
			};

			cont[k] = shouldHave[k]; // does not have.
		};

		// remove keys we no longer need
		// this happens every layer, so shouldnt have to do more recursion
		// D U M B: obvs this wll remove stuff we need like folderinfo!!!
		/*for (let k of Object.keys(cont)) {
			if (shouldHaveKeys.indexOf(k) !== -1) continue;

			delete cont[k];
		};*/

		return cont;
	};

	static async UStorageGetRaw() {
		return {
			grabbedFromLocal: (await browser.storage.local.get()),
			grabbedFromSync: (await browser.storage.sync.get())
		};
	};

	static async UStorageGet() {
		let storageLocal = await browser.storage.local.get();
		let storageSync = await browser.storage.sync.get();

		let storage = Object.assign({}, storageLocal, storageSync);

		let storageKeys = Object.keys(storage);
		
		if (storageKeys.length === 0) {
			storage = this.UDEFAULT_STORAGE;

		} else {
			storage = this.UCheckHasKeys(storage, this.UDEFAULT_STORAGE);
		};

		if (storage["syncEnabled"] === false) {
			let syncContents = structuredClone(storageLocal.syncContents);
			delete storageLocal.syncContents

			storage = Object.assign(storageLocal, syncContents);
			storage = _CheckHasKeys(storage, this.UDEFAULT_STORAGE);
		};
	
		return storage;
	};

	static async UStorageClean(beDangerous, storageLocal, storageSync) {
		// cleans top level of storage to remove inconsistency.
		// using beDangerous is only done manually, otherwise is used to strip from setting bad values.
		// this function does not set values, just returns a cleaned up version,
		// and clears old storage if beDagnerous.

		let DEF_LOC_STO = Object.keys(this.U_REAL_DEFAULT_STORAGE.local);
		let DEF_SYN_STO = Object.keys(this.U_REAL_DEFAULT_STORAGE.sync);


		if (storageLocal === undefined || storageSync === undefined) {
			let storage = await this.UStorageGetRaw();

			if (storageLocal === undefined) { storageLocal = storage.grabbedFromLocal; };
			if (storageSync === undefined) { storageSync = storage.grabbedFromSync; };
		};
		

		if (beDangerous) {
			await browser.storage.local.clear();
			await browser.storage.sync.clear();
		};		

		for (let key of Object.keys(storageLocal)) {
			if (DEF_LOC_STO.indexOf(key) === -1 || DEF_SYN_STO.indexOf(key) !== -1) {
				delete storageLocal[key];
			};
		};

		for (let key of Object.keys(storageSync)) {
			if (DEF_SYN_STO.indexOf(key) === -1 || DEF_LOC_STO.indexOf(key) !== -1) {
				delete storageSync[key];
			};
		};

		return [storageLocal, storageSync];
	};

	static async UStorageSet(toSave) {
		

		let that = this;

		return new Promise(async function(resolve, reject) {
			let DEF_LOC_STO = that.U_REAL_DEFAULT_STORAGE.local;
			let DEF_SYN_STO = that.U_REAL_DEFAULT_STORAGE.sync;

			// when editing storage, local and sync are merged.
			// when setting, we need to separate them.
			let storageLocal = {};
			let storageSync = {};
	
			for (let key of Object.keys(DEF_LOC_STO)) { // match expected keys from local
				let val = toSave[key];
				if (!val) val = that.UDEFAULT_STORAGE[key];
	
				storageLocal[key] = val; // add to local
			};
	
			for (let key of Object.keys(DEF_SYN_STO)) { // match expected keys from sync
				let val = toSave[key];
				if (!val) val = that.UDEFAULT_STORAGE[key];
	
				storageSync[key] =  val; // add to sync
			};
	
	
			// StorageArea.clear() is dangerous, instead remove keys not wanted each time.
			// only .clear() manually for now.
	
			[storageLocal, storageSync] = await that.UStorageClean(false, storageLocal, storageSync);
	
			browser.storage.sync.set(storageSync).then(
				function() { // resolved
					storageLocal["syncEnabled"] = true;
					delete storageLocal["syncContents"];

					browser.storage.local.set(storageLocal);

					resolve("syncEnabled true");
				},
			
				function() { // rejected
					storageLocal["syncEnabled"] = false;
					storageLocal["syncContents"] = storageSync;

					browser.storage.local.set(storageLocal);

					resolve("syncEnabled false");
				}
			);
		});
	};


	static UGetUserAccountInfo() {
		if (!polymerController) this.UGetPolymerController();

		//try {			
			let juicyInfo = polymerController.accountService.cachedGetAccountMenuRequestPromise.result_.actions[0]. 
			openPopupAction.popup.multiPageMenuRenderer.header.activeAccountHeaderRenderer;		
	
			return {
				accountName: juicyInfo.accountName.runs[0].text,
				accountPhoto: juicyInfo.accountPhoto.thumbnails[0].url,
				channelHandle: juicyInfo.channelHandle.runs[0].text
			};

		//} catch (err) {
		//	console.warn("ERROR GRABBING ACCOUNTINFO:", err);

		//	return undefined;
		//};
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
	}

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

	static UCreateButton(icon, textContent, style) {
		let btn = document.createElement("div");
		btn.setAttribute("class", `${style} c-button`);
		btn.setAttribute("id", textContent.toLowerCase().replaceAll(" ","-"));

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

	static URemovePopup(popup) {
		this.URemoveFromClass(popup, "active");

		setTimeout(function() {
			popup.remove();
		}, 300);
	}

	// messy function, todo: clean, but it creates a popup :)
	static UCreatePopup(layout) {
		function _TextInputFloating(inputElem, label, underline) {
			if (inputElem.type !== "text") return;

			// move label when typing begins, move back if empty
			let isFocused = false;
			inputElem.addEventListener("input", function(event) {
				if (isFocused) {
					if (inputElem.value === "") { this.URemoveFromClass(label, "floating"); isFocused = false; }
					return;
				};

				this.UAddToClass(label, "floating");
				isFocused = true;
			});

			// show underline on click
			inputElem.addEventListener("focus", function(event) {
				this.UAddToClass(underline, "active");
			});

			// hide underline on focus loss
			inputElem.addEventListener("blur", function(event) {
				this.URemoveFromClass(underline, "active");
			});
		};


		if (Object.keys(this.UTemplateElementsStrings).length === 0) {
			console.error("UTILS CreatePopup called but TemplateElementsStrings does not exist.");
			return;
		};

		// create popup from template, by seting the (outer to maintain classnames)HTML of a new div.
		const mainTemplate = this.UTemplateElementsStrings["c-popup-bkg"]; // with OPACITY 1
		console.log(mainTemplate);

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
			const svg = this.UGetSVGFromRaw(layout.title.icon, false);

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
				return;
			};

			let rowClass = rowInfo.class;
			let rowElem = document.createElement("div");

			contentCont.append(rowElem);
			rowElem.outerHTML = this.UTemplateElementsStrings[rowClass];

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
		};

		const actionsCont = popup.querySelector(".c-popup-actions");

		for (let actionInfo of layout.actions) {
			const btn = this.UCreateButton(actionInfo.icon, actionInfo.text, actionInfo.style);
			actionsCont.append(btn);

			const defaultAction = actionInfo.defaultAction;

			if (defaultAction === "close") {
				btn.addEventListener("click", function(e) {
					this.URemovePopup(popup);
				});
			};
		};

		setTimeout(function() {
			this.UAddToClass(popup, "active");
		}, 50);

		return popup;
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

	static async UMWStorageGet(path) {
		// path: string . separated, eg sidebar.folders.folders

		let response = await this.UDispatchFunctionToEW({
			func: "get-storage",
			path: path
		});

		return response.storage;
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

	static UGetTotalSecondsOfList(cache, cachedList, includeOverwriteEdits) {
		let total = 0;

		for (let trackId of cachedList.items) {
			let track = cache[trackId];
			if (!track) continue;
			if (track.lengthSec === -1) continue;
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



	static UGetVideoRenderer(vr) {
		if (vr.playlistPanelVideoWrapperRenderer) {
			return vr.playlistPanelVideoWrapperRenderer.primaryRenderer
		};
		
		return vr;
	};

	static UGetBrowsePageTypeFromBrowseId(browseId, excludeCTypes, resultisImportant) {
		if (!browseId) browseId = "";

		if (!excludeCTypes) {

			if (browseId === "FEmusic_home") return "C_PAGE_TYPE_HOME";
			if (browseId.match(/privately_owned_release_detail/)) return "C_PAGE_TYPE_PRIVATE_ALBUM"; // NEED c_type because yt does not distinguish PRIVATE_ALBUM from ALBUM.
			if (browseId.match(/privately_owned_artist_detail/)) return "C_PAGE_TYPE_PRIVATE_ARTIST";

			if (browseId.match(/^UC/)) return "C_PAGE_TYPE_CHANNEL_OR_ARTIST"; // have tested, no way to tell.
		};

		

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

		if (resultisImportant) {
			if (browseId.match(/privately_owned_release_detail/)) return "MUSIC_PAGE_TYPE_ALBUM"; // NEED c_type because yt does not distinguish PRIVATE_ALBUM from ALBUM.
			if (browseId.match(/^VL/)) return "MUSIC_PAGE_TYPE_PLAYLIST";
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
			
			this.UBrowseParamsByRequest[id] = structuredClone(navigationEndpointOuterDict.cParams);
			delete navigationEndpointOuterDict.cParams;
		};

		if (navigationEndpointOuterDict.queueAddEndpoint) {
			if (!window.menuServiceItemBehaviour) this.UGetMenuServiceItemBehaviour();

			menuServiceItemBehaviour.handleCommand(navigationEndpointOuterDict);

			return;
		};


		polymerController.handleNavigateAction({
			navigateAction: {
				endpoint: navigationEndpointOuterDict
			}
		});

		
	};

	static UNavigateOnClick(elem, navigationEndpointOuterDict, excessFunc, excessParams, verifyFunc) {
		// "outerDict" = requires "endpoint type";

		elem.addEventListener("click", function(e) {
			console.log(elem, "CLICKED navigating to", navigationEndpointOuterDict, "and doing", excessFunc);

			e.preventDefault();
			e.stopImmediatePropagation();

			if (verifyFunc && verifyFunc(e) === false) {
				console.log("navevent cancelling due to negative result of verifyFunc");
				return;
			};

			if (excessFunc) excessFunc(...excessParams);

			UNavigate(navigationEndpointOuterDict);
		});
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

			if (opts.shuffle === true) v.watchEndpoint.params = "wAEB8gECKAE%3D";
			else v.watchEndpoint.params = "wAEB";

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
	};

	static USoftClearQueue() {
		c = this.UGetPolymerController();

		polymerController.store.dispatch({
			type: "CLEAR",
			payload: [
				polymerController.queue.getCurrentItemIndex()
			]
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
	}

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
}
//(?:(?:^.)\ ?)(?:.*\(\) *{)
//(?: |.+?)(?=.*\(\) *{)
export { Utils };
/*function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function a() {
  for (let o of document.querySelectorAll("svg >*")) {
      o.style.visibility = "hidden";
    };
  
    for (let o of document.querySelectorAll("svg >*")) {
      o.style.visibility = "visible";
      await timeout(3000);
      o.style.visibility = "hidden";
    };
}

let raw = {
			play: `<svg viewBox="0 0 24 24"><path d="M6,4l12,8L6,20V4z"/></svg>`,
			playing: `<svg viewBox="0 0 24 24"><path d="M17.5,12c0,2.14-1.5,3.92-3.5,4.38v-1.04c1.44-0.43,2.5-1.76,2.5-3.34c0-1.58-1.06-2.9-2.5-3.34V7.62 C16,8.08,17.5,9.86,17.5,12z M12,4.07v15.86L6.16,15H3V9h3.16L12,4.07z M11,6.22L6.52,10H4v4h2.52L11,17.78V6.22z M21,12 c0,4.08-3.05,7.44-7,7.93v-1.01c3.39-0.49,6-3.4,6-6.92s-2.61-6.43-6-6.92V4.07C17.95,4.56,21,7.92,21,12z"/></svg>`,
			paused: `<svg viewBox="0 0 24 24"><path d="M9,19H7V5H9ZM17,5H15V19h2Z"/></svg>`, // preserveAspectRatio="xMidYMid meet" focusable="false"<g>
			shuffle: `<svg viewBox="0 0 24 24"><path d="M18.15,13.65l3.85,3.85l-3.85,3.85l-0.71-0.71L20.09,18H19c-2.84,0-5.53-1.23-7.39-3.38l0.76-0.65 C14.03,15.89,16.45,17,19,17h1.09l-2.65-2.65L18.15,13.65z M19,7h1.09l-2.65,2.65l0.71,0.71l3.85-3.85l-3.85-3.85l-0.71,0.71 L20.09,6H19c-3.58,0-6.86,1.95-8.57,5.09l-0.73,1.34C8.16,15.25,5.21,17,2,17v1c3.58,0,6.86-1.95,8.57-5.09l0.73-1.34 C12.84,8.75,15.79,7,19,7z M8.59,9.98l0.75-0.66C7.49,7.21,4.81,6,2,6v1C4.52,7,6.92,8.09,8.59,9.98z"/></svg>`,
			//customEdit: `<svg viewBox="0 0 24 24"><path d="M17.0671 2.27157C17.5 2.09228 17.9639 2 18.4324 2C18.9009 2 19.3648 2.09228 19.7977 2.27157C20.2305 2.45086 20.6238 2.71365 20.9551 3.04493C21.2864 3.37621 21.5492 3.7695 21.7285 4.20235C21.9077 4.63519 22 5.09911 22 5.56761C22 6.03611 21.9077 6.50003 21.7285 6.93288C21.5492 7.36572 21.2864 7.75901 20.9551 8.09029L20.4369 8.60845L15.3916 3.56308L15.9097 3.04493C16.241 2.71365 16.6343 2.45086 17.0671 2.27157Z"/><path d="M13.9774 4.9773L3.6546 15.3001C3.53154 15.4231 3.44273 15.5762 3.39694 15.7441L2.03526 20.7369C1.94084 21.0831 2.03917 21.4534 2.29292 21.7071C2.54667 21.9609 2.91693 22.0592 3.26314 21.9648L8.25597 20.6031C8.42387 20.5573 8.57691 20.4685 8.69996 20.3454L19.0227 10.0227L13.9774 4.9773Z"/></svg>`,
			pencil: `<svg viewBox="0 0 24 24"><path d="M14.06,7.6l2.34,2.34L6.34,20H4v-2.34L14.06,7.6 M14.06,6.19L3,17.25V21h3.75L17.81,9.94L14.06,6.19L14.06,6.19z M17.61,4.05l2.37,2.37l-1.14,1.14l-2.37-2.37L17.61,4.05 M17.61,2.63l-2.55,2.55l3.79,3.79l2.55-2.55L17.61,2.63L17.61,2.63z"/></svg>`,
			folder: `<svg viewBox="0 0 24 24"><path d="M21 9V7C21 6.44772 20.5523 6 20 6H10L9 4H4L3.21115 5.57771C3.07229 5.85542 3 6.16165 3 6.47214V9"/><path d="M3.91321 20H20.0868C20.604 20 21.0359 19.6056 21.0827 19.0905L21.9009 10.0905C21.9541 9.50492 21.493 9 20.905 9H3.09503C2.507 9 2.0459 9.50492 2.09914 10.0905L2.91732 19.0905C2.96415 19.6056 3.39601 20 3.91321 20Z"/></svg>`,// custom, stroke-linecap="round" stroke-linejoin="round",
			visible: `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`,
			invisible: `<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`,
			check: `<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`,
			add: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
			move: `<svg viewBox="0 0 24 24"><path d="M12.0001 2.89331L8.81809 6.07529L9.87875 7.13595L11.2501 5.76463V11.2499H5.7649L7.13619 9.8786L6.07553 8.81794L2.89355 11.9999L6.07553 15.1819L7.13619 14.1212L5.76485 12.7499H11.2501V18.2352L9.87875 16.8639L8.81809 17.9245L12.0001 21.1065L15.182 17.9245L14.1214 16.8639L12.7501 18.2352V12.7499H18.2353L16.8639 14.1213L17.9246 15.1819L21.1066 11.9999L17.9246 8.81796L16.8639 9.87862L18.2352 11.2499H12.7501V5.76463L14.1214 7.13595L15.182 6.07529L12.0001 2.89331Z"/></svg>`,
			delete: `<svg viewBox="0 0 24 24"><path d="M11,17H9V8h2V17z M15,8h-2v9h2V8z M19,4v1h-1v16H6V5H5V4h4V3h6v1H19z M17,5H7v15h10V5z"/></svg>`
		};

static UStripSVGFromElem(elem, copy, className) {
		let svg = elem.querySelector("svg");

		className = className || "";
		if (copy) svg = svg.cloneNode(true);

		svg.style = {};
		svg.setAttribute("class",className);

		let parent = svg;

		while (parent.firstElementChild) {
			let child = parent.firstElementChild;
			child.setAttribute("class", "");
			parent = child;
		};

		return svg;
	};

	static UGetSVGFromRaw(_type, returnDiv, returnHTML) {
		

		if (raw[_type]) {
			if (returnHTML) {
				return raw[_type];
			};

			let div = document.createElement("div");
			div.innerHTML = raw[_type];

			if (returnDiv) return div; // simple :)
			return this.UStripSVGFromElem(div, false, `c-${_type}`);
		} else {
			return undefined;
		}
	}

a();*/