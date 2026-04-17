import { MWUtils } from "../extension/utilsmw"
import { InjectMyPaperItems } from "../extension/taskFiles/sidebarService";
import { SidebarEditFeatures } from "../extension/taskFiles/sidebarEditService";
import { CacheService } from "../extension/taskFiles/cacheService";
import { GETEditors, MainPOSTEditors, SmallPOSTEditors } from "../extension/taskFiles/middlewareEditors";
import { EventDriven } from "../extension/taskFiles/eventDriven";
import { PopupService } from "../extension/popups";
import { PopupTemplates } from "../extension/popupTemplates";
import { BaseEditMode } from "../extension/editModes/_baseEditor";
import { AlbumEditMode } from "../extension/editModes/albumEditMode";

declare const console: undefined;

declare global {
	var ext: typeof MWUtils;

	var polymerController: polymerController;
	var apiComponent: Element;
	var menuServiceItemBehaviour: object;
	var fconsole: Console;

	var sidebarService: typeof InjectMyPaperItems;
	var cacheService: typeof CacheService;
	var popupService: typeof PopupService;
	var sidebarEditService: typeof SidebarEditFeatures;
	var baseEditMode: typeof BaseEditMode;
	var albumEditMode: typeof AlbumEditMode;
	var middlewareEditors: middlewareEditors;

	interface Window {
		ext: typeof MWUtils;
		sidebarService: typeof InjectMyPaperItems;
		sidebarEditService: typeof SidebarEditFeatures;
		cacheService: typeof CacheService;
		eventDriven: typeof EventDriven;
		popupService: typeof PopupService;
		popupTemplates: typeof PopupTemplates;

		middlewareEditors: middlewareEditors;

		fconsole: Console;

		cMusicFixerExtIgnoreTab: boolean;
		cMusicFixerPlayerBarInterval: number;
		cMusicFixerNetworkMiddlewareEnabled: boolean;
		cMusicFixerRunningServices: {
			sidebarService: InjectMyPaperItems;
			sidebarEditService: SidebarEditFeatures;
			eventDriven: EventDriven;
			activeEditMode?: BaseEditMode;
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