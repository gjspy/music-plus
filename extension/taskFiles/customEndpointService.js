export class CustomEndpointService {


	async UnlinkSeason() {
		await ext.DispatchEventToEW({
			func: "storage",
			storageFunc: "unlink-season",
			data: {
				season: this.endpoint.seasonId,
				key: "related",
				data: {
					id: this.endpoint.itemId,
					mode: "del",
				},
				_saveBackup: true
			}
		});

		ext.Navigate(ext.BuildEndpoint({
			navType: "toast",
			successTextRuns: [{
				text: "Item removed from " + this.endpoint.seasonName
			}]
		}));

		// TODO delete item
	};


	run() {
		switch (this.endpoint.action) {
			//case "writeNotePopup": this.AddNote(); break;
			//case "addTagPopup": this.AddTag(); break;
			//case "createTagPopup": this.CreateTag(); break;
			case "unlinkSeason": this.UnlinkSeason(); break;
		};
	};


	constructor(endpoint) {
		this.endpoint = endpoint;

		this.run();
	};
};