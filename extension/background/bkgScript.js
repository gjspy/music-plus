"use strict";

import { Utils } from "../utils.js";
import { MWInjectMyPaperItems } from "../task_files/injectMyPaperItems.js";
import { MWSidebarEditFeatures } from "../task_files/sidebarEditFeatures.js";
import { MWEventDriven_PageChanges } from "../task_files/eventDriven.js";
//import { AlbumEditFeatures } from "../task_files/albumEditMode.js";
import { MWCaching } from "../task_files/caching.js";

const EXTRAS_FILE_LOC = "../task_files/extras/";
const EXTRAS = ["niceMiniGuide.js", "playerPageFeatures.js", "editMode.js"];
const MIDDLEWARE = "../networkMiddleware.js";


const utils = Utils;

let clonableUtils;


/* FUNCTIONS FOR USE IN THE


███╗   ███╗ █████╗ ██╗███╗   ██╗    ██╗    ██╗ ██████╗ ██████╗ ██╗     ██████╗ 
████╗ ████║██╔══██╗██║████╗  ██║    ██║    ██║██╔═══██╗██╔══██╗██║     ██╔══██╗
██╔████╔██║███████║██║██╔██╗ ██║    ██║ █╗ ██║██║   ██║██████╔╝██║     ██║  ██║
██║╚██╔╝██║██╔══██║██║██║╚██╗██║    ██║███╗██║██║   ██║██╔══██╗██║     ██║  ██║
██║ ╚═╝ ██║██║  ██║██║██║ ╚████║    ╚███╔███╔╝╚██████╔╝██║  ██║███████╗██████╔╝
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝     ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═════╝ 


*/


async function MWInit(toGlobalise) {
	console.log(toGlobalise);


	//init, convert cloned utils to usable varaibles
	for (let group of toGlobalise) {
		for (let [i,v] of Object.entries(group)) {
			if (typeof(v) === "string" && (v.startsWith("window["))) {
				eval(v); // eval runs code to "create" function, adding it to local scope. dumb ik :)
			} else {
				window[i] = v; // add value to local scope
			};
		};
	};

	UEventListenerInMWFromEW(); // launch this to start listening for us.

	window.polymerController = undefined;
	window.menuServiceItemBehaviour = undefined;
	window.NETWORK_EDITING_ENABLED = true;
	
	interval = setInterval(function() { // backup, incase loop in paperitems doesnt work.
		let utilsGot = UGetPolymerController();
		if (!utilsGot) return;

		console.log("got polymerController");


		let menu = UGetMenuServiceItemBehaviour();
		if (!menu) return;

		console.log("got menuservicebehaviour");

		clearInterval(interval);
	}, 500);


	// we now want to keep templateElem forever, so add it to a new div separate from paper items.
	// must be separate otherwise it interferes with clicking/dragging.
	let templates = document.createElement("template");
	templates.setAttribute("class", "c-templates-list");
	
	
	for (let templateClass of ["c-paper-wrapper", "c-sidebar-sep"]) {
		let elem = document.createElement("div");
		templates.append(elem);

		elem.outerHTML = UTemplateElementsStrings[templateClass];
	};

	document.head.appendChild(templates);


	document.documentElement.addEventListener("click", function(e) {
		let currentDropdown = document.querySelector("body .c-popup-bkg .c-dropdown");
		if (!currentDropdown) return;

		if (e.target.matches(".c-dropdown") || e.target.closest(".c-dropdown")) return;

		currentDropdown.parentElement.remove();
	});
};


/* FUNCTIONS FOR USE IN THE


███████╗██╗  ██╗████████╗███████╗███╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗    ██╗    ██╗ ██████╗ ██████╗ ██╗     ██████╗ 
██╔════╝╚██╗██╔╝╚══██╔══╝██╔════╝████╗  ██║██╔════╝██║██╔═══██╗████╗  ██║    ██║    ██║██╔═══██╗██╔══██╗██║     ██╔══██╗
█████╗   ╚███╔╝    ██║   █████╗  ██╔██╗ ██║███████╗██║██║   ██║██╔██╗ ██║    ██║ █╗ ██║██║   ██║██████╔╝██║     ██║  ██║
██╔══╝   ██╔██╗    ██║   ██╔══╝  ██║╚██╗██║╚════██║██║██║   ██║██║╚██╗██║    ██║███╗██║██║   ██║██╔══██╗██║     ██║  ██║
███████╗██╔╝ ██╗   ██║   ███████╗██║ ╚████║███████║██║╚██████╔╝██║ ╚████║    ╚███╔███╔╝╚██████╔╝██║  ██║███████╗██████╔╝
╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝     ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═════╝ 


*/

