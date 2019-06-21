import Collection = require('esri/core/Collection');
import Locator = require('esri/tasks/Locator');
import LocatorSearchSource = require('esri/widgets/Search/LocatorSearchSource');

// The different types of sources used for searching
enum SearchSourceType {
  Location = 0,
  Filter = 1
}

interface SearchFilterClause {
  layerName: string;
  clause?: string;
  labelsVisible?: boolean,
}

interface SearchFilter {
  // The clauses to filter by. There should only be one per layer.
  clauses: Array<SearchFilterClause>;
  // Whether or not the filter should be visible in its own window
  visible: boolean;
  // The name of the filter to be displayed in the filter window
  name?: string;
  // The description to be displayed in the filter window
  description?: string;
  // Strings to identify this filter in a search
  tags?: Array<string>;
  subFilters?: Array<SearchFilter>;
}

// Everything needed to store a suggestion for future search
interface Suggestion {
  text: string;
  key: string;
  sourceType: SearchSourceType;
  locationSourceIndex?: number;
  filter?: SearchFilter;
}

// Everything needed to store what a user has searched
interface SearchResult {
  name: string;
  sourceType: SearchSourceType;
  latitude?: number;
  longitude?: number;
  filter?: SearchFilter;
}

// Minimum required to query a location from a server
interface LocationSearchSourceProperties {
  url: string;
  title: string;
}

// Minimum properties needed to directly query locations
const locationSearchSourceProperties: Array<LocationSearchSourceProperties> = [
  {
    url: 'https://maps.umass.edu/arcgis/rest/services/Locators/CampusAddressLocatorWithSuggestions/GeocodeServer',
    title: 'On-campus locations'
  }, {
    url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer',
    title: 'Off-campus locations'
  }
];

// Verbose search sources for esri's directions widget
let _esriSearchSources = new Collection();
_esriSearchSources.addMany([
  new LocatorSearchSource({ 
    locator: new Locator({
      url: locationSearchSourceProperties[0].url
    }),
    singleLineFieldName: 'SingleLine',
    name: locationSearchSourceProperties[0].title,
    placeholder: 'Find on-campus locations',
    suggestionsEnabled: true
  }),
  new LocatorSearchSource({
    locator: new Locator({
      url: locationSearchSourceProperties[1].url
    }),
    singleLineFieldName: 'SingleLine',
    outFields: ['Addr_type'],
    name: locationSearchSourceProperties[1].title,
    placeholder: 'Find off-campus locations',
    suggestionsEnabled: true
  })
]);
const esriSearchSources: Collection<LocatorSearchSource> = _esriSearchSources;

// Return true if the search term matches one of the tags
function searchTermMatchesTags(searchTerm: string, tags: Array<string>): boolean {
  let searchWords = searchTerm.split(' ');
  return searchWords.some((word) => {
    return tags.some((tag) => {
      if (tag.toUpperCase().indexOf(word.toUpperCase()) !== -1) {
        return true;
      }
      return false;
    });
  })
}

/*
  Export helper types related to search so they can be
  imported and used in other files.
*/
export {
  SearchSourceType,
  SearchFilter,
  SearchFilterClause,
  Suggestion,
  SearchResult,
  LocationSearchSourceProperties,
  locationSearchSourceProperties,
  esriSearchSources,
  searchTermMatchesTags
};
