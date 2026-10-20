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

		(new popupService("modal", popupTemplates.PlaylistImportancePrimary(OnSubmit, () => this.disableEditMode()))).Load();
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

		(new popupService("modal", popupTemplates.PlaylistImportance(OnSubmit, () => this.disableEditMode()))).Load();
	};

	Archive(state, pageId) {
		const Confirm = (popup) => {
			popup.querySelector("#confirm")?.remove();

			ext.DispatchFunctionToEW({
				func: "storage",
				storageFunc: "start-archive",
				id: pageId
			}).then(v => {
				const followupId = v.storage.progress_tracking_id;
				const textElem = popup.querySelector(".c-popup-text-block-scroll label");

				let prevBackedUp = false;
				let clearNext = false;

				const interval = setInterval(() => {
					if (prevBackedUp) return;
					prevBackedUp = true;

					if (clearNext) {
						ext.DispatchFunctionToEW({
							func: "storage",
							storageFunc: "archive-usage"
						}).then(v => {
							textElem.textContent += `\r\nUsed ${v.storage.usedMB}MB / ${v.storage.totalMB}MB (${v.storage.usedPERC}%)`
						});

						clearInterval(interval);
						return;
					};

					ext.DispatchFunctionToEW({
						func: "storage",
						storageFunc: "check-archive",
						trackerId: followupId
					}).then(v => {
						if (v.code === 200) {
							clearNext = true;
							textElem.textContent += "\r\n" + v.storage;

						} else textElem.textContent = v.storage;

						prevBackedUp = false;
					});
					
				}, 1000);

			});
		};

		(new popupService("modal", popupTemplates.ArchiveProcess(Confirm, () => this.disableEditMode()))).Load();
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
		},
		{
			type: "archive",
			icon: "note",
			text: "Archive Playlist",
			onclick: this.Archive
		}
	];
};