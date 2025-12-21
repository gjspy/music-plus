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


	OpenEditModeOnClick() {
		ext.HideElem(this.ytNewPlBtn);
		ext.HideElem(this.buttons.edit);

		ext.UnhideElem(this.buttons.finish);
		ext.UnhideElem(this.buttons.folder);
		ext.UnhideElem(this.buttons.sep);
		ext.UnhideElem(this.buttons.carousel);


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


	constructor() {
		this.ytButtonsCont = document.querySelector(ext.HELPFUL_SELECTORS.sidebarYTButtonsCont); // TODO: this errors, bcs queries before yt has loaded the buttn
		this.ytNewPlBtn = this.ytButtonsCont.querySelector("yt-button-renderer");

		// RENAME YT BUTTON FROM "New Playlist" TO "New"
		this.ytNewPlBtn.querySelector("yt-core-attributed-string").textContent = "New"; 

		this.ClearEditButtons(); // DELETE OLD, INCASE MODULE RELOADED.
		this.CreateAllEditButtons(); // CREATE NEW

		ext.UnhideElem(this.buttons.edit);
		this.GenerateSVGs();
	};
};