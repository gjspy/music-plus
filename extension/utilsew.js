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
				entitiesToKeys: {}
			}
		},
		
		external: {
			cache: {
				mfIdMap: {}
			},
	
			sidebar: {
				paperItemOrder: [], // [PL123, PL456, ...]
				hidden: [],
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

	static CACHE_FORMATS = {
		PLAYLIST: {
			name: "",
			creator: "",
			thumb: "",
			saved: null,
			items: [],
			id: "",
			type: "PLAYLIST",
			year: -1,
		},
		ALBUM: {
			name: "",
			artist: "",
			thumb: "",
			saved: null,
			features: [],
			items: [],
			id: "",
			mfId: "",
			year: -1,
			type: "ALBUM",
			subType: "",
			badges: [],
			privateCounterparts: [],
			alternate: [],
			private: null
		},
		ARTIST: {
			name: "",
			thumb: "",
			wideThumb: "",
			radios: {},
			saved: null,
			discography: [],
			id: "",
			type: "ARTIST",
			private: null,
			privateCounterparts: []
		},
		SONG: {
			name: "",
			album: "",
			index: "",
			artists: [],
			liked: "",
			lengthSec: -1,
			id: "",
			badges: [],
			type: "",
			views: 0,
			albumPlSetVideoId: "",
			lyricEndpoint: ""
		},
		USER_CHANNEL: {
			name: "",
			id: "",
			type: "USER_CHANNEL"
		},
		UNKNOWN: {

		}
	};

	static STORAGE_ENDPOINT = "https://music.gtweb.dev/api";

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

	static StorageGetExternal(fetchNew, localStorage) {
		const Get = async (resolve, reject) => {
			if (!localStorage) localStorage = await this.StorageGetLocal();

			let allowUsingCachedResponse = true;
			if (!fetchNew && localStorage.cachedLastResponse) {
				const sessionStorage = await browser.storage.session.get() || {};
				allowUsingCachedResponse = sessionStorage.fetchedThisSession;
			};

			if ((!fetchNew) && localStorage.cachedLastResponse && allowUsingCachedResponse) {
				resolve(this.CheckHasKeys(localStorage.cachedLastResponse, this.DEFAULT_STORAGE.external));
				return;
			};

			fconsole.log(
				"getting new extstorage because [fetchNew, noCached, cacheOldDontAllow]",
				fetchNew, !localStorage.cachedLastResponse, !allowUsingCachedResponse
			);

			const username = localStorage.username;
			const token = localStorage.token;

			if (!username || !token) {
				reject("no credentials");
				return;
			};

			const fetched = await fetch(this.STORAGE_ENDPOINT + `/storage/get?user_id=${username}&token=${token}`);
			
			if (fetched.status !== 200) {
				fconsole.error(fetched);
				reject(`External response was ${fetched.status} for GET.`);
			};

			let json = JSON.parse(await fetched.text());
			json = this.CheckHasKeys(json, this.DEFAULT_STORAGE.external);

			resolve(json);

			localStorage.cachedLastResponse = json;
			this.StorageSetLocal(localStorage);

			browser.storage.session.set({ fetchedThisSession: true });
		};

		return new Promise(Get);
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

	static async StorageSetExternal(toStore, localStorage) {
		if (!localStorage) {
			localStorage = await this.StorageGetLocal();
		};
		
		const username = localStorage.username;
		const token = localStorage.token;

		if (!username || !token) {
			throw Error("No credentials");
		};

		const defaultData = this.DEFAULT_STORAGE.external;
		const storageExt = {};

		for (const key of Object.keys(defaultData)) {
			const val = toStore[key];
			
			storageExt[key] = (val) ? val : defaultData[key];
		};

		// even though errors could happen, do this before, to stop
		// a spam of requests being misaligned, eg request 1 then 2 then 3,
		// if 2 took longer for whatever reason, cachedLastResponse would be 2 and not 3.
		localStorage.cachedLastResponse = storageExt;

		// DO THIS BEFORE. SO WHILE WAITING FOR RESP FROM
		// SERVER, IF ANOTHER EDIT HAPPENS, IT IS ADDED TO THESE CHANGES.
		// BEFORE, THAT CHANGE WOULD BE ADDED TO THE OLD STORAGE VER, AND
		// THIS WOULD BE LOST.
		this.StorageSetLocal(localStorage);

		let response = await fetch(this.STORAGE_ENDPOINT + `/storage/set?user_id=${username}&token=${token}`, {
			method: "POST",
			body: JSON.stringify(storageExt),
			headers: {"Content-Type": "application/json"}
		});

		if (response.status !== 200) {
			fconsole.error(response);
			throw Error(`External response was ${response.status} for POST.`);
		};
		
		browser.storage.session.set({ fetchedThisSession: true });
	};
};