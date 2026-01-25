export class InjectMyPaperItems {
	GetCleanPLDataFromYTPaper(data) {
		let subtitleIgnore = [this.accountInfo.accountName, "Album", "Playlist"];
		let madeForYou = `Made for ${this.accountInfo.accountName}`;

		let title = data.formattedTitle.runs.map( v => v.text ).join(""); // not dot, will already have.

		let goodSubtitleRuns = data.formattedSubtitle.runs
			.filter( v => v && v.text && subtitleIgnore.indexOf(v.text) === -1)
			.map( v => (v.text = ( v.text === madeForYou ) ? "Made for you" : v.text) && v ); // && v to resolve with v

		return {
			title: title,
			subtitleRuns: goodSubtitleRuns,
			id: data.navigationEndpoint.browseEndpoint.browseId,
			mfId: data.navigationEndpoint.browseEndpoint.browseId.replace(/^VL/,"")
		};
	};


	GetUserAccountInfo() {
		const juicyInfo = ext.SafeDeepGet(polymerController, ext.Structures.userAccountInfoFromPC);

		return juicyInfo ? {
			accountName: juicyInfo.accountName.runs[0].text,
			accountPhoto: juicyInfo.accountPhoto.thumbnails[0].url,
			channelHandle: juicyInfo.channelHandle.runs[0].text
		} : {
			accountName: "",
			accountPhoto: "",
			channelHandle: ""
		};
	};


	ProcessYTDefaultPaperItems() {
		function _EditSystemItem(item, data) {
			item = item.parentElement; // WANT ytmusic-renderer NOT PAPER.
			if (item.parentElement.matches("a")) return; // ALREADY REPLACED. LEAVE.

			const a = document.createElement("a");
			ext.AddToClass(a, "c-paper-wrapper");
			a.setAttribute("is-primary", "true");

			// ONLY USE href FOR MIDDLE-CLICK NEW TAB.
			// EVENT BUBBLES DOWN TO DEFAULT YT INNERTUBE NAVIGATOR.
			// SET onclick TO PREVENT BROWSER NAVIGATING.
			a.setAttribute("href", "browse/" + data.navigationEndpoint.browseEndpoint.browseId);
			a.onclick = (e) => e.preventDefault();

			item.parentElement.append(a);
			a.append(item);
		};

		this.ytLoadedPlaylists = {};

		document.querySelectorAll("ytmusic-guide-section-renderer tp-yt-paper-item").forEach((paper) => {
			const data = ext.SafeDeepGet(paper, ext.Structures.dataFromElemDH) || {};

			if (data.isPrimary) _EditSystemItem(paper, data);
			else {
				let info = this.GetCleanPLDataFromYTPaper(data);
				this.ytLoadedPlaylists[info.id] = info;
				paper.parentElement.remove();
			};
		});
	};


	InitButtonContOnNavClick(cont) {
		const statusIco = cont.querySelector(".c-paper-status-icon");

		ext.HideElem(cont.querySelector(".c-paper-shfl-btn"));
		ext.HideElem(cont.querySelector(".c-paper-play-btn"));
		ext.AddToClass(cont, "c-active");

		ext.UnhideElem(statusIco);

		let icon = cont.querySelector(".icon");
		let spinner = cont.querySelector("#spinnerContainer");

		icon.textContent = ""; // CLEAR CHILDRENs

		ext.HideElem(icon);
		ext.UnhideElem(spinner);
	};


	RespondToPlayerBar() {
		function _SetState(cont, state) {
			const icon = cont.querySelector(".icon");
			const spinner = cont.querySelector("#spinnerContainer");

			icon.textContent = ""; // CLEAR CHILDREN
			ext.UnhideElem(icon);
			ext.HideElem(spinner);

			if (state === "playing") {
				if (hoverDebounce) { // is hovering
					_SetState(cont, "hoverToPause");
					
				} else {
					// speaker icon
					icon.append(svgs.playing); // removed cloned
				};
			
			} else if (state === "paused") {
				// add play triangle
				icon.append(svgs.play);// removed cloned

			} else if (state === "hoverToPause") {
				// show pause button
				icon.append(svgs.paused);// removed cloned

			} else if (state === "loading") {
				// show spinner, hide ico (spinner always active)
				ext.HideElem(icon);

				ext.UnhideElem(spinner);

			} else if (state === "default") { // shouldn't happen? idk
				_Reset(cont);

			};
		};


		// MOUSE EVENTS
		function __MouseOver() {
			if (curState === "playing" && !hoverDebounce) {
				hoverDebounce = true;
				_SetState(thisCont, "hoverToPause");
			};
		};

		function __MouseOut() {
			if (curState === "playing") {
				hoverDebounce = false; // DO THIS FIRST!
				_SetState(thisCont, "playing");
			};
		};

		function __MouseClick(event) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			playerBarBtn.click();
		};

		// USEFUL
		function _GetBtnCont(mfId) {
			return document.querySelector(`[mfId="${mfId}"] .c-paper-button-cont`);
		};

		// OTHER MAIN FUNCS
		function _Start(cont) {
			const statusIco = cont.querySelector(".c-paper-status-icon");

			statusIco.addEventListener("mouseover", __MouseOver);
			statusIco.addEventListener("mouseleave", __MouseOut);
			statusIco.addEventListener("click", __MouseClick);

			if (cont.matches(".c-active")) return; //done in this.InitLoadingWhatever

			ext.HideElem(cont.querySelector(".c-paper-shfl-btn"));
			ext.HideElem(cont.querySelector(".c-paper-play-btn"));
			ext.AddToClass(cont, "c-active");

			ext.UnhideElem(statusIco);

			_SetState(cont, "loading");
		};


		


		function _Reset(cont) {
			const statusIco = cont.querySelector(".c-paper-status-icon");
			const icon = cont.querySelector(".icon");

			ext.UnhideElem(cont.querySelector(".c-paper-shfl-btn"));
			ext.UnhideElem(cont.querySelector(".c-paper-play-btn"));
			ext.RemoveFromClass(cont, "c-active");

			ext.HideElem(statusIco);

			statusIco.removeEventListener("mouseover", __MouseOver);
			statusIco.removeEventListener("mouseleave", __MouseOut);
			statusIco.removeEventListener("click", __MouseClick);

			icon.textContent = ""; // CLEAR CHILDREN

			hoverDebounce = false;
			playingPlId = undefined;
		};


		// MAIN
		function _OnIntervalForPlayerBar() {
			if (!this.masterCont.isConnected) {
				fconsole.error("THIS.MASTERCONT NO LONGER CONNECTED, CLOSING AND CREATING NEW INSTANCE");
				
				this.Close();

				setTimeout(() => ext.DispatchEventToEW({
					func: "reinit-sidebar"
				}), 3000);
				return;
			};

			const data = playerBarBtn.__dataHost.__data;
			const playingItem = data.currentItem;

			if (thisCont && !thisCont.isConnected) {
				thisCont = undefined;
				curState = undefined;
			};

			if (curState !== undefined && !playingItem && thisCont) {
				_Reset(thisCont);
				curState = undefined;

				return;
			};

			if (!playingItem) return;

			let newV;

			if (data.playing === true) newV = "playing";
			else if (data.showBufferingSpinner === true) newV = "loading";
			else newV = "paused";

			const thisPlId = playingItem.navigationEndpoint.watchEndpoint.playlistId;

			if (thisCont && playingPlId !== undefined && playingPlId !== thisPlId) {
				// remove playing icons from old paper
				_Reset(thisCont);
			};

			if (playingPlId === undefined || playingPlId !== thisPlId || !thisCont) {
				// add playing icons to new (or first) paper
				thisCont = _GetBtnCont(thisPlId);

				if (!thisCont) return;
				_Start(thisCont);
			};

			playingPlId = thisPlId;

			if (newV !== curState) _SetState(thisCont, newV);

			curState = newV;
		};

		const svgs = {
			"play": ext.GetSVG("play"),
			"playing": ext.GetSVG("playing"),
			"paused": ext.GetSVG("paused")
		};

		const playerBarBtn = document.querySelector("#play-pause-button.ytmusic-player-bar");

		let playingPlId;
		let thisCont;
		let curState;
		let hoverDebounce = false;

		if (window.cMusicFixerPlayerBarInterval) clearInterval(window.cMusicFixerPlayerBarInterval);
		window.cMusicFixerPlayerBarInterval = setInterval(() => _OnIntervalForPlayerBar.call(this), 100);
	};


	OnClickFolderEvent(paperWrapper, event) {
		if (event) {
			event.preventDefault();
			event.stopImmediatePropagation();
		};
		
		if (
			paperWrapper.matches(":has(.c-editing)") ||
			paperWrapper.matches(ext.HELPFUL_SELECTORS.sidebarFolderHasVisibleActiveChild)
		) {
			ext.AddToClass(paperWrapper, "open");
			ext.RemoveFromClass(paperWrapper, "closed");
			return;
		};

		if (paperWrapper.getAttribute("class").indexOf("open") === -1) {
			ext.AddToClass(paperWrapper, "open");
			ext.RemoveFromClass(paperWrapper, "closed");
		} else {
			ext.AddToClass(paperWrapper, "closed");
			ext.RemoveFromClass(paperWrapper, "open");
		};
	};


	AddInteractionToPaperItem(elem, id, mfId) {
		const navVerifyFunc = () => (!document.querySelector("#guide .c-editing, .c-popup-elem-overflow") && !elem.matches(".c-ovf-elem"));

		ext.NavigateOnClick({
			elem,
			navEndpOuter: ext.BuildEndpoint({
				navType: "browse",
				id: id
			}),
			verifyFunc: navVerifyFunc
		});

		if (!mfId) return;
		const browsePageType = ext.GetBrowsePageTypeFromBrowseId(id, true, true);
		const runAfterParams = [elem.querySelector(".c-paper-button-cont")];


		ext.NavigateOnClick({
			"elem": elem.querySelector(".c-paper-play-icon"),
			navEndpOuter: ext.BuildEndpoint({
				navType: "watch",
				playlistId: mfId,
				shuffle: false,
				cParams: { buildQueueFrom: id }
			}),
			runAfter: this.InitButtonContOnNavClick,
			runAfterParams,
			useCapture: true,
			preventPropagation: true
		});
	

		ext.NavigateOnClick({
			"elem": elem.querySelector(".c-paper-shfl-icon"),
			navEndpOuter: ext.BuildEndpoint({
				navType: "watch",
				playlistId: mfId,
				shuffle: true,
				cParams: { buildQueueFrom: id }
			}),
			runAfter: this.InitButtonContOnNavClick,
			runAfterParams,
			useCapture: true,
			preventPropagation: true
		});


		// DON'T INITBUTTONCONT FOR QUEUE ADD BUTTONS
		// backingPlaylistId DOES NOT CHANGE, SO WILL NOT GET "playing" STATUS.
		// DON'T WANT TO SET THEM AS LOADING.

		ext.NavigateOnClick({
			"elem": elem.querySelector(".c-paper-queueadd-icon"),
			navEndpOuter: ext.BuildEndpoint({
				navType: "queueAdd",
				playlistId: mfId,
				position: "end",
				listType: browsePageType,
				cParams: { buildQueueFrom: id }
			}),
			useCapture: true,
			preventPropagation: true
		});

		ext.NavigateOnClick({
			"elem": elem.querySelector(".c-paper-queuenext-icon"),
			navEndpOuter: ext.BuildEndpoint({
				navType: "queueAdd",
				playlistId: mfId,
				position: "next",
				listType: browsePageType,
				cParams: { buildQueueFrom: id }
			}),
			useCapture: true,
			preventPropagation: true
		});
	};


	CreatePaperElem(item, parent, insertBefore) {
		if (!insertBefore) insertBefore = null;

		const newElem = ext.GetTemplateElem(this.templateNames.paperWrapper);

		let ytLoadedInfo = this.ytLoadedPlaylists[item.id] || {};

		let mfId = ytLoadedInfo.mfId || item.mfId;
		if (!mfId) mfId = ext.GetMicroformatIdFromBrowseId(item.id);

		// TITLE HIERARCHY: OVERWRITE, CACHED, YT LOADED.
		// USED TO PROPRITISE YT OVER CACHE, BUT IF YOU UPDATE PL
		// NAME, YT DOES NOT UPDATE AS PAPER IS DETACHED?

		let title = item.name || "?";
		title = title.replace(/^\[.*?\] /, "");
		if (title === "?" && ytLoadedInfo?.title) title = ytLoadedInfo?.title;

		// SUBTITLE: PRIORITISE CACHE. BETTER DATA.
		let subtitleRuns = item.subtitle;	
		if (!subtitleRuns && ytLoadedInfo?.subtitleRuns) subtitleRuns = ytLoadedInfo.subtitleRuns;

		newElem.querySelector(".c-paper-title").textContent = title;
		ext.CreateTextElemFromRuns(newElem.querySelector(".c-paper-subtitle"), subtitleRuns, item.badges);


		const iconElem = newElem.querySelector(".c-paper-icon");
		const bkgCont = newElem.querySelector(".bkg-cont");
		
		let thumb = item.thumb === undefined ? "" : item.thumb;
		if (!thumb) iconElem.style.display = "none";

		iconElem.src = thumb;
		if (thumb) bkgCont.style.backgroundImage = `url("${thumb}")`;

		if (item.hidden) ext.HideElem(newElem);	

		newElem.setAttribute("href", `browse/${item.id}`); // FOR MIDDLE MOUSE/NEW TAB
		newElem.setAttribute("plId", item.id);
		newElem.setAttribute("mfId", mfId);
		newElem.setAttribute("draggable", "false");
		newElem.setAttribute("c-clickable", "true");

		this.AddInteractionToPaperItem(newElem, item.id, mfId);

		if (parent) {
			parent.insertBefore(newElem, insertBefore);
			this.instanceAddedElementsIds.push(item.id);
		};			

		return newElem;
	};


	CreateAndPopulateCarousel(item, parent, insertBefore) {
		if (!insertBefore) insertBefore = null;

		const cont = document.createElement("div");
		cont.setAttribute("class", "c-carousel");
		cont.setAttribute("plId", item.id);

		parent.insertBefore(cont, insertBefore);
		this.PopulateCont(item.contents, cont);

		this.instanceAddedElementsIds.push(item.id);
		return cont;
	};


	CreateAndPopulateFolderPaperItem(item, parent, insertBefore) {
		if (!insertBefore) insertBefore = null;

		if (this.instanceAddedElementsIds.indexOf(item.id) !== -1) {
			throw Error(`Attempted to create the same folder twice. Cannot due to risk of inf recursion. (${item.id})`);
		};

		if (item.folderType === "carousel") return this.CreateAndPopulateCarousel(item, parent, insertBefore);


		const newElem = ext.GetTemplateElem(this.templateNames.paperWrapper);
		ext.AddToClass(newElem, "c-paper-folder");
		ext.AddToClass(newElem, "closed");

		newElem.querySelector(".c-paper-title").textContent = item.name;
		if (item.subtitle) ext.CreateTextElemFromRuns(
			newElem.querySelector(".c-paper-subtitle"),
			[{text: item.subtitle}]
		);

		const folderIcon = ext.GetSVG("folder");
		ext.AddToClass(folderIcon, "c-paper-icon");

		const oldImgElem = newElem.querySelector("img.c-paper-icon");
		newElem.querySelector(".c-paper-icon-cont").insertBefore(folderIcon, oldImgElem);
		oldImgElem.remove();

		const cont = document.createElement("div");
		cont.setAttribute("class", "c-paper-folder-cont");
		newElem.append(cont);

		this.instanceAddedElementsIds.push(item.id);
		this.PopulateCont(item.contents, cont);

		if (newElem.matches(ext.HELPFUL_SELECTORS.sidebarFolderHasVisibleActiveChild)) {
			ext.AddToClass(newElem, "open");
			ext.RemoveFromClass(newElem, "closed");
		};

		newElem.firstElementChild.addEventListener("click", (e) => this.OnClickFolderEvent(newElem, e));

		// HIDE BUTTON CONT. NO PLAY BUTTON.
		// DON'T DELETE, NEED FOR EDIT!
		ext.HideElem(newElem.querySelector(".c-paper-button-cont"));

		if (item.hidden) ext.HideElem(newElem);

		newElem.setAttribute("plId", item.id);
		newElem.setAttribute("draggable", "false");
		newElem.setAttribute("c-clickable", "true");
		parent.insertBefore(newElem, insertBefore);

		// FAKE A CLICK TO OPEN THE FOLDER.
		if (this._foldersToOpen.indexOf(item.id) !== -1) this.OnClickFolderEvent(newElem);

		return newElem;
	};


	CreateSeparatorItem(item, parent, insertBefore) {
		if (!insertBefore) insertBefore = null;

		if (this.instanceAddedElementsIds.indexOf(item.id) !== -1) {
			throw Error(`Attempted to create the same separator twice. Cannot due to quirks when deleting. (${item.id})`);
		};


		const newElem = ext.GetTemplateElem(this.templateNames.separator);
		newElem.setAttribute("plId", item.id);

		newElem.querySelector(".c-sep-title").textContent = item.name;
		
		parent.insertBefore(newElem, insertBefore);
		this.instanceAddedElementsIds.push(item.id);

		return newElem;
	};


	CreateItem(item, cont) {
		if (item.type === "folder") this.CreateAndPopulateFolderPaperItem(item, cont);
		else if (item.type === "separator") this.CreateSeparatorItem(item, cont);
		else this.CreatePaperElem(item, cont);
	};


	PopulateCont(items, cont) {
		items.forEach((item) => {
			try { this.CreateItem(item, cont); }
			catch (err) {
				const contId = cont.getAttribute("id");
				fconsole.error(`ERROR ADDING PL ${item.id} TO CONT #${contId}:`, item, err);
			};
		});
	};

	GetAllItemsInCont(contIdList) {
		return contIdList.map( v => v.type === "folder" ? this.GetAllItemsInCont(v.contents) : v.id ).flat();
	};


	InsertAllPaperItemsInOrder() {
		const ytLoadedIds = Array.from(Object.keys(this.ytLoadedPlaylists));

		const paperItemOrder = this.sidebarData;

		const allItemsWithSavedPosition = this.GetAllItemsInCont(paperItemOrder);

		// PREPEND YOUTUBE LOADED PAPERS WHICH DON'T HAVE USER-ASSIGNED POSITION.
		const prependNewItems = ytLoadedIds.filter( v => allItemsWithSavedPosition.indexOf(v) === -1 ).map(v => {
			return {
				title: "?",
				type: "paperItem",
				id: v
			}
		});
		const orderToInsert = prependNewItems.concat(paperItemOrder);
		
		// THIS IS RECURSIVE!
		this.PopulateCont(orderToInsert, this.masterCont);
	};


	_OnChangeSentByEW(eventData) {
		/*if (!eventData.storage) {
			if (eventData.action === "refreshCont") {
				this.RefreshCont(true);
				fconsole.warn("ONLY RUNNING onChange AS ACTION = refreshCont. NO STORAGE PROVIDED.");
			} else {
				fconsole.error("event.storage IS undefined, not running onChange action");
			};
			
			return;
		};
		
		this.storage = eventData.storage;

		if (eventData.action === "new") {
			const parent = (eventData.parent === "guide") ? this.masterCont : this.masterCont.querySelector(`.c-paper-folder[plid=${eventData.parent}]`);
			const insertBefore = (eventData.position === undefined) ? null : parent.children[eventData.position];

			if (eventData.id.match(/^CF/)) this.CreateAndPopulateFolderPaperItem(eventData.id, parent, insertBefore);
			else if (eventData.id.match(/^CS/)) this.CreateSeparatorItem(eventData.id, parent, insertBefore);
			else this.CreatePaperElem(eventData.id, parent, insertBefore);

		} else if (eventData.action === "refreshCont") {
			this.RefreshCont(false);

		} else {
			fconsole.error("What is this eventData action from EW for sidebar update", eventData.action, "?");
		};*/
	};


	ListenForChanges() {
		const madeFunctionId = ext.RegisterEWFunction({
			detail: {
				time: -1,
				func: ext.SIDEBAR_UPDATE_EVENT_FUNC
			},
			resolve: this._OnChangeSentByEW,
			scope: this,
			once: false
		});

		this._onChangeListenerId = madeFunctionId;
	};


	RefreshCont(getNewStorage) {
		if (this.masterCont.matches(":has(.c-editing)")) {
			throw Error("Cannot refresh paper cont during edit mode.");
		};
		
		if (getNewStorage) {
			ext.StorageGet(true).then((storage) => {
				this.storage = storage || {};

				this.RefreshCont(false);
			});

			return;
		};

		const currentOpenedFolders = Array.from(document.querySelectorAll(".c-paper-folder.open"))
			.map(v => v.getAttribute("plid"));

		this._foldersToOpen = currentOpenedFolders;

		this.RemoveAllCGuideEntries();
		this.instanceAddedElementsIds = [];

		this.InsertAllPaperItemsInOrder();			
	};

	RemoveAllCGuideEntries() {
		document.querySelectorAll(ext.HELPFUL_SELECTORS.allCGuideElements).forEach((elem) => elem.remove());
	};

	Close() {
		ext.RemoveRegisteredEWWaiter(this._onChangeListenerId);
		clearInterval(window.cMusicFixerPlayerBarInterval);
	};

	async RefreshStorage() {
		await Promise.all([
			(async () => { this.localStorage = await ext.StorageGet({"storageFunc": "getlocal"}) || {}; })(),
			(async () => { this.sidebarData = await ext.StorageGet({"storageFunc": "getsidebar"}); })()
		]);
	};

	async init(startListening) {
		await ext.WaitForPolymerController();

		this.accountInfo = this.GetUserAccountInfo();

		if (!this.accountInfo && this.localStorage.accountInfo) {
			this.accountInfo = this.localStorage.accountInfo;
		};

		await this.RefreshStorage();

		this.ProcessYTDefaultPaperItems();

		this.RemoveAllCGuideEntries();
		this.InsertAllPaperItemsInOrder();

		this.RespondToPlayerBar();

		if (startListening) this.ListenForChanges();

		if (this.accountInfo) ext.DispatchEventToEW({
			func: "save-account-info",
			accountInfo: this.accountInfo
		});
	};


	constructor() {
		this.ytLoadedPlaylists = {};

		this.masterCont = document.querySelector("#sections>:not([is-primary])>#items");
		this.templateNames = {
			paperWrapper: "c-paper-wrapper",
			separator: "c-sidebar-sep"
		};

		this.instanceAddedElementsIds = [];
		this._foldersToOpen = [];
	};	
};