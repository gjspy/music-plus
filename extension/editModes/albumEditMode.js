export class AlbumEditMode extends baseEditMode {
	affectsBrowsePage = true;

	async _ToggleSongs(state, pageId, action) {
		const hideSong = action === "hidden";
		// const skipSong =  action === "skipped";

		const attr = (hideSong) ? "c-hidden" : "c-skipped";

		const OnClickItem = (listItem, id, playable) => {
			ext.DispatchEventToEW({
				func: "storage",
				storageFunc: (hideSong) ? "set-song-hidden" : "set-song-skipped",
				data: {
					id, playable,
					fromId: pageId
				}
			});

			if (playable) listItem.removeAttribute(attr);
			else listItem.setAttribute(attr, !playable);

			listItem.data.cData.thisData[action] = !playable;

			const current = listItem.querySelector("div.fixed-columns .c-edit-btn");
			if (playable) current.replaceChildren(icon.cloneNode(true));
			else current.replaceChildren(undoIcon.cloneNode(true));
		};		

		this.browsePage.setAttribute("c-editing", "hideSongs");
		document.querySelectorAll(".c-skip-icon").forEach(v => v.remove());

		const listItems = document.querySelectorAll(ext.HELPFUL_SELECTORS.listItemRenderersOfCurrentBrowseResponse);

		const icon = ext.GetSVG((hideSong) ? "delete" : "no-circle");
		ext.AddToClass(icon, "c-edit-btn");

		const undoIcon = ext.GetSVG("undo");
		ext.AddToClass(undoIcon, "c-edit-btn");

		for (const listItem of listItems) {
			const data = listItem.data;
			if (!data) continue;

			const videoId = data.playlistItemData.videoId;
			
			let playable = !Boolean(listItem.getAttribute(attr));

			listItem.removeAttribute("unplayable");
			listItem.querySelector(".left-items .index").textContent = data.cData.indexData.displayIndex;

			let newButton = ((playable) ? icon : undoIcon).cloneNode(true);
			if (videoId) newButton.onclick = () => {
				playable = !playable;

				OnClickItem(listItem, videoId, playable);
			};

			const fixedCols = listItem.querySelector("div.fixed-columns");
			if (fixedCols) fixedCols.append(newButton);
		};
	};

	HideSongs = (state, pageId) => this._ToggleSongs(state, pageId, "hidden");
	SkipSongs = (state, pageId) => this._ToggleSongs(state, pageId, "skipped");

	/*Importance(state, pageId) {
		const OnSubmit = (popup) => {
			const year = Number(popup.querySelector("#year input").value);
			const season = popup.querySelector("#season input").value;

			ext.DispatchFunctionToEW({
				func: "storage",
				storageFunc: "importance",
				data: {
					data: {
						id: pageId,
						year,
						season,
						seasonCode: `${year}-${season}`,
						description: popup.querySelector("#description input").value
					}, // TODO need to swap. index describes browseId : [seasonCodes], normal files are seasonCode: browseIds. shit then, cant have description per entry?
					_saveBackup: true
				}
			});
		};

		(new popupService("modal", popupTemplates.PlaylistImportance(OnSubmit))).Load();
	};*/

	Importance = (state, pageId) => (new playlistEditMode()).Importance.call(this, state, pageId);

















	buttons = [
		{
			type: "skip", // "type" IS THE ID!
			icon: "no-circle",
			text: "Define Skips",
			onclick: this.SkipSongs
		},
		{
			type: "hide",
			icon: "visible",
			text: "Hide Songs",
			onclick: this.HideSongs
		},
		{
			type: "importance", // "type" IS THE ID!
			icon: "note",
			text: "Define as Related",
			onclick: this.Importance
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
};