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


	

	

	

	



	static UTestingShowStorage() {
		UMWStorageGet().then(v => console.log(v));
	};

	static UTestingShowEntireCache() {
		UMWStorageGet("cache").then(v => console.log(v));
	};

	static UTestingShowCacheEntry(id) {
		UMWStorageGet("cache").then(v => console.log(v[id]))
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