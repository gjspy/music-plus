function initiateDelayedCacheOfOldResp(browseId, pageType, responseIsContinuation, toCacheOriginal) {
	setTimeout(function() { // CACHE ORIGINAL!
		if (!browseId) return;

		let contents = toCacheOriginal.contents;

		if (toCacheOriginal.onResponseReceivedActions) {
			contents = toCacheOriginal.onResponseReceivedActions[0];

		} else if (toCacheOriginal.continuationContents) {
			contents = toCacheOriginal.continuationContents;
		};

		let response = {
			browseId: browseId,
			browsePageType: pageType,
			responseIsContinuation: responseIsContinuation,
			contents: contents
		};
		if (toCacheOriginal.header) response.contents.header = toCacheOriginal.header;
		if (toCacheOriginal.microformat) response.contents.microformat = toCacheOriginal.microformat;

		cacheService.CachePageContents(response);
	}, 100);
};


async function FetchModifyResponse(request, oldResp, xhr) {
	function _GetCParams(request, browseId) {
		let cParams = request.cParams;

		if (cParams) return [cParams, undefined];
		if (!ext.state.BrowseParamsByRequest) return [undefined, undefined];

		let refs = [
			browseId,
			(request.body) ? request.body.videoId : undefined,
			(request.body) ? request.body.playlistId : undefined,
			(request.body) ? request.body.title : undefined
		];
		if (request.body && request.body.videoIds) refs.push(...request.body.videoIds);

		for (let ref of refs) {
			if (ref === undefined) continue;

			cParams = ext.state.BrowseParamsByRequest[ref];
			if (cParams) return [cParams, ref];
		};

		if (!ext.state.BrowseParamsByRequest.pageSpecific) return [undefined, undefined];

		for (let ref of refs) {
			cParams = ext.state.BrowseParamsByRequest.pageSpecific[ref];
			if (cParams) return [cParams, undefined]; // PAGESPEFIC MUST BE PERSISTENT, NO DELETE.
		};

		cParams = ext.state.BrowseParamsByRequest.pageSpecific.all;
		if (cParams) return [cParams, undefined]; 

		return [undefined, undefined];
	};

	if (
		(!xhr && !String(oldResp.status).startsWith("2")) ||
		(!xhr && !(oldResp.headers.get("Content-Type") || "").includes("application/json")) ||
		!request ||
		ext.state.networkEditingEnabled === false
	) {
		return oldResp;
	};

	let urlObj;
	try { urlObj = new URL(request.url); }
	catch {};

	if (!urlObj) return oldResp;
	
	request.urlObj = urlObj;
	let pathname = urlObj.pathname;

	if (request.method !== "POST") {
		let task = middlewareEditors.GETEditors.endpointToTask[pathname];
		if (!task) return oldResp;

		let change = task(request, oldResp);
		if (change) return change;

		return oldResp;
	};

	if (!request.body || middlewareEditors.urlsToEdit.indexOf(urlObj.pathname) === -1) {
		return oldResp;
	};

	console.log(request.url);	

	let changed = false;
	let clonedResp = (!xhr) ? oldResp.clone() : undefined;
	let respText = (xhr) ? structuredClone(oldResp.responseText) : (await clonedResp.text());

	let respBody = JSON.parse(respText);
	let toCacheOriginal = structuredClone(respBody);

	let browseId = request.body.browseId ||
		ext.GetBrowseIdFromResponseContext(toCacheOriginal.responseContext);

	let responseIsContinuation = !!(
		request.body.continuation ||
		urlObj.searchParams.get("ctoken") ||
		urlObj.searchParams.get("continuation")
	);

	let [cParams, cParamsRef] = _GetCParams(request, browseId);

	if (cParams) {
		cParams = structuredClone(cParams);

		if (cParamsRef) delete ext.state.BrowseParamsByRequest[cParamsRef];
		if (cParams.returnOriginal) return oldResp;

		request.cParams = cParams;
	};

	console.log("ORIGINAL RESP", browseId, toCacheOriginal, "is continuation:", responseIsContinuation, request);

	let newBody;

	let smallTask = middlewareEditors.SmallPOSTEditors.endpointToTask[pathname];
	if (smallTask) newBody = await smallTask.apply(middlewareEditors.SmallPOSTEditors, [request, respBody]);

	let pageType = ext.GetBrowsePageTypeFromBrowseId(browseId);

	initiateDelayedCacheOfOldResp(browseId, pageType, responseIsContinuation, toCacheOriginal);

	if (newBody) {
		respBody = newBody;
		changed = true;
	};


	if (!changed && browseId) {
		if (!pageType) return oldResp;
		if (responseIsContinuation) pageType = "CONT_" + pageType;

		const mainTask = middlewareEditors.MainPOSTEditors[pageType];

		if (!mainTask) return oldResp;
		newBody = await mainTask.apply(middlewareEditors.MainPOSTEditors, [respBody, browseId]);

		if (newBody) {
			respBody = newBody;
			changed = true;
		};
	};

	if (!changed) return oldResp;

	console.log("NEW RESP BODY", respBody);

	if (!respBody) return oldResp;

	if (changed) {
		respBody.cMusicFixerExtChangedResponse = true;
		let finalStr = JSON.stringify(respBody);

		if (xhr) {
			Object.defineProperty(oldResp, "responseText", {
				get() {
					return finalStr;
				}
			});

			Object.defineProperty(oldResp, "response", {
				get() {
					return finalStr;
				}
			});

			return oldResp;
		};

		return new Response(finalStr, {
			headers: clonedResp.headers,
			ok: clonedResp.ok,
			redirected: clonedResp.redirected,
			status: clonedResp.status,
			statusText: clonedResp.statusText,
			type: clonedResp.type,
			url: clonedResp.url
		});
	};

	return oldResp;
};

