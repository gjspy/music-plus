class Utils {

	static U_VARIOUS_ARTISTS = "Various Artists";
	//static U_VARIOUS_ARTISTS_EXTID = "VARIOUS";


	// UGetSVGFromRaw(name, returnDiv, returnHTMLString)
	// UWaitForBySelector(selector, parent, mayWaitForever)
	// UNavigateOnClick(elem, navigationEndpointOuterDict, excessFunc, excessParams, verifyFunc, useCapture, preventPropagation)

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
};