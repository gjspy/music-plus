function IWInitTemplateElements(detail) {
	const cont = document.createElement("div");

	cont.innerHTML = detail.HTMLString;
	cont.id = "c-templates-cont";

	document.head.append(cont);
	detail.contId = cont.id;
};


if (window.cMusicFixerExtIgnoreTab === true) {
	throw Error();
};

// runs ISOLATED, not MAIN, so can access browser api
// IF CHANGING THIS ID, MUST CHANGE IN utilsmw TOO.
var bridgeEventId = "extGeneralCustomEventMWToEW";

// send message to extension to start main code.
browser.runtime.sendMessage({
	"func": "start",
});

// this is used as a bridge to communicate MW -> EW.
// customEvent fired in MW, received here, passed to EW through runtime message api.
var OnEventFromMW = (event) => browser.runtime.sendMessage(event.detail);

// this is used as a bridge to communicate EW -> MW.
// message sent from EW, received here, passed to MW through customEvent.
var OnMessageFromEW = (detail) => {
	const act = detail.csAction;
	
	if (act) {
		if (act === "init-template-elems") IWInitTemplateElements(detail);
	};
	
	window.postMessage(detail);
};

browser.runtime.onMessage.addListener(OnMessageFromEW);
window.addEventListener(bridgeEventId, OnEventFromMW);