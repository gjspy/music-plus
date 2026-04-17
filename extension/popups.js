export class PopupService {

	dropdownPadFromDocumentEdge = 40;

	_FloatingTextInput(elem) {
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
		document.body.append(this.contents);
		
		await paperService.PopulateCont(this.items, this.childCont);
		return Array.from(this.childCont.children);
	};


	_AppendModalItem(item) {
		const elem = ext.GetTemplateElem(item.class);

		if (item.text) elem.querySelector("label").textContent = item.text;
		if (item.icon) elem.querySelector(".c-popup-icon").append(ext.GetSVG(item.icon));
		if (item.id) elem.setAttribute("id", item.id);

		if (item.class === "c-text-input") this._FloatingTextInput(elem.querySelector("input"));

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

		document.body.append(this.contents);
	};

	InitialiseDropdown({buttons, originalClickEvent, scope, onClickRunFirst}) {
		this.contents = document.createElement("div");
		this.contents.className = "c-popup-bkg";

		this.childCont = document.createElement("div");
		this.childCont.className = "c-dropdown";
		this.contents.append(this.childCont);

		this.items = buttons;
		this.originalClickEvent = originalClickEvent;
		this.scope = scope;
		this.onClickRunFirst = onClickRunFirst;
	};

	_LoadDropdown() {
		this.contents.style.opacity = 0;

		document.body.append(this.contents);

		for (const v of this.items) {
			const button = document.createElement("div");
			button.className = v.type + "-btn c-drop-btn";

			if (v.icon) button.append(ext.GetSVG(v.icon));

			const text = document.createElement("a");
			text.textContent = v.text;
			button.append(text);

			if (v.onclick) button.onclick = () => {
				if (this.onClickRunFirst) this.onClickRunFirst.call(this.scope);

				this.ClearPopups();

				const state = polymerController.store.getState();
				const pageId = ext.SafeDeepGet(state, ext.Structures.browseIdFromPolymerState());
				v.onclick.call(this.scope, state, pageId);
			};

			this.childCont.append(button);
		};

		setTimeout(() => {
			const bounds = {
				x: document.documentElement.clientWidth,
				y: document.documentElement.clientHeight
			};

			const size = this.childCont.getBoundingClientRect();

			const posX = Math.min(this.originalClickEvent.x, bounds.x - size.width - this.dropdownPadFromDocumentEdge);
			const posY = Math.min(this.originalClickEvent.y + 20, bounds.y - size.height - this.dropdownPadFromDocumentEdge);

			this.contents.style.left = String(posX) + "px";
			this.contents.style.top = String(posY) + "px";
			this.contents.style.opacity = "1";
		}, 1);
	};


	Load() {
		ext.AddToClass(this.contents, "c-popup");

		if (this.type === "modal") this._LoadModal();
		else if (this.type === "grid") return this._LoadGrid();
		else if (this.type === "dropdown") return (new Promise(() => setTimeout(() => this._LoadDropdown(), 1)));

		return Promise.resolve([]);
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
		else if (type === "dropdown") this.InitialiseDropdown(options);
	};
};