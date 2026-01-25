export class PlayerPage {

	RefreshElements() {
		this.playerBar = document.querySelector("ytmusic-player-bar");
		this.slider = this.playerBar.querySelector("#progress-bar");
		this.root = document.querySelector(":root");
	};

	InitRoot() {
		this.root.style.setProperty("--imgHeight", `${ext.IMG_HEIGHT}px`);
		this.root.style.setProperty("--scrolled-height", "0px");
	};

	SetTransitionSpeed(speed) {
		this.root.style.setProperty("--c-player-bkg-transition", `opacity ${speed} ease`);

		this.currentTransitionSpeed = speed;
	};

	CreatePlayerBackground(parent) {
		const div = document.createElement("div");
		ext.AddToClass(div, "c-player-bkg");

		const parentElem = document.querySelector(parent);
		parentElem.removeAttribute("aria-hidden");
		
		if (parent === this.PLAYER_PAGE_SELECTOR) {
			div.setAttribute("id", "c-player-page-bkg");

			parentElem.insertBefore(div, parentElem.firstElementChild);
			return;
		};

		parent.append(div);
	};

	CreatePlayerBkgElems() {
		this.PLAYER_BACKGROUNDS.forEach(this.CreatePlayerBackground);


	};

	async SetThumbnail(url) {
		this.root.style.setProperty("--playing-thumbnail", `url(${url})`);

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

	Interval() {
		if (!(this.playerBar && this.slider)) {
			this.RefreshElements();
			return;
		};
		
		const playerResponse = this.playerBar.playerApi.getPlayerResponse();
		if (!playerResponse?.videoDetails) return;

		const currentTime = this.playerBar.playerApi.getCurrentTime();
		const totalTime = Number(playerResponse.videoDetails.lengthSeconds);

		this.slider.setProperty("--v", currentTime / totalTime);

		if (this.playingVideoId === playerResponse.videoDetails.videoId) return;
		this.playingVideoId = playerResponse.videoDetails.videoId;

		const thumb = ext.ChooseBestThumbnail(playerResponse.videoDetails.thumbnail?.thumbnails);
		if (thumb) this.SetThumbnail(thumb);
	};

	constructor() {
		////this.TRANSITION_SPEEDS = {
		//	fast: 
		//};

		this.PLAYER_PAGE_SELECTOR = "ytmusic-player-page";

		this.PLAYER_BACKGROUNDS = [
			"#player-bar-background.ytmusic-app-layout",
			this.PLAYER_PAGE_SELECTOR
		];

		this.playingVideoId = "";

		
		//this.ytApi = document.querySelector("ytmusic-app");
		this.RefreshElements();
		this.InitRoot();
	};
};