// EDIT DATA PREFLIGHT.
function FetchModifyRequest(requestData, resource, body_) {
	if (requestData.method !== "POST") return;
	if (requestData.url.indexOf("youtubei/v1/playlist/create") !== -1) {
		if (!body_.title.startsWith(ext.TAG_PLAYLIST_DEFAULT_METADATA.titlePrefix)) return;
		
		body_.description = ext.TAG_PLAYLIST_DEFAULT_METADATA.description;

		const {
			cache, credentials, headers, integrity, method,
			mode, redirect, referrer, referrerPolicy, url, body
		} = resource;

		let bodyStr = JSON.stringify(body_);

		return new Request(url, {
			"cache": cache,
			"credentials": credentials,
			"headers": headers,
			"integrity": integrity,
			"method": method,
			"mode": mode,
			"redirect": redirect,
			"referrer": referrer,
			"referrerPolicy": referrerPolicy,
			"body": bodyStr
		});
	};
};


async function newFetch(resource, options) {
	let request;
	let resourceIsStr = typeof(resource) === "string";

	if (resourceIsStr) { // used for random stuff
		request = {
			url: resource,
			method: options.method || "GET",
			body: undefined
		};

	} else {
		request = { // used for JSON things like browsing.
			url: resource.url,
			method: resource.method || "GET",
			body: undefined
		};

	};

	// REFRESHES PAGESPECIFIC HERE!!
	if (request.url.includes("/browse")) ext.state.BrowseParamsByRequest.pageSpecific = {};

	if (request.method === "POST") { // have to do this first, or body is used in originalFetch.
		try {
			if (resourceIsStr && options && options.body && typeof(options.body) === "string") {
				request.body = JSON.parse(options.body);
				// will err 90-100% of time, Request obj used for JSON things.

			} else if (!resourceIsStr) {
				let clonedResource = resource.clone();
				let reqText = await clonedResource.text();

				let body = JSON.parse(reqText);
				let newR;

				try { newR = FetchModifyRequest(request, resource, body); }
				catch (err) { console.error("couldnt modify fetch request", request, body, resource, err); };

				if (newR) resource = newR;
				request.body = body;
			};

		} catch {};
	};

	let response = await originalFetch(resource, options);

	try {
		response = await FetchModifyResponse(request, response);

	} catch (err) {
		console.warn("couldnt modify fetch response", err);

	};

	return response;
};

window.cacheContinuations = {};

Object.defineProperty(window, "originalFetch", {
	value: window.fetch,
	writable: false,
	configurable: false
});

Object.defineProperty(window, "originalXHROpen", {
	value: XMLHttpRequest.prototype.open,
	writable: false,
	configurable: false
});

Object.defineProperty(window, "originalXHRSend", {
	value: XMLHttpRequest.prototype.send,
	writable: false,
	configurable: false
});


window.fetch = async function(resource, opts) {
	try {
		return await newFetch(resource, opts);

	} catch(err) { // try/catch vital here. walsy have backup otherwise site breaks.
		console.warn("ERR IN NEWFETCH",err);
		return await originalFetch(resource, opts);

	};
};

XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
	this._url = url;
	this._method = method;

	if (url.match(/^\/[^\/]/)) {
		this._url = "https://music.youtube.com" + url;
	};

	if (url.match(/^\/\//)) {
		this._url = "https:" + url;
	};

	return originalXHROpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) { // used for player/next/atr/qoe.
	const xhr = this;

	const originalOnReadyStateEvent = xhr.onreadystatechange;

	xhr.onreadystatechange = async function() {
		if (xhr.readyState === 4 && String(xhr.status).startsWith("2")) {
			try {
				await FetchModifyResponse({
					url: xhr._url,
					method: xhr._method,
					body: JSON.parse(body || "{}")
				}, xhr, true);
			} catch {};
		};

		if (originalOnReadyStateEvent) originalOnReadyStateEvent.apply(this, arguments);
	};

	return originalXHRSend.apply(this, arguments);
};

fconsole.log("middleware initialised successfully");

["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = window.fetch, non clonable.)