async function EWInit(injectionTarget) {
	let toGlobalise = [clonableUtils];//, clonableAlbumEditFeatures];

	let resp1 = await browser.scripting.executeScript({
		"target": injectionTarget,
		"func": MWInit,
		"args": [toGlobalise],
		"world": "MAIN"
	});

	console.warn("EWINIT: INJECT UTILS RESP1", JSON.stringify(resp1));

	window["utils"] = utils;
}

function EWUnhideItemsCont(injectionTarget) {
	browser.scripting.insertCSS({
		target: injectionTarget,
		css: `#guide #items.ytmusic-guide-section-renderer:not(:has(ytmusic-guide-entry-renderer[is-primary])) {opacity: 1 !important; }`,
		origin: "USER"
	});
};


async function EWInjectMyPaperItems(injectionTarget) {
	console.log("in EWINJECT");

	// main function to remove old + create new paper items.
	let resp1 = await browser.scripting.executeScript({
		"target": injectionTarget,
		"func": MWInjectMyPaperItems,
		//"files": ["task_fikes\\injectMyPaperItems.js"], args dont work with files
		//"args": ["first-tasks", cache, savedCustomConfigs, savedAccountInfo],
		"world": "MAIN"
	});

	console.warn("EWINJECT: MWINJECT RESP1", JSON.stringify(resp1));

	EWUnhideItemsCont(injectionTarget);

	if (resp1 && resp1[0] && !resp1[0].error) {
		let resp2 = await browser.scripting.insertCSS({
			target: injectionTarget,
			css: "ytmusic-guide-entry-renderer:not([is-primary]) { display: none !important; }",
			origin: "USER"
		});

		console.warn("EWINJECT: INSERTCSS RESP2", JSON.stringify(resp2));
	};
};


async function EWSidebarEditFeatures(injectionTarget) {
	let resp1 = await browser.scripting.executeScript({
		"target": injectionTarget,
		"func": MWSidebarEditFeatures,
		"world": "MAIN"
	});

	console.warn("EWSIDEBAR: RESP1", JSON.stringify(resp1));
};


async function EWExtras(injectionTarget) {
	for (let file of EXTRAS) {
		let f = EXTRAS_FILE_LOC + file;

		let resp = await browser.scripting.executeScript({
			"target": injectionTarget,
			"files": [f],
			"world": "MAIN"
		});

		console.log(f, "resp", JSON.stringify(resp));
	};
};

async function EWEventDriven(injectionTarget) {
	let resp0 = await browser.scripting.executeScript({
		"target": injectionTarget,
		"func": MWCaching,
		"world": "MAIN"
	});

	console.log("EWEVENTDRIVEN RESP0 MWCACHING", JSON.stringify(resp0));

	let resp = await browser.scripting.executeScript({
		"target": injectionTarget,
		"func": MWEventDriven_PageChanges,
		"world": "MAIN"
	});

	console.log("EWEVENTDRIVEN RESP", JSON.stringify(resp));
};

async function EWInjectMiddleware(injectionTarget) {
	let resp = await browser.scripting.executeScript({
		"target": injectionTarget,
		"files": [MIDDLEWARE],
		"world": "MAIN"
	});

	console.log("EWINJECTMIDDLEWARE RESP", JSON.stringify(resp));
};

async function EWInitSidebarThings(injectionTarget) {
	try {await EWInjectMyPaperItems(injectionTarget);}
	catch (err) {console.error("couldnt inject paperitems", err)};

	try {await EWSidebarEditFeatures(injectionTarget);}
	catch (err) {console.error("couldnt inject sidebarfeatures", err)};
};

async function main(request, sender, sendResponse) {
	let tab = sender.tab;
	let injectionTarget = {
		"tabId": tab.id
	};

	console.log("BkgScript MAIN function began.");

	await utils._ULoadTemplateElements();
	clonableUtils = utils.toString();
	await EWInit(injectionTarget);

	console.log(clonableUtils);	

	console.log("TAB", tab.id);

	await EWInitSidebarThings(injectionTarget);

	try {await EWInjectMiddleware(injectionTarget);}
	catch (err) {console.error("couldnt inject middleware", err)};

	try {await EWExtras(injectionTarget);}
	catch (err) {console.error("couldnt inject extras", err)};

	try {await EWEventDriven(injectionTarget);}
	catch (err) {console.error("couldnt inject eventdriven", err)};
};




