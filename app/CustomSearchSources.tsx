import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';

import esriRequest = require('esri/request');
import Accessor = require('esri/core/Accessor');

import { umassLongLat } from 'app/latLong';
import { filterInfo } from 'app/rendering';
import {
  SearchSourceType,
  SearchFilter,
  SearchResult,
  Suggestion,
  LocationSearchSourceProperties,
  locationSearchSourceProperties,
  searchTermMatchesTags
} from 'app/search';

@subclass('esri.CustomSearchSources')
class CustomSearchSources extends declared(Accessor) {
  // The source properties for location searches
  @property()
  locationSearchSourceProperties: Array<LocationSearchSourceProperties>;

  // Only use location sources
  @property()
  locationsOnly: boolean;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.locationSearchSourceProperties = locationSearchSourceProperties;
    this.locationsOnly = properties.locationsOnly || false;
  }

  // Return header text to describe a list of suggestions of the same type
  suggestionHeader(suggestion: Suggestion): string {
    if (suggestion.sourceType === SearchSourceType.Location) {
      return this.locationSearchSourceProperties[suggestion.locationSourceIndex].title;
    } else if (suggestion.sourceType === SearchSourceType.Filter) {
      return 'Filters';
    } else {
      return '';
    }
  }

  // Return a promise with search suggestions based on the search term
  suggest(searchTerm: string): Promise<Array<Suggestion>> {
    return new Promise((resolve, reject) => {
      let suggestPromises;
      // Prepare suggestion promises from multiple sources
      if (this.locationsOnly) {
        suggestPromises = [this._suggestLocations(searchTerm)];
      } else {
        suggestPromises = [
          this._suggestFilters(searchTerm),
          this._suggestLocations(searchTerm)
        ];
      }
      // Evaluate after all promises have completed
      Promise.all(suggestPromises).then((allSuggestions) => {
        let finalSuggestions: Array<Suggestion> = [];
        allSuggestions.forEach((suggestions) => {
          finalSuggestions = finalSuggestions.concat(suggestions);
        });
        resolve(finalSuggestions);
      })
    });
  }

  /*
    Return a promise to a search result based on the suggestion passed in.
    This is neccesary for location searches because the suggestions don't
    contain the full information about the location, so there has to be a
    call to the API to ask for the full info.
  */
  search(suggestion: Suggestion): Promise<SearchResult> {
    return new Promise((resolve, reject) => {
      let searchResult: SearchResult;
      if (suggestion.sourceType === SearchSourceType.Location) {
        /*
          Build our own request to the API so we can explicitly request the same
          output spatial reference to be in latitude and longitude.
          Otherwise different locators return coordinates in different spatial
          references depending on the location.
        */
        esriRequest(
          this.locationSearchSourceProperties[suggestion.locationSourceIndex].url + '/findAddressCandidates',
          {
            query: {
              magicKey: suggestion.key,
              f: 'json',
              maxLocations: 1,
              outSR: '{"wkid":4326}'
            }
          }
        ).then((response) => {
          if (response.data.candidates.length > 0) {
            const topResult = response.data.candidates[0];
            searchResult = {
              name: topResult.address,
              sourceType: SearchSourceType.Location,
              latitude: topResult.location.y,
              longitude: topResult.location.x
            };
            resolve(searchResult);
          } else {
            reject(`Could not find search result for suggestion with magicKey ${suggestion.key}`);
          }
        });
      } else if (suggestion.sourceType === SearchSourceType.Filter) {
        searchResult = {
          name: suggestion.text,
          sourceType: suggestion.sourceType,
          filter: suggestion.filter
        }
        resolve(searchResult);
      } else {
        reject(`Cannot search for suggestion from source type ${suggestion.sourceType}`);
      }
    });
  }

  // Return a promise for location suggestions
  private _suggestLocations(searchTerm: string): Promise<Array<Suggestion>> {
    return new Promise((resolve, reject) => {
      let suggestPromises = [];
      // Create a promise for every locator service
      for (let i = 0; i < this.locationSearchSourceProperties.length; i += 1) {
        suggestPromises.push(esriRequest(
          this.locationSearchSourceProperties[i].url + '/suggest',
          {
            query: {
              text: searchTerm,
              f: 'json',
              outSR: '{"wkid":4326}',
              location: umassLongLat.join(','),
              distance: 10000
            }
          }
        ));
      }
      // Resolve all promises with their results as an array in order
      Promise.all(suggestPromises).then((responses) => {
        let suggestions: Array<Suggestion> = [];
        // Iterate over each set of suggestions obtained from a suggest promise
        responses.forEach((response, sourceIndex) => {
          // Iterate over each suggestion from that source
          response.data.suggestions.forEach((responseSuggestion: any) => {
            const suggestion = {
              text: responseSuggestion.text,
              key: responseSuggestion.magicKey,
              sourceType: SearchSourceType.Location,
              locationSourceIndex: sourceIndex
            }
            suggestions.push(suggestion);
          });
        });
        resolve(suggestions);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  // Return a promise for filter suggestions
  private _suggestFilters(searchTerm: string): Promise<Array<Suggestion>> {
    return new Promise((resolve, reject) => {
      const maxResults = 5;
      let suggestions: Array<Suggestion> = [];
      filterInfo.forEach((filter: SearchFilter) => {
        if (suggestions.length >= maxResults) {
          return;
        }
        // Use tags from the filter or convert the filter name to tags
        let tags;
        if (filter.tags) {
          tags = filter.tags;
        } else {
          tags = filter.name.split(' ');
        }
        /*
          Only include the filter as a suggestion if the search term matches
          the filter's tags.
        */
        if (searchTermMatchesTags(searchTerm, tags)) {
          suggestions.push({
            text: filter.name,
            key: `filter-${filter.name}`,
            sourceType: SearchSourceType.Filter,
            filter: filter
          });
        }
      });
      resolve(suggestions);
    });
  }
}

// Export custom search sources so it can be imported and used in other files
export = CustomSearchSources;
