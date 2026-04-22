import { EWUtils } from "../../utilsew.js";

const TTAV_FUNCTIONS = {
	"strg-e": ["Set ExtStorage"],
	"strg-l": ["Set LclStorage"],
	"strg-uid": ["Set Storage API UID"],
	"strg-tok": ["Set Storage API Token"],
	"strg-cachedel": ["Delete Cache Entry of ID", {needExtStorage: true}],
	"strg-human": ["Show Human Cache Entry of ID", {needExtStorage: true}],
	"light-api": ["Set Light API endpoint[\"https://...\"]"],
	"light-entities": ["Set Light API EntitiesToKeys[lightShow]"],
	"light-room": ["Set Light API room"]
};

async function Processor(func, {content = "", needExtStorage = false}) {
	let lclStorage = await EWUtils.StorageGetLocal();
	let extStorage = {};

	const lclBefore = structuredClone(lclStorage);

	if 		(func === "strg-e") extStorage = JSON.parse(content);
	else if (func === "strg-l") lclStorage = JSON.parse(content);
	else if (func === "strg-uid") lclStorage.username = content;
	else if (func === "strg-tok") lclStorage.token = content;
	else if (func === "strg-cachedel") delete extStorage.cache[content];
	else if (func === "strg-human") dump(GetHumanJSONOfId(extStorage, content));
	else if (func === "light-api") lclStorage.lightApi.endpoint = content;
	else if (func === "light-entities") lclStorage.lightApi.entitiesToKeys = JSON.parse(content);
	else if (func === "light-enabled") lclStorage.lightApi.enabled = content;
	else if (func === "light-room") lclStorage.lightApi.autoMusicRoom = content;
	else if (func === "clr-lcl") {
		await browser.storage.local.clear();
		lclStorage = {};
	}
	else if (func === "clr-ext") extStorage.cache = {};

	if (lclStorage !== lclBefore) await EWUtils.StorageSetLocal(lclStorage);

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
		lightCont.querySelector("#brightness").onchange = (e) => browser.runtime.sendMessage({ func: "auto-lights", action: "brightness", value: e.target.value, autoMusic: false });
	};

	document.querySelector("#hide-controls").onclick = () => document.querySelector("#main-cont").replaceChildren();

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
				(strgType === "s") ? await browser.storage.session.get() : {};
			
			dump(strg);
		};
	};

	let CHANGING_THEME = true;

	document.querySelector("#reset-theme").onclick = () => {
		CHANGING_THEME = false;
		browser.theme.reset();
	};

	// HEARS EVERY EVENT BKGSCRIPT HEARS
	browser.runtime.onMessage.addListener((request) => {
		console.log(request);
		if (request.func !== "auto-lights" && request.func !== "ext-page-colours") return;

		let brightness = request.action === "dim" ? 0 :
			request.action === "undim" ? 1 : 
			request.action === "brightness" ? request.value / 255 : undefined;
		
		if (brightness !== undefined) {
			document.body.style.setProperty("--c-player-bkg-transition", `opacity ${request.transition}s ease`);
			document.body.style.setProperty("--c-player-bkg-opacity", String(brightness));
		
		} else if (request.action === "setImg") {
			const blob = new Blob([request.imgData], {type: request.imgType});
			const url = URL.createObjectURL(blob);
			document.body.style.setProperty("--playing-thumbnail", `url(${url})`);
		
		} else if (request.action === "setCols" && CHANGING_THEME) {
			const blob = new Blob([request.imgData], {type: request.imgType});
			const url = URL.createObjectURL(blob);

			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");

				canvas.width = 1920;
				canvas.height = 1920;
				ctx.filter = "blur(20px) brightness(0.9) saturate(1.4)";

				ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
				const data = canvas.toDataURL("image/png");
				console.log(data);
				console.log(ctx.filter);
				const [c1,c2] = request.colours;

				browser.theme.update({
					images: {
						additional_backgrounds: [data]
					},
					colors: {
						toolbar: [c1.r, c1.g, c1.b, 0.3],
						tab_selected: [c2.r, c2.g, c2.b, 0.5],
						toolbar_field: [c2.r, c2.g, c2.b, 0.5]
					},
					properties: {
						additional_backgrounds_alignment: ["center center"],
						color_scheme: "dark"
					}
				});

				canvas.remove();
			};

			img.src = url;
		};
	});

	window.onbeforeunload = () => browser.theme.reset();

	const tab = (await browser.tabs.query({ url: "*://music.youtube.com/*", windowId: browser.windows.WINDOW_ID_CURRENT}))[0];

	if (tab) browser.tabs.sendMessage(tab.id, {
		functionResponseCorrelation: "update-lights"
	});
	
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

init();