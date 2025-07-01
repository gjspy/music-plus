function NiceColours() {
	const BKG_PARENTS = ["#player-bar-background.ytmusic-app-layout", "#player-bar-background.ytmusic-app-layout", "#mini-guide-background.ytmusic-app-layout","ytmusic-player-page"];
	const OP_TRANSITION_TIME = 4;
	const FAST_OP_TRANSITION = 0.5;

	function _CreatePlrBkgs() {
		let made = [];

		for (let parent of BKG_PARENTS) {
			let div = document.createElement("div");
			UAddToClass(div, "c-player-bkg");

			if (parent === "ytmusic-player-page") {
				div.setAttribute("id", "c-player-page-bkg");

				player = document.querySelector(parent);
				player.insertBefore(div, player.firstElementChild);

				made.push(div);

				continue;
			};
			
			parent = document.querySelector(parent);

			parent.removeAttribute("aria-hidden");
			parent.append(div);

			made.push(div);
		};

		let playerBarTransitioner = document.querySelector(BKG_PARENTS[0]).firstElementChild;
		UAddToClass(playerBarTransitioner, "player-bar-fader");

		return made;
	};

	function _GetRendererFromQueueObj(queueObj) {
		let videoRenderer = queueObj.playlistPanelVideoRenderer;

		if (videoRenderer) return videoRenderer;

		let primaryRenderer = queueObj.playlistPanelVideoWrapperRenderer.primaryRenderer;
		return Object.values(primaryRenderer)[0];
	};

	function _GetNextThumb(playerBar) {
		// use builtin queue api from playeruiService to get full queue, and find next
		//let queueContents = playerBar.playerUiService.queue.getItems();
		let state = playerBar.playerUiService.store.getState();
		let queueContents = state.queue.items;
		let automixContents = state.queue.automixItems;
		let repeatMode = state.queue.repeatMode;

		// let repeatMode = playerBar.getAttribute("repeat-mode");

		let i, playingRenderer;

		for (i = 0; i < queueContents.length; i++) {
			let queueObj = queueContents[i];
			let videoRenderer = _GetRendererFromQueueObj(queueObj);

			if (!videoRenderer) continue;

			if (videoRenderer.selected === true) {
				playingRenderer = videoRenderer;

				break;
			};
		};

		if (!playingRenderer) {
			console.log("Nothing is playling? Got queue length:", queueContents.length);
			return;
		};

		let isLast = (i === queueContents.length - 1);


		if (repeatMode === "ONE") return playingRenderer.thumbnail.thumbnails[0].url;

		if (repeatMode === "NONE" && isLast) {
			//let firstAutomix = document.querySelector("ytmusic-player-queue#queue #automix-contents > *");
			if (automixContents.length === 0) return;

			let firstAutomix = _GetRendererFromQueueObj(automixContents[0]);

			return firstAutomix.thumbnail.thumbnails[0].url;			
		};

		if (repeatMode === "ALL" && isLast) {
			let nextQueueObj = queueContents[0];
			let nextRenderer = _GetRendererFromQueueObj(nextQueueObj);

			if (!nextRenderer) return;
			return nextRenderer.thumbnail.thumbnails[0].url;
		}

		let nextQueueObj = queueContents[i + 1];
		let nextRenderer = _GetRendererFromQueueObj(nextQueueObj);
			
		if (!nextRenderer) return;
		return nextRenderer.thumbnail.thumbnails[0].url;
	};

	function _SetTransitionValue(time) {
		root.style.setProperty("--c-player-bkg-transition", `opacity ${time}s ease`);
	};

	function _SetPlayingThumbnail(url) {
		root.style.setProperty("--playing-thumbnail", `url(${url})`);
	};

	function _SetBackgroundThumbnail(url) {
		root.style.setProperty("--page-background", `url(${url})`);
	};

	function _Dim() {
		root.style.setProperty("--c-player-bkg-opacity", 0);
	};

	function _Undim() {
		root.style.setProperty("--c-player-bkg-opacity", 1);
	};

	function _DoBlockingTransition(thisImg) {
		function __Reset() {
			_SetTransitionValue(OP_TRANSITION_TIME);

			blocking_transitioning = false;
			console.log("DONE");
		};


		function __OnceDimmed() {
			_SetPlayingThumbnail(thisImg);
			_Undim();

			setTimeout(__Reset, FAST_OP_TRANSITION * 1000);
		};


		blocking_transitioning = true;
		console.log("BLOCKINGTRANSITIONING");

		_SetTransitionValue(FAST_OP_TRANSITION);
		_Dim();

		setTimeout(__OnceDimmed, FAST_OP_TRANSITION * 1000);
	};


	function _InitRoot() {
		root.style.setProperty("--imgHeight", `${UIMG_HEIGHT}px`);
		root.style.setProperty("--scrolled-height", `0px`);
		_SetTransitionValue(OP_TRANSITION_TIME);
	};


	// MAIN FUNCTION for player backgrounds.
	// this is called every interval, with all logic.
	function _UpdatePlayerBackgrounds() {
		if (blocking_transitioning === true) return;
		
		// source all the things we need, wait for..
		if (!playerBar) {
			playerBar = document.querySelector("ytmusic-player-bar");
			if (!playerBar) return;
		};

		if (!slider) {
			slider = playerBar.querySelector("#progress-bar");
			if (!slider) return;
		};

		if (!root) {
			root = document.querySelector(":root");
			if (!root) return;

			_InitRoot();
		};

		// now using apis for details
		let playerResponse = playerBar.playerUiService.playerApi.getPlayerResponse();
		if (!playerResponse) return;

		let videoDetails = playerResponse.videoDetails;

		let currentTime = playerBar.playerUiService.playerApi.getCurrentTime();
		let totalTime = Number(videoDetails.lengthSeconds);

		let v = currentTime / totalTime;
		let diff = totalTime - currentTime;

		// set % played as property of slider
		slider.style.setProperty("--v", v);

		//let thisImg = UUpscaleThumbQuality(imgElem.src); // middle-controls
		let thisImg = UChooseBestThumbnail(videoDetails.thumbnail.thumbnails);
		let thisVId = videoDetails.videoId;

		let nextThumb = _GetNextThumb(playerBar); // in queue
		//if (!nextThumb) return;

		if (nextThumb) {
			nextThumb = UUpscaleThumbQualityStr(nextThumb);
		};


		// trying to fix youtube's broken gapless audio;
		// song metadata updates to next, but stays at end-of-song timestamp;
		// so if has done this and is frozen, seekTo(0 seconds) to restart it.
		let tryingToFix = false;

		if (diff < 3 && thisVId !== playingVId && playingVId !== undefined) {
			console.log("trying to fix, seeking and playing");
			playerBar.playerUiService.playerApi.seekTo(0);
			playerBar.playerUiService.playerApi.play();

			tryingToFix = true;
		};

		// normal autoplay flow.
		// no intervals / timeouts, simply always dim when at the end and undim at start.
		if (diff < OP_TRANSITION_TIME + 1 && nextThumb !== thisImg && !tryingToFix) {
			_Dim();
			// console.log("dimming");

			dimmed = true;

		} else {
			_Undim();
			// console.log("undimming");

			if (dimmed === true) lastImg = thisImg;
			dimmed = false;
		};

		
		// this is for when the user clicks on a new song / clicks next.
		// blocking_transition prevents interval changing anything, and
		// conducts a short transition between the two songs.
		if (thisImg !== lastImg && lastImg !== undefined && !dimmed) { 
			playingVId = thisVId;
			lastImg = thisImg;

			_DoBlockingTransition(thisImg);
			return; // !!!
		};

		playingVId = thisVId;
		lastImg = thisImg;

		_SetPlayingThumbnail(thisImg);
	};


	function _UpdateNonColouredGuide() {
		if (!appLayout) {
			appLayout = document.querySelector("ytmusic-app-layout");
			if (!appLayout) return;
		};

		if (!root) {
			root = document.querySelector(":root");
			if (!root) return;

			_InitRoot();
		};

		let currentData = appLayout.__dataHost.__data.mainContentData;
		let backgroundData = currentData.response.background; // normal pages

		if (!backgroundData) {
			//try { // artist page
				//backgroundData = currentData.response.header.musicImmersiveHeaderRenderer.thumbnail;

			//} catch {
				_SetBackgroundThumbnail("");
				return;
			//};			
		};

		let backgroundRenderer = Object.values(backgroundData)[0];

		// make transition between player page and this
		
		// do not upscale this: they have different aspect ratio (not square)
		let background = backgroundRenderer.thumbnail.thumbnails[0].url;
		_SetBackgroundThumbnail(background);
	};


	function _MakeAutomixInteractable() {
		let automixItems = document.querySelectorAll(
			`ytmusic-player-page #side-panel #automix-contents #primary-renderer > ytmusic-player-queue-item[is-automix],
			ytmusic-player-page #side-panel #automix-contents > ytmusic-player-queue-item[is-automix]
			`
		);

		for (let elem of automixItems) {
			elem.removeAttribute("is-automix");
		};
	};


	function _ColourFeaturesInterval() {
		try {
			_UpdatePlayerBackgrounds();
		} catch(err) {
			console.log("Couldn't update player backgrounds:", err);
		};


		try {
			_UpdateNonColouredGuide();
		} catch(err) {
			console.log("Couldn't update non coloured guide:", err);
		};

		try {
			_MakeAutomixInteractable();
		} catch (err) {
			console.log("Couldn't make automix interactable:", err);
		};

		try {
			PlayerPage_ClearQueue();
		} catch (err) {
			console.log("Couldn't add clear queue btn:", err)
		};
	};


	function _OnScroll() {
		let scrollHeight = window.scrollY;

		root.style.setProperty("--scrolled-height", `${scrollHeight}px`);
	};

	let playerBar, slider, root;
	let playingVId, lastImg;
	let blocking_transitioning = false;
	let dimmed = false;

	let appLayout;

	_CreatePlrBkgs();

	document.addEventListener("scroll", _OnScroll);

	setInterval(_ColourFeaturesInterval, 500);
};

