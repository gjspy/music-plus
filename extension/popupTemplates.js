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
					action: {f: OnSubmit, e: "click"}
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
					action: {f: OnSubmit, e: "click"}
				}
			]
		};
	};


	static PlaylistImportance(OnSubmit, OnClose) {
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
					defaultAction: "close",
					action: {f: OnClose, e: "click"}
				},
				{
					icon: null,
					text: "Apply",
					style: "light",
					action: {f: OnSubmit, e: "click"}
				}
			]
		};
	};

	static PlaylistImportancePrimary(OnSubmit, OnClose) {
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
					defaultAction: "close",
					action: {f: OnClose, e: "click"}
				},
				{
					icon: null,
					text: "Apply",
					style: "light",
					action: {f: OnSubmit, e: "click"}
				}
			]
		};
	};

	





	static EditMetadata(OnSubmit, OnClose) {
		const uninteractable = (parent, textName) => {
			const text = parent.querySelector(`#${textName}`);
			const checkInput = parent.querySelector(`#def_${textName}`);

			if (checkInput.checked) ext.AddToClass(text, "c-uninteractable");
			else ext.RemoveFromClass(text, "c-uninteractable");
		};

		return {
			content: [
				{
					class: "c-popup-title",
					text: "Edit List Metadata",
					icon: "album"
				},
				{
					class: "c-text-input",
					id: "name",
					text: "Title"
				},
				{
					class: "c-check-input",
					id: "def_name",
					text: "Reset to default",
					action: {e: "change", f: (parent) => uninteractable(parent, "name")}
				},
				{
					class: "c-text-input",
					id: "desc",
					text: "Description"
				},
				{
					class: "c-check-input",
					id: "def_desc",
					text: "Reset to default",
					action: {e: "change", f: (parent) => uninteractable(parent, "desc")}
				},
				{
					class: "c-text-input",
					id: "thumb",
					text: "Thumbnail URL"
				},
				{
					class: "c-check-input",
					id: "def_thumb",
					text: "Reset to default",
					action: {e: "change", f: (parent) => uninteractable(parent, "thumb")}
				},
				/*{
					class: "c-text-input",
					id: "bkg",
					text: "Custom Page Background URL"
				},
				{
					class: "c-check-input",
					id: "def_bkg",
					text: "Reset to default",
					action: {e: "change", f: (parent) => uninteractable(parent, "bkg")}
				},*/
				{
					class: "c-text-input",
					id: "subType",
					text: "Release Type (Album, Single, EP)"
				},
				{
					class: "c-check-input",
					id: "def_subType",
					text: "Reset to default",
					action: {e: "change", f: (parent) => uninteractable(parent, "subType")}
				},
				{
					class: "c-text-input",
					id: "year",
					text: "Year"
				},
				{
					class: "c-check-input",
					id: "def_year",
					text: "Reset to default",
					action: {e: "change", f: (parent) => uninteractable(parent, "year")}
				},
				{
					class: "c-text-input",
					id: "artist",
					text: "Artist ID (UC..)"
				},
				{
					class: "c-check-input",
					id: "def_artist",
					text: "Reset to default",
					action: {e: "change", f: (parent) => uninteractable(parent, "artist")}
				}
			],
			actions: [
				{
					icon: null,
					text: "Cancel",
					style: "text-only",
					defaultAction: "close",
					action: {f: OnClose, e: "click"}
				},
				{
					icon: null,
					text: "Apply",
					style: "light",
					action: {f: OnSubmit, e: "click"}
				}
			]
		};		
	};
};