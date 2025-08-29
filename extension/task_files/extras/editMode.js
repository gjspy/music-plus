// functionality for editing albums.

AlbumEditMode = class AlbumEditMode {
	static buttons = [
		{ // ask whether should be that songs ALWAYS or just when playing the album
			type: "skip", // "type" IS THE ID!
			icon: "no-circle",
			text: "Define Skips",
			onclick: this.HideSongs
		},
		{
			type: "hide",
			icon: "visible",
			text: "Hide Songs",
			onclick: this.HideSongs
		},
		{
			type: "explicit",
			icon: "MUSIC_EXPLICIT_BADGE",
			text: "Define Explicit Songs"
		},
		{
			type: "insert",
			icon: "add",
			text: "Insert/Remove Extra Songs"
		},
		{ // change name, cover, single/ep/album!!, exact release date!!
			type: "details",
			icon: "pencil",
			text: "Edit Album Metadata",
			onclick: this.EditMetadata
		},
		{ // when linking other albums, use the longest ver as base. eg folklore: base = folklore, "link" deluxe version, not base = deluxe and link folklore.
			type: "link",
			icon: "album",
			text: "Link Other Album",
			onclick: this.LinkMode
		},
		{
			type: "editlink",
			icon: "album",
			text: "Remove Linked Album",
			onclick: this.RemoveLink
		},
		{ // shouldn't be different from yt default. eg folklore: primary = folklore explicit, not deluxe
			type: "versions",
			icon: "album",
			text: "Define Primary Version",
			onclick: this.DefineVersion
		}
	];

	static async HideSongs(state, browsePage, id, buttonType) {
		function OnClickItem(item, clickedId, isDeleted) {
			UDispatchEventToEW({
				func: (buttonType === "hide") ? "setDeletion" : "setSkip",
				videoId: clickedId,
				deleted: isDeleted,
				album: id
			});

			let attr = (buttonType === "hide") ? "c-hidden" : "c-skipped";
			if (isDeleted) item.setAttribute(attr, isDeleted);
			else item.removeAttribute(attr);

			let current = item.querySelector("div.fixed-columns .c-edit-btn");
			if (isDeleted) current.innerHTML = undoIcon.innerHTML;
			else current.innerHTML = icon.innerHTML;

			let data = item.controllerProxy.__data.data;
			if (!data) return;

			if (buttonType === "hide") {
				if (!data.cData) data.cData = { changedByDeletion: {} }
				if (!data.cData.changedByDeletion) data.cData.changedByDeletion = {};

				data.cData.changedByDeletion.isDeleted = isDeleted;
			};
		};

		for (let oldIcon of document.querySelectorAll(".c-skip-icon")) {
			oldIcon.remove();
		};

		browsePage.setAttribute("c-editing", "hideSongs");

		let listItems = document.querySelectorAll("ytmusic-browse-response #contents > ytmusic-two-column-browse-results-renderer ytmusic-responsive-list-item-renderer");

		let icon = UGetSVGFromRaw((buttonType === "hide") ? "delete" : "no-circle", true, false)
		UAddToClass(icon, "c-edit-btn");

		let undoIcon = UGetSVGFromRaw("undo", true, false);
		UAddToClass(undoIcon, "c-edit-btn");


		for (let listItem of listItems) {
			let thisCp = listItem.controllerProxy;
			let data = UDigDict(thisCp, ["__data", "data"]);
			if (!data) continue;

			let changedByDeletionData = (data.cData) ? data.cData.changedByDeletion : undefined;
			let videoId = data.playlistItemData.videoId;
			
			let isDeleted = !!listItem.getAttribute("c-hidden");
			let isSkipped = !!listItem.getAttribute("c-skipped");

			listItem.removeAttribute("unplayable");

			if (buttonType === "hide" && changedByDeletionData) {
				if (changedByDeletionData.originalIndex) {
					let index = listItem.querySelector(".left-items yt-formatted-string.index");
					if (index) index.textContent = changedByDeletionData.originalIndex;
				};
			};

			let newButton = ((isDeleted || isSkipped) ? undoIcon : icon).cloneNode(true);
			if (videoId) newButton.onclick = () => {
				if (buttonType === "hide") isDeleted = !isDeleted;
				if (buttonType === "skip") isSkipped = !isSkipped;

				OnClickItem(listItem, videoId, (buttonType === "hide") ? isDeleted : isSkipped);
			};

			let fixedCols = listItem.querySelector("div.fixed-columns");
			if (fixedCols) fixedCols.append(newButton);
		};
	};

	static async EditMetadata(state, browsePage, id) {
		let popup = UCreatePopup({
			title: {
				text: "Edit Album Metadata",
				icon: "album"
			},
			content: [
				{
					class: "c-text-input",
					id: "title",
					config: [
						["label", "textContent", "Title"]
					]
				},
				{
					class: "c-check-input",
					id: "def_title",
					config: [
						["label", "textContent", "Reset to default"]
					]
				},
				{
					class: "c-text-input",
					id: "desc",
					config: [
						["label", "textContent", "Description"]
					]
				},
				{
					class: "c-check-input",
					id: "def_desc",
					config: [
						["label", "textContent", "Reset to default"]
					]
				},
				{
					class: "c-text-input",
					id: "thumb",
					config: [
						["label", "textContent", "Thumbnail URL"]
					]
				},
				{
					class: "c-check-input",
					id: "def_thumb",
					config: [
						["label", "textContent", "Reset to default"]
					]
				},
				{
					class: "c-text-input",
					id: "type",
					config: [
						["label", "textContent", "Release Type (Album, Single, EP)"]
					]
				},
				{
					class: "c-check-input",
					id: "def_type",
					config: [
						["label", "textContent", "Reset to default"]
					]
				},
				{
					class: "c-text-input",
					id: "year",
					config: [
						["label", "textContent", "Year"]
					]
				},
				{
					class: "c-check-input",
					id: "def_year",
					config: [
						["label", "textContent", "Reset to default"]
					]
				}
			],
			actions: [
				{
					icon: null,
					text: "Cancel",
					id: "cancel",
					style: "text-only",
					defaultAction: "close"
				},
				{
					icon: null,
					text: "Submit",
					id: "submit",
					style: "light"
				}
			]
		});

		for (let check of popup.querySelectorAll(".c-check-input")) {
			let id = check.getAttribute("id").replace("def_", "");
			let textInput = popup.querySelector(`#${id}`);

			check.addEventListener("change", function(e) {
				if (e.target.checked) UAddToClass(textInput, "c-uninteractable");
				else URemoveFromClass(textInput, "c-uninteractable");
			});
		};

		popup.querySelector("#submit").addEventListener("click", function(e) {
			let data = {};

			for (let text of popup.querySelectorAll(".c-text-input")) {
				let id = text.getAttribute("id");
				let reset = popup.querySelector(`.c-check-input#def_${id} input`).checked;

				if (reset) {
					data["reset_" + id] = true;
					continue;
				};

				let value = text.querySelector("input").value;
				if (value !== "") data[id] = value;
			};

			UDispatchEventToEW({
				func: "edit-metadata",
				"data": data,
				"id": id
			});

			URemovePopup(popup);

			setTimeout(() => UNavigate(
				UBuildEndpoint({
					navType: "browse",
					"id": id
				})
			), 70);
		});
	};

	static async LinkMode(state, browsePage, id) {
		function OnClickItem(chosenId) {
			UDispatchEventToEW({
				func: "defineLink",
				baseItem: id,
				linkedItem: chosenId
			});

			ButtonBar.CancelAll();

			setTimeout(() => UNavigate(
				UBuildEndpoint({
					navType: "browse",
					"id": id
				})
			), 70);
			
		};

		let storage = await UMWStorageGet();
		let cache = storage.cache;
		let thisAlbumData = cache[id];
		let currentLinked = storage.customisation.albumLinks[id] || [];
		
		let cachedArtist = cache[thisAlbumData.artist];
		let artistCounterpart = UGetCounterpartFromData(cache, cachedArtist);

		let gridCont = UShowGridOfMusicItems(
			(v) => (
				//v.saved === true &&
				v.type === "ALBUM" &&
				v.id !== id &&
				v.name !== thisAlbumData.name &&
				(v.artist === thisAlbumData.artist || (artistCounterpart && v.artist === artistCounterpart.id)) &&
				currentLinked.indexOf(v.id) === -1
			),
			[], false, false, OnClickItem, storage, "link-albums", "Other Albums",
			"Select an album to link with \"" + thisAlbumData.name + "\". Any private albums with identical names are matched automatically, and hidden here."
		);

		gridCont.ovf.style.marginRight = "250px";
		gridCont.ovf.style.marginLeft = "initial";
		gridCont.ovf.style.right = "0";
		gridCont.ovf.style.setProperty("--height", "700px");
	};

	static async RemoveLink(state, browsePage, id) {
		function OnClickItem(chosenId) {
			UDispatchEventToEW({
				func: "removeLink",
				baseItem: id,
				linkedItem: chosenId
			});

			ButtonBar.CancelAll();

			setTimeout(() => UNavigate(
				UBuildEndpoint({
					navType: "browse",
					"id": id
				})
			), 70);
			
		};

		let storage = await UMWStorageGet();
		let thisAlbumData = storage.cache[id];
		let currentLinked = storage.customisation.albumLinks[id] || [];

		let gridCont = UShowGridOfMusicItems(
			(v) => (
				currentLinked.indexOf(v.id) !== -1
			),
			[], false, false, OnClickItem, storage, "link-albums", "Linked Albums",
			"Current albums linked with \"" + thisAlbumData.name + "\". Any private albums with identical names are matched automatically, and hidden here. Click to remove."
		);

		gridCont.ovf.style.marginRight = "250px";
		gridCont.ovf.style.marginLeft = "initial";
		gridCont.ovf.style.right = "0";
		gridCont.ovf.style.setProperty("--height", "700px");
	};

	static async DefineVersion(state, browsePage, id) {
		function OnClickItem(chosenId) {
			let alternates = [...alt, id];

			UDispatchEventToEW({
				func: "setPrimaryAlbum",
				chosen: chosenId,
				alts: alternates
			});

			ButtonBar.CancelAll();

			setTimeout(() => UNavigate(
				UBuildEndpoint({
					navType: "browse",
					"id": id
				})
			), 70);
			
		};

		let storage = await UMWStorageGet();
		let thisAlbumData = storage.cache[id];
		let alt = thisAlbumData.alternate;

		let gridCont = UShowGridOfMusicItems(
			(v) => (
				alt.indexOf(v.id) !== -1 ||
				v.id === id
			),
			[], false, false, OnClickItem, storage, undefined, "Album Versions",
			"Choose the base album version that YouTube uses for recommendations. This is usually explicit, non-deluxe."
		);

		gridCont.ovf.style.marginRight = "250px";
		gridCont.ovf.style.marginLeft = "initial";
		gridCont.ovf.style.right = "0";
		gridCont.ovf.style.setProperty("--height", "700px");
	};
};

