// functionality for editing albums.

AlbumEditMode = class AlbumEditMode {
	static buttons = [
		{
			type: "explicit",
			icon: "MUSIC_EXPLICIT_BADGE",
			text: "Define Explicit Songs"
		},
		{
			type: "insert",
			icon: "add",
			text: "Insert Extra Songs",
			onclick: this.InsertSongs
		},
		{
			type: "remove-inserted",
			icon: "delete",
			text: "Remove Extra Songs",
			onclick: this.RemoveInsertedSongs
		},
		{ // when linking other albums, use the longest ver as base. eg folklore: base = folklore, "link" deluxe version, not base = deluxe and link folklore.
			type: "link",
			icon: "album",
			text: "Link Other Album",
			onclick: this.LinkMode
		},
		{
			type: "editlink",
			icon: "album",
			text: "Remove Linked Album",
			onclick: this.RemoveLink
		},
		{ // shouldn't be different from yt default. eg folklore: primary = folklore explicit, not deluxe
			type: "versions",
			icon: "album",
			text: "Define Primary Version",
			onclick: this.DefineVersion
		}
	];


	static async RemoveInsertedSongs(state, browsePage, id) {
		let storage = await UMWStorageGet();
		let currentExtraSongs = storage.customisation.extraSongs[id] || {};

		let popup = UCreatePopup({
			title: {
				text: "Remove Song",
				icon: "tag"
			},
			content: [
				{
					class: "c-popup-scroll-rows",
					id: "removeInsertedSong",
					config: [
						["label", "textContent", "Inserted Songs"]
					],
					contents: {
						items: currentExtraSongs.map((data) => {
							let id_ = data.videoId;
							let albumId = storage.cache[id_]?.album;
							let album = (albumId) ? storage.cache[albumId] : undefined;

							return {
								videoId: id_,
								videoName: storage.cache[id_]?.name,
								albumData: (album) ? album.name : albumId,
								thumb: (album) ? album.thumb : undefined,
								index: data.index
							};
						}).sort((a,b) => Number(a.index) - Number(b.index)),
						generator: function(scrollRow, item) {
							console.log(scrollRow, item);
							let img = document.createElement("img");
							img.setAttribute("src", item.thumb);

							scrollRow.querySelector(".left-item").append(img);
							scrollRow.querySelector(".title-row").textContent = item.videoId + " : " + item.videoName;
							scrollRow.querySelector(".subtitle-row").textContent = item.albumData;
							scrollRow.cData = item;
						}
					}
				}
			],
			actions: [
				{
					icon: null,
					text: "Cancel",
					id: "cancel",
					style: "text-only",
					defaultAction: "close"
				}
			]
		});

		for (let row of popup.querySelectorAll(".c-popup-scroll-row")) {

			let handleClick =  function() {
				UDispatchEventToEW({
					func: "remove-inserted-song",
					data: {videoId: row.cData.videoId},
					"id": id
				});

				row.removeEventListener("click", handleClick);
				row.style.cursor = "default";
				row.style.opacity = 0.5;
			};

			row.addEventListener("click", handleClick);			
		};
	};

	static async LinkMode(state, browsePage, id) {
		function OnClickItem(chosenId) {
			ButtonBar.RemoveOVF();

			let popup = UCreatePopup({
				title: {
					text: "Start Index",
					icon: "album"
				},
				content: [
					{
						class: "c-popup-text-line",
						config: [
							["label", "innerHTML", "Are the indexes of these albums offset? If not, leave this blank. Else, what index of the larger album should be overitten by the first item of the smaller album?"]
						]
					},
					{
						class: "c-text-input",
						id: "offset",
						config: [
							["label", "textContent", "Offset Index"]
						]
					}
				],
				actions: [
					{
						icon: null,
						text: "Cancel",
						id: "cancel",
						style: "text-only",
						defaultAction: "close"
					},
					{
						icon: null,
						text: "Submit",
						id: "submit",
						style: "light"
					}
				]
			});

			popup.querySelector("#submit").addEventListener("click", function() {
				UDispatchEventToEW({
					func: "defineLink",
					baseItem: id,
					linkedItem: chosenId,
					offsetIndex: popup.querySelector("#offset input").value
				});

				ButtonBar.CancelAll();
				URemovePopup(popup);

				setTimeout(() => UNavigate(
					UBuildEndpoint({
						navType: "browse",
						"id": id
					})
				), 2000);
			});

			popup.querySelector("#cancel").addEventListener("click", () => ButtonBar.CancelAll());

			
			
		};

		let storage = await UMWStorageGet();
		let cache = storage.cache;
		let thisAlbumData = cache[id];
		let currentLinked = storage.customisation.albumLinks[id] || [];
		
		let cachedArtist = cache[thisAlbumData.artist];
		let artistCounterpart = UGetCounterpartFromData(cache, cachedArtist);

		let gridCont = UShowGridOfMusicItems(
			(v) => (
				//v.saved === true &&
				v.type === "ALBUM" &&
				v.id !== id &&
				v.name !== thisAlbumData.name &&
				(v.artist === thisAlbumData.artist || (artistCounterpart && v.artist === artistCounterpart.id)) &&
				currentLinked.indexOf(v.id) === -1
			),
			[], false, false, OnClickItem, storage, "link-albums", "Other Albums",
			"Select an album to link with \"" + thisAlbumData.name + "\". Any private albums with identical names are matched automatically, and hidden here."
		);

		gridCont.ovf.style.marginRight = "250px";
		gridCont.ovf.style.marginLeft = "initial";
		gridCont.ovf.style.right = "0";
		gridCont.ovf.style.setProperty("--height", "700px");
	};

	static async RemoveLink(state, browsePage, id) {
		function OnClickItem(chosenId) {
			UDispatchEventToEW({
				func: "removeLink",
				baseItem: id,
				linkedItem: chosenId
			});

			ButtonBar.CancelAll();

			setTimeout(() => UNavigate(
				UBuildEndpoint({
					navType: "browse",
					"id": id
				})
			), 2000);
			
		};

		let storage = await UMWStorageGet();
		let thisAlbumData = storage.cache[id];
		let currentLinked = storage.customisation.albumLinks[id] || [];

		let gridCont = UShowGridOfMusicItems(
			(v) => (
				currentLinked.indexOf(v.id) !== -1
			),
			[], false, false, OnClickItem, storage, "link-albums", "Linked Albums",
			"Current albums linked with \"" + thisAlbumData.name + "\". Any private albums with identical names are matched automatically, and hidden here. Click to remove."
		);

		gridCont.ovf.style.marginRight = "250px";
		gridCont.ovf.style.marginLeft = "initial";
		gridCont.ovf.style.right = "0";
		gridCont.ovf.style.setProperty("--height", "700px");
	};

};


PlaylistEditMode = class AlbumEditMode {
	static buttons = [
		{ // change name, cover, single/ep/album!!, exact release date!!
			type: "details", // "type" IS THE ID!
			icon: "pencil",
			text: "Edit Playlist Metadata",
			onclick: this.EditMetadata
		},
		{
			type: "tag",
			icon: "tag",
			text: "Create Tag from playlist",
			onclick: this.CreateTagFrom
		}
	];

	static async CreateTagFrom(state, browsePage, id) {
		let handler = new CustomEndpointHandler({}, undefined);
		handler.CreateTag(id);
	};
};





["success"]; // RESULT TO RETURN BACK TO BKGSCRIPT. LEAVE THIS OR ERR (RESULT = window.fetch, non clonable.)