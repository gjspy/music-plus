export class SidebarEditFeatures {
	// this function connects dragging events to all papers.
	function _AddDraggableFeatures(ovf) {
		function __OnEnter() {
			draggedPaper.setAttribute("c-dragging", "true");

			// dont do anything else here, we're just abt to do it
			// cus user has moved mouse.
		};

		function __OnLeave() {
			draggedPaper.setAttribute("c-dragging", "oob");

			if (originalInsertedInside) { // insert in original pos
				if (dragisOvf && originalInsertedInside.closest("ytmusic-guide-section-renderer")) {
					_MovePaperOutOVF(draggedPaper);
					
					dragisOvf = false;

				} else if ((!dragisOvf) && originalInsertedInside.closest(".c-popup-elem-overflow")) {
					UConvertCPaperItemToCGridItem(draggedPaper);

					dragisOvf = true;
				};

				draggedPaper.setAttribute("c-dragging", "oob");

				originalInsertedInside.insertBefore(draggedPaper, originalInsertedBefore);

				return;
			};
		};


		function __AutoScroll(event) {
			function __ScrollBy(mouseY) {
				let percentLineBtm = contBounds.y + (cont.clientHeight * 0.9);// + cont.scrollTop;
				let percentLineTop = contBounds.y + (cont.clientHeight * 0.1);// + cont.scrollTop;
	
				if (mouseY > percentLineBtm) {
					return 100;
				} else if (mouseY < percentLineTop) {
					return -100;
				};	

				return 0;
			};

			function ___OnIntervalForAutoScroll() {
				let toScroll = __ScrollBy(mousePos[1]);

				let fakeEvent = {clientX: mousePos[0], clientY: mousePos[1]};
				
				if (toScroll === 0 || !__IsDragInCont(fakeEvent) || !holdingClick) {
					clearInterval(interval);
					autoScrolling = false;
					return;
				};

				cont.scrollBy({top: toScroll, behavior: "smooth"});
			};

			let toScroll = __ScrollBy(event.y);

			if (toScroll !== 0) {
				cont.scrollBy({top: toScroll, behavior: "smooth"});
			};			

			let interval = setInterval(___OnIntervalForAutoScroll, 100);
			autoScrolling = true;
		};



		function __AreCoordsInBounds(coords, bounds) {
			return (
				(coords.x > bounds.left && coords.x < bounds.right) && 
				(coords.y > bounds.top && coords.y < bounds.bottom)
			);
		};

		function __IsDragInCont(event) {
			return __AreCoordsInBounds({x: event.clientX, y: event.clientY}, contBounds);
		};

		function __IsDragInOvf(event) {
			return __AreCoordsInBounds({x: event.clientX, y: event.clientY}, ovfBounds);
		};

		function __GetElemHoveringOver(event) {
			let mouseOverElem = document.elementFromPoint(event.clientX, event.clientY);
			if (!mouseOverElem) return; // not hovering over anything somehow??

			let mouseOverWrapper = mouseOverElem.closest(".c-paper-wrapper, .c-sidebar-sep, .c-ovf-elem, .c-carousel"); // closest ancestor
			return mouseOverWrapper;
		};

		function __GetClosestElemToMouse(event) {
			let mouseOverElem = document.elementFromPoint(event.clientX, event.clientY);
			if (!mouseOverElem) return [null, null]; // not hovering over anything somehow??

			let mouseOverWrapper = mouseOverElem.closest(".c-paper-wrapper, .c-sidebar-sep, .c-carousel"); // closest ancestor

			if (!mouseOverWrapper) { // is hovering over margin gap
				return [null, null]; // just ignore
			};


			// problems caused by subfolders
			if (mouseOverWrapper === draggedPaper) {
				if (draggingCarousel || draggingSep || draggingFolder) return [null, null];

				let bounds = mouseOverWrapper.getBoundingClientRect();
				let percentLineY = bounds.y + (bounds.height * 0.5);

				if (event.clientY > percentLineY) {
					// insert before the next elem. if does not exist is ok,
					// nextElemSib returns null, insertBefore(.., null) appends!!!
					let nextElem = mouseOverWrapper.nextElementSibling;
					if (!nextElem.matches(".c-carousel")) return [null, null];

					return [null, nextElem];
				};
				return [null, null];
			};

			if (draggedPaper.contains(mouseOverWrapper)) return [null, null];

			// ".open" to make sure we can insert into it.
			let isInsertableFolder = mouseOverWrapper.matches(".c-paper-folder.open"); // not IN a folder, IS a folder.
			// user is hovering over the folder's card (c-paper-item, not folder-cont)
			// MUST BE MOUSEOVERELEM!! CHECKS THAT USER ISNT HOVERING OVER THE FOLDER CONT.
			let isHoveringFolderTitle = (isInsertableFolder && !mouseOverElem.closest(".c-paper-folder-cont"));

			// user is hovering inside folder-cont but not over an elem.
			// ignore this, only to prevent glitching above and inside the folder. (margin/padding bug fixed)
			if (isInsertableFolder && !isHoveringFolderTitle) {
				let folderCont = mouseOverWrapper.querySelector(".c-paper-folder-cont");

				// no children to insert before, and this thinks that its hovering
				// over a gap.
				if (folderCont.children.length === 0) {
					return [null, folderCont];
				};

				// should never happen? (NOT cause of glitching when hovering over gaps)
				return [insertedBefore, insertedInside]; 
			};

			// CAROUSEL
			let carousel = mouseOverWrapper.closest(".c-carousel"); // is IN carousel

			// ALLOW SEPS IN CAROUSEL, RLLY GOOD FEATURE
			if (carousel && !draggingFolder && !draggingCarousel) { 
				//console.log("in carousel, not folder or sep", carousel, mouseOverWrapper);

				if (mouseOverWrapper === carousel) {
					if (insertedInside === carousel) return [null, null];
					
					return [carousel.firstElementChild, carousel];
				};

				let bounds = mouseOverWrapper.getBoundingClientRect();
				let percentLineX = bounds.x + (bounds.width * 0.5);

				if (event.clientX > percentLineX) {
					// insert before the next elem. if does not exist is ok,
					// nextElemSib returns null, insertBefore(.., null) appends!!!
					let nextElem = mouseOverWrapper.nextElementSibling;
					return [nextElem, carousel];
				};

				return [mouseOverWrapper, carousel];
			};

			if (carousel && (draggingFolder || draggingCarousel)) {
				mouseOverWrapper = carousel; // CANNOT insert folder into carousel
				// set mouseOverWrapper to carousel so it inserts AFTER carousel, not inside.
			};


			// ANYTHING ELSE: GET BOUNDS OF NORMAL PAPER ITEM. (OR FOLDER TITLE)
			let bounds = mouseOverWrapper.getBoundingClientRect();

			if (isHoveringFolderTitle) { // need to get bounds of title only, not including fodler-cont
				bounds = mouseOverWrapper.querySelector(".c-paper-item").getBoundingClientRect();
			};


			let percentLineY = bounds.y + (bounds.height * 0.5);

			if (event.clientY > percentLineY) {
				if (isHoveringFolderTitle) { // insert first to folderCont
					let folderCont = mouseOverWrapper.querySelector(".c-paper-folder-cont")

					return [folderCont.firstElementChild, folderCont];
				};

				// insert before the next elem. if does not exist is ok,
				// nextElemSib returns null, insertBefore(.., null) appends!!!
				let nextElem = mouseOverWrapper.nextElementSibling;
				return [nextElem, mouseOverWrapper.parentElement];
			};

			// insert before the current elem. is hovering above it.
			return [mouseOverWrapper, mouseOverWrapper.parentElement];
		};

		function __OnMouseDown(event) {
			console.log("MOUSEDOWN");
			let paper = __GetElemHoveringOver(event);

			if (!paper) return;
			if (!paper.hasAttribute("c-draggable")) return;
			if (event.button !== 0) return; // left click only

			if (event.target.closest(".c-paper-button-cont")) {
				if (event.target.closest(".c-paper-btn")) return;

				if (event.target.closest(".c-carousel")) draggingCarousel = true;
				else return;
			};
			
			event.stopPropagation();
			event.stopImmediatePropagation();
			event.preventDefault();

			holdingClick = true;
			draggedPaper = paper;

			draggingFolder = draggedPaper.matches(".c-paper-folder");
			dragisOvf = draggedPaper.matches(".c-ovf-elem");
			draggingSep = draggedPaper.matches(".c-sidebar-sep");
			draggingCarousel = draggedPaper.matches(".c-carousel");

			/*draggedPaper.setAttribute("c-clickable", "false");*/
			draggedPaper.setAttribute("c-dragging", "true");

			originalInsertedBefore = paper.nextElementSibling;
			originalInsertedInside = paper.parentElement;
			console.log("dragging", draggedPaper);
		};

		function __OnMouseMove(event) {
			if (!holdingClick) return;
			if (!draggedPaper) return;

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			mousePos = [event.x, event.y];

			let thisDragInCont = __IsDragInCont(event);

			if (!thisDragInCont) {

				if (__IsDragInOvf(event)) {
					if (draggingSep || draggingCarousel) return;
					if (!dragisOvf) {
						UConvertCPaperItemToCGridItem(draggedPaper);
						ovf.elemCont.append(draggedPaper);
					};

					dragisOvf = true;

					__OnEnter(); // nothing happens here other than opacity

					return;
				};

				__OnLeave();

				return;
			};

			__OnEnter(); // nothing happens here other than opacity

			// do now so can return happily
			if (!autoScrolling) {
				__AutoScroll(event)
			};
			
			let resp = __GetClosestElemToMouse(event);
			[closest, parent] = resp;

			//console.log("in cont! closest, parent, insertedBefore, insertedInside", closest, parent, insertedBefore, insertedInside);

			if (!closest && !parent) return;
			if (insertedBefore === closest && insertedInside === parent) return;

			if (dragisOvf) {// do this because we dont rearrange ovf ever (getclosest does not look for ovfelem)
				_MovePaperOutOVF(draggedPaper);
			};

			dragisOvf = false;
			
			parent.insertBefore(draggedPaper, closest);

			insertedBefore = closest;
			insertedInside = parent;	
		};

		function __OnMouseUp(event) {
			console.log("MOUSEUP",draggedPaper);
			if (!draggedPaper) return;

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			draggedPaper.removeAttribute("c-dragging");
			draggedPaper = undefined;

			holdingClick = false;

			dragisOvf = false;

			draggingSep = false;

			// does not matter if drag is in cont or not,
			// it is positioned ready to unclick anytime.

			setTimeout(() => USaveNewOrder(cont), 300); // incase of any bubbling with buttons
		};

		// CODE THAT RUNS
		// (css handles cursor/opacity with the c-dragging attribute.)

		const cont = document.querySelector("#sections>:not([is-primary])>#items"); // paper cont
		let contBounds = cont.getBoundingClientRect(); // used to ensure mouse is still inside when moving
		let ovfBounds = ovf.ovf.getBoundingClientRect();

		let draggedPaper, originalInsertedBefore, originalInsertedInside;
		let insertedInside, insertedBefore, mousePos;
		let dragisOvf = false;
		let autoScrolling = false;
		let draggingSep = false;
		let draggingCarousel = false;
		let draggingFolder = false;

		let holdingClick = false;

		// adding all event listeners
		// use .on instead of addEventListener, because user could
		// exit and re-enter edit mode. could just not readd events
		// on the second occasion, but new elems would be excluded.
		// (hasEventListener does not exist.)
		document.body.onmousedown = __OnMouseDown;
		document.body.onmousemove = __OnMouseMove;
		document.body.onmouseup = __OnMouseUp;
		document.body.oncontextmenu = __OnMouseUp;

	};

	function _NewFolderPopup(finishBtn) {
		let popup = UCreatePopup({
			title: {
				text: "New Folder",
				icon: "folder"
			},
			content: [
				{
					class: "c-text-input",
					config: [
						["label", "textContent", "Name - Required"]
					]
				},
				{
					class: "c-text-input",
					config: [
						["label", "textContent", "Subtitle"]
					]
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
					style: "light"
				}
			]
		});

		popup.querySelector("#create").addEventListener("click", function(e) {
			let title = popup.querySelector("input[_group=\"1\"]");
			let titleVal = title.value;
			let subVal = popup.querySelector("input[_group=\"2\"]").value;

			if (titleVal === "") { // cant have blank name of folder
				UAddToClass(title.parentElement, "invalid");
				return;
			};

			// most crude thing ever. really cant be bothered to add edit mode features
			// to new elem when made, so we're gonna cancel edit mode when its made.
			// to do this, instead of passing through a million arguments, we click the finish button.
			// embarassing? yes. do i care? yes. will i change it? no
			finishBtn.click();

			// dispatch custom event, received by isolated contentscript, messaged to bkg
			UDispatchEventToEW({
				func: "sidebar-new-folder",
				title: titleVal,
				subtitle: subVal
			});

			URemovePopup(popup, true);

			// EXTENSION WORLD CALLS MAIN WORLD ONCE FOLDER DECLARED THERE.
		});
	};

	

	function _NewSeparatorPopup(finishBtn) {
		let popup = UCreatePopup({
			title: {
				text: "New Separator",
				icon: "add"
			},
			content: [
				{
					class: "c-text-input",
					config: [
						["label", "textContent", "Title - Optional"]
					]
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
					style: "light"
				}
			]
		});

		popup.querySelector("#create").addEventListener("click", function(e) {
			let title = popup.querySelector("input[_group=\"1\"]");
			let titleVal = title.value;

			finishBtn.click();

			// dispatch custom event, received by isolated contentscript, messaged to bkg
			UDispatchEventToEW({
				func: "sidebar-new-sep",
				title: titleVal
			});

			URemovePopup(popup, true);
		});
	};

	function _NewCarousel(finishBtn) {
		// dispatch custom event, received by isolated contentscript, messaged to bkg

		UDispatchEventToEW({
			func: "sidebar-new-carousel"
		});

		finishBtn.click();
	};

	// this function ends edit mode, deletes most buttons, removes
	// draggability.
	function _DisableEditMode(editButton, newPlaylistBtn, btnsToRemove) {
		UUnHideElem(newPlaylistBtn);
		UUnHideElem(editButton);

		for (let btn of btnsToRemove) { // finishBtn, folderBtn, addBtn
			btn.remove(); // we make them again next time, dont fret :)
		};

		for (let elem of document.querySelectorAll("#guide .c-paper-wrapper:not([is-primary])")) {
			elem.removeAttribute("c-draggable");
			elem.removeAttribute("c-dragging");

			const normButtonCont = elem.querySelector(".c-paper-button-cont:not(.c-editing)");
			const editButtonCont = elem.querySelector(".c-editing.c-paper-button-cont");
			
			// may not exist if created during edit mode, bugs
			if (normButtonCont && !elem.matches(".c-paper-folder")) UUnHideElem(normButtonCont);
			if (editButtonCont) editButtonCont.remove();
		};

		for (let elem of document.querySelectorAll("#guide .c-sidebar-sep, #guide .c-carousel")) {
			elem.removeAttribute("c-draggable");
			elem.removeAttribute("c-dragging");

			let deleteBtn = elem.querySelector(":scope > .c-paper-btn:has(.delete)");
			if (deleteBtn) deleteBtn.remove();
		};

		/*for (let elem of document.querySelectorAll("#guide .c-paper-btn:has(.delete)")) {
			elem.remove();
		};*/

		/*for (let elem of document.querySelectorAll(".c-paper-folder")) {
			UAddToClass(elem, "closed");
			URemoveFromClass(elem, "open");
		};*/

		_HideOverflowCont();
		

		const cont = document.querySelector("#sections>:not([is-primary])>#items"); // paper cont
		cont.onmousedown = null;
		
		document.body.onmousedown = null;
		document.body.onmousemove = null;
		document.body.onmouseup = null;
		document.body.oncontextmenu = null;
	};

	function _MovePaperOutOVF(paper) {
		URemoveFromClass(paper, "c-ovf-elem");
		UAddToClass(paper, "c-paper-wrapper");
	}


	function _HideOverflowCont() {
		document.querySelector("div > .c-popup-elem-overflow").parentElement.remove();
	};

	
	
	// this function is called when the edit button is clicked.
	// HERE IS WHERE "DRAGGABLE" ATTR IS GIVEN TO ELEMS
	function _EnableEditMode(ytButtonsCont, editButton) {
		const newPlaylistBtn = ytButtonsCont.querySelector("yt-button-renderer"); // default "New Playlist" YT button.
		UHideElem(newPlaylistBtn); // hide it!

		UHideElem(editButton);

		// create new buttons
		const finishBtn = UCreateButton("check", "Finish", "dark");
		UAddToClass(finishBtn, "c-side-main");
		ytButtonsCont.append(finishBtn);


		const folderBtn = UCreateButton("folder", "Create", "dark");
		folderBtn.addEventListener("click",  function(e) {
			_NewFolderPopup(finishBtn);
		});

		ytButtonsCont.append(folderBtn);


		const addBtn = UCreateButton("add", "Line", "dark");
		addBtn.addEventListener("click", function(e) {
			_NewSeparatorPopup(finishBtn);
		});
		
		ytButtonsCont.append(addBtn);

		const carouselBtn = UCreateButton("add", "Carousel", "dark");
		carouselBtn.addEventListener("click", function(e) {
			_NewCarousel(finishBtn);
		});

		ytButtonsCont.append(carouselBtn);

		// KEEP THIS AFTER CREATING ALL OTHER BUTTONS!
		finishBtn.addEventListener("click", function(e) {
			_DisableEditMode(editButton, newPlaylistBtn, [finishBtn, folderBtn, addBtn, carouselBtn]);
		});


		// all return div containing respective svgs
		const visibleIcon = UGetSVGFromRaw("visible", true);
		const invisibleIcon = UGetSVGFromRaw("invisible", true);
		const pencilIcon = UGetSVGFromRaw("pencil", true);
		const moveIcon = UGetSVGFromRaw("move", true);
		const deleteIcon = UGetSVGFromRaw("delete", true);
		const expandIcon = UGetSVGFromRaw("expand-up", true);

		for (let elem of [visibleIcon, invisibleIcon, pencilIcon, deleteIcon]) {
			UAddToClass(elem, "c-paper-btn");
			UAddToClass(elem, "small");
		};

		UAddToClass(moveIcon, "c-paper-btn");
		UAddToClass(moveIcon, "tiny");
		UAddToClass(moveIcon, "c-uninteractable");

		UAddToClass(expandIcon, "c-paper-btn");
		UAddToClass(expandIcon, "tiny");

		let editButtons = [visibleIcon, invisibleIcon, pencilIcon, moveIcon, deleteIcon, expandIcon];

		let ovf = UShowGridOfMusicItems((v) => (
			v.saved === true &&
			!document.querySelector(`#guide [plId=${v.id}]`)
		), editButtons, true, true, undefined, undefined, "sidebar-edit");

		let tinyDelete = UGetSVGFromRaw("delete", true);
		UAddToClass(tinyDelete, "c-paper-btn");
		UAddToClass(tinyDelete, "tiny");

		for (let elem of document.querySelectorAll("#guide .c-sidebar-sep")) {
			elem.setAttribute("c-draggable","true");

			let delBtn = tinyDelete.cloneNode(true);
			elem.append(delBtn);

			delBtn.addEventListener("click", function(e) {
				elem.remove();

				e.preventDefault();
				e.stopImmediatePropagation();
				e.stopPropagation();

				let id = elem.getAttribute("plid");

				UDispatchEventToEW({
					func: "sidebar-delete-sep",
					sepId: id
				});
			});
		};


		for (let elem of document.querySelectorAll("#guide .c-carousel")) {
			elem.setAttribute("c-draggable","true");

			let delBtn = tinyDelete.cloneNode(true);
			elem.append(delBtn);

			delBtn.addEventListener("click", function(e) {
				elem.remove();

				e.preventDefault();
				e.stopImmediatePropagation();
				e.stopPropagation();

				let id = elem.getAttribute("plid");

				UDispatchEventToEW({
					func: "sidebar-delete-carousel",
					folderId: id
				});
			});
		};

		// give editButtonCont to each paper item, containing new buttons.
		for (let elem of document.querySelectorAll("#guide .c-paper-wrapper:not([is-primary])")) {

			UAddEditButtonsToPaperItem(elem, ...editButtons);
		};

		_AddDraggableFeatures(ovf);		
	};

	// main function, creates primary edit button + invokes creation of other features
	function _PrepareEditButtons() {
		// ytButtonsCont just holds "New Playlst" until we edit it.
		// id buttons with class ytmusic-sect-renderer and has child of type button-renderer
		// unlike itemsCont, another buttons cont does exist above is-primary items, but no children.
		const ytButtonsCont = document.querySelector("sidebarYTButtonsCont");

		let oldBtn = ytButtonsCont.querySelector("#edit.c-button");
		if (oldBtn) oldBtn.remove();

		// change other button from New Playlist -> New
		let otherButtonText = ytButtonsCont.querySelector(".yt-core-attributed-string");
		otherButtonText.textContent = "New";
		
		// insert edit button
		let editButton = UCreateButton("pencil", "Edit", "dark");

		editButton.addEventListener("click",function() {
			_EnableEditMode(ytButtonsCont, editButton);
		});

		ytButtonsCont.append(editButton);
	};
	
};









async function _AsyncStartProcesses() {
	return new Promise(function(resolve, reject) {
		try {
			_PrepareEditButtons();
			resolve("success");

		} catch(err) {
			console.log("ERROR:",err);
			reject(["failure", err.toString()]);

		};
	});
};

async function _ExpireAndReject() {
	return new Promise(function(_, reject) {
		setTimeout(() => reject(["TIMEOUT!"]), UMAX_EXECUTION_TIMEOUT);
	});
};

console.log("MWSIDEEDIT");

return Promise.race([ // return fastest
	_AsyncStartProcesses(),
	_ExpireAndReject()
]);
