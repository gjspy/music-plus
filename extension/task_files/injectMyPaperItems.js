export async function MWInjectMyPaperItems() {
	window.InjectMyPaperItems = class InjectMyPaperItems {
		GetPlInfoFromYTPaperItemData(data) {
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
			let subtitle = [];

			if (cachedInfo.type === "PLAYLIST" && cachedInfo.items && cachedInfo.items.length !== 0) {
				let nTracks = cachedInfo.items.length; // TODO: get overwrite changes here!!

				subtitle.push({
					text: String(nTracks) + " track" + (nTracks === 1 ? "" : "s")
				});

				if (((!!cachedInfo.creator) && (!this.accountInfo)) || (cachedInfo.creator !== this.accountInfo.accountName)) {
					subtitle.unshift({
						text: cachedInfo.creator
					});

				} else {
					let len = UGetTotalSecondsOfList(this.storage.cache, cachedInfo, true); // TODO: includeOverwriteEdits here[true]

					subtitle.push({
						text: USecondsToLengthStr(len, true, false)
					});
				};
			};

			if (cachedInfo.type === "ALBUM") {
				let subType = cachedInfo.subType;
				let artist = cachedInfo.artist;
				let year = cachedInfo.year;

				if (subType) subtitle.push({text: subType});

				if (artist) {
					let artistObj = this.storage.cache[artist];

					if ((artistObj.privateCounterparts || []).length > 0) {
						let c = artistObj.privateCounterparts[0];
						if (!!c && this.storage.cache[c]) artistObj = this.storage.cache[c];
					};

					if (artistObj && artistObj.name) subtitle.push({
						text: artistObj.name,
						navigationEndpoint: UBuildEndpoint({
							id: artist,
							navType: "browse",
							browsePageType: "MUSIC_PAGE_TYPE_ARTIST",
							cParams: { stopPropagation: true }
						})
					});
				};

				if (year && year !== -1) subtitle.push({text: year});
			};

			return subtitle;
		};




		EditYTDefaultPaperItems() {
			function _EditSystemItem(item, data) {
				item = item.parentElement; // get ytmusic-renderer instead of paper-item

				if (item.parentElement.matches("a")) return; // DONT DO MORE THAN ONCE

				let a = document.createElement("a");
				UAddToClass(a, "c-paper-wrapper");

				a.setAttribute("href", "browse/" + data.navigationEndpoint.browseEndpoint.browseId);
				a.setAttribute("is-primary", "true");

				a.onclick = function(e) { // only use href for newtab
					e.preventDefault();
					// event bubbles down to receiver (wrapper, child)

					
				};

				item.parentElement.append(a);
				a.append(item);

			};

			let ytLoadedPlaylists = [];

			for (let paper of document.querySelectorAll("ytmusic-guide-section-renderer tp-yt-paper-item")) {
				if (!paper.__dataHost || !paper.__dataHost.__data) continue;

				let data = paper.__dataHost.__data.data;

				if (data.isPrimary) {
					_EditSystemItem(paper, data);
				
				} else {
					let info = this.GetPlInfoFromYTPaperItemData(data);
					//info.paper = paper;

					ytLoadedPlaylists.push(info);
					paper.parentElement.remove();
				};

			};

			return ytLoadedPlaylists;
		};

		InitButtonContOnNavClick(cont) {
			let statusIco = cont.querySelector(".c-paper-status-icon");
	
			UHideElem(cont.querySelector(".c-paper-shfl-btn"));
			UHideElem(cont.querySelector(".c-paper-play-btn"));
			UAddToClass(cont, "c-active");

			UUnHideElem(statusIco);

			let icon = cont.querySelector(".icon");
			let spinner = cont.querySelector("#spinnerContainer");

			icon.innerHTML = "";

			UHideElem(icon);
			UUnHideElem(spinner);
		};

		RespondToPlayerBar() {
			function __SetState(cont, state) {
				let icon = cont.querySelector(".icon");
				let spinner = cont.querySelector("#spinnerContainer");
	
				icon.innerHTML = "";
				UUnHideElem(icon);
				UHideElem(spinner);
	
				if (state === "playing") {
					if (hoverDebounce) { // is hovering
						__SetState(cont, "hoverToPause");
						
					} else {
						// speaker icon
						icon.append(svgs["playing"]); // removed cloned
					};
				
				} else if (state === "paused") {
					// add play triangle
					icon.append(svgs["play"]);// removed cloned
	
				} else if (state === "hoverToPause") {
					// show pause button
					icon.append(svgs["paused"]);// removed cloned
	
				} else if (state === "loading") {
					// show spinner, hide ico (spinner always active)
					UHideElem(icon);
	
					UUnHideElem(spinner);
	
				} else if (state === "default") { // shouldn't happen? idk
					__Reset(cont);
	
				};
			};


			// MOUSE EVENTS
			function __MouseOver() {
				if (curState === "playing" && !hoverDebounce) {
					hoverDebounce = true;
					__SetState(thisCont, "hoverToPause");
				};
			};
	
			function __MouseOut() {
				if (curState === "playing") {
					hoverDebounce = false; // DO THIS FIRST!
					__SetState(thisCont, "playing");
				};
			};
	
			function __MouseClick(event) {
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
	
				/*if (curState === "playing") {
					button.__cFuncs.pause();
	
				} else if (curState === "paused") {
					button.__cFuncs.play();
	
				};*/
	
				playerBarBtn.click();
			};
	
			// USEFUL
			function __GetBtnCont(mfId) {
				return document.querySelector(`[mfId="${mfId}"] .c-paper-button-cont`);
			};
	
			// OTHER MAIN FUNCS
			function __Start(cont) {
				let statusIco = cont.querySelector(".c-paper-status-icon");
	
				statusIco.addEventListener("mouseover", __MouseOver);
				statusIco.addEventListener("mouseleave", __MouseOut);
				statusIco.addEventListener("click", __MouseClick);

				if (cont.matches(".c-active")) return; //done in this.InitLoadingWhatever

				UHideElem(cont.querySelector(".c-paper-shfl-btn"));
				UHideElem(cont.querySelector(".c-paper-play-btn"));
				UAddToClass(cont, "c-active");
	
				UUnHideElem(statusIco);
	
				__SetState(cont, "loading");
			};
	
	
			
	
	
			function __Reset(cont) {
				let statusIco = cont.querySelector(".c-paper-status-icon");
				let icon = cont.querySelector(".icon");
	
				UUnHideElem(cont.querySelector(".c-paper-shfl-btn"));
				UUnHideElem(cont.querySelector(".c-paper-play-btn"));
				URemoveFromClass(cont, "c-active");
	
				UHideElem(statusIco);
	
				statusIco.removeEventListener("mouseover", __MouseOver);
				statusIco.removeEventListener("mouseleave", __MouseOut);
				statusIco.removeEventListener("click", __MouseClick);
	
				icon.innerHTML = "";
	
				hoverDebounce = false;
				playingPlId = undefined;
			};
	
	
			// MAIN
			function __OnIntervalForPlayerBar() {
				if (!this.masterCont.isConnected) {
					console.error("THIS.MASTERCONT NO LONGER CONNECTED, CLOSING AND CREATING NEW INSTANCE");
					
					this.Close();

					setTimeout(() => UDispatchEventToEW({
						func: "reinit-sidebar"
					}), 3000);
					return;
				};

				let data = playerBarBtn.__dataHost.__data;
				let playingItem = data.currentItem;

				if (thisCont && !thisCont.isConnected) {
					thisCont = undefined;
					curState = undefined;
				};
	
				if (curState !== undefined && !playingItem && thisCont) {
					__Reset(thisCont);
					curState = undefined;
	
					return
				};
	
				if (!playingItem) return;
	
				let newV;
	
				if (data.playing === true) newV = "playing";
				else if (data.showBufferingSpinner === true) newV = "loading";
				else newV = "paused";
	
				let thisPlId = playingItem.navigationEndpoint.watchEndpoint.playlistId;
	
				if (thisCont && playingPlId !== undefined && playingPlId !== thisPlId) {
					// remove playing icons from old paper
					__Reset(thisCont)
				};
	
				if (playingPlId === undefined || playingPlId !== thisPlId || !thisCont) {
					// add playing icons to new (or first) paper
					thisCont = __GetBtnCont(thisPlId);
	
					if (thisCont) {
						__Start(thisCont);
					} else{
						return
					};
				};
	
				playingPlId = thisPlId;
	
				if (newV !== curState) __SetState(thisCont, newV);
	
				curState = newV;
			};
	
			let svgs = {
				"play":UGetSVGFromRaw("play"),
				"playing": UGetSVGFromRaw("playing"),
				"paused": UGetSVGFromRaw("paused")
			};
	
			let playerBarBtn = document.querySelector("#play-pause-button.ytmusic-player-bar");
	
			let playingPlId;
			let thisCont;
			let curState;
			let hoverDebounce = false;
	
			if (window.cMusicFixerPlayerBarInterval) clearInterval(window.cMusicFixerPlayerBarInterval);

			window.cMusicFixerPlayerBarInterval = setInterval(() => __OnIntervalForPlayerBar.call(this), 100);
		};


		FolderOnClick(paperWrapper, event) {
			if (event) {
				event.preventDefault();
				event.stopImmediatePropagation();
			};
			
			if (
				paperWrapper.matches(":has(.c-editing)") ||
				paperWrapper.matches(":has(:not(.c-hidden) > .c-paper-item > .c-active)")
			) {
				UAddToClass(paperWrapper, "open");
				URemoveFromClass(paperWrapper, "closed");
				return;
			};

			if (paperWrapper.getAttribute("class").indexOf("open") === -1) {
				UAddToClass(paperWrapper, "open");
				URemoveFromClass(paperWrapper, "closed");
			} else {
				UAddToClass(paperWrapper, "closed");
				URemoveFromClass(paperWrapper, "open");
			};
		};


		AddInteractionToPaperItem(elem, id, mfId) {
			let navVerifyFunc = (e) => (!document.querySelector("#guide .c-editing, .c-popup-elem-overflow") && !elem.matches(".c-ovf-elem"));

			UNavigateOnClick(elem, UBuildEndpoint({
				id: id,
				navType: "browse"
			}), undefined, undefined, navVerifyFunc, false, false);

			if (!mfId) return;
			let browsePageType = UGetBrowsePageTypeFromBrowseId(id, true, true);

			let excessParams = [elem.querySelector(".c-paper-button-cont")];


			UNavigateOnClick(elem.querySelector(".c-paper-play-icon"), UBuildEndpoint({
				playlistId: mfId,
				navType: "watch",
				shuffle: false,
				cParams: { buildQueueFrom: id }
			}), this.InitButtonContOnNavClick, excessParams, undefined, true, true);

			UNavigateOnClick(elem.querySelector(".c-paper-shfl-icon"), UBuildEndpoint({
				playlistId: mfId,
				navType: "watch",
				shuffle: true,
				cParams: { buildQueueFrom: id }
			}), this.InitButtonContOnNavClick, excessParams, undefined, true, true);


			// don't initbuttoncontonnavclick for queue buttons:
			// backingPlaylistId does nto change, so will not get "playing" status. dont set them to loading.

			UNavigateOnClick(elem.querySelector(".c-paper-queueadd-icon"), UBuildEndpoint({
				playlistId: mfId,
				navType: "queueAdd",
				position: "end",
				listType: browsePageType,
				cParams: { buildQueueFrom: id }
			}), undefined, undefined, undefined, true, true);

			UNavigateOnClick(elem.querySelector(".c-paper-queuenext-icon"), UBuildEndpoint({
				playlistId: mfId,
				navType: "queueAdd",
				position: "next",
				listType: browsePageType,
				cParams: { buildQueueFrom: id }
			}), undefined, undefined, undefined, true, true);
		};


		CreatePaperElem(id, parent, insertBefore) {
			if (!insertBefore) insertBefore = null;

			let newElem = this.templates.paperWrapper.cloneNode(true);

			let cachedInfo = this.storage.cache[id] || {};
			let overwriteInfo = {}; // TODO: check for overwrite info
			let ytLoadedInfo = this.ytLoadedPlaylists[id];

			let mfId = "";
			if (ytLoadedInfo) mfId = ytLoadedInfo.mfId;
			else if (cachedInfo) {

				if (cachedInfo.type === "ARTIST") {
					if (cachedInfo.radios.allSongsPlId) mfId = cachedInfo.radios.allSongsPlId.replace(/^VL/, "");

				} else if (cachedInfo.type === "ALBUM" && !!cachedInfo.mfId) {
					mfId = cachedInfo.mfId;

				} else {
					let result = UGetMicroformatIdFromBrowseData(id);
					if (result) mfId = result;
				};
				
			} else {
				let result = UGetMicroformatIdFromBrowseData(id);
				if (result) mfId = result;
			};


			// title hierarchy: overwrite, ytLoaded, cached.

			let title;
			if (overwriteInfo && overwriteInfo.name) {
				title = overwriteInfo.name;

			} else if (ytLoadedInfo && ytLoadedInfo.title) {
				title = ytLoadedInfo.title;

			} else if (cachedInfo && cachedInfo.name) {
				title = cachedInfo.name;
			} else {
				title = "?";
			};


			// subtitle: prioritise cached.

			let subtitleRuns;
			if (cachedInfo) {
				subtitleRuns = this.GetMetadataFromCachedInfo(cachedInfo);

			};
			
			if (!subtitleRuns && ytLoadedInfo && ytLoadedInfo.subtitleRuns) {
				subtitleRuns = ytLoadedInfo.subtitleRuns;

			};


			newElem.querySelector(".c-paper-title").textContent = title;
			UCreateTextElemFromRuns(newElem.querySelector(".c-paper-subtitle"), subtitleRuns, cachedInfo.badges);


			let iconElem = newElem.querySelector(".c-paper-icon");

			if (cachedInfo && cachedInfo.thumb) {
				iconElem.src = cachedInfo.thumb;

			} else {
				iconElem.src = "";
				
				if (title !== "?") iconElem.style.display = "none";
			};


			if (this.storage.sidebar.hidden.indexOf(id) !== -1) {
				UHideElem(newElem);
			};

			newElem.setAttribute("href", `browse/${id}`); // middle mouse click or "new tab"
			newElem.setAttribute("plId", id);
			newElem.setAttribute("mfId", mfId);
			newElem.setAttribute("draggable", "false");
			newElem.setAttribute("c-clickable", "true");

			this.AddInteractionToPaperItem(newElem, id, mfId);

			if (parent) {
				parent.insertBefore(newElem, insertBefore);

				this.thisInstanceAddedElementsIds.push(id);
			};			

			return newElem;
		};


		CreateAndPopulateCarousel(id, parent, folderInfo, insertBefore) {
			if (!insertBefore) insertBefore = null;

			if (!folderInfo) folderInfo = this.storage.sidebar.folders.folders[id];
			if (!folderInfo) throw Error("No folder info for paper item " + id);

			let cont = document.createElement("div");
			cont.setAttribute("class", "c-carousel");
			cont.setAttribute("plId", folderInfo.id);

			parent.insertBefore(cont, insertBefore);

			this.PopulateCont(folderInfo.contents, cont);

			this.thisInstanceAddedElementsIds.push(id);

			return cont;
		};


		CreateAndPopulateFolderPaperItem(id, parent, insertBefore) {
			if (!insertBefore) insertBefore = null;

			let folderInfo = this.storage.sidebar.folders.folders[id];
			if (!folderInfo) throw Error("No folder info for paper item");

			if (this.thisInstanceAddedElementsIds.indexOf(id) !== -1) {
				throw Error(`Attempted to create the same folder twice. Cannot due to risk of recursion. (${id})`);
			};


			if (folderInfo.type === "carousel") {
				return this.CreateAndPopulateCarousel(id, parent, folderInfo, insertBefore);
			};


			let newElem = this.templates.paperWrapper.cloneNode(true);
			UAddToClass(newElem, "c-paper-folder closed");


			newElem.querySelector(".c-paper-title").textContent = folderInfo.title;
			if (folderInfo.subtitle) {
				UCreateTextElemFromRuns(
					newElem.querySelector(".c-paper-subtitle"),
					[{text: folderInfo.subtitle}]
				);
			};


			let folderIcon = UGetSVGFromRaw("folder");
			UAddToClass(folderIcon, "c-paper-icon");

			let oldImgElem = newElem.querySelector("img.c-paper-icon");
			newElem.querySelector(".c-paper-icon-cont").insertBefore(folderIcon, oldImgElem);

			oldImgElem.remove();

			let cont = document.createElement("div");
			cont.setAttribute("class", "c-paper-folder-cont");
			newElem.append(cont);


			this.thisInstanceAddedElementsIds.push(id);

			this.PopulateCont(folderInfo.contents, cont);


			// if has an active paper item that isnt hidden
			if (newElem.matches(":has(:not(.c-hidden) > .c-paper-item > .c-active)")) {
				UAddToClass(newElem, "open");
				URemoveFromClass(newElem, "closed");
			};

			newElem.firstElementChild.addEventListener("click", (e) => this.FolderOnClick(newElem, e));

			UHideElem(newElem.querySelector(".c-paper-button-cont")); // dont delete, need for edit!

			if (this.storage.sidebar.hidden.indexOf(id) !== -1) {
				UHideElem(newElem);
			};

			newElem.setAttribute("plId", id);
			newElem.setAttribute("draggable", "false");
			newElem.setAttribute("c-clickable", "true");

			parent.insertBefore(newElem, insertBefore);

			if (this._foldersToOpen.indexOf(id) !== -1) this.FolderOnClick(newElem);

			return newElem;
		};

		CreateSeparatorItem(id, parent, insertBefore) {
			if (!insertBefore) insertBefore = null;

			let sepInfo = this.storage.sidebar.separators.separators[id];
			if (!sepInfo) console.warn("No separator info for id", id, "couldnt get title");

			if (this.thisInstanceAddedElementsIds.indexOf(id) !== -1) {
				throw Error(`Attempted to create the same separator twice. Cannot due to quirks when deleting. (${id})`);
			};


			let newElem = this.templates.separator.cloneNode(true);

			if (sepInfo) newElem.querySelector(".c-sep-title").textContent = sepInfo.title;
			newElem.setAttribute("plId", id);

			parent.insertBefore(newElem, insertBefore);

			this.thisInstanceAddedElementsIds.push(id);

			return newElem;
		};




		PopulateCont(ids, cont) {
			for (let id of ids) {
				try {
					if 		(id.match(/^CF/)) this.CreateAndPopulateFolderPaperItem(id, cont);
					else if (id.match(/^CS/)) this.CreateSeparatorItem(id, cont);
					else this.CreatePaperElem(id, cont);


				} catch (err) {
					console.error(
						"ERROR ADDING PLID",
						id, 
						"TO CONT #",
						cont.getAttribute("id"),
						": ",
						err
					)
				};
			};
		};


		InsertAllPaperItemsInOrder(ytLoadedPlaylists) {
			let ytLoadedIds = (ytLoadedPlaylists || []).map( v => v.id );

			let paperItemOrder = this.storage.sidebar.paperItemOrder;
			let folders = this.storage.sidebar.folders.folders;


			let allPlaylistsWithSavedPosition = paperItemOrder.concat(
				Object.values(folders).map( v => v.contents ).flat()
			);

			// task 1: ytLoaded and isnt saved in a position (usually a new creation)
			// TODO: FIX BUG, CONTINUALLY REMOVING THIS, WE DONT SAVE TO CFMORE ANYMORE
			// 		NO WAY TO KNOW USER HAS TRIED TO REMOVE IT
			// (!cachedKeys.includes(elem[0])) // NEW 08/03/25, now if cached then wont appear at top, will be in CFMore.
			//  used to do, not good, will just disappear after first visit to page
			let appendToStart = ytLoadedIds.filter( v => allPlaylistsWithSavedPosition.indexOf(v) === -1 );
			let orderToInsert = appendToStart.concat(paperItemOrder)
			
			this.PopulateCont(orderToInsert, this.masterCont);

			// no longer creating multitude of extra items and filling CFMore with them
			// the call above is the only one necessary, all items in order are filled in
			// and all folders are filled recursively.
		};


		_OnChangeSentByEW(eventData) {
			if (!eventData.storage) {
				console.error("event.storage IS undefined, not running onChange action");
				return;
			};
			
			this.storage = eventData.storage;

			if (eventData.action === "new") {
				let parent = (eventData.parent === "guide") ? this.masterCont : this.masterCont.querySelector(`.c-paper-folder[plid=${eventData.parent}]`);
				let insertBefore = (eventData.position === undefined) ? null : parent.children[eventData.position];

				if (eventData.id.match(/^CF/)) this.CreateAndPopulateFolderPaperItem(eventData.id, parent, insertBefore);
				else if (eventData.id.match(/^CS/)) this.CreateSeparatorItem(eventData.id, parent, insertBefore);
				else this.CreatePaperElem(eventData.id, parent, insertBefore);

			} else if (eventData.action === "refreshCont") {
				this.RefreshCont(false);

			} else {
				console.error("What is this eventData action from EW for sidebar update", eventData.action, "?");
			};
		};


		ListenForChanges() {
			let madeFunctionDetail = URegisterListener({
				detail: {
					time: -1,
					func: UEventFuncForSidebarUpdate
				},
				resolve: this._OnChangeSentByEW,
				scope: this,
				once: false
			});

			this._onChangeListenerId = madeFunctionDetail.id;
		};

		RefreshCont(getNewStorage) {
			if (this.masterCont.matches(":has(.c-editing)")) {
				throw Error("Cannot refresh paper cont during edit mode.");
			};
			
			if (getNewStorage) {
				UMWStorageGet().then((storage) => {
					this.storage = storage || {};

					this.RefreshCont(false);
				});
			};

			let currentOpenedFolders = Array.from(document.querySelectorAll(".c-paper-folder.open"))
				.map(v => v.getAttribute("plid"));

			this._foldersToOpen = currentOpenedFolders;

			for (let elem of document.querySelectorAll("#guide .c-paper-wrapper:not([is-primary]), #guide .c-carousel, #guide .c-sidebar-sep")) elem.remove();
			this.thisInstanceAddedElementsIds = [];

			this.InsertAllPaperItemsInOrder();			
		};

		Close() {
			URemoveListener(this._onChangeListenerId);

			clearInterval(window.cMusicFixerPlayerBarInterval);
		};

		async MainTasks(startListening) {
			await UWaitForPolymerController();
			
			this.storage = await UMWStorageGet() || {};

			if (!this.accountInfo) {
				this.accountInfo = UGetUserAccountInfo();

				if (!this.accountInfo && this.storage.accountInfo) {
					this.accountInfo = this.storage.accountInfo;
				};
			};

			let ytLoadedPlaylists = this.EditYTDefaultPaperItems();
			for (let item of ytLoadedPlaylists) this.ytLoadedPlaylists[item.id] = item;

			for (let elem of document.querySelectorAll("#guide .c-paper-wrapper:not([is-primary]), #guide .c-carousel, #guide .c-sidebar-sep")) elem.remove();

			this.InsertAllPaperItemsInOrder(ytLoadedPlaylists);

			this.RespondToPlayerBar();

			if (startListening) this.ListenForChanges();
		};


		constructor() {
			this.accountInfo = UGetUserAccountInfo() || {};
			this.ytLoadedPlaylists = {};

			if (!!this.accountInfo) {
				UDispatchEventToEW({
					func: "save-account-info",
					accountInfo: this.accountInfo
				});
			};

			this.masterCont = document.querySelector("#sections>:not([is-primary])>#items");
			this.templates = {
				paperWrapper: document.querySelector(".c-templates-list .c-paper-wrapper"),
				separator: document.querySelector(".c-templates-list .c-sidebar-sep")
			};

			this.thisInstanceAddedElementsIds = [];
			this._foldersToOpen = [];
		};	
	};


	function _AsyncStartProcesses() {
		return new Promise(function(resolve, reject) {

			try {
				(new InjectMyPaperItems()).MainTasks(true).then(
					(fulfilled) => resolve(["success", String(fulfilled)]),
					(rejected) => {reject(["failure", String(rejected)]); console.error("MWInject err", rejected)}
				);
			} catch (err) {
				reject(["failure", String(err)]);
			};
		});
	};

	function _ExpireAndReject() {
		return new Promise(function(_, reject) {
			setTimeout(() => reject(["TIMEOUT!"]), UMAX_EXECUTION_TIMEOUT);
		});
	};

	console.log("MWINJECT");

	return Promise.race([ // return fastest
		_AsyncStartProcesses(),
		_ExpireAndReject()
	]);	
};