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


	GetMetadataFromCachedInfo(cachedInfo) {
		const customMetadata = this.storage.customisation.metadata[cachedInfo.id] || {};
		const subtitle = [];

		if (cachedInfo.type === "PLAYLIST") {
			if (!cachedInfo.items || cachedInfo.items.length === 0) return subtitle;

			const hiddenSongs = this.storage.customisation.hiddenSongs[cachedInfo.id] || [];
			const nTracks = cachedInfo.items.length - hiddenSongs.length;

			subtitle.push({
				text: String(nTracks) + " track" + (nTracks === 1 ? "" : "s")
			});

			if (((cachedInfo.creator) && (!this.accountInfo)) || (cachedInfo.creator !== this.accountInfo.accountName)) {
				subtitle.unshift({ text: cachedInfo.creator});

			} else {
				const len = ext.GetTotalDurationOfList(this.storage, cachedInfo);
				subtitle.push({ text: ext.SecondsToWordyHMS(len) });

			};

			return subtitle;
		};

		if (cachedInfo.type === "ALBUM") {
			let subType = customMetadata.type;
			if (ext.IsEntryPrivateSingle(this.storage, cachedInfo.id)) subType = "Single";
			if (!subType) subType = cachedInfo.subType;

			if (subType) subtitle.push({text: subType});
			
			const artist = customMetadata.artist || cachedInfo.artist;
			const year = customMetadata.year || cachedInfo.year;

			if (artist) {
				let artistObj = this.storage.cache[artist];

				if (!artistObj.private && (artistObj.privateCounterparts || []).length > 0) {
					const c = artistObj.privateCounterparts[0];
					if (c && this.storage.cache[c]) artistObj = this.storage.cache[c];
				};

				if (artistObj && artistObj.name) {
					const artistCustomisation = this.storage.customisation.metadata[artistObj.id] || {};

					subtitle.push({
						text: artistCustomisation.title || artistObj.name,
						navigationEndpoint: ext.BuildEndpoint({
							navType: "browse",
							id: artist,
							browsePageType: "MUSIC_PAGE_TYPE_ARTIST",
							cParams: { stopPropagation: true }
						})
					});
				};
			};

			if (year && year !== -1) subtitle.push({ text: year });
			return subtitle;
		};

		if (cachedInfo.type === "ARTIST") {
			let songCount = 0;

			for (let album of cachedInfo.discography) {
				if (!album.startsWith("MPREb")) continue;

				const albumInfo = this.storage.cache[album];
				songCount += albumInfo.items.length;
			};

			subtitle.push(
				{ text: "Artist" },
				{ text: ext.YT_DOT },
				{ text: `${songCount} song${(songCount === 1) ? "" : "s"}`}
			);
		};

		return subtitle;
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


	CreatePaperElem(id, parent, insertBefore) {
		if (!insertBefore) insertBefore = null;

		const newElem = ext.GetTemplateElem(this.templateNames.paperWrapper);

		const cachedInfo = this.storage.cache[id] || {};
		const overwriteInfo = this.storage.customisation.metadata[id];
		let ytLoadedInfo = this.ytLoadedPlaylists[id];

		let mfId = "";
		if (ytLoadedInfo) mfId = ytLoadedInfo.mfId;
		else if (cachedInfo) {

			if (cachedInfo.type === "ARTIST" && cachedInfo.radios.allSongsPlId) {
				mfId = cachedInfo.radios.allSongsPlId.replace(/^VL/, "");
				
			} else if (cachedInfo.type === "ALBUM" && !!cachedInfo.mfId) {
				mfId = cachedInfo.mfId;
			};

		};

		if (!mfId) mfId = ext.GetMicroformatIdFromBrowseId(id);

		// TITLE HIERARCHY: OVERWRITE, CACHED, YT LOADED.
		// USED TO PROPRITISE YT OVER CACHE, BUT IF YOU UPDATE PL
		// NAME, YT DOES NOT UPDATE AS PAPER IS DETACHED?

		let title;
		if (overwriteInfo?.title) title = overwriteInfo.title;
		else if (cachedInfo?.name) title = cachedInfo.name;
		else if (ytLoadedInfo?.title) title = ytLoadedInfo.title;
		else title = "?";

		// SUBTITLE: PRIORITISE CACHE. BETTER DATA.
		let subtitleRuns;
		if (cachedInfo) subtitleRuns = this.GetMetadataFromCachedInfo(cachedInfo);		
		if (!subtitleRuns && ytLoadedInfo?.subtitleRuns) subtitleRuns = ytLoadedInfo.subtitleRuns;

		newElem.querySelector(".c-paper-title").textContent = title;
		ext.CreateTextElemFromRuns(newElem.querySelector(".c-paper-subtitle"), subtitleRuns, cachedInfo.badges);


		const iconElem = newElem.querySelector(".c-paper-icon");
		const bkgCont = newElem.querySelector(".bkg-cont");
		
		let thumb = "";
		if (overwriteInfo?.thumb) thumb = overwriteInfo.thumb;
		else if (cachedInfo?.thumb) thumb = cachedInfo.thumb;
		else iconElem.style.display = "none";

		iconElem.src = thumb;
		if (thumb) bkgCont.style.backgroundImage = `url("${thumb}")`;
		

		if (this.storage.sidebar.hidden.indexOf(id) !== -1) ext.HideElem(newElem);	

		newElem.setAttribute("href", `browse/${id}`); // FOR MIDDLE MOUSE/NEW TAB
		newElem.setAttribute("plId", id);
		newElem.setAttribute("mfId", mfId);
		newElem.setAttribute("draggable", "false");
		newElem.setAttribute("c-clickable", "true");

		this.AddInteractionToPaperItem(newElem, id, mfId);

		if (parent) {
			parent.insertBefore(newElem, insertBefore);
			this.instanceAddedElementsIds.push(id);
		};			

		return newElem;
	};


	CreateAndPopulateCarousel(id, parent, folderInfo, insertBefore) {
		if (!insertBefore) insertBefore = null;

		if (!folderInfo) folderInfo = this.storage.sidebar.folders.folders[id];
		if (!folderInfo) throw Error(`No folder info for paper item ${id}`);

		const cont = document.createElement("div");
		cont.setAttribute("class", "c-carousel");
		cont.setAttribute("plId", folderInfo.id);

		parent.insertBefore(cont, insertBefore);
		this.PopulateCont(folderInfo.contents, cont);

		this.instanceAddedElementsIds.push(id);
		return cont;
	};


	CreateAndPopulateFolderPaperItem(id, parent, insertBefore) {
		if (!insertBefore) insertBefore = null;

		const folderInfo = this.storage.sidebar.folders.folders[id];
		if (!folderInfo) throw Error(`No folder info for paper item ${id}`);

		if (this.instanceAddedElementsIds.indexOf(id) !== -1) {
			throw Error(`Attempted to create the same folder twice. Cannot due to risk of recursion. (${id})`);
		};

		if (folderInfo.type === "carousel") return this.CreateAndPopulateCarousel(id, parent, folderInfo, insertBefore);


		const newElem = ext.GetTemplateElem(this.templateNames.paperWrapper);
		ext.AddToClass(newElem, "c-paper-folder");
		ext.AddToClass(newElem, "closed");

		newElem.querySelector(".c-paper-title").textContent = folderInfo.title;
		if (folderInfo.subtitle) ext.CreateTextElemFromRuns(
			newElem.querySelector(".c-paper-subtitle"),
			[{text: folderInfo.subtitle}]
		);

		const folderIcon = ext.GetSVG("folder");
		ext.AddToClass(folderIcon, "c-paper-icon");

		const oldImgElem = newElem.querySelector("img.c-paper-icon");
		newElem.querySelector(".c-paper-icon-cont").insertBefore(folderIcon, oldImgElem);
		oldImgElem.remove();

		const cont = document.createElement("div");
		cont.setAttribute("class", "c-paper-folder-cont");
		newElem.append(cont);

		this.instanceAddedElementsIds.push(id);
		this.PopulateCont(folderInfo.contents, cont);

		if (newElem.matches(ext.HELPFUL_SELECTORS.sidebarFolderHasVisibleActiveChild)) {
			ext.AddToClass(newElem, "open");
			ext.RemoveFromClass(newElem, "closed");
		};

		newElem.firstElementChild.addEventListener("click", (e) => this.OnClickFolderEvent(newElem, e));

		// HIDE BUTTON CONT. NO PLAY BUTTON.
		// DON'T DELETE, NEED FOR EDIT!
		ext.HideElem(newElem.querySelector(".c-paper-button-cont"));

		if (this.storage.sidebar.hidden.indexOf(id) !== -1) ext.HideElem(newElem);

		newElem.setAttribute("plId", id);
		newElem.setAttribute("draggable", "false");
		newElem.setAttribute("c-clickable", "true");
		parent.insertBefore(newElem, insertBefore);

		// FAKE A CLICK TO OPEN THE FOLDER.
		if (this._foldersToOpen.indexOf(id) !== -1) this.OnClickFolderEvent(newElem);

		return newElem;
	};


	CreateSeparatorItem(id, parent, insertBefore) {
		if (!insertBefore) insertBefore = null;

		const sepInfo = this.storage.sidebar.separators.separators[id];
		if (!sepInfo) fconsole.warn(`No info for sidebar sep #${id}`);

		if (this.instanceAddedElementsIds.indexOf(id) !== -1) {
			throw Error(`Attempted to create the same separator twice. Cannot due to quirks when deleting. (${id})`);
		};


		const newElem = ext.GetTemplateElem(this.templateNames.separator);
		newElem.setAttribute("plId", id);

		if (sepInfo) newElem.querySelector(".c-sep-title").textContent = sepInfo.title;
		
		parent.insertBefore(newElem, insertBefore);
		this.instanceAddedElementsIds.push(id);

		return newElem;
	};


	CreateItemOfId(id, cont) {
		if (id.match(/^CF/))	  this.CreateAndPopulateFolderPaperItem(id, cont);
		else if (id.match(/^CS/)) this.CreateSeparatorItem(id, cont);
		else 					  this.CreatePaperElem(id, cont);
	};


	PopulateCont(ids, cont) {
		ids.forEach((id) => {
			try { this.CreateItemOfId(id, cont); }
			catch (err) {
				const contId = cont.getAttribute("id");
				fconsole.error(`ERROR ADDING PLID ${id} TO CONT #${contId}:`, err);
			};
		});
	};


	InsertAllPaperItemsInOrder() {
		const ytLoadedIds = Array.from(Object.keys(this.ytLoadedPlaylists));

		const paperItemOrder = this.storage.sidebar.paperItemOrder;
		const folders = this.storage.sidebar.folders.folders;

		const allPlaylistsWithSavedPosition = paperItemOrder.concat(
			Object.values(folders).map( v => v.contents ).flat()
		);

		// PREPEND YOUTUBE LOADED PAPERS WHICH DON'T HAVE USER-ASSIGNED POSITION.
		const prependNewItems = ytLoadedIds.filter( v => allPlaylistsWithSavedPosition.indexOf(v) === -1 );
		const orderToInsert = prependNewItems.concat(paperItemOrder);
		
		// THIS IS RECURSIVE!
		this.PopulateCont(orderToInsert, this.masterCont);
	};


	_OnChangeSentByEW(eventData) {
		if (!eventData.storage) {
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
		};
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

	async init(startListening) {
		await ext.WaitForPolymerController();
		
		this.storage = await ext.StorageGet(true) || {};

		this.accountInfo = this.GetUserAccountInfo();

		if (!this.accountInfo && this.storage.accountInfo) {
			this.accountInfo = this.storage.accountInfo;
		};

		this.ProcessYTDefaultPaperItems();

		this.RemoveAllCGuideEntries();
		this.InsertAllPaperItemsInOrder();

		this.RespondToPlayerBar();

		if (startListening) this.ListenForChanges();
	};


	constructor() {
		this.ytLoadedPlaylists = {};

		if (this.accountInfo) ext.DispatchEventToEW({
			func: "save-account-info",
			accountInfo: this.accountInfo
		});

		this.masterCont = document.querySelector("#sections>:not([is-primary])>#items");
		this.templateNames = {
			paperWrapper: "c-paper-wrapper",
			separator: "c-sidebar-sep"
		};

		this.instanceAddedElementsIds = [];
		this._foldersToOpen = [];
	};	
};