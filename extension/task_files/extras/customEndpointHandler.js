window.CustomEndpointHandler = class CustomEndpointHandler {

	AddNote() {
		let popup = UCreatePopup({
			title: {
				text: "Write Note",
				icon: "note"
			},
			content: [
				{
					class: "c-text-input",
					id: "noteContent",
					config: [
						["label", "textContent", "Note Content"]
					]
				},
				{
					class: "c-popup-text-line",
					config: [
						["label", "innerHTML", "Will overwrite any existing note for this song. Leave blank to remove the note."],
						["label", "style", "font-size: 13px; line-height: 13px; display: block; margin-top: 3px;"],
						
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

		let ctx = this;

		popup.querySelector("#submit").addEventListener("click", function(e) {
			let data = popup.querySelector(".c-text-input input").value;

			UDispatchEventToEW({
				func: "add-note",
				note: data,
				videoId: ctx.endpoint.videoId
			});

			URemovePopup(popup, true);

			let lirs = document.querySelectorAll(`ytmusic-responsive-list-item-renderer:has([href*="${ctx.endpoint.videoId}"])`)
			for (let lir of lirs) {
				let cd = UDigDict(lir, UDictGet.cDataFromElem);
				if (!cd) continue;

				cd.customNote = data;
			};
			console.log(ctx, lirs, data);

			if (lirs.length !== 0) UAddTitleIconsToListItems(lirs[0].parentElement.children);
		});
	};

	CreateTag() {
		let popup = UCreatePopup({
			title: {
				text: "Create Tag",
				icon: "tag"
			},
			content: [
				{
					class: "c-text-input",
					id: "noteContent",
					config: [
						["label", "textContent", "Tag Text"]
					]
				},
				{
					class: "c-colour-input",
					id: "colour",
					config: [
						["label", "textContent", "Tag Colour"]
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

		let ctx = this;

		popup.querySelector("#submit").addEventListener("click", function(e) {
			let title = popup.querySelector(".c-text-input input").value;
			let col = popup.querySelector(".c-colour-input input").value;

			UNavigate(UBuildEndpoint({
				navType: "createPlaylist",
				"title": U_TAG_PLAYLIST_DATA.titlePrefix + title,
				privacyStatus: "Private",
				description: U_TAG_PLAYLIST_DATA.description,
				videoIds: [ctx.endpoint.videoId],
				cParams: { colour: col, text: title }
			}));

			URemovePopup(popup, true);
		});
	};

	async AddTag() {
		let storage = await UMWStorageGet();
		let tags = Object.values(storage.customisation.tags.tags);
		
		let popup = UCreatePopup({
			title: {
				text: "Add Tag",
				icon: "tag"
			},
			content: [
				{
					class: "c-popup-scroll-rows",
					id: "existingTags",
					config: [
						["label", "textContent", "Existing Tags"]
					],
					contents: {
						items: tags,
						generator: function(scrollRow, item) {
							console.log(scrollRow, item);
							let svg = UGetSVGFromRaw("tag", false, false);
							svg.style.fill = item.colour;

							scrollRow.querySelector(".left-item").append(svg);
							scrollRow.querySelector(".title-row").textContent = item.text;
							scrollRow.cData = item;
						}
					}
				},
				{
					class: "c-popup-button",
					id: "createNewTag",
					buttonConfig: [
						undefined, "Create New Tag", "dark", "createNewTag"
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
				}
			]
		});

		console.log("POPUP", popup);

		let ctx = this;

		popup.querySelector("#createNewTag").addEventListener("click", function() {
			console.log("createnewTag clicked");

			URemovePopup(popup, false);
			ctx.CreateTag();
		});

		for (let row of popup.querySelectorAll(".c-popup-scroll-row")) {
			row.addEventListener("click", function() {
				UDispatchEventToEW({
					func: "add-video-to-tag",
					videoId: ctx.endpoint.videoId,
					tagId: row.cData.id
				});

				UNavigate(UBuildEndpoint({
					navType: ""
				}))

				let lirs = document.querySelectorAll(`ytmusic-responsive-list-item-renderer:has([href*="${ctx.endpoint.videoId}"])`)
				for (let lir of lirs) {
					let cd = UDigDict(lir, UDictGet.cDataFromElem);
					if (!cd) continue;

					if (!cd.tags) cd.tags = [];
					cd.tags.push(row.cData);
				};
			});
		};
	};


	ProcessEndpoint() {
		switch (this.endpoint.action) {
			case "writeNotePopup": this.AddNote(); break;
			case "addTagPopup": this.AddTag(); break;
			case "createTagPopup": this.CreateTag(); break;
		};
	};


	constructor(endpoint, dropdownFrom) {
		this.endpoint = endpoint;
		this.dropdownFrom = dropdownFrom;

		this.ProcessEndpoint();
	};
};


["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = a class, non clonable, so throws err in bkgScript.)