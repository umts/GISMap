import Graphic = require('esri/Graphic');

// The different types of sources used for searching
enum SearchSourceType {
  Location = 0,
  Filter = 1,
  Space = 2,
  // Used to supplement Location searches with better results
  Building = 3,
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
  // Target to goto on initial filter
  target?: Array<Graphic>;
  subFilters?: Array<SearchFilter>;
}

// Everything needed to store a suggestion for future search
interface Suggestion {
  text: string;
  sourceType: SearchSourceType;
  key?: string;
  locationSourceIndex?: number;
  filter?: SearchFilter;
  latitude?: number;
  longitude?: number;
}

// Everything needed to store what a user has searched
interface SearchResult {
  name: string;
  sourceType: SearchSourceType;
  latitude?: number;
  longitude?: number;
  filter?: SearchFilter;
}

// Return true if the search term matches one of the tags
function searchTermMatchesTags(searchTerm: string, tags: Array<string>): boolean {
  const searchWords = searchTerm.split(' ');
  return searchWords.some((word) => {
    return tags.some((tag) => {
      if (tag.toUpperCase().indexOf(word.toUpperCase()) !== -1) {
        return true;
      }
      return false;
    });
  })
}

// Escape single quotes, mainly for querying
function escapeQueryParam(text: string): string {
  return text.replace(/'/g, '\'\'');
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
  searchTermMatchesTags,
  escapeQueryParam
};
