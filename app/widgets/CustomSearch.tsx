import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Point = require("esri/geometry/Point");
import webMercatorUtils = require("esri/geometry/support/webMercatorUtils");
import esriRequest = require("esri/request");
import Search = require("esri/widgets/Search");
import LocatorSearchSource = require("esri/widgets/Search/LocatorSearchSource");
import Widget = require("esri/widgets/Widget");

function inputValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value;
}

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
  searchResult: SearchResult;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.suggestions = [];
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let suggestionElements = [];
    for (let i = 0; i < this.suggestions.length; i += 1) {
      suggestionElements.push(
        <div
          bind={this}
          class='custom-search-suggestion'
          data-key={this.suggestions[i].key}
          data-source-index={`${this.suggestions[i].sourceIndex}`}
          key={this.suggestions[i].key}
          onclick={this._setSearch}>
          {this.suggestions[i].text}
        </div>
      );
    }

    return (
      <div>
        <input
          bind={this}
          oninput={this._setSuggestions}
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
    return inputValue(this.name);
  }

  latitudeLongitude(): string {
    if (!(this.searchResult)) {
      return null;
    }
    return `${this.searchResult.latitude},${this.searchResult.longitude}`;
  }

  private _setSearch(event: any) {
    console.log(this.search.sources);
    console.log(event.target.dataset.sourceIndex);
    const locator = (this.search.sources.getItemAt(event.target.dataset.sourceIndex) as LocatorSearchSource).locator;
    
    esriRequest(locator.url + "/findAddressCandidates",
      {
        query: {
          magicKey: event.target.dataset.key,
          f: "json",
          maxLocations: 6,
          outSR: '{"wkid":4326}'
        }
      }
    ).then((response: any) => {
      console.log(response);
      const topResult = response.data.candidates[0];
      this.searchResult = {
        latitude: topResult.location.y,
        longitude: topResult.location.x,
        name: topResult.address
      };
      (document.getElementById(this.name) as HTMLInputElement).value = this.searchResult.name;
      this.suggestions = [];
    });
  }

  private _setSuggestions() {
    // Reset last search if we start typing something different
    if (this.searchResult && inputValue(this.name) !== this.searchResult.name) {
      this.searchResult = null;
    }
    // Reset previous suggestions
    this.suggestions = [];
    if (inputValue(this.name) === '') {
      return;
    }
    // Find new suggestions
    this.search.suggest(inputValue(this.name)).then((response) => {
      console.log(response);
      for (let i = 0; i < response.results.length; i += 1) {
        for (let j = 0; j < response.results[i].results.length; j += 1) {
          this.suggestions.push(response.results[i].results[j]);
        }
      }
    });
  }
}

/*
  Set the custom search widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomSearch;
