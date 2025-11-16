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

		CachePageContents(response);
	}, 100);
};


async function FetchModifyResponse(request, oldResp, xhr) {
	function _GetCParams(request, browseId) {
		let cParams = request.cParams;

		if (cParams) return [cParams, undefined];
		if (!UBrowseParamsByRequest) return [undefined, undefined];

		let refs = [
			browseId,
			(request.body) ? request.body.videoId : undefined,
			(request.body) ? request.body.playlistId : undefined,
			(request.body) ? request.body.title : undefined
		];
		if (request.body && request.body.videoIds) refs.push(...request.body.videoIds);

		for (let ref of refs) {
			if (ref === undefined) continue;

			cParams = UBrowseParamsByRequest[ref];
			if (cParams) return [cParams, ref];
		};

		if (!UBrowseParamsByRequest.pageSpecific) return [undefined, undefined];

		for (let ref of refs) {
			cParams = UBrowseParamsByRequest.pageSpecific[ref];
			if (cParams) return [cParams, undefined]; // PAGESPEFIC MUST BE PERSISTENT, NO DELETE.
		};

		cParams = UBrowseParamsByRequest.pageSpecific.all
		if (cParams) return [cParams, undefined]; 

		return [undefined, undefined]
	};

	if (
		(!xhr && oldResp.status !== 200) ||
		(!xhr && !(oldResp.headers.get("Content-Type") || "").includes("application/json")) ||
		!request ||
		!request.body ||
		request.method !== "POST" ||
		NETWORK_EDITING_ENABLED === false
	) {
		return oldResp;
	};

	let urlObj;
	try { urlObj = new URL(request.url); }
	catch {};

	if (!urlObj || MiddlewareEditors.urlsToEdit.indexOf(urlObj.pathname) === -1) {
		return oldResp;
	};

	console.log(request.url);

	let changed = false;
	let clonedResp = (!xhr) ? oldResp.clone() : undefined;
	let respText = (xhr) ? structuredClone(oldResp.responseText) : (await clonedResp.text());

	let respBody = JSON.parse(respText);
	let toCacheOriginal = structuredClone(respBody);

	let browseId = request.body.browseId ||
		UGetBrowseIdFromResponseContext(toCacheOriginal.responseContext);
	let pathname = urlObj.pathname;

	let responseIsContinuation = !!(
		request.body.continuation ||
		urlObj.searchParams.get("ctoken") ||
		urlObj.searchParams.get("continuation")
	);

	let [cParams, cParamsRef] = _GetCParams(request, browseId);
	console.log("CPARAMS", cParams, cParamsRef);

	if (cParams) {
		cParams = structuredClone(cParams);

		if (cParamsRef) delete UBrowseParamsByRequest[cParamsRef];
		if (cParams.returnOriginal) return oldResp;

		request.cParams = cParams;
	};

	console.log("ORIGINAL RESP", browseId, toCacheOriginal, "is continuation:", responseIsContinuation, request);

	let newBody;

	let smallTask = MiddlewareSmallTasks.endpointToTask[pathname];
	if (smallTask) newBody = smallTask.apply(MiddlewareSmallTasks, [request, respBody]);


	let smallTaskWithCache = MiddlewareSmallTasks.endpointToTaskCache[pathname];
	if (smallTaskWithCache) {
		let storage = await UMWStorageGet();

		newBody = smallTaskWithCache.apply(MiddlewareSmallTasks, [request, respBody, storage]);
	};


	let pageType = UGetBrowsePageTypeFromBrowseId(browseId);

	initiateDelayedCacheOfOldResp(browseId, pageType, responseIsContinuation, toCacheOriginal);

	if (newBody) {
		respBody = newBody;
		changed = true;
	};


	if (!changed && browseId) {
		if (!pageType) return oldResp;
		if (responseIsContinuation) pageType = "CONT_" + pageType;

		let f = MiddlewareEditors[pageType];

		if (!f) return oldResp;

		// functions MUST take response, browseId. MAY take cache, that's the only change.
		if (f.length === 3) { // only get cache for functions that need it.
			let storage = await UMWStorageGet();

			newBody = f.apply(MiddlewareEditors, [respBody, browseId, storage]);

		} else {
			newBody = f.apply(MiddlewareEditors, [respBody, browseId]);
		};

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
		if (!body_.title.startsWith(U_TAG_PLAYLIST_DATA.titlePrefix)) return;
		
		body_.description = U_TAG_PLAYLIST_DATA.description;

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
			"url": resource,
			"method": options.method || "GET"
		};

	} else {
		request = { // used for JSON things like browsing.
			"url": resource.url,
			"method": resource.method || "GET"
		};

	};

	// REFRESHES PAGESPECIFIC HERE!!
	if (request.url.includes("/browse")) UBrowseParamsByRequest.pageSpecific = {};

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

				try { newR = FetchModifyRequest(request, resource, body) }
				catch (err) { console.error("TRIED TO MODIFY REQ", request, body, resource, err) };

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

	if (url.startsWith("/")) {
		this._url = "https://music.youtube.com" + url;
	};

	return originalXHROpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) { // used for player/next/atr/qoe.
	const xhr = this;

	const originalOnReadyStateEvent = xhr.onreadystatechange;

	xhr.onreadystatechange = async function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			try {
				await FetchModifyResponse({
					url: xhr._url,
					method: xhr._method,
					body: JSON.parse(body)
				}, xhr, true);
			} catch {};
		};

		if (originalOnReadyStateEvent) originalOnReadyStateEvent.apply(this, arguments);
	};

	return originalXHRSend.apply(this, arguments);
};

["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = window.fetch, non clonable.)