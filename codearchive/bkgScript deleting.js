import { MWInit } from "../initmw.js";
import { EWUtils as utils } from "../utilsew.js";

const EXTRAS_FILE_LOC = "../task_files/extras/";
const EXTRAS = ["niceMiniGuide.js", "playerPageFeatures.js", "editMode.js", "middlewareEditors.js", "customEndpointHandler.js"];
const MIDDLEWARE = "../networkMiddleware.js";

const MODULESCRIPTS = {
	"ext": "utilsmw.js",
	"sidebarService": "taskFiles/sidebarService.js",
	"sidebarEditService": "taskFiles/sidebarEditService.js",
	"cacheService": "taskFiles/cacheService.js",
	"middlewareEditors": "taskFiles/middlewareEditors.js"
};

const TEMPLATE_ELEMS_FP = "../templateElements.html";



/* FUNCTIONS FOR USE IN THE


███╗   ███╗ █████╗ ██╗███╗   ██╗    ██╗    ██╗ ██████╗ ██████╗ ██╗     ██████╗ 
████╗ ████║██╔══██╗██║████╗  ██║    ██║    ██║██╔═══██╗██╔══██╗██║     ██╔══██╗
██╔████╔██║███████║██║██╔██╗ ██║    ██║ █╗ ██║██║   ██║██████╔╝██║     ██║  ██║
██║╚██╔╝██║██╔══██║██║██║╚██╗██║    ██║███╗██║██║   ██║██╔══██╗██║     ██║  ██║
██║ ╚═╝ ██║██║  ██║██║██║ ╚████║    ╚███╔███╔╝╚██████╔╝██║  ██║███████╗██████╔╝
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝     ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═════╝ 


*/


/* FUNCTIONS FOR USE IN THE


███████╗██╗  ██╗████████╗███████╗███╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗    ██╗    ██╗ ██████╗ ██████╗ ██╗     ██████╗ 
██╔════╝╚██╗██╔╝╚══██╔══╝██╔════╝████╗  ██║██╔════╝██║██╔═══██╗████╗  ██║    ██║    ██║██╔═══██╗██╔══██╗██║     ██╔══██╗
█████╗   ╚███╔╝    ██║   █████╗  ██╔██╗ ██║███████╗██║██║   ██║██╔██╗ ██║    ██║ █╗ ██║██║   ██║██████╔╝██║     ██║  ██║
██╔══╝   ██╔██╗    ██║   ██╔══╝  ██║╚██╗██║╚════██║██║██║   ██║██║╚██╗██║    ██║███╗██║██║   ██║██╔══██╗██║     ██║  ██║
███████╗██╔╝ ██╗   ██║   ███████╗██║ ╚████║███████║██║╚██████╔╝██║ ╚████║    ╚███╔███╔╝╚██████╔╝██║  ██║███████╗██████╔╝
╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝     ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═════╝ 


*/

async function EWInit(injectionTarget) {
	const files = Object.entries(MODULESCRIPTS).map(v => [v[0], browser.runtime.getURL(v[1])]);

	const resp1 = await browser.scripting.executeScript({
		"target": injectionTarget,
		"func": MWInit,
		"args": [files],
		"world": "MAIN"
	});

	fconsole.warn("EWINIT: INJECT UTILS RESP1", JSON.stringify(resp1));
};


async function EWExtras(injectionTarget) {
	for (let file of EXTRAS) {
		let f = EXTRAS_FILE_LOC + file;
		let resp;

		try {
			resp = await browser.scripting.executeScript({
				"target": injectionTarget,
				"files": [f],
				"world": "MAIN"
			});
		} catch (err) {
			fconsole.error("DOING", f, resp, err);
		};

		fconsole.log(f, "resp", JSON.stringify(resp));
	};
};


async function EWInjectMiddleware(injectionTarget) {
	let resp = await browser.scripting.executeScript({
		"target": injectionTarget,
		"files": [MIDDLEWARE],
		"world": "MAIN"
	});

	fconsole.log("EWINJECTMIDDLEWARE RESP", JSON.stringify(resp));
};


async function main(request, sender, sendResponse) {
	fconsole.log("BKGSCRIPT STARTED FOR TAB", sender.tab.id);

	let injectionTarget = { "tabId": sender.tab.id };	
	await EWInit(injectionTarget);

	try {await EWInjectMiddleware(injectionTarget);}
	catch (err) {fconsole.error("couldnt inject middleware", err); };

	return;

	try {await EWExtras(injectionTarget);}
	catch (err) {fconsole.error("couldnt inject extras", err)};
};




/*

 ██████╗ ███╗   ██╗    ███╗   ███╗███████╗███████╗███████╗ █████╗  ██████╗ ███████╗
██╔═══██╗████╗  ██║    ████╗ ████║██╔════╝██╔════╝██╔════╝██╔══██╗██╔════╝ ██╔════╝
██║   ██║██╔██╗ ██║    ██╔████╔██║█████╗  ███████╗███████╗███████║██║  ███╗█████╗  
██║   ██║██║╚██╗██║    ██║╚██╔╝██║██╔══╝  ╚════██║╚════██║██╔══██║██║   ██║██╔══╝  
╚██████╔╝██║ ╚████║    ██║ ╚═╝ ██║███████╗███████║███████║██║  ██║╚██████╔╝███████╗
 ╚═════╝ ╚═╝  ╚═══╝    ╚═╝     ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
                                                                                   
*/

