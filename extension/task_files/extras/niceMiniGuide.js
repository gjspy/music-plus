// functionality for when sidebar is collapsed. adds YTMUSIC logo.

function NiceMiniGuide() {
	function _AddLogoToMiniGuide(found) {
		let sections = found.querySelector("#sections");

		let div = document.createElement("div");
		div.setAttribute("class", "c-yt-logo");

		let img = document.createElement("img");
		img.setAttribute("src", U_YT_FAVICON);

		div.append(img);
		sections.append(div);
	};

	function _DOMChange(changes) {
		let found = false;

		for (let change of changes) {
			if (found) break;
			if (change.type !== "childList") continue;
			if (!change.addedNodes) continue;

			for (let node of change.addedNodes) {
				if (!node) continue;
				if (!node.matches) continue; // ye idk
				if (!node.matches("#mini-guide")) continue;

				found = node;
				break;
			};
		};

		if (!found) return;

		_AddLogoToMiniGuide(found);
		observer.disconnect();
	};

	let currentMiniGuide = document.querySelector("#mini-guide");

	if (currentMiniGuide) {
		_AddLogoToMiniGuide(currentMiniGuide);
		return;
	};

	let observer = new MutationObserver(_DOMChange);
	observer.observe(document.querySelector("ytmusic-app-layout"), {attributes: false, subtree: true, childList: true});
};

async function _AsyncStartProcesses() {
	return new Promise(function(resolve, reject) {
		try {
			NiceMiniGuide();
			console.log("done nice mini guide");

		} catch(err) {
			console.log("nice mini guide error " + err);
			reject(["failure", err]);
		};

		resolve(["success"]);		
	});
};

async function _ExpireAndReject() {
	return new Promise(function(_, reject) {
		setTimeout(() => reject(["TIMEOUT!"]), UMAX_EXECUTION_TIMEOUT);
	});
};

Promise.race([ // return fastest
	_AsyncStartProcesses(),
	_ExpireAndReject(),
]);