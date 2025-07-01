console.log("contentscript", window.cMusicFixerExtIgnoreTab);

if (window.cMusicFixerExtIgnoreTab === true) {
	throw Error();
};

// runs ISOLATED, not MAIN, so can access browser api

// send message to extension to start main code.
browser.runtime.sendMessage({
	"func": "start",
});

// this is used as a bridge to communicate MW -> EW.
// customEvent fired in MW, received here, passed to EW through runtime message api.
function OnEventFromMW(event) {
	browser.runtime.sendMessage(event.detail);
};

// this is used as a bridge to communicate EW -> MW.
// message sent from EW, received here, passed to MW through customEvent.
function OnMessageFromEW(detail) {
	//let newEvent = new CustomEvent(UGeneralCustomEventEWToMW, {detail: detail});

	window.postMessage(detail);
};

browser.runtime.onMessage.addListener(OnMessageFromEW);
window.addEventListener("extGeneralCustomEventMWToEW", OnEventFromMW);