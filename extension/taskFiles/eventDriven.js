export class EventDriven {

	// PAGE MODIFIERS
	async AlbumAndPlaylist(state) {
		if (ext.SafeDeepGet(state, ext.Structures.cExtCoolBkg())) {
			this.browsePage.setAttribute("c-fancy-page", "list");
		};
	};

	async Album(state) {

	};








	ModifyPage() {
		const state = polymerController.store.getState();
		const browsePageType = ext.GetBrowsePageType(state);

		this.browsePage.setAttribute("c-page-type", browsePageType);
		this.browsePage.removeAttribute("c-fancy-page");

		if (ext.BrowsePageTypes.isPlaylist(browsePageType)) {
			this.AlbumAndPlaylist(state);
		};
	};



	OnDropdownFocusChange(changes) {
		const change = changes[0];

		if (change.target.getAttribute(change.attributeName) !== "100") return;
		this.ModifyPage();
	};

	OnProgressBarValueChange(changes) {

	};

	async LoadNavProgressObserver() {
		this.browsePage = (await ext.WaitForBySelector("ytmusic-browse-response"))[0];
		this.navProgressBar = (await ext.WaitForBySelector("yt-page-navigation-progresss"))[0];

		this.observers.navProgress = new MutationObserver(this.OnProgressBarValueChange);

		this.observers.navProgress.observe(this.browsePage, {
			childList: false,
			subtree: false,
			attributes: true,
			attributeFilter: ["aria-valuenow"],
			attributeOldValue: false
		});
	};

	async LoadDropdownObserver() {
		this.dropdown = (await ext.WaitForBySelector("ytmusic-popup-container tp-yt-iron-dropdown"))[0];

		this.observers.dropdown = new MutationObserver(this.OnDropdownFocusChange);

		this.observers.dropdown.observe(this.dropdown, {
			childList: false,
			subtree: false,
			attributes: true,
			attributeFilter: ["aria-hidden"],
			attributeOldValue: false
		});
	};

	async init() {
		await ext.WaitForPolymerController();

		this.LoadNavProgressObserver();
		this.LoadDropdownObserver();		
	};

	constructor() {
		this.observers = {
			navProgress: undefined,
			dropdown: undefined
		};
	};
};