import { subclass, property } from 'esri/core/accessorSupport/decorators';

import esriRequest = require('esri/request');
import Graphic = require('esri/Graphic');
import Accessor = require('esri/core/Accessor');
import SpatialReference = require('esri/geometry/SpatialReference');
import FeatureLayer = require('esri/layers/FeatureLayer');
import MapView = require('esri/views/MapView');

import { umassLongLat, myLocation } from 'app/latLong';
import { filterInfo, featurePoint } from 'app/rendering';
import {
  SearchSourceType,
  SearchFilter,
  SearchResult,
  Suggestion,
  searchTermMatchesTags,
  escapeQueryParam
} from 'app/search';

interface LocationSearchSourceProperties {
  url: string;
  title: string;
}

@subclass('esri.CustomSearchSources')
class CustomSearchSources extends Accessor {
  @property()
  private view: MapView;

  // The source properties for location searches
  private static locationSearchSourceProperties: Array<LocationSearchSourceProperties> = [{
    url: 'https://maps.umass.edu/server/rest/services/Community-Locator/UmaCampusLocatorGazetteer/GeocodeServer',
    title: 'On-campus locations'
  }, {
    url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer',
    title: 'Off-campus locations'
  }]

  // Only use location sources
  @property()
  private readonly locationsOnly: boolean;

  // Only use on campus locations for searching
  @property()
  public onCampusLocationsOnly: boolean;

  public constructor(params?: {
    view: MapView,
    locationsOnly: boolean,
    onCampusLocationsOnly: boolean,
  }) {
    super();
    // Assign constructor params
    this.set(params);

    this.locationsOnly = params.locationsOnly || false;
    this.onCampusLocationsOnly = params.onCampusLocationsOnly || false;
  }

  // Return header text to describe a list of suggestions of the same type
  public suggestionHeader(suggestion: Suggestion): string {
    if (suggestion.sourceType === SearchSourceType.Location) {
      return CustomSearchSources.locationSearchSourceProperties[suggestion.locationSourceIndex].title;
    } else if (suggestion.sourceType === SearchSourceType.Building) {
      return CustomSearchSources.locationSearchSourceProperties[0].title;
    } else if (suggestion.sourceType === SearchSourceType.Filter) {
      return 'Filters';
    } else if (suggestion.sourceType === SearchSourceType.Space) {
      return 'Spaces';
    } else if (suggestion.sourceType === SearchSourceType.MyLocation) {
      return 'Locations';
    } else {
      return '';
    }
  }

