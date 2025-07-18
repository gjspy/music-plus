// functionality for editing albums.

AlbumEditMode = class AlbumEditMode {
	static buttons = [
		{ // ask whether should be that songs ALWAYS or just when playing the album
			type: "skip",
			icon: "no-circle",
			text: "Define Auto-Skips"
		},
		{
			type: "hide",
			icon: "visible",
			text: "Hide Songs"
		},
		{
			type: "explicit",
			icon: "MUSIC_EXPLICIT_BADGE",
			text: "Define Explicit Songs"
		},
		{ // change name, cover, single/ep/album!!, exact release date!!
			type: "details",
			icon: "pencil",
			text: "Edit Album Metadata"
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

	static async LinkMode(state, browsePage, id) {
		function OnClickItem(chosenId) {
			UDispatchEventToEW({
				func: "defineLink",
				baseItem: id,
				linkedItem: chosenId
			});

			EditMode.CancelAll();

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

			EditMode.CancelAll();

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

			EditMode.CancelAll();

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

window.EditMode = class MasterEditMode {
	static specificEditModes = {
		"MUSIC_PAGE_TYPE_ALBUM": AlbumEditMode
	};

	static rightContent = undefined;
	static buttonCont = undefined;

	static AddButtonToCont(type) {
		let btn;

		if (type === "REVERT") btn = UGetSVGFromRaw("doc-revert", true, false);
		else if (type === "EDIT") btn = UGetSVGFromRaw("pencil", true, false);
		else if (type === "CANCEL") btn = UGetSVGFromRaw("cross", true, false);

		btn.className = type.toLowerCase() + "-btn c-button";

		UHideElem(btn);

		this.buttonCont.append(btn);
		this.buttonCont.__data.buttons[type] = btn;

		this.buttonCont.setAttribute(type, true);
	};

	static FillButtonCont() {
		for (let type of ["REVERT", "EDIT", "CANCEL"]) {
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
		newCont.__data = {buttons: {}};

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
	}

	static UpdateButtons(stateOrNone) {
		let state = stateOrNone || polymerController.store.getState();
		let content = state.navigation.mainContent;

		this.GetButtonCont();

		let hasEditedResponse = content.response.cMusicFixerExtChangedResponse;

		this.CancelAll();
		this.HideButton("EDIT"); // always hide, to remove old onclick etc..
		this.HideButton("REVERT");
		this.HideButton("CANCEL");

		if (hasEditedResponse) this.ShowButton("REVERT");

		let browseId = state.navigation.mainContent.endpoint.data.browseId;
		let browseType = UGetBrowsePageTypeFromBrowseId(browseId, false, true, hasEditedResponse);
		let modeForType = this.specificEditModes[browseType];

		UNavigateOnClick(this.buttonCont.__data.buttons.REVERT, UBuildEndpoint({
			navType: "browse",
			id: browseId,
			cParams: {returnOriginal: true}
		}));

		if (!modeForType) return;
		
		this.ShowButton("EDIT");

		this.buttonCont.__data.buttons.EDIT.onclick = function(e) {
			let browsePage = document.querySelector("#content ytmusic-browse-response#browse-page");

			UDrawDropdown(modeForType.buttons, e, modeForType, [state, browsePage, browseId], function() {
				let buttonCont = document.querySelector("ytmusic-nav-bar #right-content .c-master-buttons");

				UHideElem(buttonCont.__data.buttons.EDIT);
				UUnHideElem(buttonCont.__data.buttons.CANCEL);
			});
		};

		this.buttonCont.__data.buttons.CANCEL.onclick = this.CancelAll;
	};
};



["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = window.fetch, non clonable.)