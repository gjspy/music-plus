export class SidebarEditFeatures {

	REQUIRED_ICONS_AND_SIZES = {
		visible: "small",
		invisible: "small",
		pencil: "small",
		delete: "small",
		move: "tiny",
		expand: "tiny"
	};


	CreateFolderOnClick() {

	};

	CreateSeparatorOnClick() {

	};

	CreateCarouselOnClick() {

	};


	AddEditButtonsToElem(elem) {
		const paper = elem.querySelector(".c-paper-item");
		

		const normButtonCont = elem.querySelector(".c-paper-button-cont");
		const editCont = normButtonCont.cloneNode(true);
		ext.HideElem(normButtonCont);
		ext.UnhideElem(editCont);

		paper.append(editCont);
		ext.AddToClass(editCont, "c-editing");

		editCont.append(this.svgs["move"].cloneNode(true));

		let isHidden = elem.matches(".c-hidden");
		const vis = this.svgs[(isHidden) ? "invisible" : "visible"].cloneNode(true);

		editCont.append(vis);
		vis.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();

			isHidden = !isHidden;

			vis.replaceWith(this.svgs[(isHidden) ? "invisible" : "visible"].cloneNode(true));

			ext.DispatchEventToEW({
				func: "sidebar-vis-change",
				id: elem.getAttribute("plId"),
				"isHidden": isHidden
			});
		});

		const isFolder = elem.matches(".c-paper-folder");
		if (!isFolder) return;

		const pencil = this.svgs["pencil"].cloneNode(true);
		editCont.append(pencil);

		pencil.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();

			// TODO: Rename popup
		});

		const del = this.svgs["delete"].cloneNode(true);
		editCont.insertBefore(del, editCont.firstElementChild);

		del.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();

			// TODO: delete popup
		});
	};


	OpenEditModeOnClick() {
		ext.HideElem(this.ytNewPlBtn);
		ext.HideElem(this.buttons.edit);

		ext.UnhideElem(this.buttons.finish);
		ext.UnhideElem(this.buttons.folder);
		ext.UnhideElem(this.buttons.sep);
		ext.UnhideElem(this.buttons.carousel);

		for (const elem of document.querySelectorAll("#guide .c-sidebar-sep, #guide .c-carousel")) {
			elem.setAttribute("c-draggable","true");

			const del = this.svgs["delete"].cloneNode(true);
			elem.append(del);

			del.addEventListener("click", (e) => {
				e.preventDefault();
				elem.stopImmediatePropagation();

				elem.remove();

				ext.DispatchEventToEW({
					func: "delete-sidebar-elem",
					id: elem.getAttribute("plid")
				});
			});
		};

		for (const elem of document.querySelectorAll("#guide .c-paper-wrapper:not([is-primary])")) {

		};
	};

	CloseEditModeOnClick() {

	};


	CreateAllEditButtons() {
		this.buttons = {
			edit: ext.CreateButtonElem("pencil", "Edit", "dark"),
			finish: ext.CreateButtonElem("check", "Finish", "dark"),
			folder: ext.CreateButtonElem("folder", "Create", "dark"),
			sep: ext.CreateButtonElem("add", "Line", "dark"),
			carousel: ext.CreateButtonElem("add", "Carousel", "dark")
		};

		this.buttons.edit.addEventListener("click", this.OpenEditModeOnClick);
		this.buttons.finish.addEventListener("click", this.CloseEditModeOnClick);
		this.buttons.folder.addEventListener("click", this.CreateFolderOnClick);
		this.buttons.sep.addEventListener("click", this.CreateSeparatorOnClick);
		this.buttons.carousel.addEventListener("click", this.CreateCarouselOnClick);

		Object.values(this.buttons).forEach((button) => {
			ext.HideElem(button);
			this.ytButtonsCont.append(button);
		});

		fconsole.error("SIDEBAR EDIT SERVICE IS INCOMPLETE.");
	};


	ClearEditButtons() {
		this.buttons = {};

		this.ytButtonsCont.querySelectorAll(".c-button").forEach((button) => {
			button.remove();
		});
	};


	GenerateSVGs() {
		this.svgs = {};
		Object.entries(this.REQUIRED_ICONS_AND_SIZES).forEach(([icon, size]) => {
			const svg = ext.GetSVG(icon);
			
			const div = document.createElement("div");
			ext.AddToClass(div, "c-paper-btn");
			ext.AddToClass(div, size);

			div.append(svg);
			this.svgs[icon] = div;
		});
	};


	async init() {
		this.ytButtonsCont = (await ext.WaitForBySelector(ext.HELPFUL_SELECTORS.sidebarYTButtonsCont, undefined, false))[0];
		this.ytNewPlBtn = this.ytButtonsCont.querySelector("yt-button-renderer");

		// RENAME YT BUTTON FROM "New Playlist" TO "New"
		this.ytNewPlBtn.querySelector("yt-core-attributed-string").textContent = "New"; 

		this.ClearEditButtons(); // DELETE OLD, INCASE MODULE RELOADED.
		this.CreateAllEditButtons(); // CREATE NEW

		ext.UnhideElem(this.buttons.edit);
		this.GenerateSVGs();
	};


	constructor() {
		
	};
};