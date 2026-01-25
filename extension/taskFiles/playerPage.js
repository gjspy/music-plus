function NiceColours() {
	const BKG_PARENTS = ["#player-bar-background.ytmusic-app-layout", "#player-bar-background.ytmusic-app-layout", "#mini-guide-background.ytmusic-app-layout","ytmusic-player-page"];
	const OP_TRANSITION_TIME = 4;
	const FAST_OP_TRANSITION = 0.5;
	let dataNow = {
		transition: 0,
		playingThumbnail: "",
		dimness: "dim"
	};

	function _CreatePlrBkgs() {
		let made = [];

		for (let parent of BKG_PARENTS) {
			let div = document.createElement("div");
			ext.AddToClass(div, "c-player-bkg");

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
		ext.AddToClass(playerBarTransitioner, "player-bar-fader");

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
		if (dataNow.transition === time) return;
		root.style.setProperty("--c-player-bkg-transition", `opacity ${time}s ease`);
		
		dataNow.transition = time;
	};

	async function _PublishPlayingThumbnail(url) {
		const resp = await fetch(url);
		const buffer = await resp.arrayBuffer();

		ext.DispatchEventToEW({
			func: "auto-lights",
			action: "setImg",
			imgData: buffer,
			imgType: resp.headers.get("content-type"),
			autoMusic: true
		});
	};

	function _SetPlayingThumbnail(url) {
		if (dataNow.playingThumbnail === url) return;

		root.style.setProperty("--playing-thumbnail", `url(${url})`);
		dataNow.playingThumbnail = url;

		_PublishPlayingThumbnail(url);		
	};

	function _Dim() {
		if (dataNow.dimness === "dim") return;
		root.style.setProperty("--c-player-bkg-opacity", 0);

		/*UDispatchEventToEW({
			func: "auto-lights",
			action: "dim",
			transition: dataNow.transition,
			autoMusic: true
		});*/

		dataNow.dimness = "dim";
	};

	function _Undim() {
		if (dataNow.dimness === "undim") return;
		root.style.setProperty("--c-player-bkg-opacity", 1);

		/*setTimeout(() => UDispatchEventToEW({
			func: "auto-lights",
			action: "undim",
			transition: dataNow.transition,
			autoMusic: true
		}), 100);*/

		dataNow.dimness = "undim";
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
		root.style.setProperty("--imgHeight", `${ext.IMG_HEIGHT}px`);
		root.style.setProperty("--scrolled-height", "0px");
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

		let thisImg = ext.ChooseBestThumbnail(videoDetails.thumbnail.thumbnails);
		let thisVId = videoDetails.videoId;

		let nextThumb = _GetNextThumb(playerBar); // in queue

		if (nextThumb) {
			nextThumb = ext.UpscaleImgQuality(nextThumb);
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
		let shouldBeDim = diff < OP_TRANSITION_TIME + 1 && nextThumb !== thisImg && !tryingToFix;
		if (shouldBeDim) {
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



	function _ColourFeaturesInterval() {
		try {
			_UpdatePlayerBackgrounds();
		} catch(err) {
			console.log("Couldn't update player backgrounds:", err);
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

	_CreatePlrBkgs();

	document.addEventListener("scroll", _OnScroll);

	setInterval(_ColourFeaturesInterval, 500);
};

NiceColours();

fconsole.log("playerPage runner initialised successfully");
["success"];