AlbumButtons = class AlbumButtons {
	static buttons = [
		{
			type: "hide",
			icon: "album",
			text: "Go To Linked",
			onclick: this.SelectLinked
		},
	];

	static async SelectLinked(state, browsePage, id) {
		function OnClickItem(chosenId) {
			ButtonBar.CancelAll();

			setTimeout(() => UNavigate(
				UBuildEndpoint({
					navType: "browse",
					"id": chosenId
				})
			), 70);
			
		};

		let storage = await UMWStorageGet();
		let thisAlbumData = storage.cache[id];
		let primaryVersions = UGetPrimaryVersions(storage, id) || []; // other versions (eg non-deluxe)
		let linkedAlbums = storage.customisation.albumLinks[id] || []; // linked versions (eg 3am)
		let counterparts = thisAlbumData.privateCounterparts || []; // private uploaded versions

		let gridCont = UShowGridOfMusicItems(
			(v) => (
				primaryVersions.indexOf(v.id) !== -1 ||
				linkedAlbums.indexOf(v.id) !== -1 || 
				counterparts.indexOf(v.id) !== -1				
			),
			[], false, false, OnClickItem, storage, "link-albums", "Linked Albums",
			"Current albums linked with \"" + thisAlbumData.name + "\"."
		);

		gridCont.ovf.style.marginRight = "250px";
		gridCont.ovf.style.marginLeft = "initial";
		gridCont.ovf.style.right = "0";
		gridCont.ovf.style.setProperty("--height", "700px");
	};
}

