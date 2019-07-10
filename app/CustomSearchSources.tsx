import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';

import esriRequest = require('esri/request');
import Accessor = require('esri/core/Accessor');

import { umassLongLat } from 'app/latLong';
import { toNativePromise } from 'app/promises';
import { filterInfo } from 'app/rendering';
import {
  SearchSourceType,
  SearchFilter,
  SearchResult,
  Suggestion,
  searchTermMatchesTags
} from 'app/search';

interface LocationSearchSourceProperties {
  url: string;
  title: string;
}

@subclass('esri.CustomSearchSources')
class CustomSearchSources extends declared(Accessor) {
  // The source properties for location searches
  private static locationSearchSourceProperties: Array<LocationSearchSourceProperties> = [{
    url: 'https://maps.umass.edu/arcgis/rest/services/Locators/CampusAddressLocatorWithSuggestions/GeocodeServer',
    title: 'On-campus locations'
  }, {
    url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer',
    title: 'Off-campus locations'
  }]

  // Only use location sources
  @property()
  private readonly locationsOnly: boolean;

  // Pass in any properties
  public constructor(properties?: { locationsOnly: boolean }) {
    super();
    this.locationsOnly = properties.locationsOnly || false;
  }

  // Return header text to describe a list of suggestions of the same type
  public suggestionHeader(suggestion: Suggestion): string {
    if (suggestion.sourceType === SearchSourceType.Location) {
      return CustomSearchSources.locationSearchSourceProperties[suggestion.locationSourceIndex].title;
    } else if (suggestion.sourceType === SearchSourceType.Filter) {
      return 'Filters';
    } else {
      return '';
    }
  }

  // Return a promise with search suggestions based on the search term
  public suggest(searchTerm: string): Promise<Array<Suggestion>> {
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
    return Promise.all(suggestPromises).then((allSuggestions) => {
      let finalSuggestions: Array<Suggestion> = [];
      allSuggestions.forEach((suggestions) => {
        finalSuggestions = finalSuggestions.concat(suggestions);
      });
      return finalSuggestions;
    }).catch((error) => {
      throw error;
    });
  }

  /*
    Return a promise to a search result based on the suggestion passed in.
    This is neccesary for location searches because the suggestions don't
    contain the full information about the location, so there has to be a
    call to the API to ask for the full info.
  */
  public search(suggestion: Suggestion): Promise<SearchResult> {
    let searchResult: SearchResult;
    // Search for location
    if (suggestion.sourceType === SearchSourceType.Location) {
      /*
        Build our own request to the API so we can explicitly request the same
        output spatial reference to be in latitude and longitude.
        Otherwise different locators return coordinates in different spatial
        references depending on the location.
      */
      return toNativePromise(esriRequest(
        CustomSearchSources.locationSearchSourceProperties[suggestion.locationSourceIndex].url + '/findAddressCandidates',
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
          return searchResult;
        } else {
          throw `Could not find search result for suggestion with magicKey ${suggestion.key}`;
        }
      }).catch((error) => {
        throw error;
      }));
    // Search for filter
    } else if (suggestion.sourceType === SearchSourceType.Filter) {
      searchResult = {
        name: suggestion.text,
        sourceType: suggestion.sourceType,
        filter: suggestion.filter
      }
      return Promise.resolve(searchResult);
    } else {
      return Promise.reject(
        `Cannot search for suggestion from source type ${suggestion.sourceType}`
      );
    }
  }

  // Return a promise for location suggestions
  private _suggestLocations(searchTerm: string): Promise<Array<Suggestion>> {
    const suggestPromises = [];
    // Create a promise for every locator service
    for (let i = 0; i < CustomSearchSources.locationSearchSourceProperties.length; i += 1) {
      suggestPromises.push(esriRequest(
        CustomSearchSources.locationSearchSourceProperties[i].url + '/suggest',
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
    return Promise.all(suggestPromises).then((responses) => {
      const suggestions: Array<Suggestion> = [];
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
      return suggestions;
    }).catch((error) => {
      throw error;
    });
  }

  // Return a promise for filter suggestions
  private _suggestFilters(searchTerm: string): Promise<Array<Suggestion>> {
    const maxResults = 5;
    const suggestions: Array<Suggestion> = [];
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
    return Promise.resolve(suggestions);
  }
}

// Export custom search sources so it can be imported and used in other files
export = CustomSearchSources;
