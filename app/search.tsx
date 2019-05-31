// The different types of sources used for searching
enum SearchSourceType {
  Location = 0
}

// Everything needed to store a suggestion for future search
interface Suggestion {
  text: string;
  key: string;
  sourceType: SearchSourceType;
  locationSourceIndex?: number; 
}

// Everything needed to store what a user has searched
interface SearchResult {
  name: string;
  latitude?: number;
  longitude?: number;
}

/*
  Export helper types related to search so they can be
  imported and used in other files.
*/
export { SearchSourceType, Suggestion, SearchResult };
