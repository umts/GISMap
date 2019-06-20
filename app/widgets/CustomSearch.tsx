import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import MapView = require('esri/views/MapView');
import Search = require('esri/widgets/Search');
import Widget = require('esri/widgets/Widget');

import { SearchSourceType, SearchResult, Suggestion } from 'app/search';
import CustomSearchSources = require('app/CustomSearchSources');
import RequestSet = require('app/RequestSet');
import CustomFilter = require('app/widgets/CustomFilter');

@subclass('esri.widgets.CustomSearch')
class CustomSearch extends declared(Widget) {
  // The main map view
  @property()
  @renderable()
  view: MapView;

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

  // Keep suggestion request promises in chronological order
  @property()
  suggestionRequestSet: RequestSet;

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

  // The main filter widget we can apply filters to
  @property()
  customFilter: CustomFilter;

  // Whether or not this input should be required in a form
  @property()
  required: boolean;

  // Whether or not this is the main search bar for the entire app
  @property()
  mainSearch: boolean;

  // Whether or not we are waiting for the suggestions to load
  @property()
  @renderable()
  loadingSuggestions: boolean;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.suggestions = [];
    this.suggestionRequestSet = new RequestSet();
    this.showSuggestions = false;
    this.required = properties.required || false;
    this.mainSearch = properties.mainSearch || false;
    this.sources = new CustomSearchSources({locationsOnly: !properties.mainSearch});

    // Hide suggestions when the escape key is pressed
    window.addEventListener('keydown', (event) => {
      // Do nothing if the event was already processed or the input is not visible
      if (event.defaultPrevented || !this._inputElement()) {
        return;
      }
      // Regular people use `key`, IE uses `keyCode`
      if (event.key === 'Escape' || event.keyCode === 27) {
        this._hideSuggestions();
      }
    });
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
      // Push the loading text
      if (this.loadingSuggestions) {
        suggestionElements.push(
          <div
            class='custom-search-header suggestion-item'
            key='loading-header'>
            Loading...
          </div>
        );
      }
    }

    /*
      This is bad. For some reason IE does not propagate focus events from
      child divs to parent divs unless the elements in between are NOT divs.
      That is why we are using p tags here and not div tags.
      https://stackoverflow.com/a/25953721/674863
    */
    const suggestionContainer = (
      <p class='custom-search-pane-container' style='margin: 0;'>
        <p class='custom-search-pane' style='margin: 0;'>
          {suggestionElements}
        </p>
      </p>
    );

    let clearButton;
    if (this._inputElement() && this._inputElement().value) {
      clearButton = (
        <div
          bind={this}
          class='esri-widget esri-widget--button button-input'
          onclick={this._clearSearch}
          tabindex='0'
          title='Clear search'>
          <span class='esri-icon esri-icon-close'></span>
        </div>
      );
    }

    let submitButton;
    if (this.mainSearch) {
      submitButton = (
        <div
          bind={this}
          class='esri-widget esri-widget--button button-input'
          onclick={this._submitSearch}
          tabindex='0'
          title='Search'>
          <span class='esri-icon esri-icon-search'></span>
        </div>
      );
    }

    let mainElement;
    const input = (
      <div class='form-row-input'>
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
        {clearButton}
        {submitButton}
      </div>
    );
    mainElement = input;
    if (this.mainSearch) {
      mainElement = (
        <form bind={this} onsubmit={this._submitSearch}>
          {input}
        </form>
      );
    }

    return (
      <div class='form-row'>
        <div
          bind={this}
          class='custom-search-container'
          onfocus={this._showSuggestions}
          onblur={this._hideSuggestions}
          tabindex="-1">
          {mainElement}
          {suggestionContainer}
          <div id={`${this.name}-validation-warning`} class="validation-warning hide">
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

  // Show the validation warning with the given message
  showWarning(message: string) {
    this._warningElement().innerHTML = message;
    this._warningElement().classList.remove("hide");
  }

  // Hide the validation warning
  private _hideWarning() {
    this._warningElement().classList.add("hide");
  }

  // Called when the main search is submitted
  private _submitSearch(): boolean {
    if (this.searchResult) {
      if (this.searchResult.sourceType === SearchSourceType.Location) {
        // Go to a location result
        this.view.goTo({
          target: [this.searchResult.longitude, this.searchResult.latitude],
          zoom: 18
        });
        this._hideSuggestions();
      } else if (this.searchResult.sourceType === SearchSourceType.Filter) {
        // Filter by a filter result
        this.customFilter.filter = this.searchResult.filter;
      }
    // No search result, so use the first suggestion
    } else {
      for (let i = 0; i < this.suggestions.length; i += 1) {
        const suggestion = this.suggestions[i];
        if (suggestion.sourceType === SearchSourceType.Location) {
          this._setSearch(suggestion);
          break;
        }
      }
    }
    // Don't submit the form
    return false;
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
    this.loadingSuggestions = true;
    // Safely find new suggestions
    this.suggestionRequestSet.setPromise(this.sources.suggest(searchTerm))
      .then((suggestions: Array<Suggestion>) => {
        this.suggestions = suggestions;
        this._showSuggestions();
        this.loadingSuggestions = false;
      }, (error: string) => {
        console.log(error);
        this.loadingSuggestions = false;
      }
    );
  }

  /*
    Called when a suggestion term is clicked.
    For location suggestions it will search the geolocator services for the
    exact suggestion.
  */
  private _setSearch(suggestion: Suggestion) {
    this.sources.search(suggestion).then((searchResult) => {
      this.searchResult = searchResult;
      // Set the search input text to the name of the search result
      (document.getElementById(this.name) as HTMLInputElement)
        .value = this.searchResult.name;
      this._hideSuggestions();
      this._hideWarning();
      // When this is the main search bar submit when a suggestion is selected
      if (this.mainSearch) {
        this._submitSearch();
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  // Completely clear the search bar
  private _clearSearch() {
    this.searchResult = null;
    this.suggestions = [];
    this._inputElement().value = '';
    this._inputElement().focus();
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
    this._inputElement().blur();
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
