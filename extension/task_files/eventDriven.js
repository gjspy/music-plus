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

	function _EvaluateNewValue(browsePage, state, newValue, retry) {
		console.log("moved to", newValue, "retry = ", retry);

		switch (newValue) {
			case "MUSIC_PAGE_TYPE_PLAYLIST":
				_AlbumAndPlaylistPage(browsePage);
				_PlaylistPage(browsePage);
				break;

			case "MUSIC_PAGE_TYPE_ALBUM":
				_AlbumAndPlaylistPage(browsePage);
				_AlbumPage(browsePage);
				break;
		};
	};

	async function _OnDOMChange(changes, browsePage) {
		for (let change of changes) {
			let oldValue = change.oldValue;
			let attributeName = change.attributeName;
			let target = change.target;
			let newValue = target.getAttribute(attributeName);

			if (newValue !== "100") continue;
	
			let state = polymerController.store.getState();
			let browsePageType = UGetBrowsePageType(state);

			browsePage.setAttribute("c-page-type", browsePageType);

			_EvaluateNewValue(browsePage, state, browsePageType);
		};
	};

	async function _AsyncStartProcesses() {
		return new Promise(async function(resolve, reject) {
			let browsePage = ( await UWaitForBySelector("ytmusic-browse-response") )[0];
			let navigationProgressBar = ( await UWaitForBySelector("yt-page-navigation-progress") )[0];

			let observer = new MutationObserver((changes) => {
				_OnDOMChange(changes, browsePage);
			});

			observer.observe(navigationProgressBar, {
				childList: false,
				subtree: false,
				attributes: true,
				//attributeFilter: ["page-type"],
				attributeFilter: ["aria-valuenow"],
				attributeOldValue: true
			});

			// init
			let state = polymerController.store.getState();
			let browsePageType = UGetBrowsePageType(state);
			_EvaluateNewValue(browsePage, state, browsePageType);

			

			resolve(["success"]);
		});
	};

	async function _ExpireAndReject() {
		setTimeout(() => {
			throw new Error("TIMEOUT!");

		}, UMAX_EXECUTION_TIMEOUT);
	};

	console.log("MWEXTRA");


	return Promise.race([ // return fastest
		// DO NOT ADD NEW FUNCTIONALITY HERE!! ADD IT IN ASYNCSTARTPROCESSES()
		_AsyncStartProcesses(),
		_ExpireAndReject(),
	]);
};