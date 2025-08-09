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
				mfIdMap: {}
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

			customisation: {
				albumLinks: {},
				primaryAlbums: {},
				hiddenSongs: {}
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
			//artPlaylistSetId: "",
			playlistSetVideoId: ""
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

		if (storage.syncEnabled === false) {
			console.warn("storageget only loading from local.");

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
					console.error("error writing to sync. using local storage only.");

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
				button.onclick.call(onClickContext, ...onClickParams);
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

	static async UMWStorageGet(path) {
		// path: string . separated, eg sidebar.folders.folders

		let response = await this.UDispatchFunctionToEW({
			func: "get-storage",
			path: path
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

				UPopups.RenamePopup(elem);
			});

			let thisDeleteButton = deleteIcon.cloneNode(true);
			editButtonCont.insertBefore(thisDeleteButton, editButtonCont.firstElementChild);

			thisDeleteButton.addEventListener("click", function(e) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				
				let name = elem.querySelector(".c-paper-text-cont .c-paper-title").textContent;
				UPopups.DeleteFolderPopup(elem.parentElement, name, elem.getAttribute("plId"), elem);
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

		ovf.promiseOfFillingrGrid = async function() {
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
			|| UDigDict(obj, ["playlistPanelVideoWrapperRenderer", "primaryRenderer", "playlistPanelVideoRenderer"])
			|| UDigDict(obj, ["content", "playlistPanelVideoRenderer"])
			|| UDigDict(obj, ["content", "playlistPanelVideoWrapperRenderer", "primaryRenderer", "playlistPanelVideoRenderer"]);
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
	};

	static UGetIsResponseEditedFromState(state) {
		return this.UDigDict(state, [
			"navigation", "mainContent", "response",
			"cMusicFixerExtChangedResponse"
		]);
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

	static UGetModifiedCacheItem(storage, id) {
		let cache = storage.cache;

		let item = this.FunctionToString.UGetBaseCacheItem(cache, id);

		let modifications = this.UGetModificationsFromStorage(storage, id);

		if (item.type === "ALBUM") {
			let counterpart = this.UGetCounterpartFromData(cache, item);

			// items

			// names
			// icons
			// subType
			// badges!!


			// TODO: update length of albums in subtitle runs
		};


	};

	static UGetBaseCacheItem(cache, id) {
		return structuredClone(cache[id]) || {};
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

	static UGetModificationsFromStorage(storage, id) {
		let data = {};

		let albumLinks = storage.customisation.albumLinks[id];
		if (albumLinks) data.albumLinks = albumLinks;


		return data;
	};

	static UGetLinkedAlbums(storage, nonMainId) {
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

		// MAP INDEX TO VIDEO OF ALBUM WE HAVE LOADED.
		// DO ALL BASED ON CACHE NOW, SO SHUFFLING DOESNT MATTER.
		for (let video of (loadedFromAlbum.items || [])) {
			video = cache[video] || {};
			indexToVideoIdOfThis[video.index] = video.id;
		};

		let albumsToUse = [];
		let primaryVersions = this.UGetLinkedAlbums(storage, buildQueueFrom) || [];
		let linkedAlbums = storage.customisation.albumLinks[buildQueueFrom] || [];
		let counterparts = buildingFromAlbum.privateCounterparts || [];
		
		// priority order (last overwrite first)
		if (primaryVersions) albumsToUse.push(...primaryVersions);
		if (linkedAlbums) {
			linkedAlbums = linkedAlbums
				.map( v => cache[v] ) // docs: "a and b will never be undefined", so no placeholder.
				.sort( (a, b) =>  (a.private && !b.private) ? 1 : (!a.private && b.private) ? -1 : b.items.length - a.items.length )
				.map( v => v.id );

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

		for (let album of albumsToUse) {
			album = cache[album];
			if (!album || album.items.length === 0) continue;

			for (let item of album.items) {
				item = cache[item];
				if (!item) continue;

				let alreadyChanging = changesByIndex[item.index];
				if (alreadyChanging) {
					if (alreadyChanging.from.private === true) continue;
					// removed this. instead, made priority of albumsToUse correct. most important last.
					// if (album.private === false) continue; 
				};

				// why change if its the same?
				// because midnights. queue built from original, replaced by 3am. 
				// need to bring back to original.

				changesByIndex[item.index] = {
					video: item,
					from: album
				};
			};
		};

		// if loading from smaller album, need extras from deluxe adding.
		/*for (let item of buildingFromAlbum.items || []) {
			item = cache[item];
			if (!item || indexToVideoIdOfThis[item.index] !== undefined) continue;
			
			let alreadyChanging = changesByIndex[item.index];
			if (alreadyChanging) continue; // low priority.

			changesByIndex[item.index] = {
				video: item,
				from: buildingFromAlbum
			};
		};*/

		let changesByOriginalId = {extraByIndex: {}};

		console.log("indexToVideoIdOfThis", indexToVideoIdOfThis);
		console.log("changesByIndex", structuredClone(changesByIndex));

		for (let [k,v] of Object.entries(changesByIndex)) {
			let originalId = indexToVideoIdOfThis[k];

			if (originalId) changesByOriginalId[originalId] = v;
			else changesByOriginalId.extraByIndex[k] = v;
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
							"navigationEndpoint": {
								"browseEndpoint": {
									"browseId": data.id,
									"browseEndpointContextSupportedConfigs": {
										"browseEndpointContextMusicConfig": {
											"pageType": "MUSIC_PAGE_TYPE_ALBUM"
										}
									}
								}
							}
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
				"navigationEndpoint": {
					"browseEndpoint": {
						"browseId": data.id,
						"browseEndpointContextSupportedConfigs": {
							"browseEndpointContextMusicConfig": {
								"pageType": "MUSIC_PAGE_TYPE_ALBUM"
							}
						}
					}
				},
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
							{
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
												"playlistId": data.mfId
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
												"playlistId": data.mfId
											}
										}
									}
								}
							},
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

	static UModifyListItemRendererFromData(replacement, realAlbum, current) {
		// realAlbum is the album we've navigated to. replacement.from is where the replacement came from (duh)
		// eg, realAlbum = deluxe, replacement.from = original.

		if (current.musicResponsiveListItemRenderer) current = current.musicResponsiveListItemRenderer;
		let playButton = this.UDigDict(current, [
			"overlay", "musicItemThumbnailOverlayRenderer",
			"content", "musicPlayButtonRenderer"
		]);

		let vId = replacement.video.id;
		let setPlId = replacement.video.playlistSetVideoId;

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

	static UModifyPlaylistPanelRendererFromData(current, replacement, realAlbum, artist) {
		let vId = replacement.video.id;
		let plSetId = replacement.video.playlistSetVideoId;

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
		// TODO not editing params, playerParams, playlistSetVideoId, may need to? test it

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
			{
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
								"videoId": vId
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
								"videoId": vId
							}
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

	static UBuildListItemRendererFromData(replacement, realAlbum) {
		let video = replacement.video;

		let index = Number(video.index);
		if (index !== 0) index --;

		let playEndp = this.UBuildEndpoint({
			navType: "watch",
			playlistId: realAlbum.mfId,
			firstVideo: video,
			index: index, // zero base index.
			playlistSetVideoId: video.playlistSetVideoId
			//cParams: { buildingQueueFrom: realAlbum.id }
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
									"likeStatus": "LIKE",
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
					playlistSetVideoId: video.artPlaylistSetId,
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
							"url": replacement.from.thumb,
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
						"playlistSetVideoId": video.artPlaylistSetId,
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
							{
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
												"videoId": video.id
											},
											"removeLikeParams": "OAI%3D"
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
												"videoId": video.id
											},
											"likeParams": "OAI%3D"
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
				"playlistSetVideoId": video.artPlaylistSetId,
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

		for (let item of browsePage.querySelectorAll("#content-wrapper > #contents ytmusic-responsive-list-item-renderer")) {
			let newButton = iconElem.cloneNode(true);
			
			let fixedCols = item.querySelector("div.fixed-columns");
			if (fixedCols) fixedCols.append(newButton);

			let data = item.controllerProxy;
			let videoId = this.UDigDict(data, ["__data", "data", "playlistItemData", "videoId"]);

			if (videoId) newButton.onclick = () => onClick(item, videoId);
		};
	};

	static UEndListItemPageEditMode(browsePage) {
		browsePage.removeAttribute("c-editing");

		for (let item of browsePage.querySelectorAll(".c-edit-btn")) {
			item.remove();
		};

		let indexCount = 0;
		for (let item of browsePage.querySelectorAll("#content-wrapper > #contents ytmusic-responsive-list-item-renderer")) {
			let data = this.UDigDict(item, ["controllerProxy", "__data", "data"]);
			if (!data) continue;

			let isDeleted = this.UDigDict(data, ["cData", "changedByDeletion", "isDeleted"]);
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


	static UPopups = {
		DeleteFolderPopup: function(cont, folderName, folderId, folderElem) {
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

				URemovePopup(popup);

				// save new order in separate event..
				setTimeout(function() {
					USaveNewOrder(cont);
				}, 500); // delay this, to ensure previous event happens first.
			});
		},
		RenamePopup: function(paperWrapper) {
			function __RenameFolder() {
				return UCreatePopup({
					title: {
						text: "Edit Folder",
						icon: "pencil"
					},
					content: [
						{
							class: "c-popup-text-line",
							config: [
								["label", "textContent", "Leaving the subtitle blank here will clear it, your original value will not be saved."]
							],
							style: [
								["label", "font-size: 12px;"],
								["", "margin-bottom: 7px;"]
							]
						},
						{
							class: "c-text-input",
							config: [
								["label", "textContent", "Name"]
							]
						},
						{
							class: "c-text-input",
							config: [
								["label", "textContent", "Subtitle"]
							]
						}
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
							text: "Reset",
							style: "dark"
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

			
			popup.querySelector("#reset").addEventListener("click", function(e) {
				UDispatchEventToEW({
					func: "sidebar-rename-folder",
					editInfo: {title:"", subtitle:""},
					plId: plId
				});	

				URemovePopup(popup);
				paperWrapper.querySelector(".c-paper-subtitle").textContent = "";
			});


			
			popup.querySelector("#submit").addEventListener("click", function(e) {
				let titleVal = popup.querySelector("input[_group=\"1\"]").value;
				let subVal = popup.querySelector("input[_group=\"2\"]").value;

				UDispatchEventToEW({
					func: "sidebar-rename-folder",
					editInfo: {title: titleVal, subtitle: subVal},
					plId: plId
				});

				URemovePopup(popup);
				paperWrapper.querySelector(".c-paper-title").textContent = titleVal;
				paperWrapper.querySelector(".c-paper-subtitle").textContent = subVal;
			});		
		}
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