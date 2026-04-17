class Utils {


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
};