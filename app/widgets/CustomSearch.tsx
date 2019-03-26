import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Point = require("esri/geometry/Point");
import webMercatorUtils = require("esri/geometry/support/webMercatorUtils");
import esriRequest = require("esri/request");
import Search = require("esri/widgets/Search");
import LocatorSearchSource = require("esri/widgets/Search/LocatorSearchSource");
import Widget = require("esri/widgets/Widget");

interface SearchResult {
  latitude: number;
  longitude: number;
  name: string;
}

@subclass("esri.widgets.CustomSearch")
class CustomSearch extends declared(Widget) {
  @property()
  @renderable()
  search: Search;

  @property()
  @renderable()
  name: string;

  @property()
  @renderable()
  placeholder: string;

  @property()
  @renderable()
  suggestions: any;

  @property()
  @renderable()
  showSuggestions: boolean;

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
    // Render suggestions
    let suggestionElements = [];
    if (this.showSuggestions) {
      for (let i = 0; i < this.suggestions.length; i += 1) {
        suggestionElements.push(
          <div
            bind={this}
            class='custom-search-suggestion'
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
        tabindex="0">
        <input
          bind={this}
          oninput={this._setSuggestions}
          onfocus={this._showSuggestions}
          onblur={this._hideSuggestions}
          class='esri-input custom-search'
          id={this.name}
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

  searchTerm(): string {
    return this._inputElement().value;
  }

  latitudeLongitude(): string {
    if (!(this.searchResult)) {
      return null;
    }
    return `${this.searchResult.latitude},${this.searchResult.longitude}`;
  }

  // Called when a suggestion term is clicked
  private _setSearch(suggestion: any) {
    console.log(suggestion);
    const locator = (
      this.search.sources.getItemAt(
        Number(suggestion.sourceIndex)
      ) as LocatorSearchSource
    ).locator;
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
        this.searchResult = {
          latitude: topResult.location.y,
          longitude: topResult.location.x,
          name: topResult.address
        };
        (document.getElementById(this.name) as HTMLInputElement).value = this.searchResult.name;
      } else {
        console.error(`Could not find search result for suggestion with magicKey ${suggestion.key}`);
      }
      this._hideSuggestions();
    });
  }

  private _setSuggestions() {
    const inputValue = this._inputElement().value;
    // Reset last search if we start typing something different
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
      for (let i = 0; i < response.results.length; i += 1) {
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
