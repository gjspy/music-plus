import { Utils } from "../../utils.js";
console.log("hiii");

let body = document.body;
let log = document.querySelector(".content");

let config = {};

let dontDrop = false;
let hasHeldSomething = true;
let dropSoon = false;
let brightness = 255;

let time = Date.now();

let downNow = {};

function up(key, forceDrop) {

	if (dontDrop && !forceDrop) {
		if (dropSoon) {
			dontDrop = false;
			dropSoon = false;
		};

		hasHeldSomething = true;
		return;
	};

	if (!downNow[key]) return;

	let thisLight = config.entities[key];
	if (!thisLight) return;

	fetch(config.endpoint + "/api/brightness?auto_music=false", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			room: "bedroom",
			entity: thisLight,
			brightness: 0,
			transition: 0
		})
	});

	downNow[key] = false;
	log.innerHTML += `<span>${Math.round((Date.now() - time) / 100) / 10}: OFF ${thisLight}<span>`;
	document.body.scrollIntoView({behavior: "instant", block: "end"});
};


function down(key) {

	if (downNow[key]) {
		if (dontDrop) up(key, true);
		return;
	};

	downNow[key] = true;

	let thisLight = config.entities[key];
	if (!thisLight) return;

	fetch(config.endpoint + "/api/brightness?auto_music=false", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			room: "bedroom",
			entity: thisLight,
			brightness: brightness,
			transition: 0
		})
	});

	log.innerHTML += `<span>${Math.round((Date.now() - time) / 100) / 10}: ON  ${thisLight}<span>`;
	document.body.scrollIntoView({behavior: "instant", block: "end"});
};

function dimAll() {
	fetch(config.endpoint + "/api/brightness?auto_music=false", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			brightness: 0,
			transition: 2
		})
	});
	log.innerHTML += `<span>${Math.round((Date.now() - time) / 100) / 10}: DIM ALL<span>`;
	document.body.scrollIntoView({behavior: "instant", block: "end"});

	downNow = {};

};


function onAction(event) {
	let key = event.key;
	let isNumpad = event.code.startsWith("Numpad");
	let isDown = event.type === "keydown";

	if (key === "+" || key == "Shift") {
		if (isDown) {
			dontDrop = true;
			hasHeldSomething = false;

		};
		
		if (!isDown && hasHeldSomething) {
			dontDrop = false;
		};

		if (!isDown && !hasHeldSomething) {
			dropSoon = true;
		};

		return;
	};

	if (key === "Backspace") {
		dimAll();
		return;
	};

	if (isNumpad) {
		let n = Math.round(55 + ((Number(key) + 1) / 10) * 200);
		if (n !== undefined) brightness = n;
		return;
	};

	if (isDown) down(key);
	else up(key);
};


// INIT VALUES

function onStorageGet(storage) {
	config = {
		"endpoint": storage.lightApi.endpoint,
		"entities":  storage.lightApi.entitiesToKeys
	};
};

Utils.UStorageGetLocal().then(onStorageGet);

body.onkeydown = onAction;
body.onkeyup = onAction;

// TODO: avoid preflight OPTIONS.