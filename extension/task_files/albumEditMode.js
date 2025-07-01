export function AlbumEditFeatures() {
	function _GetAlbumContents() {
		let appLayout = document.querySelector("ytmusic-app-layout");

		let listData = appLayout.__dataHost.__data.mainContentData.response.contents.twoColumnBrowseResultsRenderer;
		let items = listData.secondaryContents.sectionListRenderer.contents[0].musicShelfRenderer.contents;

		return items;
	};

	async function _GetSongsToHide(albumContents) {
		return new Promise(function(resolve, reject) {
			function RespListener(event) {
				if (event.detail.func !== "get-hidden-song-details") return;

				let toHide = event.detail.toHide;

				window.removeEventListener(UGeneralCustomEventEWToMW, RespListener);

				resolve(toHide);
			};

			if (!albumContents) albumContents = _GetAlbumContents();
			console.log("albumcontents:",albumContents);

			// get ready to receive response
			window.addEventListener(UGeneralCustomEventEWToMW, RespListener);

			// send event to EW to get saved data
			UDispatchEventToEW({
				func: "get-hidden-song-details",
				albumContents: albumContents
			});
		});
	};

	function _HideUnwantedSongs() {

	};

	function _OnPageLoad() {
		let shareButton = document.querySelector("ytmusic-two-column-browse-renderer #primary yt-button-renderer:has([aria-label=\"Share\"])");

		
	};

	// main

	//let albumItems = 
	//_GetSongsToHide().then(function(result) {
	//	console.log("RESULT:", result);
	//})

	_CacheInformationPlaylistPage();
}