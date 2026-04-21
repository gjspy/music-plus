export class SidebarEditFeatures {

	REQUIRED_ICONS_AND_SIZES = {
		visible: "small",
		invisible: "small",
		pencil: "small",
		delete: "small",
		move: "tiny",
		expand: "tiny"
	};

	static ApplyChanges(elem) {
		const parent = elem.closest(".c-grid-popup, div#items, .c-paper-folder, .c-carousel");
		if (parent.classList.contains("c-popup")) return;

		const parentPaperCont = (parent.classList.contains("c-paper-folder")) ? parent.querySelector(".c-paper-folder-cont") : parent;

		const parentContents = Array.from(parentPaperCont.querySelectorAll(":scope > [plid]")).map(v => v.getAttribute("plid"));
		
		ext.DispatchEventToEW({
			func: "storage",
			storageFunc: "sidebar",
			data: {
				data: {
					"id": (parent.matches("div#items")) ? "paperItemOrder" : parent.getAttribute("plid"),
					contents: parentContents,
					type: "folder"
				},
				_saveBackup: true
			}
		});
	};


	AddDragFeatures(ovfCont) {
		function GetElemHoveringOver(event) {
			let mouseOverElem = document.elementFromPoint(event.clientX, event.clientY);
			if (!mouseOverElem) return; // not hovering over anything somehow??

			let mouseOverWrapper = mouseOverElem.closest(".c-paper-wrapper, .c-sidebar-sep, .c-carousel"); // closest ancestor
			return mouseOverWrapper;
		};

		function AreCoordsInBounds(coords, bounds) {
			return (
				(coords.x > bounds.left && coords.x < bounds.right) && 
				(coords.y > bounds.top && coords.y < bounds.bottom)
			);
		};

		function OutOfBounds() {
			isOob = true;
			grabTarget.setAttribute("c-dragging", "oob");

			if (!(originalInsertedInside)) return;

			originalInsertedInside.insertBefore(grabTarget, originalInsertedBefore);
		};

		function InBounds() {
			isOob = false;
			grabTarget.setAttribute("c-dragging", "true");
		};

		function GetClosestElemToMouse(x, y) { // -> [closest, parent]
			const mouseOverElem = document.elementFromPoint(x, y);
			if (!mouseOverElem) return;

			let containerOfMOE = mouseOverElem.closest(".c-paper-wrapper, .c-sidebar-sep, .c-carousel");
			if (!containerOfMOE) return;

			if (containerOfMOE === grabTarget) return; // ??

			if (grabTarget.contains(containerOfMOE)) return;

			const isInsertableFolder = containerOfMOE.matches(".c-paper-folder.open");
			const isHoveringFolderTitle = (isInsertableFolder && mouseOverElem.closest(".c-paper-item") === containerOfMOE.children[0]);
			const folderCont = isInsertableFolder && containerOfMOE.querySelector(".c-paper-folder-cont");

			if (isInsertableFolder && !isHoveringFolderTitle && folderCont.children.length === 0) {
				return [null, folderCont];
			};


			const carousel = containerOfMOE.closest(".c-carousel");

			if (carousel) {
				if (targetIsFolder || targetIsCarousel) {
					containerOfMOE = carousel; // SET IS HOVERING OVER CAROUSEL, NOT CHILD OF CAROUSEL.

				} else {
					if (carousel.children.length === 1) return [carousel.firstElementChild, carousel];
					if (containerOfMOE === carousel) return;

					// SAME LOGIC AS NORMAL, BUT WITH X ISNTEAD OF Y
					const bounds = containerOfMOE.getBoundingClientRect();

					if (x > bounds.x + (bounds.width * 0.5)) return [containerOfMOE.nextElementSibling, carousel];
					return [containerOfMOE, carousel];
				};
			};

			const bounds = ((isHoveringFolderTitle) ? containerOfMOE.querySelector(".c-paper-item") : containerOfMOE).getBoundingClientRect();

			if (y > bounds.y + (bounds.height * 0.5)) {
				if (isHoveringFolderTitle) return [folderCont.firstElementChild, folderCont];
				return [containerOfMOE.nextElementSibling, containerOfMOE.parentElement];
			};

			return [containerOfMOE, containerOfMOE.parentElement];
		};

		

		function ApplyChange() {
			if (originalInsertedBefore === insertedBefore) return;
			sidebarEditService.ApplyChanges(insertedInside);

			if (originalInsertedInside === insertedInside) return;
			sidebarEditService.ApplyChanges(originalInsertedInside); // UPDATE ORIGINAL TO REMOVE ITEM.
		};

		function OnMouseDown(event) {
			if (event.button !== 0) return;
			if (event.target.closest(".c-paper-btn")) return;

			const toGrab = GetElemHoveringOver(event);
			
			if (!toGrab) return;
			if (!toGrab.hasAttribute("c-draggable")) return;

			event.preventDefault();
			event.stopImmediatePropagation();

			mouseDown = true;
			grabTarget = toGrab;

			targetIsFolder = grabTarget.matches(".c-paper-folder");
			targetIsCarousel = grabTarget.matches(".c-carousel");

			InBounds();

			originalInsertedBefore = grabTarget.nextElementSibling;
			originalInsertedInside = grabTarget.parentElement;

			insertedBefore = grabTarget.nextElementSibling;
			insertedInside = grabTarget.parentElement;
			
			isOob = false;
			isOvf = !!insertedInside?.closest(".c-grid-popup");
		};

		function OnMouseMove(event) {
			if (!(mouseDown && grabTarget)) return;

			event.preventDefault();
			event.stopImmediatePropagation();

			const isMouseInGuide = AreCoordsInBounds({x: event.clientX, y: event.clientY}, contBounds);

			if (!isMouseInGuide) {
				const isInOvf = AreCoordsInBounds({x: event.clientX, y: event.clientY}, ovfBounds);

				if (!isInOvf) {
					if (isOob) return;

					OutOfBounds();
					return;
				};

				if (isOvf) return; // DON'T REARRANGE IN OVF. JUST PUT THERE AND LEAVE.

				InBounds();
			};

			if (isOob) InBounds();

			const resp = GetClosestElemToMouse(event.clientX, event.clientY);
			if (!resp) return;
			const [closest, parent] = resp;
			if (insertedBefore === closest && insertedInside === parent) return;

			isOvf = parent.closest(".c-grid-popup");

			parent.insertBefore(grabTarget, closest);

			insertedBefore = closest;
			insertedInside = parent;
		};

		function OnMouseUp(event) {
			if (!grabTarget) return;

			event.preventDefault();
			event.stopImmediatePropagation();

			grabTarget.removeAttribute("c-dragging");
			grabTarget = undefined;

			mouseDown = false;

			ApplyChange();
		};	

		const contBounds = this.guideCont.getBoundingClientRect();
		const ovfBounds = ovfCont.getBoundingClientRect();

		let mouseDown, grabTarget, targetIsFolder, targetIsCarousel;
		let isOob, isOvf;
		let originalInsertedBefore, originalInsertedInside;
		let insertedBefore, insertedInside;

		document.body.onmousedown = OnMouseDown;
		document.body.onmousemove = OnMouseMove;
		document.body.onmouseup = OnMouseUp;
		document.body.oncontextmenu = OnMouseUp; // accidental right click
	};


	CreateFolderOnClick() {
		function OnSubmit(popup) {
			const title = popup.querySelector("#nameField");
			const titleVal = title.querySelector("input").value;

			if (titleVal === "") {
				ext.AddToClass(title, "invalid");
				return;
			};

			const subtitleVal = popup.querySelector("#subtitleField input").value;

			ext.DispatchFunctionToEW({
				func: "storage",
				storageFunc: "sidebar-new-folder",
				data: {
					data: {
						folderType: "folder",
						name: titleVal,
						subtitle: subtitleVal,
						type: "folder"
					}
				}
			}).then(v => {
				const service = window.cMusicFixerRunningServices.sidebarService; // TODO meth to get service
				const created = service.CreateAndPopulateFolderPaperItem(v.storage[0], service.masterCont, service.masterCont.firstElementChild);

				window.cMusicFixerRunningServices.sidebarEditService.AddEditButtonsToAny(created);

				popup.remove();
			});
		};

		(new popupService("modal", popupTemplates.NewFolder(OnSubmit))).Load();
	};

	CreateSeparatorOnClick() {
		function OnSubmit(popup) {
			const title = popup.querySelector("#nameField");
			const titleVal = title.querySelector("input").value;

			ext.DispatchFunctionToEW({
				func: "storage",
				storageFunc: "sidebar-new-sep",
				data: {
					data: {
						name: titleVal,
						type: "separator"
					}
				}
			}).then(v => {
				const service = window.cMusicFixerRunningServices.sidebarService; // TODO meth to get service
				const created = service.CreateSeparatorItem(v.storage[0], service.masterCont, service.masterCont.firstElementChild);

				window.cMusicFixerRunningServices.sidebarEditService.AddEditButtonsToAny(created);
				sidebarEditService.ApplyChanges(service.masterCont);

				popup.remove();
			});
		};

		(new popupService("modal", popupTemplates.NewSeparator(OnSubmit))).Load();
	};

	CreateCarouselOnClick() {
		ext.DispatchFunctionToEW({
			func: "storage",
			storageFunc: "sidebar-new-folder",
			data: {
				data: {
					folderType: "carousel",
					type: "folder"
				}
			}
		}).then(v => {
			const service = window.cMusicFixerRunningServices.sidebarService; // TODO meth to get service
			const created = service.CreateAndPopulateFolderPaperItem(v.storage[0], service.masterCont, service.masterCont.firstElementChild);

			window.cMusicFixerRunningServices.sidebarEditService.AddEditButtonsToAny(created);
			sidebarEditService.ApplyChanges(service.masterCont);
		});
	};


	AddEditButtonsToElem(elem) {
		elem.setAttribute("c-draggable","true");

		const paper = elem.querySelector(".c-paper-item");

		const normButtonCont = elem.querySelector(".c-paper-button-cont");
		const editCont = normButtonCont.cloneNode(); // NO subtree, dont want children
		
		ext.UnhideElem(editCont);
		ext.HideElem(normButtonCont);

		paper.append(editCont);
		ext.AddToClass(editCont, "c-editing");

		let isHidden = elem.matches(".c-hidden");
		const vis = this.svgs[(isHidden) ? "invisible" : "visible"].cloneNode(true);

		editCont.append(vis);
		vis.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();

			isHidden = !isHidden;

			vis.replaceWith(this.svgs[(isHidden) ? "invisible" : "visible"].cloneNode(true));

			if (isHidden) ext.HideElem(elem);
			else ext.UnhideElem(elem);

			ext.DispatchEventToEW({
				func: "storage",
				storageFunc: "sidebar-vis-change",
				data: {
					data: {
						id: elem.getAttribute("plId"),
						mode: (isHidden) ? "add" : "del"
					}
				}
			});
		});

		editCont.append(this.svgs["move"].cloneNode(true));

		const isFolder = elem.matches(".c-paper-folder");
		if (!isFolder) {
			return;
		};

		this.AddEditButtonsToSepCar(editCont, elem);
	};




	AddEditButtonsToSepCar(elem, elemToRemoveOnClick) {
		elem.setAttribute("c-draggable","true");

		const del = this.svgs["delete"].cloneNode(true);
		elem.append(del);

		del.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();

			const inside = elemToRemoveOnClick.parentElement;

			elemToRemoveOnClick.remove();

			ext.DispatchEventToEW({
				func: "storage",
				storageFunc: "sidebar-del",
				data: {
					data: {
						id: elemToRemoveOnClick.getAttribute("plId"),
						type: elemToRemoveOnClick.matches(".c-sidebar-sep") ? "separator" : "folder"
					},
					_saveBackup: true
				}
			});

			sidebarEditService.ApplyChanges(inside);
		});
	};


	AddEditButtonsToAny(elem) {
		if (elem.matches(".c-sidebar-sep, .c-carousel")) return this.AddEditButtonsToSepCar(elem, elem);
		this.AddEditButtonsToElem(elem);
	};


	OpenEditModeOnClick() {
		ext.HideElem(this.ytNewPlBtn);
		ext.HideElem(this.buttons.edit);

		ext.UnhideElem(this.buttons.finish);
		ext.UnhideElem(this.buttons.folder);
		ext.UnhideElem(this.buttons.sep);
		ext.UnhideElem(this.buttons.carousel);

		for (const elem of this.guideCont.querySelectorAll(".c-sidebar-sep, .c-carousel")) {
			this.AddEditButtonsToSepCar(elem, elem);
		};

		for (const elem of this.guideCont.querySelectorAll(".c-paper-wrapper:not([is-primary])")) {
			this.AddEditButtonsToElem(elem);
		};

		ext.DispatchFunctionToEW({
			func: "storage",
			storageFunc: "get-library"
		}).then(v => {
			const ps = new popupService("grid", {"title": "Sidebar Items", "items": v.storage});
			ps.Load().then(children => children.forEach(child => this.AddEditButtonsToAny(child)));

			this.AddDragFeatures(ps.contents);
		});
	};

	CloseEditModeOnClick() {
		ext.UnhideElem(this.ytNewPlBtn);
		ext.UnhideElem(this.buttons.edit);

		ext.HideElem(this.buttons.finish);
		ext.HideElem(this.buttons.folder);
		ext.HideElem(this.buttons.sep);
		ext.HideElem(this.buttons.carousel);

		for (const elem of this.guideCont.querySelectorAll(".c-sidebar-sep, .c-carousel")) {
			elem.setAttribute("c-draggable","false");

			let deleteBtn = elem.querySelector(":scope > .c-paper-btn:has(.delete)");
			if (deleteBtn) deleteBtn.remove();
		};

		for (const elem of this.guideCont.querySelectorAll(".c-paper-wrapper:not([is-primary])")) {
			elem.setAttribute("c-draggable","false");
			
			const normButtonCont = elem.querySelector(".c-paper-button-cont:not(.c-editing)");
			const editButtonCont = elem.querySelector(".c-editing.c-paper-button-cont");
			
			// may not exist if created during edit mode, bugs
			if (normButtonCont && !elem.matches(".c-paper-folder")) ext.UnhideElem(normButtonCont);
			if (editButtonCont) editButtonCont.remove();
		};

		(new popupService()).ClearPopups();

		document.body.onmousedown = null;
		document.body.onmousemove = null;
		document.body.onmouseup = null;
		document.body.oncontextmenu = null;
	};


	InitAllEditButtons() {
		this.buttons.edit.addEventListener("click", () => this.OpenEditModeOnClick());
		this.buttons.finish.addEventListener("click", () => this.CloseEditModeOnClick());
		this.buttons.folder.addEventListener("click", () => this.CreateFolderOnClick());
		this.buttons.sep.addEventListener("click", () => this.CreateSeparatorOnClick());
		this.buttons.carousel.addEventListener("click", () => this.CreateCarouselOnClick());

		Object.values(this.buttons).forEach((button) => {
			ext.HideElem(button);
			this.ytButtonsCont.append(button);
		});
	};


	ClearEditButtons() {
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
		this.ytNewPlBtn = (await ext.WaitForBySelector("yt-button-renderer", this.ytButtonsCont, false))[0];

		this.guideCont = document.querySelector("ytmusic-guide-renderer");

		// RENAME YT BUTTON FROM "New Playlist" TO "New"
		(await ext.WaitForBySelector(".ytAttributedStringHost", this.ytNewPlBtn, false))[0].textContent = "New"; 

		this.ClearEditButtons(); // DELETE OLD, INCASE MODULE RELOADED.
		this.InitAllEditButtons(); // CREATE NEW

		ext.UnhideElem(this.buttons.edit);
		this.GenerateSVGs();
	};


	constructor() {
		this.svgs = {};
		this.buttons = {
			edit: ext.CreateButtonElem("pencil", "Edit", "dark"),
			finish: ext.CreateButtonElem("check", "Finish", "dark"),
			folder: ext.CreateButtonElem("folder", "Create", "dark"),
			sep: ext.CreateButtonElem("add", "Line", "dark"),
			carousel: ext.CreateButtonElem("add", "Carousel", "dark")
		};		
	};
};