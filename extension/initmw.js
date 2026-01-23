export function MWInit(moduleScriptsEntries) {

	/* eslint-disable no-restricted-globals */
	function CreateCustomConsole() {
		//@ts-ignore
		window.fconsole = class fconsole {
			static kw = "MFIXER:";

			static debug = (...data) => console.debug(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
			static log = (...data) => console.log(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
			static info = (...data) => console.info(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
			static warn = (...data) => console.warn(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
			static error = (...data) => console.error(this.kw, ...data, "\n  ↳", (new Error().stack.split("\n")[1]));
		};
	};

	async function ImportAllWebAccessibleResources() {
		// IMPORT ALL WEB ACCESSIBLE RESOURCES

		const promises = [];

		for (let [k,v] of moduleScriptsEntries) {
			fconsole.debug(k, "importing");

			promises.push(import(v).then(
				( exports ) => {
					const exportObjs = Object.values(exports);

					if (exportObjs.length === 1) window[k] = Object.values(exports)[0];
					else window[k] = exports;

					fconsole.debug(k, "imported successfully");
				},
				( rejection ) => {
					fconsole.error(k, v, "failed to import because", rejection);
				}
			));
		};

		await Promise.all(promises); // ENSURE ALL ARE LOADED BEFORE CAN PROGRESS
	};

	async function init() {
		CreateCustomConsole();
		await ImportAllWebAccessibleResources();

		// LOAD GLOBALLY REQUIRED RESOURCES
		ext.LaunchListenerOfEWEvents();
		ext.WaitForPolymerController(); // NOT AWAITING.
		ext.GetMenuServiceItemBehaviour();
		await ext.InitTemplateElements(); // NOT AWAITING.

		window.cMusicFixerNetworkMiddlewareEnabled = true;
		window.cMusicFixerRunningServices = {};

		// ADD EVENT FOR C-DROPDOWNS DELETION WHEN USER CLICKS SOMEWHERE OTHER THAN IT.
		document.documentElement.addEventListener("click", function(e) {
			const currentDropdown = document.querySelector("body .c-popup-bkg .c-dropdown");
			if (!currentDropdown || !(e.target instanceof Element)) return;

			if (e.target.matches(".c-dropdown") || e.target.closest(".c-dropdown")) return;

			currentDropdown.parentElement.remove();
		});

		

		// START EXTENSION FEATURES
		try {
			const sidebar = new window.sidebarService();
			sidebar.init(true);

			window.cMusicFixerRunningServices.sidebarService = sidebar;
		} catch (err) { fconsole.error("failed to load sidebarService because", err); };

		/*try {
			const edit = new window.sidebarEditService();

			window.cMusicFixerRunningServices.sidebarEditService = edit;
		} catch (err) { fconsole.error("failed to load sidebarEditService because", err); };*/

		try {
			const events = new window.eventDriven();
			events.init();

			window.cMusicFixerRunningServices.eventDriven = events;
		} catch (err) { fconsole.error("failed to load eventDriven because", err); };
	};


	try { init(); }
	catch (err) {
		fconsole.error("ERROR IN MWINIT", err);
		return ["error in mwinit", String(err)];
	};
};