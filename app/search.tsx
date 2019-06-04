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

/*
  Export helper types related to search so they can be
  imported and used in other files.
*/
export {
  SearchSourceType,
  SearchFilter,
  SearchFilterClause,
  Suggestion,
  SearchResult
};
