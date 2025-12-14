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
		musicFixer.HideElem(this.ytNewPlBtn);
		musicFixer.HideElem(this.buttons.edit);

		musicFixer.UnhideElem(this.buttons.finish);
		musicFixer.UnhideElem(this.buttons.folder);
		musicFixer.UnhideElem(this.buttons.sep);
		musicFixer.UnhideElem(this.buttons.carousel);


	};

	CloseEditModeOnClick() {

	};


	CreateAllEditButtons() {
		this.buttons = {
			edit: musicFixer.CreateButtonElem("pencil", "Edit", "dark"),
			finish: musicFixer.CreateButtonElem("check", "Finish", "dark"),
			folder: musicFixer.CreateButtonElem("folder", "Create", "dark"),
			sep: musicFixer.CreateButtonElem("add", "Line", "dark"),
			carousel: musicFixer.CreateButtonElem("add", "Carousel", "dark")
		};

		this.buttons.edit.addEventListener("click", this.OpenEditModeOnClick);
		this.buttons.finish.addEventListener("click", this.CloseEditModeOnClick);
		this.buttons.folder.addEventListener("click", this.CreateFolderOnClick);
		this.buttons.sep.addEventListener("click", this.CreateSeparatorOnClick);
		this.buttons.carousel.addEventListener("click", this.CreateCarouselOnClick);

		Object.values(this.buttons).forEach((button) => {
			musicFixer.HideElem(button);
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
			const svg = musicFixer.GetSVG(icon);
			
			const div = document.createElement("div");
			musicFixer.AddToClass(div, "c-paper-btn");
			musicFixer.AddToClass(div, size);

			div.append(svg);
			this.svgs[icon] = div;
		});
	};


	constructor() {
		this.ytButtonsCont = document.querySelector(musicFixer.HELPFUL_SELECTORS.sidebarYTButtonsCont);
		this.ytNewPlBtn = this.ytButtonsCont.querySelector("yt-button-renderer");

		// RENAME YT BUTTON FROM "New Playlist" TO "New"
		this.ytNewPlBtn.querySelector("yt-core-attributed-string").textContent = "New"; 

		this.ClearEditButtons(); // DELETE OLD, INCASE MODULE RELOADED.
		this.CreateAllEditButtons(); // CREATE NEW

		musicFixer.UnhideElem(this.buttons.edit);
		this.GenerateSVGs();
	};
};