  // Return a promise with search suggestions based on the search term
  public suggest(searchTerm: string): Promise<Array<Suggestion>> {
    let suggestPromises;
    // Prepare suggestion promises from multiple sources
    if (this.locationsOnly) {
      suggestPromises = [
        this._suggestLocations(searchTerm, ['On-campus locations']),
        this._suggestBuildings(searchTerm)
      ];
    } else {
      suggestPromises = [
        this._suggestFilters(searchTerm),
        this._suggestSpaces(searchTerm),
        this._suggestLocations(searchTerm, ['On-campus locations']),
        this._suggestBuildings(searchTerm)
      ];
    }
    // Add off campus locations to the end if needed
    if (!this.onCampusLocationsOnly) {
      suggestPromises.push(
        this._suggestLocations(searchTerm, ['Off-campus locations'])
      );
    }
    // Suggest my location after all other suggestions
    suggestPromises.push(this._suggestMyLocation(searchTerm));

    // Evaluate after all promises have completed
    return Promise.all(suggestPromises).then((allSuggestions) => {
      /*
        Store location suggestions for later to filter out duplicate building
        results.
      */
      const filteredLocationSuggestions = allSuggestions.filter((suggestions) => {
        if (suggestions.length <= 0) {
          return false;
        }
        return suggestions[0].sourceType == SearchSourceType.Location;
      });
      // Use the first set of filtered suggestions
      let locationSuggestions: Array<Suggestion> = [];
      if (filteredLocationSuggestions.length > 0) {
        locationSuggestions = filteredLocationSuggestions[0];
      }

      const finalSuggestions: Array<Suggestion> = [];
      // Go through suggestions from each source
      allSuggestions.forEach((suggestions) => {
        // Go through each suggestion from that source
        suggestions.forEach((suggestion) => {
          /*
            Add building suggestions only if they don't overlap with location
            suggestions.
          */
          if (suggestion.sourceType == SearchSourceType.Building) {
            const duplicateSuggestions = locationSuggestions
              .filter((locationSuggestion) => {
                return locationSuggestion.text === suggestion.text;
              });
            if (duplicateSuggestions.length === 0) {
              finalSuggestions.push(suggestion);
            }
          // Otherwise add the suggestion
          } else {
            finalSuggestions.push(suggestion);
          }
        });
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
      return esriRequest(
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
          throw `Failed to find result for suggestion. (Key ${suggestion.key}). ` +
            'Try a different query.'
        }
      }).catch((error) => {
        throw error;
      });
    // Search for filter or spaces
    } else if (
      suggestion.sourceType === SearchSourceType.Filter ||
      suggestion.sourceType === SearchSourceType.Space
    ) {
      searchResult = {
        name: suggestion.text,
        sourceType: suggestion.sourceType,
        filter: suggestion.filter
      }
      return Promise.resolve(searchResult);
    // Search for buildings
    } else if (suggestion.sourceType == SearchSourceType.Building) {
      searchResult = {
        name: suggestion.text,
        sourceType: suggestion.sourceType,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude
      }
      return Promise.resolve(searchResult);
    // Use my location
    } else if (suggestion.sourceType == SearchSourceType.MyLocation) {
      return myLocation().then((location) => {
        searchResult = {
          name: 'My location',
          sourceType: suggestion.sourceType,
          latitude: location.latitude,
          longitude: location.longitude
        };
        return searchResult;
      });
    } else {
      return Promise.reject(
        `Failed to find result for suggestion (Type ${suggestion.sourceType}). ` +
        'Try a different query.'
      );
    }
  }

  /*
    Return a promise for location suggestions, only pulling locations from
    sources with the given titles.
  */
  private _suggestLocations(
    searchTerm: string, sourceTitles: Array<string>
  ): Promise<Array<Suggestion>> {
    const suggestPromises: Array<IPromise<any>> = [];
    let sources = CustomSearchSources.locationSearchSourceProperties;
    // Filter locations by source title
    sources = sources.filter((source) => {
      let titleInSources = false;
      sourceTitles.forEach((title) => {
        if (title === source.title) {
          titleInSources = true;
        }
      })
      return titleInSources;
    });
    // Create a promise for each locator service
    sources.forEach((source) => {
      suggestPromises.push(esriRequest(
        source.url + '/suggest',
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
    });
    // Resolve all promises with their results as an array in order
    return Promise.all(suggestPromises).then((responses) => {
      const suggestions: Array<Suggestion> = [];
      // Iterate over each set of suggestions obtained from a suggest promise
      responses.forEach((response, responseIndex) => {
        let sourceIndex = -1;
        /*
          Find the source index based on the response index. This is neccessary
          because we filter out some sources, so response and source index
          are not the same.
        */
        CustomSearchSources.locationSearchSourceProperties.forEach((properties, propertiesIndex) => {
          if (properties.title == sources[responseIndex].title) {
            sourceIndex = propertiesIndex;
          }
        });
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

  /*
    Return similar results to suggest locations except we are only querying
    buildings. This is so we can search by building name by text in the
    middle of the name.
  */
  private _suggestBuildings(searchTerm: string): Promise<Array<Suggestion>> {
    const layer = this.view.map.layers.find((layer) => {
      return layer.title === 'Campus Buildings';
    }) as FeatureLayer;
    const query = layer.createQuery();
    query.where = `Building_Name like '%${escapeQueryParam(searchTerm)}%'`;
    query.outSpatialReference = new SpatialReference({wkid: 4326});
    query.num = 5;

    return layer.queryFeatures(query)
      .then((response: any) => {
        const suggestions: Array<Suggestion> = [];
        response.features.forEach((feature: Graphic) => {
          const point = featurePoint(feature);
          const suggestion = {
            text: feature.attributes.Building_Name,
            sourceType: SearchSourceType.Building,
            latitude: point.latitude,
            longitude: point.longitude
          };
          suggestions.push(suggestion);
        });
        return suggestions;
      }).catch((error: string) => {
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

  private _suggestMyLocation(searchTerm: string): Promise<Array<Suggestion>> {
    const suggestions = [];
    if (searchTermMatchesTags(searchTerm, ['my', 'me'])) {
      suggestions.push({
        text: 'My location',
        key: 'my-location',
        sourceType: SearchSourceType.MyLocation
      });
    }
    return Promise.resolve(suggestions);
  }

  // Return a promise for space suggestions
  private _suggestSpaces(searchTerm: string): Promise<Array<Suggestion>> {
    const layer = this.view.map.layers.find((layer) => {
      return layer.title === 'Spaces';
    }) as FeatureLayer;
    const query = layer.createQuery();
    query.where = `ParkingSpaceClientPublic like '%${escapeQueryParam(searchTerm)}%'`;

    return layer.queryFeatures(query)
      .then((response: any) => {
        const foundClients: Array<string> = [];
        const maxResults = 5;
        const suggestions: Array<Suggestion> = [];
        // Go through each space returned
        response.features.forEach((feature: Graphic) => {
          const client = feature.attributes.ParkingSpaceClientPublic;
          if (suggestions.length >= maxResults) {
            return;
          }
          // Filter out duplicate space clients
          if (
            foundClients
              .filter((eachClient) => eachClient === client).length > 0
          ) {
            return;
          }
          foundClients.push(client);
          // Create a filter for spaces with this client
          const target = response.features.filter((graphic: Graphic) => {
            return graphic.attributes.ParkingSpaceClientPublic === client;
          });
          const filter = {
            name: `${client} Spaces`,
            description: `${target.length} space${target.length === 1 ? '' : 's'} reserved for ${client}.`,
            visible: true,
            showInFilterList: false,
            clauses: [
              {
                layerName: 'Spaces',
                clause: `ParkingSpaceClientPublic = '${escapeQueryParam(client)}'`
              },
              {layerName: 'Sections', clause: '0 = 1'}
            ],
            target: target
          };
          // Add the suggestion
          suggestions.push({
            text: `${client} Spaces`,
            key: String(feature.getObjectId()),
            sourceType: SearchSourceType.Space,
            filter: filter
          });
        });
        return suggestions;
      }).catch((error: string) => {
        throw error;
      });
  }
}

// Export custom search sources so it can be imported and used in other files
export = CustomSearchSources;
