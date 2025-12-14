export class Popups {



	// RUN THIS TO LOAD + SHOW THE POPUP!
	async Load() {
		if (!this.storage) this.storage = await musicFixer.StorageGet();

		// INCLUDE FOLDERS
	};


	InitialiseItemsGrid({title, subtitle, storage}) {
		this.contents = musicFixer.GetTemplateElem("c-grid-popup");
		
		this.contents.querySelector(".header a:first-child").textContent = title;
		this.contents.querySelector(".header a:last-child").textContent = subtitle;

		this.storage = storage;
	};


	/**
	 * 
	 * @param {*} type"modal", "grid", "list"
	 *
	 * @param {*} options
	 * [modal]: ...
	 * 
	 * [grid]: title, subtitle, storage?
	 */
	constructor(type, options) {
		this.type = type;

		if (type === "modal") fconsole.log();
		else if (type === "grid") this.InitialiseItemsGrid(options);
	};
};