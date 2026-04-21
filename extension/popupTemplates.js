export class PopupTemplates {

	static NewFolder(OnSubmit) {
		return {
			content: [
				{
					class: "c-popup-title",
					text: "New Folder",
					icon: "folder"
				},
				{
					class: "c-text-input",
					text: "Name - Required",
					id: "nameField"
				},
				{
					class: "c-text-input",
					text: "Subtitle",
					id: "subtitleField"
				}
			],
			actions: [
				{
					icon: null,
					text: "Cancel",
					style: "text-only",
					defaultAction: "close"
				},
				{
					icon: null,
					text: "Create",
					style: "light",
					action: OnSubmit
				}
			]
		};
	};


	static NewSeparator(OnSubmit) {
		return {
			content: [
				{
					class: "c-popup-title",
					text: "New Separator",
					icon: "add"
				},
				{
					class: "c-text-input",
					text: "Name (Not Required)",
					id: "nameField"
				}
			],
			actions: [
				{
					icon: null,
					text: "Cancel",
					style: "text-only",
					defaultAction: "close"
				},
				{
					icon: null,
					text: "Create",
					style: "light",
					action: OnSubmit
				}
			]
		};
	};


	/*static PlaylistImportance(OnSubmit) {
		return {
			content:  [
				{
					class: "c-popup-title",
					text: "Playlist Importance",
					icon: "note"
				},
				{
					class: "c-text-input",
					text: "Year",
					id: "year"
				},
				{
					class: "c-text-input",
					text: "Season Code",
					id: "season"
				},
				{
					class: "c-popup-text-line",
					text: "1 = Spring\n2 = Summer\n3 = Autumn\n4 = 'End Of'\nUse letters (eg 1a) to describe 'Early'"
				},
				{
					class: "c-check-input",
					text: "Is the original?",
					id: "primary"
				},
				{
					class: "c-check-input",
					text: "Is the replay?",
					id: "replay"
				},
				{
					class: "c-text-input",
					text: "Specific date range (eg 1st Jan - 1st April)",
					id: "dates"
				},
				{
					class: "c-text-input",
					text: "Description",
					id: "description"
				}
			],
			actions: [
				{
					icon: null,
					text: "Cancel",
					style: "text-only",
					defaultAction: "close"
				},
				{
					icon: null,
					text: "Define / Overwrite",
					style: "light",
					action: OnSubmit
				}
			]
		};
	};*/

	static PlaylistImportance(OnSubmit) {
		return {
			content:  [
				{
					class: "c-popup-title",
					text: "Playlist Importance (Related List)",
					icon: "note"
				},
				{
					class: "c-text-input",
					text: "Year",
					id: "year"
				},
				{
					class: "c-text-input",
					text: "Season Code",
					id: "season"
				},
				{
					class: "c-popup-text-line",
					text: "1 = Spring\n2 = Summer\n3 = Autumn\n4 = 'End Of'\nUse letters (eg 1a) to describe 'Early Spring'"
				},
				{
					class: "c-check-input",
					text: "Is the replay?",
					id: "replay"
				}
			],
			actions: [
				{
					icon: null,
					text: "Cancel",
					style: "text-only",
					defaultAction: "close"
				},
				{
					icon: null,
					text: "Apply",
					style: "light",
					action: OnSubmit
				}
			]
		};
	};

	static PlaylistImportancePrimary(OnSubmit) {
		return {
			content:  [
				{
					class: "c-popup-title",
					text: "Playlist Importance (Primary List)",
					icon: "note"
				},
				{
					class: "c-text-input",
					text: "Year",
					id: "year"
				},
				{
					class: "c-text-input",
					text: "Season Code",
					id: "season"
				},
				{
					class: "c-popup-text-line",
					text: "1 = Spring\n2 = Summer\n3 = Autumn\n4 = 'End Of'\nUse letters (eg 1a) to describe 'Early Spring'"
				},
				{
					class: "c-text-input",
					text: "Specific date range (eg 1st Jan - 1st April)",
					id: "dates"
				},
				{
					class: "c-text-input",
					text: "Description",
					id: "description"
				}
			],
			actions: [
				{
					icon: null,
					text: "Cancel",
					style: "text-only",
					defaultAction: "close"
				},
				{
					icon: null,
					text: "Apply",
					style: "light",
					action: OnSubmit
				}
			]
		};
	};

	
};