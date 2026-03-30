export class PopupService {

	_FloatingTextInput(elem, label, underline) {
		let isFocused;

		const decide = () => {
			if (elem.value === "") {
				ext.RemoveFromClass(elem, "floating");
				return;
			};

			ext.AddToClass(elem, "floating");
		};

		elem.addEventListener("input", () => decide());
		elem.addEventListener("focus", () => ext.AddToClass(elem, "floating"));
		elem.addEventListener("blur", () => decide());
	};

	InitialiseItemsGrid({title, subtitle, items}) {
		this.contents = ext.GetTemplateElem("c-grid-popup"); // CREATE CONT
		this.childCont = this.contents.querySelector(".elem-cont");
		
		this.contents.querySelector(".header a:first-child").textContent = title;
		this.contents.querySelector(".header a:last-child").textContent = subtitle;

		this.items = items;
	};
	

	async _LoadGrid() {
		const paperService = new sidebarService();
		
		await paperService.PopulateCont(this.items, this.childCont);
		return Array.from(this.childCont.children);
	};


	_AppendModalItem(item) {
		const elem = ext.GetTemplateElem(item.class);

		if (item.text) elem.querySelector("label").textContent = item.text;
		if (item.icon) elem.querySelector(".c-popup-icon").append(ext.GetSVG(item.icon));
		if (item.id) elem.setAttribute("id", item.id);

		if (item.class === "c-text-input") this._FloatingTextInput(elem.querySelector("input"), elem.querySelector("label"), elem.querySelector(".c-underline"));

		for (const underline of elem.querySelectorAll(".c-underline:empty")) {
			underline.append(ext.GetTemplateElem("c-underline"));
		};

		this.childCont.append(elem);
	};


	InitialiseModal({content, actions}) {
		this.contents = ext.GetTemplateElem("c-popup-bkg");
		this.childCont = this.contents.querySelector(".c-popup-content");
		this.items = content;
		this.actions = actions;
	};

	_LoadModal() {
		this.items.forEach(v => this._AppendModalItem(v));

		const actionsCont = this.contents.querySelector(".c-popup-actions");

		this.actions.forEach(v => {
			const btn = ext.CreateButtonElem(v.icon, v.text, v.style, v.id);

			if (v.defaultAction === "close") btn.addEventListener("click", () => this.ClearPopups());
			if (v.action) btn.addEventListener("click", () => v.action(this.contents));

			actionsCont.append(btn);
		});
	};


	Load() {
		ext.AddToClass(this.contents, "c-popup");

		document.body.append(this.contents);

		if (this.type === "modal") this._LoadModal();
		else if (this.type === "grid") return this._LoadGrid();
	};


	ClearPopups() {
		for (const popup of document.body.querySelectorAll(".c-popup")) {
			popup.remove();
		};
	};

	static ClearAllPopups() {
		for (const popup of document.body.querySelectorAll(".c-popup")) {
			popup.remove();
		};
	};


	constructor(type, options) {
		this.type = type;

		if (type === "modal") this.InitialiseModal(options);
		else if (type === "grid") this.InitialiseItemsGrid(options);
	};
};