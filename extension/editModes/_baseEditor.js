export class BaseEditMode {
	buttons = {};
	infoButtons = {};
	affectsBrowsePage = false;

	addButton(name, onclick) {
		const button = ext.GetSVG(name);
		ext.AddToClass(button, "c-button");

		this.buttonCont?.append(button);
		button.onclick = onclick;

		return button;
	};

	browsePageInit(state) {
		const hasEditedResponse = state.navigation.mainContent.response.cMusicFixerExtChangedResponse;
		const browseId = state.navigation.mainContent.endpoint.data.browseId;

		if (hasEditedResponse) this.addButton("doc-revert", () => ext.Navigate(ext.BuildEndpoint({
			navType: "browse",
			id: browseId,
			cParams: { returnOriginal: true }
		})));

		this.browsePage = document.querySelector("ytmusic-browse-response");
	};

	enableEditMode() {
		ext.HideElem(this.editButton);
		ext.UnhideElem(this.cancelButton);

		if (this.affectsBrowsePage) this.browsePage.setAttribute("c-editing", true);
	};

	disableEditMode() {
		ext.UnhideElem(this.editButton);
		ext.HideElem(this.cancelButton);

		popupService.ClearAllPopups();

		if (this.affectsBrowsePage && this.browsePage.getAttribute("c-editing")) {
			this.clearButtonsFromListItems();

			this.browsePage.removeAttribute("c-editing"); // do AFTER to show success
		};
	};

	clearButtonsFromListItems() {
		const listItems = document.querySelectorAll(ext.HELPFUL_SELECTORS.listItemRenderersOfCurrentBrowseResponse);
	
		let visibleIndex;
		for (const listItem of listItems) {
			const data = listItem.data?.cData;

			if (visibleIndex === undefined) visibleIndex = data.indexData.displayIndex;
			if ((!data) || data.thisData.hidden) continue;

			listItem.querySelector(".left-items .index").textContent = String(visibleIndex);
			visibleIndex++;

			listItem.querySelectorAll(".c-edit-btn").forEach(v => v.remove());
		};

		ext.AddLeftIconsToListItems(listItems);
	};

	addEditButton() {
		this.cancelButton = this.addButton("cross", () => this.disableEditMode());
		ext.HideElem(this.cancelButton);

		this.editButton = this.addButton("pencil", (e) => {
			(new popupService("dropdown", {
				buttons: this.buttons,
				originalClickEvent: e,
				scope: this,
				onClickRunFirst: this.enableEditMode
			})).Load();
		});
	};


	close() {
		this.buttonCont?.remove();
	};


	init() {
		const existing = this.rightContent.querySelector(".c-master-buttons");
		if (existing) existing.remove();

		const newCont = document.createElement("div");
		newCont.className = "c-master-buttons";

		this.rightContent.insertBefore(newCont, this.rightContent.firstElementChild);
		this.buttonCont = newCont;

		if (this.affectsBrowsePage) this.browsePageInit(polymerController.store.getState());
		this.addEditButton();
	};


	constructor() {
		this.rightContent = document.querySelector("ytmusic-nav-bar #right-content");
		if (!this.rightContent) return;
	};
};