/*

 ██████╗ ███╗   ██╗    ███╗   ███╗███████╗███████╗███████╗ █████╗  ██████╗ ███████╗
██╔═══██╗████╗  ██║    ████╗ ████║██╔════╝██╔════╝██╔════╝██╔══██╗██╔════╝ ██╔════╝
██║   ██║██╔██╗ ██║    ██╔████╔██║█████╗  ███████╗███████╗███████║██║  ███╗█████╗  
██║   ██║██║╚██╗██║    ██║╚██╔╝██║██╔══╝  ╚════██║╚════██║██╔══██║██║   ██║██╔══╝  
╚██████╔╝██║ ╚████║    ██║ ╚═╝ ██║███████╗███████║███████║██║  ██║╚██████╔╝███████╗
 ╚═════╝ ╚═╝  ╚═══╝    ╚═╝     ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
                                                                                   
*/


async function EWOMSaveAccountInfo(request) {
	let storage = await utils.UStorageGetLocal();

	storage.accountInfo = request.accountInfo;

	await utils.UStorageSetLocal(storage);
};

async function EWOMSidebarSaveChanges(request) {
	console.log("GOT CUSTOM EVENT");
	console.log(request);

	let storage = await utils.UStorageGetExternal(false);

	for (let [cont,ids] of Object.entries(request.newInfo)) {
		if (cont === "paperItemOrder") {
			storage.sidebar.paperItemOrder = ids;
		} else {
			storage.sidebar.folders.folders[cont].contents = ids;
		}
	};

	await utils.UStorageSetExternal(storage);
	console.log("SET STORAGE");
	console.log(JSON.stringify(storage));
};

async function EWOMSidebarNewFolder(request, sender) {
	let storage = await utils.UStorageGetExternal(false);

	let id = storage.sidebar.idCounter + 1;
	storage.sidebar.idCounter += 1;

	let thisId = `CF${id}`;

	let folderInfo = {
		id: thisId,
		title: request.title,
		subtitle: request.subtitle,
		contents: []
	};

	storage.sidebar.paperItemOrder.unshift(thisId);
	storage.sidebar.folders.folders[thisId] = folderInfo;

	await utils.UStorageSetExternal(storage);

	// tabs, not runtime, bcs cant send to contentscripts with runtime
	let response = {
		func: utils.UEventFuncForSidebarUpdate,
		time: -1,

		storage: storage,
		action: "new",
		parent: "guide",
		position: 0,
		id: thisId
	};

	browser.tabs.sendMessage(sender.tab.id, response);

	console.warn("EWOMSIDEBARNEWFOLDER: MWINJECT RESP1", JSON.stringify(response));
};

async function EWOMSidebarDeleteFolder(request) {
	let storage = await utils.UStorageGetExternal(false);

	console.log(JSON.stringify(request));

	delete storage.sidebar.folders.folders[request.folderId];
	
	await utils.UStorageSetExternal(storage);

	// the whole point of "count" in folders is to be a forever increasing counter
	// so ids dont overlap, so we dont -= 1 to it.

	// may as well send 2nd request to save changes, because
	// is already built-in to utils func.
};

async function EWOMSidebarRenameFolder(request) {
	let storage = await utils.UStorageGetExternal(false);

	if (request.editInfo.title !== "") {
		storage.sidebar.folders.folders[request.plId].title = request.editInfo.title;
	};

	storage.sidebar.folders.folders[request.plId].subtitle = request.editInfo.subtitle;
	console.log(request);
	await utils.UStorageSetExternal(storage);
};

async function EWOMSidebarVisibilityChange(request) {
	let storage = await utils.UStorageGetExternal(false);
	console.log(JSON.stringify(request));

	let id = request.change.id;

	if (request.change.isVisible) {
		storage.sidebar.hidden = storage.sidebar.hidden.filter((plId => plId != id));
	} else {
		storage.sidebar.hidden.push(id);
	};
	
	await utils.UStorageSetExternal(storage);
};

async function EWOMSidebarNewSep(request, sender) {
	let storage = await utils.UStorageGetExternal(false);

	let id = storage.sidebar.idCounter + 1;
	storage.sidebar.idCounter += 1;

	let thisId = `CS${id}`;

	let sepInfo = {
		id: thisId,
		title: request.title
	};

	storage.sidebar.paperItemOrder.unshift(thisId);
	storage.sidebar.separators.separators[thisId] = sepInfo;

	await utils.UStorageSetExternal(storage);

	
	// tabs, not runtime, bcs cant send to contentscripts with runtime
	let response = {
		func: utils.UEventFuncForSidebarUpdate,
		time: -1,

		storage: storage,
		action: "new",
		parent: "guide",
		position: 0,
		id: thisId
	};

	browser.tabs.sendMessage(sender.tab.id, response);

	console.warn("EWOMSIDEBARNEWSEPARATOR: MWINJECT", JSON.stringify(response));
};

