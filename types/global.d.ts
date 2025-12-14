import { MWUtils } from "../extension/utilsmw"
import { InjectMyPaperItems } from "../extension/taskFiles/sidebarService";
import { SidebarEditFeatures } from "../extension/taskFiles/sidebarEditService";

declare const console: undefined;

declare global {
	var musicFixer: typeof MWUtils;

	var polymerController: polymerController;
	var apiComponent: Element;
	var menuServiceItemBehaviour: object;
	var fconsole: Console;
	var console: undefined;

	interface Window {
		musicFixer: typeof MWUtils;
		sidebarService: typeof InjectMyPaperItems;
		sidebarEditService: typeof SidebarEditFeatures;

		fconsole: Console;
		console: undefined;

		cMusicFixerExtIgnoreTab: boolean;
		cMusicFixerPlayerBarInterval: number;
		cMusicFixerNetworkMiddlewareEnabled: boolean;
		cMusicFixerRunningServices: {
			sidebarService?: InjectMyPaperItems;
			sidebarEditService?: SidebarEditFeatures
		};

		polymerController: polymerController;
		apiComponent: Element;
		menuServiceItemBehaviour: {
			handleCommand: function;
		};
	};

	interface Node {
		querySelector: function;
		querySelectorAll: function;

		__cData: object;
		ytmusicServiceMenuItemBehavior: {
			hostElement?: Node;
			handleCommand: function;
		};
	};

	interface polymerController {
		store: {
			getState: function;
		}
		handleNavigateAction: function;
	};

	interface Console {
		log: never; // Prevent usage of console.log
		warn: never; // Prevent usage of console.warn
		error: never; // Prevent usage of console.error
		info: never; // Prevent usage of console.info
		debug: never; // Prevent usage of console.debug
    }
};

export {};