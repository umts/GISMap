import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import esriRequest = require("esri/request");
import Search = require("esri/widgets/Search");
import LocatorSearchSource = require("esri/widgets/Search/LocatorSearchSource");
import Widget = require("esri/widgets/Widget");

// Everything needed to store what a user has searched
interface SearchResult {
  latitude: number;
  longitude: number;
  name: string;
}

// Everything needed to store a suggestion for future search
interface Suggestion {
  key: string;
  sourceIndex: number;
  text: string;
}

@subclass("esri.widgets.CustomSearch")
class CustomSearch extends declared(Widget) {
  // The search widget that this widget wraps
  @property()
  @renderable()
  search: Search;

  // Name used to uniquely identify elements
  @property()
  @renderable()
  name: string;

  // Placeholder text for the input
  @property()
  @renderable()
  placeholder: string;

  // Array of suggesions based on text already typed in
  @property()
  @renderable()
  suggestions: Array<Suggestion>;

  // Whether or not to show the suggestions
  @property()
  @renderable()
  showSuggestions: boolean;

  // The single search result returned from the geolocator services
  @property()
  searchResult: SearchResult;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.suggestions = [];
    this.showSuggestions = false;
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    /*
      Render suggestions assuming suggestions from the same source are
      consecutive.
    */
    let suggestionElements = [];
    let visitedSources = [];
    if (this.showSuggestions) {
      for (let i = 0; i < this.suggestions.length; i += 1) {
        // Push a source header if the suggestions are from a new source
        if (visitedSources.indexOf(this.suggestions[i].sourceIndex) === -1) {
          visitedSources.push(this.suggestions[i].sourceIndex);
          suggestionElements.push(
            <div
              class='custom-search-header suggestion-item'
              key={`${this.suggestions[i].key}-header`}>
              {this.search.sources.getItemAt(this.suggestions[i].sourceIndex).name}
            </div>
          );
        }
        // Push a new suggestion
        suggestionElements.push(
          <div
            bind={this}
            class='custom-search-suggestion suggestion-item'
            data-index={`${i}`}
            key={this.suggestions[i].key}
            onclick={this._suggestionClicked}>
            {this.suggestions[i].text}
          </div>
        );
      }
    }

    return (
      <div
        bind={this}
        onfocus={this._showSuggestions}
        onblur={this._hideSuggestions}
        tabindex="-1">
        <input
          bind={this}
          class='esri-input custom-search'
          id={this.name}
          oninput={this._setSuggestions}
          onfocus={this._showSuggestions}
          onblur={this._hideSuggestions}
          placeholder={this.placeholder}
          type='text'>
        </input>
        <div class='custom-search-container'>
          <div class='custom-search-pane'>
            {suggestionElements}
          </div>
        </div>
      </div>
    );
  }

  // Return the latitude and longitude as a comma seaparated string
  latitudeLongitude(): string {
    if (!(this.searchResult)) {
      return null;
    }
    return `${this.searchResult.latitude},${this.searchResult.longitude}`;
  }

  /*
    Called when a suggestion term is clicked.
    It will search the geolocator services for the exact suggestion.
  */
  private _setSearch(suggestion: Suggestion) {
    // Determine which locator we should look in for the suggestion
    const locator = (this.search.sources.getItemAt(
      Number(suggestion.sourceIndex)
    ) as LocatorSearchSource).locator;
    /*
      Build our own request to the API so we can explicitly request the same
      output spatial reference to be in latitude and longitude.
      Otherwise different locators return coordinates in different spatial
      references depending on the location.
    */
    esriRequest(locator.url + "/findAddressCandidates",
      {
        query: {
          magicKey: suggestion.key,
          f: "json",
          maxLocations: 1,
          outSR: '{"wkid":4326}'
        }
      }
    ).then((response) => {
      if (response.data.candidates.length > 0) {
        const topResult = response.data.candidates[0];
        // Set the internal search result
        this.searchResult = {
          latitude: topResult.location.y,
          longitude: topResult.location.x,
          name: topResult.address
        };
        // Set the search input text to the name of the search result
        (document.getElementById(this.name) as HTMLInputElement)
          .value = this.searchResult.name;
      } else {
        console.error(`Could not find search result for suggestion
          with magicKey ${suggestion.key}`);
      }
      this._hideSuggestions();
    });
  }

  // Update suggestions based on the most recent input
  private _setSuggestions() {
    const inputValue = this._inputElement().value;
    // Reset the last search result if the user is typing something different
    if (this.searchResult && inputValue !== this.searchResult.name) {
      this.searchResult = null;
    }
    // Reset previous suggestions
    this.suggestions = [];
    if (inputValue === '') {
      return;
    }
    // Find new suggestions
    this.search.suggest(inputValue).then((response) => {
      // Iterate over each source
      for (let i = 0; i < response.results.length; i += 1) {
        // Iterate over each result from that source
        for (let j = 0; j < response.results[i].results.length; j += 1) {
          this.suggestions.push(response.results[i].results[j]);
        }
      }
      this._showSuggestions();
    });
  }

  // Called when a suggestion is clicked
  private _suggestionClicked(event: any) {
    this._setSearch(this.suggestions[event.target.dataset.index]);
  }

  private _showSuggestions() {
    this.showSuggestions = true;
  }

  private _hideSuggestions() {
    this.showSuggestions = false;
  }

  // Get this input element
  private _inputElement(): HTMLInputElement {
    return (document.getElementById(this.name) as HTMLInputElement);
  }
}

/*
  Set the custom search widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomSearch;