async function EWOMSidebarDeleteSep(request) {
	let storage = await utils.UStorageGetExternal(false);

	delete storage.sidebar.separators.separators[request.sepId];

	await utils.UStorageSetExternal(storage);
};

async function EWOMSidebarNewCarousel(request, sender) {
	let storage = await utils.UStorageGetExternal(false);

	let id = storage.sidebar.idCounter + 1;
	storage.sidebar.idCounter += 1;

	let thisId = `CF${id}`;

	let folderInfo = {
		id: thisId,
		title: "",
		subtitle: "",
		type: "carousel",
		contents: []
	};

	storage.sidebar.paperItemOrder.unshift(thisId); // insert at position 0 of array.
	storage.sidebar.folders.folders[thisId] = folderInfo;

	await utils.UStorageSetExternal(storage);

	
	// tabs, not runtime, bcs cant send to contentscripts with runtime
	let response = {
		func: utils.UEventFuncForSidebarUpdate,
		time: -1,

		storage: storage,
		action: "new",
		parent: "guide",
		position: 0,
		id: thisId
	};

	browser.tabs.sendMessage(sender.tab.id, response);

	console.warn("EWOMSIDEBARNEWCAROUSEL: MWINJECT RESP1", JSON.stringify(response));
};



async function EWOMGetStorage(request, sender, sendResponse) {
	let gotStorage = await utils.UStorageGetExternal(request.fetchNew);
	// sendResponse({toHide: toHide}); could do this, would mean more logic in cs, just making new customEvent instead.

	if (request.path) {
		for (let seg of request.path.split(".")) {
			gotStorage = gotStorage[seg];
		};
	};

	// tabs, not runtime, bcs cant send to contentscripts with runtime
	let response = {
		func: request.func,
		time: request.time,
		storage: gotStorage
	};

	browser.tabs.sendMessage(sender.tab.id, response);

	console.log("response", response);
	console.log("after send message");
};


async function EWOMOnNewPlaylist(request, sender) {
	let storage = await utils.UStorageGetExternal(false);

	storage.sidebar.paperItemOrder.unshift(request.data.id);

	await utils.UStorageSetExternal(storage);

	//EWOMOnPostCacheData(request, sender); // do this, so it sends new storage back.
	EWSendRefreshContSignalToMW(storage, sender.tab.id);
};

async function EWOMOnDeletePlaylist(request, sender) {
	let id = request.data.id;

	let storage = await utils.UStorageGetExternal(false);

	storage.sidebar.paperItemOrder = storage.sidebar.paperItemOrder.filter( v => v !== id );
	
	for (let folder of Object.values(storage.sidebar.folders.folders)) {
		folder.contents = folder.contents.filter( v => v !== id );
	};

	await utils.UStorageSetExternal(storage);

	//DONT SEND REFERSH SIGNAL. PAGE WILL REFRESH SOON ON ITS OWN.

	let info = storage.cache[id];
	if (info) {
		// OPEN TAB

		const blob = new Blob([JSON.stringify(info)], {type: "application/json"});
		browser.tabs.create({
			url: URL.createObjectURL(blob),
			discarded: true,
			title: `Deleted ${info.name}`
		});
	};
};


/*

 ██████╗ █████╗  ██████╗██╗  ██╗██╗███╗   ██╗ ██████╗ 
██╔════╝██╔══██╗██╔════╝██║  ██║██║████╗  ██║██╔════╝ 
██║     ███████║██║     ███████║██║██╔██╗ ██║██║  ███╗
██║     ██╔══██║██║     ██╔══██║██║██║╚██╗██║██║   ██║
╚██████╗██║  ██║╚██████╗██║  ██║██║██║ ╚████║╚██████╔╝
 ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
                                                      
*/

function EWCacheLinkPrivateCounterparts(cache) {
	// DO ALBUMS AND ARTISTS SEPARATE: MIGHT HAVE SAME NAME
	// EG SELF TITLED/DEBUT ALBUMS!!

	if (!cache.mfIdMap) cache.mfIdMap = {};

	let matches = {artist:{},album:{}}; 

	for (let [k,o] of Object.entries(cache)) {
		if (o === undefined || o.name === "" || o.name === undefined) continue;
		if (o.privateCounterparts) o.privateCounterparts = []; // RESET IT please. incase of a gletch it will fix itself.
		
		if (o.type === "ARTIST") {
			if (!matches.artist[o.name]) matches.artist[o.name] = [];
			matches.artist[o.name].push([k, o.private]);
		};

		if (o.type === "ALBUM") {
			if (!matches.album[o.name]) matches.album[o.name] = [];
			matches.album[o.name].push([k, o.private]);

			if (o.mfId) cache.mfIdMap[o.mfId] = o.id; // MAP MFID IN THIS ITERATION
		};
	};

	let artists = Object.values(matches.artist).filter(v => v.length > 1);
	let albums = Object.values(matches.album).filter(v => v.length > 1);

	for (let category of [artists, albums]) {
		for (let group of category) {
			for (let item of group) {
				let [id, isPrivate] = item;

				let curr = cache[id].privateCounterparts; // we reset them, but still need curr.
				let toAdd = group.filter(v => v[0] !== id && curr.indexOf(v[0]) === -1 && v[1] !== isPrivate).map(v => v[0]);
				
				cache[id].privateCounterparts.push(...toAdd);
			};
		};
	};

	return cache;
};