async function EWOMGetTemplateElems(request, sender) {
	const file = await fetch(TEMPLATE_ELEMS_FP);
	const text = (await file.text()).replaceAll(/[\t\n]/g, "");

	browser.tabs.sendMessage(sender.tab.id, {
		functionResponseCorrelation: request.functionResponseCorrelation,
		HTMLString: text,
		csAction: "init-template-elems" // CSP REQUIRED SETTING .innerHTML IN ISO WORLD ONLY.
	});
};

async function EWOMSaveAccountInfo(request) {
	let storage = await utils.UStorageGetLocal();

	storage.accountInfo = request.accountInfo;

	await utils.UStorageSetLocal(storage);
};

async function EWOMSidebarSaveChanges(request) {
	fconsole.log("GOT CUSTOM EVENT");
	fconsole.log(request);

	let storage = await utils.UStorageGetExternal(false);

	for (let [cont,ids] of Object.entries(request.newInfo)) {
		if (cont === "paperItemOrder") {
			storage.sidebar.paperItemOrder = ids;
		} else {
			storage.sidebar.folders.folders[cont].contents = ids;
		}
	};

	await utils.UStorageSetExternal(storage);
	fconsole.log("SET STORAGE");
	fconsole.log(JSON.stringify(storage));
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

	// browser.tabs, NOT browser.runtime, BCS CANT SENT TO CONTENTSCRIPTS WITH runtime.
	browser.tabs.sendMessage(sender.tab.id, {
		functionResponseCorrelation: request.functionResponseCorrelation,
		storage: storage,
		action: "new",
		parent: "guide",
		position: 0,
		id: thisId
	});
};

async function EWOMSidebarDeleteFolder(request) {
	let storage = await utils.UStorageGetExternal(false);

	fconsole.log(JSON.stringify(request));

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
	fconsole.log(request);
	await utils.UStorageSetExternal(storage);
};

async function EWOMSidebarVisibilityChange(request) {
	let storage = await utils.UStorageGetExternal(false);
	fconsole.log(JSON.stringify(request));

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

	// browser.tabs, NOT browser.runtime, BCS CANT SENT TO CONTENTSCRIPTS WITH runtime.
	browser.tabs.sendMessage(sender.tab.id, response);

	fconsole.warn("EWOMSIDEBARNEWSEPARATOR: MWINJECT", JSON.stringify(response));
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

	fconsole.warn("EWOMSIDEBARNEWCAROUSEL: MWINJECT RESP1", JSON.stringify(response));
};



async function EWOMGetStorage(request, sender, sendResponse) {
	let gotStorage = await utils.StorageGetExternal(request.forceRefresh);

	if (request.path) {
		for (let seg of request.path.split(".")) {
			gotStorage = gotStorage[seg];
		};
	};

	// browser.tabs, NOT browser.runtime, BCS CANT SENT TO CONTENTSCRIPTS WITH runtime.
	browser.tabs.sendMessage(sender.tab.id, {
		functionResponseCorrelation: request.functionResponseCorrelation,
		storage: gotStorage
	});
};

async function EWAddTagToStorage(request, storage) {
	storage.customisation.tags.tags[request.cacheData.id] = {
		id: request.cacheData.id,
		colour: request.tagData.colour,
		text: request.tagData.text
	};

	for (let videoId of request.cacheData.items) {
		let existing = storage.customisation.tags.videos[videoId];
		if (!existing) storage.customisation.tags.videos[videoId] = [];
		storage.customisation.tags.videos[videoId].push(request.cacheData.id);
	};
};


async function EWOMOnNewPlaylist(request, sender) {
	let storage = await utils.UStorageGetExternal(false);

	storage.sidebar.paperItemOrder.unshift(request.cacheData.id);

	if (request.tagData && request.tagData.colour) {
		EWAddTagToStorage(storage);
	};

	await utils.UStorageSetExternal(storage);

	//EWOMOnPostCacheData(request, sender); // do this, so it sends new storage back.
	utils.EWSendRefreshContSignalToMW(storage, sender.tab.id);
};