function PlayerPage_ClearQueue() {
	function OnClick_SoftClear() {
		if (clicked === true) {
			console.log("clear queue is on cooldown.");
			return;
		};

		clicked = true;

		USoftClearQueue();

		setTimeout(function() {
			clicked = false;
		}, 10000);
	};

	const playerPageSideButtons = document.querySelector("ytmusic-player-page #side-panel ytmusic-queue-header-renderer #buttons:not(:has(#clear-queue))");
	if (!playerPageSideButtons) return;

	let button = UCreateButton("list-remove", "Clear Queue", "dark");
	button.addEventListener("click", OnClick_SoftClear);

	let clicked = false;

	playerPageSideButtons.append(button);
};

async function _AsyncStartProcesses() {
	return new Promise(function(resolve, reject) {
		try {
			NiceColours();
			console.log("done nice colours");

		} catch(err) {
			console.log("colour features error " + err);
			reject(["failure", String(err)]);
		};

		try {
			PlayerPage_ClearQueue();
			console.log("done add clear queue button");

		} catch(err) {
			console.log("add  clear queue button error " + err);
			reject(["failure", String(err)]);
		};


		resolve(["success"]);		
	});
};

async function _ExpireAndReject() {
	return new Promise(function(_, reject) {
		setTimeout(() => reject(["TIMEOUT!"]), UMAX_EXECUTION_TIMEOUT);
	});
};

Promise.race([ // return fastest
	_AsyncStartProcesses(),
	_ExpireAndReject(),
]);

