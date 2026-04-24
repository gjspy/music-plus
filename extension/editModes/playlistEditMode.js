export class PlaylistEditMode extends baseEditMode {

	affectsBrowsePage = true;

	ImportancePrimary(state, pageId) {
		const OnSubmit = (popup) => {
			const year = Number(popup.querySelector("#year input").value);
			const season = popup.querySelector("#season input").value;

			ext.DispatchFunctionToEW({
				func: "storage",
				storageFunc: "importance",
				data: {
					data: {
						id: `${year}-${season}`,
						year,
						season,
						dates: popup.querySelector("#dates input").value,
						description: popup.querySelector("#description input").value,
						primary: pageId,
						related: [pageId]
					},
					_saveBackup: true
				}
			});

			this.disableEditMode();
		};

		(new popupService("modal", popupTemplates.PlaylistImportancePrimary(OnSubmit))).Load();
	};

	Importance(state, pageId) {
		const OnSubmit = (popup) => {
			const year = Number(popup.querySelector("#year input").value);
			const season = popup.querySelector("#season input").value;
			const replay = popup.querySelector("#replay input").checked;

			const data = {
				id: `${year}-${season}`,
				related: [pageId]
			};

			if (replay) data["replay"] = pageId;

			ext.DispatchFunctionToEW({
				func: "storage",
				storageFunc: "importance",
				data: {
					data: data,
					_saveBackup: true
				}
			});

			this.disableEditMode();
		};

		(new popupService("modal", popupTemplates.PlaylistImportance(OnSubmit))).Load();
	};

















	buttons = [
		{
			type: "importance-primary", // "type" IS THE ID!
			icon: "note",
			text: "Define Playlist as Season Primary",
			onclick: this.ImportancePrimary
		},
		{
			type: "importance", // "type" IS THE ID!
			icon: "note",
			text: "Define as Related",
			onclick: this.Importance
		}
	];
};