async function EWCacheUpdateWithData(storable) {
	let storage = await utils.UStorageGetExternal(false);
	let cache = storage.cache;

	for (let toStore of storable) {
		console.log(JSON.stringify(toStore));

		let defaultData = utils.U_CACHE_FORMATS[toStore.type.match("VIDEO_TYPE") ? "SONG" : toStore.type];
		let currentData = cache[toStore.id];

		if (!defaultData) {
			cache[toStore.id] = toStore; 
			console.warn("NO DEFAULT DATA FOR MUSIC TYPE\"", toStore.type, "\"SAVING RAW DATA", toStore);
			continue;
		};


		if (currentData) {
			currentData = utils.UCheckHasKeys(currentData, defaultData);
		} else {
			currentData = structuredClone(defaultData);
		};


		for (let k of Object.keys(defaultData)) {
			let oldV = currentData[k];
			let newV = toStore[k];
			let isArray = newV && newV.constructor === Array;

			if (newV === undefined || newV === "" || (isArray && newV.length === 0)) continue;

			if (!isArray) {
				currentData[k] = newV;
				continue;
			};

			let nonDuplicate = [];
			for (let v of newV) {
				if (nonDuplicate.indexOf(v) !== -1 && v !== null) continue;
				nonDuplicate.push(v);
			};

			if (toStore.type === "PLAYLIST" || toStore.type === "ALBUM") {
				if (toStore._CONTINUATION_DATA && toStore._CONTINUATION_DATA.itemsHasContinuation === false && toStore._CONTINUATION_DATA.itemsIsContinuation === false) {
					currentData[k] = nonDuplicate;
					continue;
				};

				let notInNewV = oldV.filter(v => nonDuplicate.indexOf(v) === -1 && v !== null); // not in newV

				let inserted = nonDuplicate.concat(notInNewV);
				currentData[k] = inserted;

				continue;
			};
				
			for (let v of nonDuplicate) {
				if (currentData[k].indexOf(v) !== -1) continue;

				currentData[k].push(v);
			};
		};

		cache[toStore.id] = currentData;
	};

	cache = EWCacheLinkPrivateCounterparts(cache);

	console.log(cache);

	await utils.UStorageSetExternal(storage);

	return storage;
};

