export class YTElemCreator {

	singleColumnBrowseResultsRenderer({contents}) {
		return { "singleColumnBrowseResultsRenderer": contents };
	};

	sectionListRenderer({contents}) {
		return { "sectionListRenderer": contents};
	};



	tabs({contents}) {
		return { "tabs": contents };
	};


	tabRenderer({endpoint, title, selected, content, iconName, tabIdentifier}) {
		return {
			"tabRenderer": {
				endpoint, title, selected, content,
				icon: {"iconType": iconName},
				tabIdentifier
			}
		};
	};

	
	musicCarouselShelfRenderer({header, contents, itemSize}) {
		return {
			"musicCarouselShelfRenderer": {
				header, contents, itemSize
			}
		};
	};

	musicCarouselShelfBasicHeaderRenderer({title, strapline, moreContentButton, thumbnail}) {
		return {
			"musicCarouselShelfBasicHeaderRenderer": {
				title, strapline, moreContentButton, thumbnail,
				headerStyle: "MUSIC_CAROUSEL_SHELF_BASIC_HEADER_STYLE_DEFAULT"
			}
		};
	};

	




};