
async function init() {

	tab = await browser.tabs.query({ url: "*://music.youtube.com/*", windowId: browser.windows.WINDOW_ID_CURRENT}); // not acive: true, as no longer a popup.
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