function EWCacheCreateStorableFromListItem(item, listData, albumId) {
	// param listData is newPl.

	if (item._DISPLAY_POLICY) albumId = "";
	if (item.type === "MUSIC_PAGE_TYPE_ARTIST") {
		item.type = utils.UGetCleanTypeFromPageType(item.type);

		return [item];
	};

	if (item.type === "C_PAGE_TYPE_PRIVATE_ARTIST") {
		item.type = "ARTIST";
		item.saved = true;
		item.private = true;

		return [item];
	};

	let storable = [];

	// playlistItem
	let formattedItem = structuredClone(item);
	formattedItem.artists = (formattedItem.artists || []).map(v => v.id);

	formattedItem.type = utils.UGetCleanTypeFromPageType(formattedItem.type);
	let itemIsSong = utils.UCacheItemIsSong(formattedItem);

	if ( 
		( // listitem is from album page, so we know who the artist is, but song doesnt have it, so add it.
			listData.type === "ALBUM" &&
			formattedItem.artists.indexOf(listData.artist) === -1 &&
			listData.artist !== utils.U_VARIOUS_ARTISTS_EXTID
		)
	) { // WE ADD ALBUM INFO FROM PAGE LATER!

		formattedItem.artists.push(listData.artist);

		if (!item.artists) item.artists = [];
		item.artists.push({id: listData.artist});

	};

	if ( // listdata is from artist page, so we know who artist is, but ITEM doesnt have it, so add it.
		listData.type === "ARTIST" &&
		formattedItem.artists.indexOf(listData.id) === -1
	) {

		formattedItem.artists.push(listData.id);
		item.artists = [{id: listData.id}];

	};


	if (itemIsSong) {
		if (listData.type === "ALBUM") {
			formattedItem.albumPlSetVideoId = formattedItem.playlistSetVideoId;
		};

		delete formattedItem.playlistSetVideoId;
	};

	
	delete formattedItem.lengthStr;

	if (itemIsSong) { // give default [albumId] for renderers from album page.
		formattedItem.album = (formattedItem.album) ? formattedItem.album.id : albumId;

		delete formattedItem.thumb; // give thumb to the album always, never store on song
		formattedItem.lengthSec = utils.ULengthStrToSeconds(item.lengthStr);
	};

	if (formattedItem.type === "ALBUM") {
		delete formattedItem.yearStr;
		try { formattedItem.year = Number(item.yearStr); }
		catch { formattedItem.year = -1; };

		if (item.artists) {
			delete formattedItem.artists;
			formattedItem.artist = item.artists[0].id;
		};
	};

	storable.push(formattedItem);

	// artists
	for (let artist of (item.artists || [])) {
		let discographyIdToGive;

		if (formattedItem.type === "ALBUM") {
			discographyIdToGive = formattedItem.id;

		} else if (itemIsSong && listData.type === "ALBUM") {
			discographyIdToGive = listData.id;

		} else if (itemIsSong && formattedItem.album) {
			discographyIdToGive = formattedItem.album;
		};

		if (discographyIdToGive) artist.discography = [discographyIdToGive];

		artist.type = utils.UGetCleanTypeFromPageType(artist.type || "ARTIST");
		artist.private = item.private;

		storable.push(artist);
	};

	if (item._DISPLAY_POLICY) return storable;

	// playlist can be here now due to tworowitems. only do the following for a song, not coming from an album page.
	if (listData.type === "ALBUM" || formattedItem.type === "ALBUM" || formattedItem.type === "PLAYLIST" || !item.album) return storable;

	// album
	item.album.artist = formattedItem.artists[0];
	item.album.features = formattedItem.artists.slice(1, formattedItem.artists.length);
	item.album.items = [formattedItem.id];
	item.album.thumb = item.thumb;
	item.album.type = "ALBUM";

	storable.push(item.album);
	
	return storable;
};


function EWCacheCreateStorableFromItemsList(data, newPl) {
	let storable = [];

	for (let item of (data.items || [])) {
		console.log(item);

		if (!item) continue;

		try {
			let itemStorable = EWCacheCreateStorableFromListItem(item, newPl, newPl.id);
			console.log(itemStorable);

			storable = storable.concat(itemStorable);
		} catch (err) {
			console.log("error", err);
		};
	};

	return storable;
};


function EWCacheCreateStorableFromListPage(data) {
	let storable = [];

	let newPl = structuredClone(data);
	if (newPl.items) newPl.items = newPl.items.map(v => v.id);

	newPl.type = utils.UGetCleanTypeFromPageType(newPl.type);

	if ((newPl.type === "ALBUM" || newPl.type === "PLAYLIST") && newPl.yearStr) {
		delete newPl.yearStr;
		try { newPl.year = Number(data.yearStr); }
		catch { newPl.year = -1; };
	};	

	if (newPl.type === "ALBUM") {
		if (newPl.artist) newPl.artist = newPl.artist.id;

		if (newPl.private !== undefined && newPl.private !== true) {
			newPl.alternate = newPl.alternate.map(v => v.id);
			newPl.features = data.items
				.map( v => v.artists.map( y => y.id ) )
				.flat()
				.filter( id => id !== newPl.artist );

			let storedFromAlt = EWCacheCreateStorableFromItemsList({items: data.alternate}, newPl);
			storable.push(...(storedFromAlt || []));
		};
		
		if (data.artist) {
			let artist = structuredClone(data.artist);
			artist.type = utils.UGetCleanTypeFromPageType(artist.type || "ARTIST");
			artist.discography = [newPl.id];

			storable.push(artist);
		};
	};

	storable.push(newPl);

	let storableItems = EWCacheCreateStorableFromItemsList(data, newPl);
	storable.push(...storableItems);

	return storable;
};

