let clonableUtils;
let utils;
let tab;

// MAIN WORLD

//CACHE IMAGES

async function MWManualCodeInject(code) {
	console.log(code);
	//let toRun = "return new Promise(async function(resolve,reject) {try {"+code+"} catch(err){reject(err);};})";
	//let toRun = "return \"hi\""
	//toRun = "(function(){try{console.log(hi)}());"
	//console.log("toRun",toRun);
	//eval(toRun);

	return new Promise(async function(resolve,reject) {
		try {
			console.log("hi");
			eval(code);
		} catch(err) {
			reject(err.toString());
		};
	});
}

async function toggleActive() {
	console.log("this does nothing");
}

async function lclDump() {
	let storage = await utils.UStorageGetLocal();

	let stringified = JSON.stringify(storage);

	const blob = new Blob([stringified], {type:"application/json"});
	browser.tabs.create({url:URL.createObjectURL(blob)});
};

async function extDump(fetchNew)  {
	let storage = await utils.UStorageGetExternal(fetchNew);

	let stringified = JSON.stringify(storage);

	const blob = new Blob([stringified], {type:"application/json"});
	browser.tabs.create({url:URL.createObjectURL(blob)});
};

async function sDump() {
	const blob = new Blob([JSON.stringify(await browser.storage.session.get())], {type: "application/json"});
	browser.tabs.create({url: URL.createObjectURL(blob)});
};

function openDebug() {
	const div = document.getElementById("debug-cont");
	let display;

	if (div.style.display === "none") { display = ""; } else { display = "none"; };
	div.style.display = display;
};

async function clearStorage() {
	await browser.storage.local.clear();
	await browser.storage.sync.clear();

	console.log("Cleared Matches!");
	lclDump();
};

async function clearCache() {
	let storage = await utils.UStorageGetExternal(true);
	storage.cache = utils.U_REAL_DEFAULT_STORAGE.external.cache;

	await utils.UStorageSetExternal(storage);

	console.log("Cleared Matches!");

	lclDump();
};

async function toggleLightControl(event) {
	let storage = await utils.UStorageGetLocal();
	console.log(event);

	storage.lightApi.enabled = event.target.checked;

	await utils.UStorageSetLocal(storage);
};

async function init() {
	utils = await import(browser.runtime.getURL("../utils.js"));
	utils = utils.Utils;
	clonableUtils = utils.toString();

	tab = await browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT});
	tab = tab[0];

	let storage = await utils.UStorageGetLocal();

	if (Object.keys(storage.cachedLastResponse).length > 0) {
		document.querySelector("#error").innerHTML = String(JSON.stringify(storage.cachedLastResponse.cache).length / 1000) + "KB of cache.<br/>" + String(JSON.stringify(storage).length / 1000) + "KB total.";
	};

	if (storage.lightApi.endpoint) {
		document.querySelector("#lights").style.display = "";
		document.querySelector("#lights input").checked = storage.lightApi.enabled;

		document.querySelector("#lights input").onchange = toggleLightControl;
	};

	let tabToggleBtn = document.querySelector("#tab-toggle");
	let result = {};

	try {
		result = (await browser.scripting.executeScript({
			func: () => window.cMusicFixerExtIgnoreTab,
			target: {tabId: tab.id},
			world: "MAIN"
		}))[0];
	} catch { return; };
	console.log(result);

	if (!result) return;

	if (result.result === true) {
		tabToggleBtn.textContent = "This tab is ignored";
	} else {
		tabToggleBtn.textContent = "Ignore this tab";
	};

	tabToggleBtn.addEventListener("click", async function() {
		tabToggleBtn.textContent = "This tab is ignored";

		let result = (await browser.scripting.executeScript({
			func: () => Object.defineProperty(window, "cMusicFixerExtIgnoreTab", {
				value: true,
				writable: false,
				configurable: false
			}),
			target: {tabId: tab.id},
			world: "MAIN"
		}))[0];
	});
};


async function setStorageE() {
	let code = document.querySelector("#run-code-input").value;

	await lclDump();

	console.log(code);
	let coded = JSON.parse(code);
	console.log(coded);

	await utils.UStorageSetExternal(coded);

	await lclDump();
};

async function setStorageL() {
	let code = document.querySelector("#run-code-input").value;

	await lclDump();
	await browser.storage.local.clear();

	console.log(code);
	let coded = JSON.parse(code);
	console.log(coded);

	setTimeout(() => utils.UStorageSetLocal(coded).then(
		setTimeout(() => lclDump(), 50)
	), 50);
};


async function setUid() {
	let content = document.querySelector("#run-code-input").value;

	let storage = await utils.UStorageGetLocal();
	storage.username = content;

	await utils.UStorageSetLocal(storage);
	document.querySelector("#error").innerHTML = "done";
};

async function setTok() {
	let content = document.querySelector("#run-code-input").value;

	let storage = await utils.UStorageGetLocal();
	storage.token = content;

	await utils.UStorageSetLocal(storage);
	document.querySelector("#error").innerHTML = "done";
};

async function setLightApi() {
	let content = document.querySelector("#run-code-input").value;

	let storage = await utils.UStorageGetLocal();
	storage.lightApi.endpoint = content;

	await utils.UStorageSetLocal(storage);
	document.querySelector("#error").innerHTML = "done";
};

async function setEntitiesToKeys() {
	let content = document.querySelector("#run-code-input").value;

	let storage = await utils.UStorageGetLocal();
	storage.lightApi.entitiesToKeys = JSON.parse(content);

	await utils.UStorageSetLocal(storage);
	document.querySelector("#error").innerHTML = "done";
};

async function dim() {
	browser.runtime.sendMessage({
		func: "auto-lights",
		action: "dim",
		autoMusic: false
	});
};

async function undim() {
	browser.runtime.sendMessage({
		func: "auto-lights",
		action: "undim",
		autoMusic: false
	});
};

function gotoLS() {
	let url = browser.runtime.getURL("pages/lightshow/index.html");
	browser.tabs.create({ url });
};

function activateButtons() {
	document.getElementById("clr-strg").addEventListener("click", clearStorage);
	//document.getElementById("cln-strg").addEventListener("click", cleanStorage);
	document.getElementById("clr-cache").addEventListener("click", clearCache);
	document.getElementById("r-dmp").addEventListener("click", lclDump);
	document.getElementById("er-dmp").addEventListener("click", () => extDump(true));
	document.getElementById("e-dmp").addEventListener("click", () => extDump(false));
	document.getElementById("s-dmp").addEventListener("click", sDump);
	document.getElementById("dim").addEventListener("click", dim);
	document.getElementById("undim").addEventListener("click", undim);
	document.getElementById("debug").addEventListener("click", openDebug);
	//document.getElementById("toggle-active").addEventListener("click", toggleActive);
	document.getElementById("set-strg-e").addEventListener("click", setStorageE);
	document.getElementById("set-strg-l").addEventListener("click", setStorageL);
	document.getElementById("set-uid").addEventListener("click", setUid);
	document.getElementById("set-token").addEventListener("click", setTok);
	document.getElementById("set-light-api").addEventListener("click", setLightApi);
	document.getElementById("set-entities-api").addEventListener("click", setEntitiesToKeys);
	document.getElementById("goto-ls").addEventListener("click", gotoLS);
};

init().then(function() {
	console.log("initted popup");
	activateButtons();

}).catch((rejection) => {
	console.error("when initting popup", rejection);
	activateButtons();
});