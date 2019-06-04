import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';

import esriRequest = require('esri/request');
import Accessor = require('esri/core/Accessor');

import { filterInfo } from 'app/rendering';
import { SearchSourceType, SearchFilter, SearchResult, Suggestion } from 'app/search';

interface LocationSearchSourceProperties {
  url: string;
  title: string;
}

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
    this.locationSearchSourceProperties = [{
        url: 'https://maps.umass.edu/arcgis/rest/services/Locators/CampusAddressLocatorWithSuggestions/GeocodeServer',
        title: 'On-campus locations'
      }, {
        url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer',
        title: 'Off-campus locations'
      }
    ];
    this.locationsOnly = properties.locationsOnly || false;
  }

  suggestionHeader(suggestion: Suggestion): string {
    if (suggestion.sourceType === SearchSourceType.Location) {
      return this.locationSearchSourceProperties[suggestion.locationSourceIndex].title;
    } else if (suggestion.sourceType === SearchSourceType.Filter) {
      return 'Filters';
    } else {
      return '';
    }
  }

  suggest(searchTerm: string): Promise<Array<Suggestion>> {
    return new Promise((resolve, reject) => {
      let suggestPromises;
      if (this.locationsOnly) {
        suggestPromises = [this._suggestLocations(searchTerm)];
      } else {
        suggestPromises = [
          this._suggestFilters(searchTerm),
          this._suggestLocations(searchTerm)
        ];
      }
      Promise.all(suggestPromises).then((allSuggestions) => {
        let finalSuggestions: Array<Suggestion> = [];
        allSuggestions.forEach((suggestions) => {
          finalSuggestions = finalSuggestions.concat(suggestions);
        });
        resolve(finalSuggestions);
      })
    });
  }

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
              outSR: '{"wkid":4326}'
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
        console.error(error);
      });
    });
  }

  private _suggestFilters(searchTerm: string): Promise<Array<Suggestion>> {
    return new Promise((resolve, reject) => {
      let suggestions: Array<Suggestion> = [];
      filterInfo().forEach((filter: SearchFilter) => {
        suggestions.push({
          text: filter.name,
          key: `filter-${filter.name}`,
          sourceType: SearchSourceType.Filter,
          filter: filter
        });
      });
      resolve(suggestions);
    });
  }
}

// Export custom search sources so it can be imported and used in other files
export = CustomSearchSources;