async function EWCacheData(data) {
	let storable;

	console.log(data.type, data.type === "C_PAGE_TYPE_CHANNEL_OR_ARTIST");

	let isArray = data.constructor === Array;

	switch (data.type || (isArray && data[0].type)) {
		case "MUSIC_PAGE_TYPE_PLAYLIST":
		case "MUSIC_PAGE_TYPE_ALBUM":
		case "C_PAGE_TYPE_PRIVATE_ALBUM":
		case "MUSIC_PAGE_TYPE_ARTIST":
			storable = EWCacheCreateStorableFromListPage(data);
			break;


		case "MUSIC_PAGE_TYPE_ARTIST_DISCOGRAPHY":
		case "MUSIC_PAGE_TYPE_LIBRARY_CONTENT_LANDING_PAGE": // library
		case "MUSIC_PAGE_TYPE_PRIVATELY_OWNED_CONTENT_LANDING_PAGE": // private releases
			storable = EWCacheCreateStorableFromItemsList(data, {});
			break;
		
		case "MUSIC_VIDEO_TYPE_ATV":
		case "MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK":
		case "SONG":
			storable = [data];
			break;
		
		case "C_PAGE_TYPE_CHANNEL_OR_ARTIST":
			if (data.constructor === Array) storable = data
			else storable = [data];
			break;


		default:
			console.warn("What is this value of store.getState() browsePageType for EWcachePage", data.type);
			return;
	};
	
	let newStorage = await EWCacheUpdateWithData(storable);

	return newStorage;
};

function EWSendRefreshContSignalToMW(storage, tabId) {
	// tabs, not runtime, bcs cant send to contentscripts with runtime
	let response = {
		func: utils.UEventFuncForSidebarUpdate,
		time: -1,

		storage: storage,
		action: "refreshCont"
	};

	browser.tabs.sendMessage(tabId, response);
};

async function EWOMOnPostCacheData(request, sender) {
	let newStorage = await EWCacheData(request.data);

	// this is not a response received by caching/middleware. this is a separate event
	// fired for the sidebar.

	EWSendRefreshContSignalToMW(newStorage, sender.tab.id);
};





async function EWOMDefineLink(request) {
	let storage = await utils.UStorageGetExternal(false);

	if (!storage.customisation.albumLinks[request.baseItem]) {
		storage.customisation.albumLinks[request.baseItem] = [];
	};

	storage.customisation.albumLinks[request.baseItem].push(request.linkedItem);

	await utils.UStorageSetExternal(storage);
};

async function EWOMRemoveLink(request) {
	let storage = await utils.UStorageGetExternal(false);

	let currentLinks = storage.customisation.albumLinks[request.baseItem];
	storage.customisation.albumLinks[request.baseItem] = currentLinks.filter((v) => v !== request.linkedItem);

	await utils.UStorageSetExternal(storage);
};

async function EWOMSetPrimaryAlbum(request) {
	let storage = await utils.UStorageGetExternal(false);

	storage.customisation.primaryAlbums[request.chosen] = request.alts;

	await utils.UStorageSetExternal(storage);
};

async function EWOMHideSongFromAlbum(request) {
	let storage = await utils.UStorageGetExternal(false);

	let hiddenSongs = (request.func === "setDeletion") ? storage.customisation.hiddenSongs : storage.customisation.skippedSongs;
	if (!hiddenSongs[request.album]) hiddenSongs[request.album] = [];

	if (request.deleted) hiddenSongs[request.album].push(request.videoId);
	else hiddenSongs[request.album] = hiddenSongs[request.album].filter( v => v !== request.videoId );

	await utils.UStorageSetExternal(storage);
};

async function EWOMEditMetadata(request) {
	let storage = await utils.UStorageGetExternal(false);

	let metadata = storage.customisation.metadata[request.id] || {};

	for (let [k, v] of Object.entries(request.data)) {
		if (k.startsWith("reset_")) {
			let id = k.replace("reset_", "");
			delete metadata[id];
			continue;
		};

		metadata[k] = v;
	};

	storage.customisation.metadata[request.id] = metadata;

	await utils.UStorageSetExternal(storage);
};

async function EWOMInsertSongToAlbum(request) {
	let storage = await utils.UStorageGetExternal(false);

	let extraSongs = storage.customisation.extraSongs[request.id] || [];

	extraSongs.push(request.data);

	storage.customisation.extraSongs[request.id] = extraSongs;

	await utils.UStorageSetExternal(storage);
};

async function EWOMAutoLights(request) {
	let storage = await utils.UStorageGetLocal();

	console.log(request, storage.lightApi.endpoint, storage.lightApi.enabled);
	if (!storage.lightApi.endpoint || !storage.lightApi.enabled) return;

	if (request.action === "dim") {
		fetch(storage.lightApi.endpoint + "/api/brightness?auto_music=true", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				room: "bedroom",
				brightness: 0,
				transition: request.transition
			})
		}).then(v => console.log(v));

	} else if (request.action === "undim") {
		fetch(storage.lightApi.endpoint + "/api/brightness?auto_music=true", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				room: "bedroom",
				brightness: 255,
				transition: request.transition
			})
		}).then(v => console.log(v));

	} else if (request.action === "setImg") {
		let resp = await fetch(request.url);
		let blob = await resp.blob();
		let file = new File([blob], "image", {type: blob.type});

		let formData = new FormData();
		formData.append("file", file);

		fetch(storage.lightApi.endpoint + "/api/set-by-img-file?auto_music=true", {
			method: "POST",
			body: formData
		}).then(v => console.log(v));
	};
};