async function EWOMCreateTag(request, sender) {
	let storage = await utils.UStorageGetExternal(false);

	EWAddTagToStorage(request, storage);
	await utils.UStorageSetExternal(storage);
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




async function EWOMDefineLink(request) {
	let storage = await utils.UStorageGetExternal(false);

	if (!storage.customisation.albumLinks[request.baseItem]) {
		storage.customisation.albumLinks[request.baseItem] = [];
	};

	storage.customisation.albumLinks[request.baseItem].push({
		linkedId: request.linkedItem,
		offsetIndex: request.offsetIndex
	});

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

async function EWOMRemoveInsertedSong(request) {
	let storage = await utils.UStorageGetExternal(false);
	let extraSongs = storage.customisation.extraSongs[request.id] || [];
	storage.customisation.extraSongs[request.id] = extraSongs.filter((v) => v.videoId !== request.data.videoId);
	fconsole.log("old", extraSongs, "new", storage.customisation.extraSongs[request.id])

	await utils.UStorageSetExternal(storage);
};

async function EWOMAddNote(request) {
	let storage = await utils.UStorageGetExternal(false);

	storage.customisation.notes[request.videoId] = request.note;

	await utils.UStorageSetExternal(storage);
};

async function EWOMAddVideoToTag(request) {
	let storage = await utils.UStorageGetExternal(false);

	if (!storage.customisation.tags.videos[request.videoId]) storage.customisation.tags.videos[request.videoId] = []
	storage.customisation.tags.videos[request.videoId].push(request.tagId);

	await utils.UStorageSetExternal(storage);
};

async function EWOMRemoveVideoFromTag(request) {
	let storage = await utils.UStorageGetExternal(false);

	let current = storage.customisation.tags.videos[request.videoId]

	if (!current) return;
	storage.customisation.tags.videos[request.videoId] = current.filter(v => v !== request.tagId);

	await utils.UStorageSetExternal(storage);
};

async function EWOMAutoLights(request) {
	let storage = await utils.UStorageGetLocal();

	fconsole.log(request, storage.lightApi.endpoint, storage.lightApi.enabled);
	if (!storage.lightApi.endpoint || (!storage.lightApi.enabled && request.autoMusic)) return;

	if (request.action === "dim") {
		fetch(storage.lightApi.endpoint + "/api/brightness?auto_music=" + request.autoMusic, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				room: "bedroom",
				brightness: 0,
				transition: request.transition
			})
		}).then(v => fconsole.log(v));

	} else if (request.action === "undim") {
		fetch(storage.lightApi.endpoint + "/api/brightness?auto_music=" + request.autoMusic, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				room: "bedroom",
				brightness: 255,
				transition: request.transition
			})
		}).then(v => fconsole.log(v));

	} else if (request.action === "setImg") {
		let resp = await fetch(request.url);
		let blob = await resp.blob();
		let file = new File([blob], "image", {type: blob.type});

		let formData = new FormData();
		formData.append("file", file);

		fetch(storage.lightApi.endpoint + "/api/set-by-img-file?auto_music=" + request.autoMusic, {
			method: "POST",
			body: formData
		}).then(v => fconsole.log(v));
	};
};

async function EWOMWatchtimeStore(request) {
	let now = String(Date.now());

	let storage = await utils.UStorageGetExternal(false);

	let current = storage.stats.watchtime[request.videoId];
	if (!current) storage.stats.watchtime[request.videoId] = {};
	
	storage.stats.watchtime[request.videoId][now] = {
		pf: request.playingFrom,
		t: now,
		cw: request.completeWatch // IF WAS NOTSKIPPED OR WATCHED >80%.
	};

	await utils.UStorageSetExternal(storage);
};


function OnMessage(request, sender, sendResponse) {
	fconsole.log("received in EW", JSON.stringify(request), sender, sendResponse);
	
	const f = request.func;
	if (f === "start")                          main(request, sender, sendResponse);
	else if (f === "get-template-elements")		EWOMGetTemplateElems(request, sender);
	else if (f === "reinit-sidebar")			EWInitSidebarThings({"tabId": sender.tab.id}); //TODO: UGLY, WHY?
	else if (f === "save-account-info")         EWOMSaveAccountInfo(request);
	else if (f === "sidebar-save-changes")      EWOMSidebarSaveChanges(request);
	else if (f === "sidebar-new-folder")        EWOMSidebarNewFolder(request, sender);
	else if (f === "sidebar-delete-folder")     EWOMSidebarDeleteFolder(request);
	else if (f === "sidebar-rename-folder")     EWOMSidebarRenameFolder(request);
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
	else if (f === "remove-inserted-song")		EWOMRemoveInsertedSong(request);
	else if (f === "auto-lights")				EWOMAutoLights(request);
	else if (f === "add-note")					EWOMAddNote(request);
	else if (f === "add-video-to-tag")			EWOMAddVideoToTag(request);
	else if (f === "remove-video-from-tag")		EWOMRemoveVideoFromTag(request);
	else if (f === "create-tag")				EWOMCreateTag(request);
	else if (f === "video-watched")				EWOMWatchtimeStore(request);
};




/* eslint-disable no-restricted-globals */
//@ts-ignore
window.fconsole = class fconsole {
	static kw = "MFIXER:";

	static debug = (...data) => console.debug(this.kw, ...data, "\n\t\t\t", (new Error().stack.split("\n")));
	static log = (...data) => console.log(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
	static info = (...data) => console.info(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
	static warn = (...data) => console.warn(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
	static error = (...data) => console.error(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
};



browser.runtime.onMessage.addListener(OnMessage);