let clonableUtils;
let utils;
let tab;

// MAIN WORLD

//CACHE IMAGES
async function MWCacheFromLibraryPage(accountInfo) {
	function CleanSubtitle(runs, accountInfo) {
		let clean = "";
		
		let artistNameIndex = 0;
		let extraInfoIndex = 2;

		if (runs[0].text === "Playlist" || runs[0].text === "Album" || runs[0].text === "EP") {
			//isPlaylistPage = false; // CasualContent . 33 tracks

			artistNameIndex = 2;
			extraInfoIndex = 4;

			// (else) Album . Tewnty One Pilots . 2024
		};

		// Sounds From Shorts: Auto Playlist . CasualContent
		if (runs[0].text === "Auto playlist") return "";

		console.log(runs);

		if (runs.length < artistNameIndex + 1) return clean;
		if (runs[artistNameIndex].text !== accountInfo.accountName) { // artist name
			clean += runs[artistNameIndex].text;
		};

		if (runs.length < extraInfoIndex + 1) return clean;

		if (clean !== "") clean += U_YT_DOT;
		clean += runs[extraInfoIndex].text; // year or amt of tracks

		return clean;
	};

	console.log("hi");

	function _main() {
		let cardItems = document.querySelectorAll("ytmusic-two-row-item-renderer:not(:has([href=\"#\"]))");
		// extra nonsense on the end to remove "New Playlist" card with href "#".

		console.log(cardItems);
		let toCache = {};
	
		for (let item of cardItems) {
			let imageWrapper = item.getElementsByTagName("a")[0];
			let imgElem = imageWrapper.getElementsByTagName("img")[0];
			let data = imageWrapper.__dataHost.__data.data;

			// for now, ignore artists and only playlists/albums.
			console.log(imageWrapper.parentElement.hasAttribute("has-circle-cropped-thumbnail"));
			if (imageWrapper.parentElement.hasAttribute("has-circle-cropped-thumbnail")) continue;
	
			/*let plHref = imageWrapper.href;
			

			//nicer href (remove music.youtube.com/playlist...)
			//regex matching / or =
			// "=" for playlist?list=PL..., "/" for channel/UC...
			let charMatches = [...String(plHref).matchAll(/\/|=/g)]; 
			let sliceIndexStart = charMatches[charMatches.length - 1].index + 1;
			plHref = plHref.slice(sliceIndexStart);*/


			//let imHref = imgElem.src;

			// href or other normal methods return stupid things for albums.
			console.log(data.thumbnailOverlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint);
			let playNavEndp = data.thumbnailOverlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint;
			let plId = "";

			if (playNavEndp.watchEndpoint) {
				plId = playNavEndp.watchEndpoint.playlistId;

				// TIMPORTANT, CAN DO THIS TO DEFINE FIRST SONG
				// REMOVING SO WILL SHUFFLE AND NOT PLAY FIRST SONG ALWAYS (ALBUMS)
				delete playNavEndp.watchEndpoint.videoId;
			}
			else plId = playNavEndp.watchPlaylistEndpoint.playlistId;

			let thumbnails = data.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails;
			let largestThumbURL = "";
			let largest = 0;

			for (let thumb of thumbnails) {
				// did this cus idk could have non-squares?
				let size = thumb.width * thumb.height;

				if (size > largest) {
					largest = size;
					largestThumbURL = thumb.url;
				};
			};

			let title = "";
			for (let run of data.title.runs) title += run.text;	

			/*let subtitle = "";
			let subRuns = data.subtitle.runs;
			let i = -1;

			for (let run of subRuns) {
				i ++;

				// if is a spot and we will want to remove the next cus its us, dont add the spot
				if (run.text.indexOf("•") !== -1 && subRuns[i+1].text === accountInfo.accountName) {
					continue;
				};
				if (run.text === accountInfo.accountName) continue;

				subtitle += run.text;				
			};*/

			let playEndp = data.thumbnailOverlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint;

	
			toCache[plId] = {
				id: plId,
				image: largestThumbURL,
				title: title,
				subtitle: CleanSubtitle(data.subtitle.runs, accountInfo),
				//clickTrack: data.trackingParams,
				//browseId: data.navigationEndpoint.
				navEndp: data.navigationEndpoint,
				playEndp: playEndp
			};
		};

		return toCache;
	};

	return new Promise((resolve,reject) => {
		try {
			let toCache = _main();
			resolve(toCache);
		} catch (err) {
			console.log("ERROR:",err);
			reject(["failure", err.toString()]);
		};
	});
}

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
	let storage = await utils.UStorageGet();
	let toggleElem = document.querySelector("#toggle-active");

	storage.config.masterToggle = !storage.config.masterToggle;

	await utils.UStorageSet(storage);

	if (storage.config.masterToggle) {
		toggleElem.textContent = "Disable All Features";
	} else {
		toggleElem.textContent = "Enable All Features"
	};
}

