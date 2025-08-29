export async function MWEventDriven_PageChanges() {
	async function _PlaylistPage(browsePage) {
		// move userInfo to above thumbnail.
		let userInfo = (await UWaitForBySelector("#primary #contents .facepile-container", browsePage))[0];
		let sectionRenderer = userInfo.parentElement;

		sectionRenderer.insertBefore(userInfo, sectionRenderer.firstElementChild);

		let thumbRenderer = (await UWaitForBySelector("#primary #contents ytmusic-thumbnail-renderer.thumbnail", browsePage))[0];
		let editBtn = (await UWaitForBySelector("#primary #contents div.thumbnail-edit-button-wrapper", browsePage))[0];

		thumbRenderer.append(editBtn);
	};

	async function _AlbumAndPlaylistPage() {
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
	};

	async function _AlbumPage() {
		let listItems = await UWaitForBySelector("ytmusic-browse-response ytmusic-responsive-list-item-renderer");

		for (let listItem of listItems) {
			let thisCp = listItem.controllerProxy;
			let data = UDigDict(thisCp, ["__data", "data", "cData"]);
			if (!data) continue;

			if (data.from) {
				let nameElem = listItem.querySelector(".title-column yt-formatted-string.title");
				if (!nameElem) continue;

				let title = ((data.video) ? data.video.name : nameElem.getAttribute("title")) + " - " + data.from.name;
				nameElem.setAttribute("title", title);
			};

			if (data.changedByDeletion) {
				if (data.changedByDeletion.isDeleted) listItem.setAttribute("c-hidden", true);
			};

			if (data.skip) {
				listItem.setAttribute("c-skipped", "true");
			};
		};

		UAddSkipIconsToListItems(listItems);
	};

	function _UpdateMainSidebarButtons(state) {
		let browseId = UDigDict(state, [
			"navigation", "mainContent", "endpoint",
			"data", "browseId"
		]);
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

		switch (newValue) {
			case "MUSIC_PAGE_TYPE_PLAYLIST":
				_AlbumAndPlaylistPage(browsePage);
				_PlaylistPage(browsePage);
				break;

			case "MUSIC_PAGE_TYPE_ALBUM":
				_AlbumAndPlaylistPage(browsePage);
				_AlbumPage();
				break;
		};

		let edited = !!UDigDict(state, ["navigation", "mainContent", "response", "cMusicFixerExtChangedResponse"]);
		browsePage.setAttribute("c-edited", edited);

		ButtonBar.UpdateButtons(state);

		_UpdateMainSidebarButtons(state);
	};

	async function _OnDOMChange(changes, browsePage) {
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

	async function _AsyncStartProcesses() {
		let browsePage = ( await UWaitForBySelector("ytmusic-browse-response") )[0];
		let navigationProgressBar = ( await UWaitForBySelector("yt-page-navigation-progress") )[0];

		let observer = new MutationObserver((changes) => {
			_OnDOMChange(changes, browsePage);
		});

		observer.observe(navigationProgressBar, {
			childList: false,
			subtree: false,
			attributes: true,
			attributeFilter: ["aria-valuenow"],
			attributeOldValue: true
		});

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