// The different types of sources used for searching
enum SearchSourceType {
  Location = 0,
  Filter = 1
}

interface SearchFilterClause {
  layerName: string;
  clause: string;
}

interface SearchFilter {
  clauses: Array<SearchFilterClause>;
  visible: boolean;
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