window.ButtonBar = class MasterEditMode {
	static specificEditModes = {
		"MUSIC_PAGE_TYPE_ALBUM": AlbumEditMode
	};

	static specificButtons = {
		"MUSIC_PAGE_TYPE_ALBUM": AlbumButtons
	};

	static rightContent = undefined;
	static buttonCont = undefined;

	static AddButtonToCont(type) {
		let btn;

		if (type === "REVERT") btn = UGetSVGFromRaw("doc-revert", true, false);
		else if (type === "EDIT") btn = UGetSVGFromRaw("pencil", true, false);
		else if (type === "CANCEL") btn = UGetSVGFromRaw("cross", true, false);
		else if (type === "DOTS") btn = UGetSVGFromRaw("dots", true, false);

		btn.className = type.toLowerCase() + "-btn c-button";

		UHideElem(btn);

		this.buttonCont.append(btn);
		this.buttonCont.__data.buttons[type] = btn;

		this.buttonCont.setAttribute(type, true);
	};

	static FillButtonCont() {
		for (let type of ["DOTS", "REVERT", "EDIT", "CANCEL"]) {
			this.AddButtonToCont(type);
		};
	};

	static GetButtonCont() {
		if (this.buttonCont && this.buttonCont.isConnected) return this.buttonCont;

		if (!this.rightContent) this.rightContent = document.querySelector("ytmusic-nav-bar #right-content");
		if (!this.rightContent) return;

		let existing = this.rightContent.querySelector(".c-master-buttons");
		if (existing) existing.remove();

		let newCont = document.createElement("div");
		newCont.className = "c-master-buttons";
		newCont.__data = { buttons: {} };

		this.rightContent.insertBefore(newCont, this.rightContent.firstElementChild);

		this.buttonCont = newCont;

		this.FillButtonCont();

		return newCont;
	};

	static ShowButton(type) {
		this.buttonCont.setAttribute(type, true);
		UUnHideElem(this.buttonCont.__data.buttons[type]);
	};

	static HideButton(type) {
		this.buttonCont.setAttribute(type, false);
		UHideElem(this.buttonCont.__data.buttons[type]);

		this.buttonCont.__data.buttons[type].onclick = undefined;
	};

	static CancelAll() {
		let buttonCont = document.querySelector("ytmusic-nav-bar #right-content .c-master-buttons");

		UHideElem(buttonCont.__data.buttons.CANCEL);
		UUnHideElem(buttonCont.__data.buttons.EDIT);

		let ovfCont = document.querySelector(".c-popup-elem-overflow");
		if (ovfCont) ovfCont.remove();

		let browsePage = document.querySelector("ytmusic-browse-response");
		if (browsePage) {
			browsePage.removeAttribute("c-editing");
		};
	};

	static OnClickCloseButton() {
		let browsePage = document.querySelector("ytmusic-browse-response");

		if (browsePage && browsePage.getAttribute("c-editing")) {
			let pageType = browsePage.getAttribute("c-page-type");

			if (pageType === "MUSIC_PAGE_TYPE_ALBUM") UEndListItemPageEditMode(browsePage);

			browsePage.removeAttribute("c-editing");
		};

		this.CancelAll();
	};

	static UpdateButtons(stateOrNone) {
		let state = stateOrNone || polymerController.store.getState();
		let content = state.navigation.mainContent;

		this.GetButtonCont();

		let hasEditedResponse = content.response.cMusicFixerExtChangedResponse;
		let browseId = state.navigation.mainContent.endpoint.data.browseId;

		this.CancelAll();
		this.HideButton("DOTS");
		this.HideButton("EDIT"); // always hide, to remove old onclick etc..
		this.HideButton("REVERT");
		this.HideButton("CANCEL");

		if (hasEditedResponse) this.ShowButton("REVERT");

		let browseType = UGetBrowsePageTypeFromBrowseId(browseId, false, true, hasEditedResponse);
		let editModeForType = this.specificEditModes[browseType];
		let buttonsForType = this.specificButtons[browseType];

		// DONT USER UNAVIGATEONCLICK, DOES EVENTLISTENER.
		// NEED onclick SO NEXT TIME OVERWRITES.
		this.buttonCont.__data.buttons.REVERT.onclick = function(e) { 
			UNavigate(UBuildEndpoint({
				navType: "browse",
				id: browseId,
				cParams: {returnOriginal: true}
			}));
		};

		if (editModeForType) {
			this.ShowButton("EDIT");

			this.buttonCont.__data.buttons.EDIT.onclick = function(e) {
				if (document.querySelector(".c-dropdown")) return; // delete and move on

				let browsePage = document.querySelector("#content ytmusic-browse-response#browse-page");

				UDrawDropdown(editModeForType.buttons, e, editModeForType, [state, browsePage, browseId], function() {
					let buttonCont = document.querySelector("ytmusic-nav-bar #right-content .c-master-buttons");

					UHideElem(buttonCont.__data.buttons.EDIT);
					UUnHideElem(buttonCont.__data.buttons.CANCEL);
				});
			};

			let that = this;
			this.buttonCont.__data.buttons.CANCEL.onclick = () => that.OnClickCloseButton.call(that);
		};
		
		if (buttonsForType) {
			this.ShowButton("DOTS");

			this.buttonCont.__data.buttons.DOTS.onclick = function(e) {
				if (document.querySelector(".c-dropdown")) return; // delete and move on

				let browsePage = document.querySelector("#content ytmusic-browse-response#browse-page");

				UDrawDropdown(buttonsForType.buttons, e, buttonsForType, [state, browsePage, browseId]);
			};
		};
	};
};



["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = window.fetch, non clonable.)