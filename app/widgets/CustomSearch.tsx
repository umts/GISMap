import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Search = require('esri/widgets/Search');
import Widget = require('esri/widgets/Widget');

import { SearchResult, Suggestion } from 'app/search';
import CustomSearchSources = require('app/CustomSearchSources');

@subclass("esri.widgets.CustomSearch")
class CustomSearch extends declared(Widget) {
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

  // Many sources operating under one set of functions
  @property()
  sources: CustomSearchSources;

  @property()
  required: boolean;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.sources = new CustomSearchSources();
    this.suggestions = [];
    this.showSuggestions = false;
    this.required = properties.required || false;
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    /*
      Render suggestions assuming suggestions from the same source are
      consecutive.
    */
    let suggestionElements: Array<JSX.Element> = [];
    let visitedSources: Array<string> = [];
    if (this.showSuggestions) {
      this.suggestions.forEach((suggestion, i) => {
        const header = this.sources.suggestionHeader(suggestion);
        // Push a source header if the suggestions are from a new source
        if (visitedSources.indexOf(header) === -1) {
          visitedSources.push(header);
          suggestionElements.push(
            <div
              class='custom-search-header suggestion-item'
              key={`${suggestion.key}-header`}>
              {header}
            </div>
          );
        }
        // Push a new suggestion
        suggestionElements.push(
          <div
            bind={this}
            class='custom-search-suggestion suggestion-item'
            data-index={`${i}`}
            key={suggestion.key}
            onclick={this._suggestionClicked}>
            {suggestion.text}
          </div>
        );
      });
    }

    return (
      <div
        bind={this}
        onfocus={this._showSuggestions}
        onblur={this._hideSuggestions}
        tabindex="-1">
        <input
          bind={this}
          class='esri-input'
          id={this.name}
          oninput={this._setSuggestions}
          onfocus={this._showSuggestions}
          onblur={this._hideSuggestions}
          placeholder={this.placeholder}
          type='text'
          required={this.required} />
        <div class='custom-search-container'>
          <div class='custom-search-pane'>
            {suggestionElements}
          </div>
        </div>
        <div id={`${this.name}-validation-warning`} class="validation-warning hide">
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

  // Show the validation warning with the given message
  showWarning(message: string) {
    this._warningElement().innerHTML = message;
    this._warningElement().classList.remove("hide");
  }

  // Hide the validation warning
  private _hideWarning() {
    this._warningElement().classList.add("hide");
  }

  // Update suggestions based on the most recent input
  private _setSuggestions() {
    const searchTerm = this._inputElement().value.trim();
    // Reset the last search result if the user is typing something different
    if (this.searchResult && searchTerm !== this.searchResult.name) {
      this.searchResult = null;
    }
    // Reset previous suggestions
    this.suggestions = [];
    if (searchTerm === '') {
      return;
    }
    // Find new suggestions
    this.sources.suggest(searchTerm).then((suggestions) => {
      this.suggestions = suggestions;
      this._showSuggestions();
    }).catch((error) => {
      console.log(error);
    });
  }

  /*
    Called when a suggestion term is clicked.
    It will search the geolocator services for the exact suggestion.
  */
  private _setSearch(suggestion: Suggestion) {
    this.sources.search(suggestion).then((searchResult) => {
      this.searchResult = searchResult;
      // Set the search input text to the name of the search result
      (document.getElementById(this.name) as HTMLInputElement)
        .value = this.searchResult.name;
      this._hideSuggestions();
      this._hideWarning();
    }).catch((error) => {
      console.error(error);
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

  // Get this warning element
  private _warningElement(): HTMLElement {
    return (document.getElementById(`${this.name}-validation-warning`) as HTMLElement);
  }
}

/*
  Set the custom search widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomSearch;
