export async function MWEventDriven_PageChanges() {
	async function _PlaylistPage(browsePage) {
		// move userInfo to above thumbnail.
		let userInfo = (await UWaitForBySelector("#primary #contents .facepile-container", browsePage))[0];
		let sectionRenderer = userInfo.parentElement;

		sectionRenderer.insertBefore(userInfo, sectionRenderer.firstElementChild);

		let thumbRenderer = (await UWaitForBySelector("#primary #contents ytmusic-thumbnail-renderer.thumbnail", browsePage))[0];
		let editBtn = (await UWaitForBySelector("#primary #contents div.thumbnail-edit-button-wrapper", browsePage))[0];

		thumbRenderer.append(editBtn);

		let listItems = await UWaitForBySelector(U_HELPFUL_QUERIES.listItemRenderersOfCurrentBrowseResponse);
		UAddTitleIconsToListItems(listItems);
	};

	async function _AlbumAndPlaylistPage(browsePage, state) {
		let titleElem = (await UWaitForBySelector("ytmusic-browse-response #contents #primary #contents yt-formatted-string.title"))[0];
		let computedStyleOf = getComputedStyle(titleElem);
		let bounds = titleElem.getBoundingClientRect();
		let textSpansHeight = titleElem.scrollHeight; // total of visible + overflow

		if (bounds.height < textSpansHeight) { // text wants to span more than allowed
			let lineHeightInt = Number(computedStyleOf.lineHeight.replace("px", ""));

			let totalLines = textSpansHeight / lineHeightInt;
			let maxHeightPerLineToFit = bounds.height / totalLines;

			titleElem.style.lineHeight = String(maxHeightPerLineToFit) + "px";
			titleElem.style.fontSize = String(maxHeightPerLineToFit * 0.75) + "px";
		};

		if (UDigDict(state, UDictGet.cExtCoolBkg)) {
			browsePage.setAttribute("c-fancy-page", "list");
		};
	};

	async function _AlbumPage() {
		let listItems = await UWaitForBySelector(U_HELPFUL_QUERIES.listItemRenderersOfCurrentBrowseResponse);

		for (let listItem of listItems) {
			let nameElem = listItem.querySelector(".title-column yt-formatted-string.title");
			let nameText = nameElem.querySelector("a");

			let title = nameElem.getAttribute("title");
			nameText.setAttribute("title", title);
			nameElem.removeAttribute("title");

			let data = UDigDict(listItem, UDictGet.cDataFromElem);

			if (!data) continue;

			if (data.from) {
				let thisTitle = ((data.video) ? data.video.name : title) + " - " + data.from.name;
				nameText.setAttribute("title", thisTitle);
			};

			if (data.changedByDeletion) {
				if (data.changedByDeletion.isDeleted) listItem.setAttribute("c-hidden", true);
			};

			if (data.skip) {
				listItem.setAttribute("c-skipped", "true");
			};
		};

		UAddSkipIconsToListItems(listItems);
		UAddTitleIconsToListItems(listItems);
	};

	function _UpdateMainSidebarButtons(state) {
		let browseId = UDigDict(state, UDictGet.browseIdFromPolymerState);
		let browseHref = "browse/" + browseId;

		let allWrappers = document.querySelectorAll(".c-paper-wrapper[is-primary]");
		let thisButton = document.querySelector(`.c-paper-wrapper[is-primary][href='${browseHref}'] ytmusic-guide-entry-renderer`);

		for (let wrapper of allWrappers) {
			let icon = U_GUIDE_ICONS.inactive[wrapper.getAttribute("href").replace("browse/", "")];

			wrapper.querySelector("ytmusic-guide-entry-renderer").removeAttribute("active");
			wrapper.querySelector("ytmusic-guide-entry-renderer yt-icon.guide-icon path").setAttribute("d", icon);
		};

		if (thisButton) {
			thisButton.setAttribute("active", "");

			thisButton.querySelector("yt-icon.guide-icon path").setAttribute("d", U_GUIDE_ICONS.active[browseId]);
		};
	};


	function _EvaluateNewValue(browsePage, state, newValue) {
		browsePage.setAttribute("c-page-type", newValue);
		browsePage.removeAttribute("c-fancy-page");

		switch (newValue) {
			case "MUSIC_PAGE_TYPE_PLAYLIST":
				_AlbumAndPlaylistPage(browsePage, state);
				_PlaylistPage(browsePage);
				break;

			case "MUSIC_PAGE_TYPE_ALBUM" || "C_PAGE_TYPE_PRIVATE_ALBUM":
				_AlbumAndPlaylistPage(browsePage, state);
				_AlbumPage();
				break;
		};

		let edited = !!UDigDict(state, UDictGet.cDidExtChangeResponse);
		browsePage.setAttribute("c-edited", edited);

		ButtonBar.UpdateButtons(state);

		_UpdateMainSidebarButtons(state);
	};

	function _OnProgressBarValueChange(changes, browsePage) {
		for (let change of changes) {
			let attributeName = change.attributeName;
			let target = change.target;
			let newValue = target.getAttribute(attributeName);

			if (newValue !== "100") continue;
	
			let state = polymerController.store.getState();
			let browsePageType = UGetBrowsePageType(state);

			_EvaluateNewValue(browsePage, state, browsePageType);
		};
	};

	function _OnPopupDropdownFocusedChange(changes) {
		console.log("hello", changes[0]);
		let change = changes[0];
		let target = change.target;

		if (target.getAttribute(change.attributeName)) return;

		let lir = target.__data.positionTarget.closest("ytmusic-responsive-list-item-renderer");
		if (!lir) return;

		for (let menuItem of target.querySelectorAll(".ytmusic-menu-popup-renderer[role=\"menuitem\"]")) {
			let data = menuItem.controllerProxy.__data.data;
			console.log(data);

			if (data.icon && data.icon.cSvg) {
				let svg = UGetSVGFromRaw(data.icon.cSvg, false, false);
				let current = menuItem.querySelector("svg");
				
				if (current) current.outerHTML = svg.outerHTML;
				else menuItem.querySelector("yt-icon").append(svg);
			};

			if (data.serviceEndpoint) {
				console.log(data.serviceEndpoint, data.serviceEndpoint.customEndpoint);
				let custom = data.serviceEndpoint.customEndpoint;
				
				if (custom) {
					menuItem.onclick = () => {
						new CustomEndpointHandler(custom, lir);
					};
				};
			};
		};
	};

	async function _PopupDropdownFeatures() {
		let popupCont = ( await UWaitForBySelector("ytmusic-popup-container") )[0];
		let ironDropdown = ( await UWaitForBySelector("tp-yt-iron-dropdown", popupCont, true) )[0];

		let observer2 = new MutationObserver((changes) => {
			_OnPopupDropdownFocusedChange(changes);
		});

		observer2.observe(ironDropdown, {
			childList: false,
			subtree: false,
			attributes: true,
			attributeFilter: ["aria-hidden"],
			attributeOldValue: false
		});

		// INIT
		_OnPopupDropdownFocusedChange([{
			target: ironDropdown,
			attributeName: "aria-hidden"
		}]);
	};

	async function _AsyncStartProcesses() {
		let browsePage = ( await UWaitForBySelector("ytmusic-browse-response") )[0];
		let navigationProgressBar = ( await UWaitForBySelector("yt-page-navigation-progress") )[0];
		

		let observer = new MutationObserver((changes) => {
			_OnProgressBarValueChange(changes, browsePage);
		});

		observer.observe(navigationProgressBar, {
			childList: false,
			subtree: false,
			attributes: true,
			attributeFilter: ["aria-valuenow"],
			attributeOldValue: false
		});

		_PopupDropdownFeatures(); // DON'T AWAIT. WOULD BLOCK INIT.

		// init
		let state = polymerController.store.getState();
		let browsePageType = UGetBrowsePageType(state);
		_EvaluateNewValue(browsePage, state, browsePageType);

		return "success";
	};

	function _ExpireAndReject() {
		return new Promise(function(_, reject) {
			setTimeout(() => reject(["TIMEOUT!"]), UMAX_EXECUTION_TIMEOUT);
		});
	};

	console.log("MWEXTRA");


	return Promise.race([ // return fastest
		// DO NOT ADD NEW FUNCTIONALITY HERE!! ADD IT IN ASYNCSTARTPROCESSES()
		_AsyncStartProcesses(),
		_ExpireAndReject(),
	]);
};