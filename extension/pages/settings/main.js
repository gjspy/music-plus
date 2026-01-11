import { EWUtils } from "../../utilsew.js";

const TTAV_FUNCTIONS = {
	"strg-e": ["Set ExtStorage"],
	"strg-l": ["Set LclStorage"],
	"strg-uid": ["Set Storage API UID"],
	"strg-tok": ["Set Storage API Token"],
	"strg-cachedel": ["Delete Cache Entry of ID", {needExtStorage: true}],
	"strg-human": ["Show Human Cache Entry of ID", {needExtStorage: true}],
	"light-api": ["Set Light API endpoint", {needExtStorage: true}],
	"light-entities": ["Set Light API EntitiesToKeys"]
};

async function RefreshSidebar() {
	// TODO: WHAT TAB?
	/*let result = (await browser.scripting.executeScript({
		func: () => (new InjectMyPaperItems()).MainTasks(),
		target: {tabId: tab.id},
		world: "MAIN"
	}))[0];

	showLog(result);*/
};
// TODO: page enabling/disabling


function GetHumanJSONOfId(storage, id, _depth) {
	if (_depth === undefined) _depth = 0;

	const value = storage.cache[id];
	if (!value) return {};

	const itemType = value.type;
	const human = structuredClone(value);

	for (const [k,v] of Object.entries(value)) {
		if (itemType === "ALBUM") {
			if (k === "items" || k === "features" || k === "privateCounterparts") {
				human[k] = v.map( x => storage.cache[x] );
				continue;
			};

			if (k === "artist" && _depth === 0) {
				human[k] = storage.cache[v];
				continue;
			};

			if (k === "alternate" && _depth === 0) {
				human[k] = v.map(x => GetHumanJSONOfId(storage, x, _depth + 1));
				continue;
			};
		};

		if (itemType === "PLAYLIST") {
			if (k === "items") {
				human[k] = v.map(x => GetHumanJSONOfId(storage, x, _depth + 1));
				continue;
			};
		};

		if (itemType === "ARTIST") {
			if (k === "discography" && _depth === 0) {
				human[k] = v.map(x => GetHumanJSONOfId(storage, x, _depth + 1));
				continue;
			};
		};

		if (itemType === "SONG") {
			if (k === "album") {
				human[k] = v.map(x => GetHumanJSONOfId(storage, x, _depth + 1));
				continue;
			};

			if (k === "artists" && _depth === 0) {
				human[k] = v.map(x => GetHumanJSONOfId(storage, x, _depth + 1));
				continue;
			};
		};

		human[k] = v;
	};

	return human;
};

async function Processor(func, {content = "", needExtStorage = false}) {
	let lclStorage = await EWUtils.StorageGetLocal();
	let extStorage = needExtStorage ? await EWUtils.StorageGetExternal(true, lclStorage) : {};
	fconsole.log(content, needExtStorage);

	const lclBefore = structuredClone(lclStorage);
	const extBefore = structuredClone(extStorage);

	if 		(func === "strg-e") extStorage = JSON.parse(content);
	else if (func === "strg-l") lclStorage = JSON.parse(content);
	else if (func === "strg-uid") lclStorage.username = content;
	else if (func === "strg-tok") lclStorage.token = content;
	else if (func === "strg-cachedel") delete extStorage.cache[content];
	else if (func === "strg-human") dump(GetHumanJSONOfId(extStorage, content));
	else if (func === "light-api") lclStorage.lightApi.endpoint = content;
	else if (func === "light-entities") lclStorage.lightApi.entitiesToKeys = JSON.parse(content);
	else if (func === "light-enabled") lclStorage.lightApi.enabled = content;
	else if (func === "clr-lcl") lclStorage = {};
	else if (func === "clr-ext") extStorage.cache = {};

	if (lclStorage !== lclBefore) await EWUtils.StorageSetLocal(lclStorage);
	if (extStorage !== extBefore) await EWUtils.StorageSetExternal(extStorage, lclStorage);

	showLog(`done ${func}`);
};

function dump(storage) {
	browser.tabs.create({
		url: URL.createObjectURL(
			new Blob(
				[ JSON.stringify(storage) ],
				{type: "application/json"}
			)
		),
		active: true
	});
};

function showLog(text) {
	const elem = document.createElement("a");
	elem.textContent = text;

	document.querySelector("#logs").append(elem);
};

async function init() {
	const lclStorage = await EWUtils.StorageGetLocal();

	if (lclStorage.lightApi.endpoint) {
		const lightCont = document.querySelector(".btn-cont#lights");
		const checkBox = lightCont.querySelector("input");

		lightCont.style.display = "";
		checkBox.checked = lclStorage.lightApi.enabled;
		checkBox.onchange = () => Processor("light-enabled", {content: checkBox.checked});

		lightCont.querySelector("#goto-ls").onclick = () => browser.tabs.create({ url: browser.runtime.getURL("pages/lightshow/index.html") });
		lightCont.querySelector("#dim").onclick =   () => browser.runtime.sendMessage({ func: "auto-lights", action: "dim",   autoMusic: false});
		lightCont.querySelector("#undim").onclick = () => browser.runtime.sendMessage({ func: "auto-lights", action: "undim", autoMusic: false});
	};

	const textarea = document.querySelector("textarea");
	const tavButtons = document.querySelector(".btn-cont#tav-btns");

	for (const [k,v] of Object.entries(structuredClone(TTAV_FUNCTIONS))) {
		const btn = document.createElement("button");

		btn.setAttribute("id", k);
		btn.className = "half";
		btn.textContent = String(v[0]);

		const opts = v[1] || {};

		btn.onclick = () => { opts["content"] = textarea.value; Processor(k, opts); };
		tavButtons.append(btn);
	};

	for (const btn of document.querySelector(".btn-cont#debug-cont").children) {
		const strgType = btn.getAttribute("id") || "";

		btn.onclick = async () => {
			if (strgType.startsWith("clr")) {
				Processor(strgType, {needExtStorage: strgType === "clr-cache"});
			};

			const strg = (strgType === "l") ? await EWUtils.StorageGetLocal() :
				(strgType === "e") ? await EWUtils.StorageGetExternal(false) :
				(strgType === "er") ? await EWUtils.StorageGetExternal(true) :
				(strgType === "s") ? await browser.storage.session.get() : {};
			
			dump(strg);
		};
	};


};

/* eslint-disable no-restricted-globals */
//@ts-ignore
window.fconsole = class fconsole {
	static kw = "MFIXER:";

	static debug = (...data) => console.debug(this.kw, ...data);
	static log = (...data) => console.log(this.kw, ...data);
	static info = (...data) => console.info(this.kw, ...data);
	static warn = (...data) => console.warn(this.kw, ...data);
	static error = (...data) => console.error(this.kw, ...data);
};

init();