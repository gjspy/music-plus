import { MWUtils } from "../extension/utilsmw"
import { InjectMyPaperItems } from "../extension/taskFiles/sidebarService";
import { SidebarEditFeatures } from "../extension/taskFiles/sidebarEditService";
import { CacheService } from "../extension/taskFiles/cacheService";
import { GETEditors, MainPOSTEditors, SmallPOSTEditors } from "../extension/taskFiles/middlewareEditors";

declare const console: undefined;

declare global {
	var ext: typeof MWUtils;

	var polymerController: polymerController;
	var apiComponent: Element;
	var menuServiceItemBehaviour: object;
	var fconsole: Console;
	var console: undefined;

	var cacheService: typeof CacheService;
	var middlewareEditors: middlewareEditors;

	interface Window {
		ext: typeof MWUtils;
		sidebarService: typeof InjectMyPaperItems;
		sidebarEditService: typeof SidebarEditFeatures;
		cacheService: typeof CacheService;
		middlewareEditors: middlewareEditors;

		fconsole: Console;
		console: undefined;

		cMusicFixerExtIgnoreTab: boolean;
		cMusicFixerPlayerBarInterval: number;
		cMusicFixerNetworkMiddlewareEnabled: boolean;
		cMusicFixerRunningServices: {
			sidebarService?: InjectMyPaperItems;
			sidebarEditService?: SidebarEditFeatures;
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

	interface middlewareEditors {
		MainPOSTEditors: typeof MainPOSTEditors;
		SmallPOSTEditors: typeof SmallPOSTEditors;
		GETEditors: typeof GETEditors;
		urlsToEdit: Array;
	};

	interface Console {
		log: never; // Prevent usage of console.log
		warn: never; // Prevent usage of console.warn
		error: never; // Prevent usage of console.error
		info: never; // Prevent usage of console.info
		debug: never; // Prevent usage of console.debug
    };
};

export {};