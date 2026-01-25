import { MWInit } from "../initmw.js";
import { EWUtils, EWUtils as utils } from "../utilsew.js";


const MIDDLEWARE = "../networkMiddleware.js";
const PLAYERPAGE = "../taskFiles/playerPage.js";

const MODULESCRIPTS = {
	"ext": "utilsmw.js",
	"sidebarService": "taskFiles/sidebarService.js",
	//"sidebarEditService": "taskFiles/sidebarEditService.js",
	"cacheService": "taskFiles/cacheService.js",
	"middlewareEditors": "taskFiles/middlewareEditors.js",
	"eventDriven": "taskFiles/eventDriven.js"
};

const TEMPLATE_ELEMS_FP = "../templateElements.html";


async function EWInit(injectionTarget) {
	const files = Object.entries(MODULESCRIPTS).map(v => [v[0], browser.runtime.getURL(v[1])]);

	const resp1 = await browser.scripting.executeScript({
		"target": injectionTarget,
		"func": MWInit,
		"args": [files],
		"world": "MAIN"
	});

	fconsole.log("EWINIT: INJECT MWINIT RESP1", JSON.stringify(resp1));
};


async function EWInjectMiddleware(injectionTarget) {
	let resp = await browser.scripting.executeScript({
		"target": injectionTarget,
		"files": [MIDDLEWARE],
		"world": "MAIN"
	});

	fconsole.log("EWINJECTMIDDLEWARE RESP", JSON.stringify(resp));

	resp = await browser.scripting.executeScript({
		"target": injectionTarget,
		"files": [PLAYERPAGE],
		"world": "MAIN"
	});

	fconsole.log("EWINJECTPLAYERPAGE RESP", JSON.stringify(resp));
};


async function OnInitTab(request, sender, sendResponse) {
	fconsole.log("BKGSCRIPT STARTED FOR TAB", sender.tab.id);

	const injectionTarget = { "tabId": sender.tab.id };	
	await EWInit(injectionTarget);

	try {await EWInjectMiddleware(injectionTarget);}
	catch (err) {fconsole.error("couldnt inject middleware", err); };
};

async function EWOMGetTemplateElems(request, sender) {
	const file = await fetch(TEMPLATE_ELEMS_FP);
	const text = (await file.text()).replaceAll(/[\t\n]/g, "");

	browser.tabs.sendMessage(sender.tab.id, {
		functionResponseCorrelation: request.functionResponseCorrelation,
		HTMLString: text,
		csAction: "init-template-elems" // CSP REQUIRED SETTING .innerHTML IN ISO WORLD ONLY.
	});
};

async function Big(request, sender) {
	const func = request.storageFunc;
	
	let resp = undefined;
	let api;
	let meth = "get";

	if 		(func === "getlocal") resp = await EWUtils.StorageGetLocal();
	else if (func === "getsidebar") {
		api = { "route": `${EWUtils.SIDEBAR_API}${EWUtils.STORAGE_GETWITHCACHE}` };
	
	} else if (func === "get-populated") {
		api = { "route": `${EWUtils.STORAGE_API}cache/${request.id}/${EWUtils.STORAGE_GETPOPULATED}` };

	} else if (func === "mfId-to-id") {
		api = { "route": `${EWUtils.STORAGE_API}cache/index/mfId/${request.id}/get`}; // .STORAGEGET is bulkget. WANT /get
	
	} else if (func === "edit-list") {
		api = { "route": `${EWUtils.EDITOR_API}listItems/${request.id}` };
	



	} else if (func === "set-cache") {
		api = { "route": `${EWUtils.STORAGE_API}cache/${EWUtils.STORAGE_SET}` };
		meth = "set";

	} else if (func === "add-watchtime") {
		const now = Date.now();
		request.data[0].data.id = String(now);

		api = { "route": `${EWUtils.STORAGE_API}stats/watchtime/${now}/${EWUtils.STORAGE_SET}`};
		meth = "set";
	};

	if (meth === "get") {
		try {
			if (!resp) resp = await EWUtils.StorageGetExternal(api);
		} catch(err) { fconsole.error(err); resp = {}; };
		

		browser.tabs.sendMessage(sender.tab.id, {
			functionResponseCorrelation: request.functionResponseCorrelation,
			storage: resp
		});
	} else if (meth === "set") {
		api.data = request.data;
		await EWUtils.StorageSetExternal(api);
	};

	

	
};


async function EWOMAutoLights(request) {
	let storage = await EWUtils.StorageGetLocal();

	console.log(request, storage.lightApi.endpoint, storage.lightApi.enabled);
	if (!storage.lightApi.endpoint || (!storage.lightApi.enabled && request.autoMusic)) return;

	let brightness = request.action === "dim" ? 0 :
		request.action === "undim" ? 255 : 
		request.action === "brightness" ? request.value : undefined;



	if (brightness) {
		fetch(storage.lightApi.endpoint + "/api/brightness?auto_music=" + request.autoMusic, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				room: storage.lightApi.autoMusicRoom,
				brightness,
				transition: request.transition
			})
		}).then(v => console.log(v));


	} else if (request.action === "setImg") {
		//let resp = await fetch(request.url);
		//let blob = await resp.blob();
		const blob = new Blob([request.imgData], {type: request.imgType});

		let formData = new FormData();
		formData.append("file", blob);

		fetch(storage.lightApi.endpoint + `/api/set-by-img-file?auto_music=${request.autoMusic}&room=${storage.lightApi.autoMusicRoom}`, {
			method: "POST",
			body: formData
		}).then(v => console.log(v));

	};
};


function OnMessage(request, sender, sendResponse) {
	fconsole.log("received in EW", JSON.stringify(request), sender, sendResponse);
	
	const f = request.func;
	if (f === "start")                          OnInitTab(request, sender, sendResponse);
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
	else if (f === "storage")				    Big(request, sender);
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
};




/* eslint-disable no-restricted-globals */
//@ts-ignore
window.fconsole = class fconsole {
	static kw = "MFIXER:";

	static debug = (...data) => console.debug(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
	static log = (...data) => console.log(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
	static info = (...data) => console.info(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
	static warn = (...data) => console.warn(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
	static error = (...data) => console.error(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
};



browser.runtime.onMessage.addListener(OnMessage);