async function rawDump() {
	let storage = await utils.UStorageGetRaw();

	let stringified = JSON.stringify(storage);

	const blob = new Blob([stringified], {type:"application/json"});
	browser.tabs.create({url:URL.createObjectURL(blob)});
};

async function cleanDump()  {
	const blob = new Blob([JSON.stringify((await utils.UStorageGet()))], {type: "application/json"});
	browser.tabs.create({url:URL.createObjectURL(blob)});
};

function openDebug() {
	const div = document.getElementById("debug-cont");
	let display;

	if (div.style.display === "none") { display = ""; } else { display = "none"; };
	div.style.display = display;
};

async function cleanStorage() {
	await utils.UStorageClean(true);

	rawDump();
}

async function clearStorage() {
	await browser.storage.local.clear();
	await browser.storage.sync.clear();

	await utils.UStorageSet(utils.UDEFAULT_STORAGE);

	console.log("Cleared Matches!");
	rawDump();
};

async function removeOrder() {
	let storage = await utils.UStorageGet();
	storage.sidebar = utils.UDEFAULT_STORAGE.sidebar;

	await utils.UStorageSet(storage);

	console.log("Cleared Matches!");

	rawDump();
};

async function clearCache() {
	let storage = await utils.UStorageGet();
	storage.cache = utils.UDEFAULT_STORAGE.cache;

	await utils.UStorageSet(storage);

	console.log("Cleared Matches!");

	rawDump();
};

async function init() {
	utils = await import(browser.runtime.getURL("../utils.js"));
	utils = utils.Utils;
	clonableUtils = utils.toString();

	tab = await browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT});
	tab = tab[0];

	let storage = await utils.UStorageGet();
	console.log(storage.config);
	let toggleElem = document.querySelector("#toggle-active");

	if (storage.config.masterToggle) {
		toggleElem.textContent = "Disable All Features";
	} else {
		toggleElem.textContent = "Enable All Features"
	};

	document.querySelector("#error").innerHTML = String(JSON.stringify(storage.cache).length / 1000) + "KB of cache.<br/>" + String(JSON.stringify(storage).length / 1000) + "KB total.";

	let tabToggleBtn = document.querySelector("#tab-toggle");
	let result = {};

	try {
		result = (await browser.scripting.executeScript({
			func: () => window.cMusicFixerExtIgnoreTab,
			target: {tabId: tab.id},
			world: "MAIN"
		}))[0];
	} catch { return; };

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

async function updatePlaylistIcons() {
	let storage = await utils.UStorageGet();

	console.log(tab);
	let resp = await browser.scripting.executeScript({
		func:MWCacheFromLibraryPage,
		target:{tabId:tab.id},
		args:[storage.accountInfo],
		world:"MAIN"
	});

	resp = resp[0].result;

	console.log("resp", JSON.stringify(resp));

	storage = await utils.UStorageGet();

	for (let [i,v] of Object.entries(resp)) {
		console.log(i,v);
		storage.cache.playlists[i] = v;
	};

	await utils.UStorageSet(storage);
	cleanDump();
};

async function runCodeinBKG() {
	let code = document.querySelector("#run-code-input").value;

	await rawDump();

	let coded =JSON.parse(code);
	console.log(code);
	console.log(coded);

	await utils.UStorageSet(coded);

	await rawDump();


	/*let result = await MWManualCodeInject(code);

	console.log(JSON.stringify(result));

	if (result.error) {
		document.querySelector("#error").textContent = "error: " + JSON.stringify(result.error);
	}

	if (result.result) {
		document.querySelector("#error").textContent = "result: " + JSON.stringify(result.result);
	}
*/
	//document.querySelector("#error").textContent = JSON.stringify(result);
};

async function runCodeinMW() {
	let code = document.querySelector("#run-code-input").value;

	let result = (await browser.scripting.executeScript({
		func: MWManualCodeInject,
		target: {tabId: tab.id},
		args: [code],
		world: "MAIN"
	}))[0];

	console.log(JSON.stringify(result));

	if (result.error) {
		document.querySelector("#error").textContent = "error: " + JSON.stringify(result.error);
	}

	if (result.result) {
		document.querySelector("#error").textContent = "result: " + JSON.stringify(result.result);
	}

	//document.querySelector("#error").textContent = JSON.stringify(result);
};

init().then(function() {
	document.getElementById("upd-pl-ics").addEventListener("click", updatePlaylistIcons);
	document.getElementById("clr-strg").addEventListener("click", clearStorage);
	document.getElementById("cln-strg").addEventListener("click", cleanStorage);
	document.getElementById("clr-cache").addEventListener("click", clearCache);
	document.getElementById("rm-order").addEventListener("click", removeOrder);
	document.getElementById("r-dmp").addEventListener("click", rawDump);
	document.getElementById("c-dmp").addEventListener("click", cleanDump);
	document.getElementById("debug").addEventListener("click", openDebug);
	document.getElementById("toggle-active").addEventListener("click", toggleActive);
	document.getElementById("run-code-bkg").addEventListener("click", runCodeinBKG);
	document.getElementById("run-code-mw").addEventListener("click", runCodeinMW);
});