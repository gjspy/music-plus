// functionality for when sidebar is collapsed. adds YTMUSIC logo.

function NiceMiniGuide() {
	function onClickHamburger() {
		let miniGuide = document.querySelector("#mini-guide");
		if (!miniGuide) return;

		if (miniGuide.querySelector(".c-yt-logo")) {
			hamburger.removeEventListener("click", onClickHamburger);
			return;
		};

		let sections = miniGuide.querySelector("#sections");
		let div = document.createElement("div");
		div.setAttribute("class", "c-yt-logo");

		let img = document.createElement("img");
		img.setAttribute("src", U_YT_FAVICON);

		div.append(img);
		sections.append(div);

		hamburger.removeEventListener("click", onClickHamburger);
	};

	let hamburger = document.querySelector("ytmusic-nav-bar #left-content #guide-button");

	hamburger.addEventListener("click", onClickHamburger);
	
	setTimeout(onClickHamburger, 100); // incase youtube loaded with collapsed guide
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