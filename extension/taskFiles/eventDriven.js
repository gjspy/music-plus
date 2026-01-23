export class EventDriven {

	UpdatePrimarySidebarButtons(state) {
		const browseId = ext.SafeDeepGet(state, ext.Structures.browseIdFromPolymerState());
		const browseHref = "browse/" + browseId;

		const allWrappers = document.querySelectorAll(".c-paper-wrapper[is-primary]");
		const thisButton = document.querySelector(`.c-paper-wrapper[is-primary][href='${browseHref}'] ytmusic-guide-entry-renderer`);

		for (let wrapper of allWrappers) {
			let icon = ext.GUIDE_ICON_SVG_PATHS.inactive[wrapper.getAttribute("href").replace("browse/", "")];

			wrapper.querySelector("ytmusic-guide-entry-renderer").removeAttribute("active");
			wrapper.querySelector("ytmusic-guide-entry-renderer yt-icon.guide-icon path").setAttribute("d", icon);
		};

		if (thisButton) {
			thisButton.setAttribute("active", "");

			thisButton.querySelector("yt-icon.guide-icon path").setAttribute("d", ext.GUIDE_ICON_SVG_PATHS.active[browseId]);
		};
	};

	// PAGE MODIFIERS
	async AlbumAndPlaylist(state) {
		console.log("both");
		if (ext.SafeDeepGet(state, ext.Structures.cExtCoolBkg())) {
			this.browsePage.setAttribute("c-fancy-page", "list");
		};

		const listItems = await ext.WaitForBySelector(ext.HELPFUL_SELECTORS.listItemRenderersOfCurrentBrowseResponse);
		ext.AddTitleIconsToListItems(listItems);
	};

	async Album(state) {
		console.log("ALBUM");
		const listItems = await ext.WaitForBySelector(ext.HELPFUL_SELECTORS.listItemRenderersOfCurrentBrowseResponse);
		
		listItems.forEach(listItem => {
			const nameElem = listItem.querySelector(".title-column yt-formatted-string.title");
			const nameText = nameElem.querySelector("a");

			const title = nameElem.getAttribute("title");
			nameText.setAttribute("title", title);
			nameElem.removeAttribute("title");

			const data = ext.SafeDeepGet(listItem, ext.Structures.cDataFromElem());
			if (!data) return;

			if (data.albumData.id !== data.thisData.cameFrom.id) {
				let thisTitle = ((data.thisData.newData?.name) ? data.thisData.newData.name : title) + " - " + data.thisData.cameFrom.name;
				nameText.setAttribute("title", thisTitle);
			};

			if (data.thisData.hidden) listItem.setAttribute("c-hidden", true);
			if (data.thisData.skipped) listItem.setAttribute("c-skipped", "true");
		});

		ext.AddLeftIconsToListItems(listItems);
	};

	async Playlist(state) {
		// MOVE USERINFO ABOVE TABLE.
		const facepile = (await ext.WaitForBySelector("#primary #contents .facepile-container", this.browsePage))[0];
		const headerSection = facepile.parentElement;

		headerSection.insertBefore(facepile, headerSection.firstElementChild);

		// MOVE EDIT BTN OF THUMBNAILS
		const thumbRenderer = (await ext.WaitForBySelector("#primary #contents ytmusic-thumbnail-renderer.thumbnail", this.browsePage))[0];
		const editBtn = (await ext.WaitForBySelector("#primary #contents div.thumbnail-edit-button-wrapper", this.browsePage))[0];

		thumbRenderer.append(editBtn);
	};






	ModifyPage() {
		const state = polymerController.store.getState();
		const browsePageType = ext.GetBrowsePageType(state);

		this.browsePage.setAttribute("c-page-type", browsePageType);
		this.browsePage.removeAttribute("c-fancy-page");

		if (ext.BrowsePageTypes.isPlaylist(browsePageType)) {
			this.AlbumAndPlaylist(state);
			this.Playlist(state);

		} else if (ext.BrowsePageTypes.isAnyAlbum(browsePageType)) {
			this.AlbumAndPlaylist(state);
			this.Album(state);
		};

		console.log("MODIFIED", browsePageType);

		const isEdited = ext.SafeDeepGet(state, ext.Structures.cDidExtChangeResponse());
		this.browsePage.setAttribute("c-edited", Boolean(isEdited));

		this.UpdatePrimarySidebarButtons(state);

		// TODO: edit buttonbar ButtonBar.UpdateButtons(state);
	};


	EditDropdownMenuItem(menuItem) {
		const data = menuItem.controllerProxy.__data.data;

		if (data.icon?.cSvg) {
			const svg = ext.GetSVG(data.icon.cSvg);
			const current = menuItem.querySelector("svg");
			
			if (current) current.outerHTML = svg.outerHTML;
			else menuItem.querySelector("yt-icon").append(svg);
		};

		const customEndpoint = data.serviceEndpoint?.customEndpoint;
			
		if (customEndpoint) menuItem.onclick = () => {
			new CustomEndpointHandler(custom, lir);
		};
	};



	OnDropdownFocusChange(changes) {
		const change = changes[0];

		// attributeName = "aria-hidden", SO IF HIDDEN DON'T EDIT.
		if (change.target.getAttribute(change.attributeName)) return;

		const lir = change.target.__data.positionTarget.closest("ytmusic-responsive-list-item-renderer");
		if (!lir) return;

		change.target.querySelectorAll(".ytmusic-menu-popup-renderer[role=\"menuitem\"]").forEach(this.EditDropdownMenuItem);
	};

	OnProgressBarValueChange(changes) {
		const change = changes[0];

		if (change.target.getAttribute(change.attributeName) !== "100") return;
		this.ModifyPage();
	};

	async LoadNavProgressObserver() {
		this.browsePage = (await ext.WaitForBySelector("ytmusic-browse-response"))[0];
		this.navProgressBar = (await ext.WaitForBySelector("yt-page-navigation-progress"))[0];

		this.observers.navProgress = new MutationObserver(this.OnProgressBarValueChange.bind(this));

		this.observers.navProgress.observe(this.navProgressBar, {
			childList: false,
			subtree: false,
			attributes: true,
			attributeFilter: ["aria-valuenow"],
			attributeOldValue: false
		});
	};

	async LoadDropdownObserver() {
		// WAITS FOR A WHILE. popup-cont CREATED FIRST TIME IT'S NEEDED.
		this.dropdown = (await ext.WaitForBySelector("ytmusic-popup-container tp-yt-iron-dropdown"))[0];

		this.observers.dropdown = new MutationObserver(this.OnDropdownFocusChange.bind(this));

		this.observers.dropdown.observe(this.dropdown, {
			childList: false,
			subtree: false,
			attributes: true,
			attributeFilter: ["aria-hidden"],
			attributeOldValue: false
		});

		// INITIAL, DO HERE AS WE WAITED FOR IT.
		// DROPDOWN DOES NOT APPEAR UNTIL FIRST TIME ITS NEEDED.
		// CREATE FAKE "CHANGE" OBJECT.
		this.OnDropdownFocusChange([{
			target: this.dropdown,
			attributeName: "aria-hidden"
		}]);
	};

	async init() {
		await ext.WaitForPolymerController();

		this.LoadDropdownObserver();

		// WAIT FOR browsePage BEFORE INIT.
		await this.LoadNavProgressObserver();
		this.ModifyPage(); // INITIAL
	};

	constructor() {
		this.observers = {
			navProgress: undefined,
			dropdown: undefined
		};
	};
};