function OnMessage(request, sender, sendResponse) {
	console.log("received in EW", JSON.stringify(request), sender, sendResponse);
	
	const f = request.func;
	if (f === "start")                          main(request, sender, sendResponse);
	else if (f === "reinit-sidebar")			EWInitSidebarThings({"tabId": sender.tab.id});
	else if (f === "save-account-info")         EWOMSaveAccountInfo(request);
	else if (f === "sidebar-save-changes")      EWOMSidebarSaveChanges(request);
	else if (f === "sidebar-new-folder")        EWOMSidebarNewFolder(request, sender);
	else if (f === "sidebar-delete-folder")     EWOMSidebarDeleteFolder(request);
	else if (f === "sidebar-rename-folder")     EWOMSidebarRenameFolder(request);
	//else if (f === "sidebar-mask-pl-name")      EWOMMaskPLName(request);
	else if (f === "sidebar-visibility-change") EWOMSidebarVisibilityChange(request);
	else if (f === "sidebar-new-sep")           EWOMSidebarNewSep(request, sender);
	else if (f === "sidebar-delete-sep")        EWOMSidebarDeleteSep(request);
	else if (f === "sidebar-new-carousel")      EWOMSidebarNewCarousel(request, sender);
	else if (f === "sidebar-delete-carousel")   EWOMSidebarDeleteFolder(request);
	else if (f === "get-hidden-song-details")   EWOMGetHiddenSongDetails(request);
	else if (f === "get-storage")				EWOMGetStorage(request, sender);
	else if (f === "cache-data")				EWOMOnPostCacheData(request, sender);
	else if (f === "playlist-create")			EWOMOnNewPlaylist(request, sender);
	else if (f === "playlist-delete")			EWOMOnDeletePlaylist(request, sender);
	else if (f === "defineLink")				EWOMDefineLink(request, sender);
	else if (f === "removeLink")				EWOMRemoveLink(request, sender);
	else if (f === "setPrimaryAlbum")			EWOMSetPrimaryAlbum(request, sender);
	else if (f === "setDeletion")				EWOMHideSongFromAlbum(request, sender);
	else if (f === "setSkip")					EWOMHideSongFromAlbum(request, sender);
	else if (f === "edit-metadata")				EWOMEditMetadata(request, sender);
	else if (f === "insert-song")				EWOMInsertSongToAlbum(request);
	else if (f === "auto-lights")				EWOMAutoLights(request);
};

browser.runtime.onMessage.addListener(OnMessage);



/*HOW TO PASS UTILS TO MAIN WORLD/CONTENT SCRIPTS:
1) convert indicidual functions to string, pass as arg in executeScript, then on receiving end:
	const AsyncFunction = async function() {}.constructor; //creates equivalent of Function() constructor;
	paramUtils = AsyncFunction("return new Promise(resolve => {("+paramUtils+")(\"tp-yt-paper-item\").then(function(paperItems) {resolve(paperItems);}); });"); WORKs
	//this ends up being: 
	async function anonymous() {
		return new Promise(resolve => {(async function waitForBySelector(selector) {
			console.log("IN WAITFORBYSELECTOR FROM UTILS");

			return new Promise(resolve => {
				let found = document.querySelectorAll(selector);
				if (found.length > 0) { resolve(found); };

				let observer = new MutationObserver(function() {
					found = document.querySelectorAll(selector);

					if (found.length > 0) {
						observer.disconnect();
						resolve(found);
					};
				})
				observer.observe(document.body, {childList:true, subtree:true});
			});
		})("tp-yt-paper-item").then(
			function(paperItems) {
				resolve(paperItems);
			}); 
		});
	}	
	(a mess)

2) eval() the function body, to create new local function in namespace, then can just call normally! RIDICULOUS!!
//init, convert cloned utils to usable varaibles
for (let [i,v] of Object.entries(clonedUtils)) {
	if (typeof(v) === "string" && (v.startsWith("async") || v.startsWith("function"))) {
		eval(v); // eval runs code to "create" function, adding it to local scope. dumb ik :)
	} else {
		window[i] = v; // add value to local scope
	};
};/
*/