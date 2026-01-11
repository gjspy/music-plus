// functionality for editing albums.

AlbumEditMode = class AlbumEditMode {
	static buttons = [
		{
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
			text: "Insert Extra Songs",
			onclick: this.InsertSongs
		},
		{
			type: "remove-inserted",
			icon: "delete",
			text: "Remove Extra Songs",
			onclick: this.RemoveInsertedSongs
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

		let listItems = document.querySelectorAll(U_HELPFUL_QUERIES.listItemRenderersOfCurrentBrowseResponse);

		let icon = UGetSVGFromRaw((buttonType === "hide") ? "delete" : "no-circle", true, false)
		UAddToClass(icon, "c-edit-btn");

		let undoIcon = UGetSVGFromRaw("undo", true, false);
		UAddToClass(undoIcon, "c-edit-btn");


		for (let listItem of listItems) {
			let thisCp = listItem.controllerProxy;
			let data = UDigDict(listItem, UDictGet.dataFromElem);
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

	static async InsertSongs(state, browsePage, id) {
		let popup = UCreatePopup({
			title: {
				text: "Insert extra song to album",
				icon: "album"
			},
			content: [
				{
					class: "c-text-input",
					id: "vid",
					config: [
						["label", "textContent", "YouTube Video ID"]
					]
				},
				{
					class: "c-popup-text-line",
					config: [
						["label", "innerHTML", "Video ID must only be the 11 character id, and cache entries must exist of the song and its album."],
						["label", "style", "font-size: 13px; line-height: 13px; display: block; margin-top: 3px;"],
						
					]
				},
				{
					class: "c-text-input",
					id: "index",
					config: [
						["label", "textContent", "Index"]
					]
				},
				{
					class: "c-popup-text-line",
					config: [
						["label", "innerHTML", "Index should be relative to first song in list, 0 or 1, and based on the list before any custom song deletions change it."],
						["label", "style", "font-size: 13px; line-height: 13px; display: block; margin-top: 3px;"],
						
					]
				},
				{
					class: "c-check-input",
					id: "overwrite",
					config: [
						["label", "textContent", "Overwrite existing item at index? (If it exists)"]
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

		popup.querySelector("#submit").addEventListener("click", function(e) {
			let data = {
				videoId: popup.querySelector(".c-text-input#vid input").value,
				index: popup.querySelector(".c-text-input#index input").value,
				overwrite: popup.querySelector(".c-check-input#overwrite input").checked
			};

			UDispatchEventToEW({
				func: "insert-song",
				"data": data,
				"id": id
			});

			URemovePopup(popup, true);
		});

		popup.querySelector("#cancel").addEventListener("click", () => ButtonBar.CancelAll());
	};

	static async RemoveInsertedSongs(state, browsePage, id) {
		let storage = await UMWStorageGet();
		let currentExtraSongs = storage.customisation.extraSongs[id] || {};

		let popup = UCreatePopup({
			title: {
				text: "Remove Song",
				icon: "tag"
			},
			content: [
				{
					class: "c-popup-scroll-rows",
					id: "removeInsertedSong",
					config: [
						["label", "textContent", "Inserted Songs"]
					],
					contents: {
						items: currentExtraSongs.map((data) => {
							let id_ = data.videoId;
							let albumId = storage.cache[id_]?.album;
							let album = (albumId) ? storage.cache[albumId] : undefined;

							return {
								videoId: id_,
								videoName: storage.cache[id_]?.name,
								albumData: (album) ? album.name : albumId,
								thumb: (album) ? album.thumb : undefined,
								index: data.index
							};
						}).sort((a,b) => Number(a.index) - Number(b.index)),
						generator: function(scrollRow, item) {
							console.log(scrollRow, item);
							let img = document.createElement("img");
							img.setAttribute("src", item.thumb);

							scrollRow.querySelector(".left-item").append(img);
							scrollRow.querySelector(".title-row").textContent = item.videoId + " : " + item.videoName;
							scrollRow.querySelector(".subtitle-row").textContent = item.albumData;
							scrollRow.cData = item;
						}
					}
				}
			],
			actions: [
				{
					icon: null,
					text: "Cancel",
					id: "cancel",
					style: "text-only",
					defaultAction: "close"
				}
			]
		});

		for (let row of popup.querySelectorAll(".c-popup-scroll-row")) {

			let handleClick =  function() {
				UDispatchEventToEW({
					func: "remove-inserted-song",
					data: {videoId: row.cData.videoId},
					"id": id
				});

				row.removeEventListener("click", handleClick);
				row.style.cursor = "default";
				row.style.opacity = 0.5;
			};

			row.addEventListener("click", handleClick);			
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
					id: "bkg",
					config: [
						["label", "textContent", "Custom Page Background URL"]
					]
				},
				{
					class: "c-check-input",
					id: "def_bkg",
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
				},
				{
					class: "c-text-input",
					id: "artist",
					config: [
						["label", "textContent", "Artist ID (UC..)"]
					]
				},
				{
					class: "c-check-input",
					id: "def_artist",
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

			URemovePopup(popup, true);

			setTimeout(() => UNavigate(
				UBuildEndpoint({
					navType: "browse",
					"id": id
				})
			), 2000);
		});
	};

	static async LinkMode(state, browsePage, id) {
		function OnClickItem(chosenId) {
			ButtonBar.RemoveOVF();

			let popup = UCreatePopup({
				title: {
					text: "Start Index",
					icon: "album"
				},
				content: [
					{
						class: "c-popup-text-line",
						config: [
							["label", "innerHTML", "Are the indexes of these albums offset? If not, leave this blank. Else, what index of the larger album should be overitten by the first item of the smaller album?"]
						]
					},
					{
						class: "c-text-input",
						id: "offset",
						config: [
							["label", "textContent", "Offset Index"]
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

			popup.querySelector("#submit").addEventListener("click", function() {
				UDispatchEventToEW({
					func: "defineLink",
					baseItem: id,
					linkedItem: chosenId,
					offsetIndex: popup.querySelector("#offset input").value
				});

				ButtonBar.CancelAll();
				URemovePopup(popup);

				setTimeout(() => UNavigate(
					UBuildEndpoint({
						navType: "browse",
						"id": id
					})
				), 2000);
			});

			popup.querySelector("#cancel").addEventListener("click", () => ButtonBar.CancelAll());

			
			
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
			), 2000);
			
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
			), 2000);
			
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
};

PlaylistEditMode = class AlbumEditMode {
	static buttons = [
		{ // change name, cover, single/ep/album!!, exact release date!!
			type: "details", // "type" IS THE ID!
			icon: "pencil",
			text: "Edit Playlist Metadata",
			onclick: this.EditMetadata
		},
		{
			type: "tag",
			icon: "tag",
			text: "Create Tag from playlist",
			onclick: this.CreateTagFrom
		}
	];

	static async EditMetadata(state, browsePage, id) {
		let popup = UCreatePopup({
			title: {
				text: "Edit Album Metadata",
				icon: "album"
			},
			content: [
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
					id: "bkg",
					config: [
						["label", "textContent", "Custom Page Background URL"]
					]
				},
				{
					class: "c-check-input",
					id: "def_bkg",
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

			URemovePopup(popup, true);

			setTimeout(() => UNavigate(
				UBuildEndpoint({
					navType: "browse",
					"id": id
				})
			), 2000);
		});
	};

	static async CreateTagFrom(state, browsePage, id) {
		let handler = new CustomEndpointHandler({}, undefined);
		handler.CreateTag(id);
	};
};

window.ButtonBar = class MasterEditMode {
	static specificEditModes = {
		"MUSIC_PAGE_TYPE_ALBUM": AlbumEditMode,
		"MUSIC_PAGE_TYPE_PLAYLIST": PlaylistEditMode
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

	static RemoveOVF() {
		let ovfCont = document.querySelector(".c-popup-elem-overflow");
		if (ovfCont) ovfCont.remove();
	};

	static CancelAll() {
		let buttonCont = document.querySelector("ytmusic-nav-bar #right-content .c-master-buttons");

		UHideElem(buttonCont.__data.buttons.CANCEL);
		UUnHideElem(buttonCont.__data.buttons.EDIT);

		this.RemoveOVF();

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