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

	
};