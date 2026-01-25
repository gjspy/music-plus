export class EWUtils {
	static DEFAULT_STORAGE = {
		local: {
			accountInfo: {
				accountName: "",
				accountPhoto: "",
				channelHandle: ""
			},
			username: "",
			token: "",
			cachedLastResponse: {},
			lightApi: {
				endpoint: "",
				enabled: false,
				entitiesToKeys: {},
				autoMusicRoom: ""
			}
		},
		
		external: {
			cache: {
				mfIdMap: {}
			},
	
			sidebar: {
				paperItemOrder: [],
				idCounter: 0,
				folders: {
					folders:{
						//"CFMORE":{id: "CFMORE", contents: []}
					} // id: {id: `CF${id}`,title: request.title, subtitle: request.subtitle, contents: []}
				},
				separators: {
					separators: {} // id: {id: `CS${id}`,name: request.title}
				}
			},

			customisation: {
				albumLinks: {},
				primaryAlbums: {},
				hiddenSongs: {},
				skippedSongs: {},
				metadata: {},
				extraSongs: {},
				notes: {},
				tags: {
					tags: {}, // id: {id: "", name: "", colour: "", playlist: ""}
					videos: {} // videoId: [tagId]
				} 
			},

			stats: {
				watchtime: {}
			}
		}
	};

	static API_ENDPOINT = "https://music.gtweb.dev/v2/";
	static STORAGE_API = this.API_ENDPOINT + "storage/music/";
	static SIDEBAR_API = this.API_ENDPOINT + "music/sidebar/";
	static EDITOR_API = this.API_ENDPOINT + "music/edit/";
	static STORAGE_GET = "bulkget";
	static STORAGE_GETPOPULATED = "getpopulated";
	static STORAGE_GETWITHCACHE = "getwithcache";
	static STORAGE_SET = "set";

	// RECURSIVELY CHECK EACH DIR HAS KEYS IT REQUIRES.
	static CheckHasKeys(cont, shouldHave) {
		const shouldHaveKeys = Object.keys(shouldHave);
		shouldHave = structuredClone(shouldHave);

		// CHECK ALL KEYS, IF DOESN'T EXIST, GIVE DEFAULT VALUE.
		for (let k of shouldHaveKeys) {
			if (cont[k] === undefined || cont[k] === null) {
				cont[k] = shouldHave[k]; // does not have, give default.
				
				continue;
			};

			if (typeof(cont[k]) === "object") { // has children
				cont[k] = this.CheckHasKeys(cont[k], shouldHave[k]); // check children
			};
		};

		return cont;
	};

	static async StorageGetLocal() {
		const storage = await browser.storage.local.get();

		if (Object.keys(storage).length === 0) {
			return this.DEFAULT_STORAGE.local;
		};

		return this.CheckHasKeys(storage, this.DEFAULT_STORAGE.local);
	};

	static async StorageGetExternal({route, localStorage = undefined, body = undefined}) {
			if (!localStorage) localStorage = await this.StorageGetLocal();

			const username = localStorage.username;
			const token = localStorage.token;

			if (!username || !token) {
				throw Error("No credentials");
			};

			let response;
			const fullRoute = `${route}?user_id=${username}&token=${token}`;

			if (body) {
				response = await fetch(fullRoute, {method: "POST", body});
			} else {
				response = await fetch(fullRoute);
			};
			
			if (response.status !== 200) {
				fconsole.error(response);
				throw Error(`External response was ${response.status} for ${route}.`);
			};

			return await response.json();
	};

	static async StorageSetLocal(toStore) {
		const defaultData = this.DEFAULT_STORAGE.local;
		const storageLocal = {};

		for (const key of Object.keys(defaultData)) {
			const val = toStore[key];
			
			storageLocal[key] = (val) ? val : defaultData[key];
		};

		await browser.storage.local.set(toStore);
	};

	static async StorageSetExternal({route, data, localStorage = undefined}) {
		if (!localStorage) {
			localStorage = await this.StorageGetLocal();
		};
		
		const username = localStorage.username;
		const token = localStorage.token;

		if (!username || !token) {
			throw Error("No credentials");
		};

		const fullRoute = `${route}?user_id=${username}&token=${token}`;

		const response = await fetch(fullRoute, {
			method: "POST",
			body: JSON.stringify(data),
			headers: {"Content-Type": "application/json"}
		});

		if (response.status !== 200) {
			fconsole.error(response);
			throw Error(`External response was ${response.status} for ${route}].`);
		};
		
		//browser.storage.session.set({ fetchedThisSession: true });
	};
};