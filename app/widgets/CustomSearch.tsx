import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { clickOnSpaceOrEnter } from 'app/events';
import { iconButton } from 'app/rendering';
import { SearchSourceType, SearchResult, Suggestion } from 'app/search';
import CustomSearchSources = require('app/CustomSearchSources');
import RequestSet = require('app/RequestSet');
import CustomFilter = require('app/widgets/CustomFilter');

@subclass('esri.widgets.CustomSearch')
class CustomSearch extends declared(Widget) {
  // The main map view
  @property()
  private readonly view: MapView;

  // Name used to uniquely identify elements
  @property()
  private readonly name: string;

  // Placeholder text for the input
  @property()
  private readonly placeholder: string;

  // Keep suggestion request promises in chronological order
  @property()
  private readonly suggestionRequestSet: RequestSet;

  // Many sources operating under one set of functions
  @property()
  private readonly sources: CustomSearchSources;

  // The main filter widget we can apply filters to
  @property()
  private readonly customFilter: CustomFilter;

  // Whether or not this input should be required in a form
  @property()
  private readonly required: boolean;

  // Whether or not this is the main search bar for the entire app
  @property()
  private readonly mainSearch: boolean;

  // Array of suggesions based on text already typed in
  @property()
  @renderable()
  private suggestions: Array<Suggestion>;

  // Whether or not to show the suggestions
  @property()
  @renderable()
  private showSuggestions: boolean;

  // Whether or not we are waiting for the suggestions to load
  @property()
  @renderable()
  private loadingSuggestions: boolean;

  // Whether or not an error has occurred while loading suggestions
  @property()
  @renderable()
  private error: boolean;

  // The warning to show related to the search input
  @property()
  @renderable()
  private warning: string;

  // The single search result returned from the geolocator services
  @property()
  public searchResult: SearchResult;

  // Pass in any properties
  public constructor(properties?: any) {
    super();
    this.suggestions = [];
    this.suggestionRequestSet = new RequestSet();
    this.showSuggestions = false;
    this.required = properties.required || false;
    this.mainSearch = properties.mainSearch || false;
    this.warning = properties.warning || '';
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
  public render(): JSX.Element {
    /*
      Render suggestions assuming suggestions from the same source are
      consecutive.
    */
    const suggestionElements: Array<JSX.Element> = [];
    const visitedSources: Array<string> = [];
    if (this.showSuggestions) {
      this.suggestions.forEach((suggestion, i) => {
        const header = this.sources.suggestionHeader(suggestion);
        // Push a source header if the suggestions are from a new source
        if (visitedSources.indexOf(header) === -1) {
          visitedSources.push(header);
          suggestionElements.push(
            <div
              class='custom-search-header suggestion-item'
              key={`${suggestion.key}-header`}
              role='heading'>
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
            onclick={this._suggestionClicked}
            onkeydown={clickOnSpaceOrEnter}
            role='option'
            tabindex='0'>
            {suggestion.text}
          </div>
        );
      });
      // Push the loading text
      if (this.loadingSuggestions) {
        suggestionElements.push(
          <div
            class='custom-search-header suggestion-item'
            key='loading-header'
            role='heading'>
            Loading...
          </div>
        );
      }
      // Push error text
      if (this.error) {
        suggestionElements.push(
          <div
            class='custom-search-header suggestion-item'
            key='error-header'
            role='heading'>
            Error loading suggestions. Please try again later.
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
      <p class='custom-search-pane-container' style='margin: 0;' role='presentation'>
        <p
          aria-label='Search results'
          class='custom-search-pane'
          style='margin: 0;'
          role='listbox'>
          {suggestionElements}
        </p>
      </p>
    );

    let clearButton;
    if (this._inputElement() && this._inputElement().value) {
      clearButton = iconButton({
        object: this,
        onclick: this._clearSearch,
        name: 'Clear search',
        iconName: 'close',
        classes: ['button-input']
      });
    }

    let submitButton;
    if (this.mainSearch) {
      submitButton = iconButton({
        object: this,
        onclick: this._submitSearch,
        name: 'Search',
        iconName: 'search',
        classes: ['button-input']
      });
    }

    let mainElement;
    const input = (
      <div class='form-row-input'>
        <input
          bind={this}
          class='esri-input'
          id={this.name}
          oninput={this._setSuggestions}
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

    let warningElement;
    if (this.warning) {
      warningElement = (
        <div
          class='validation-warning'
          key={`${this.name}-validation-warning`}
          role='alert'>
          {this.warning}
        </div>
      );
    }

    /*
      Event capturing. Capture a focus or blur event on a child of the
      container using the container.
    */
    const containerElement = document.getElementById(`${this.name}-search-container`);
    if (containerElement) {
      containerElement.addEventListener('blur', this._hideSuggestions, true);
      containerElement.addEventListener('focus', this._showSuggestions, true);
    }

    return (
      <div class='form-row'>
        <div
          aria-label='Search bar'
          bind={this}
          class='custom-search-container'
          id={`${this.name}-search-container`}
          role='search'
          tabindex="-1">
          {mainElement}
          {suggestionContainer}
          {warningElement}
        </div>
      </div>
    );
  }

  // Return the latitude and longitude as a comma seaparated string
  public latitudeLongitude(): string {
    if (!(this.searchResult)) {
      return null;
    }
    return `${this.searchResult.latitude},${this.searchResult.longitude}`;
  }

  // Show the validation warning with the given message
  public showWarning(message: string): void {
    this.warning = message;
  }

  // Hide the validation warning
  private _hideWarning(): void {
    this.warning = '';
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
  private _setSuggestions(): void {
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
    this.error = false;
    this.loadingSuggestions = true;
    // Safely find new suggestions
    this.suggestionRequestSet.setPromise(this.sources.suggest(searchTerm))
      .then((suggestions: Array<Suggestion>) => {
        this.suggestions = suggestions;
        this._showSuggestions();
        this.loadingSuggestions = false;
        return;
      }).catch((error) => {
        console.error(error);
        this.error = true;
      }).finally(() => {
        this.loadingSuggestions = false;
      });
  }

  /*
    Called when a suggestion term is clicked.
    For location suggestions it will search the geolocator services for the
    exact suggestion.
  */
  private _setSearch(suggestion: Suggestion): void {
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
      return;
    }).catch((error) => {
      console.error(error);
      this._clearSearch();
      this.error = true;
    });
  }

  // Completely clear the search bar
  private _clearSearch(): void {
    this.searchResult = null;
    this.suggestions = [];
    this._inputElement().value = '';
    this._inputElement().focus();
  }

  // Called when a suggestion is clicked
  private _suggestionClicked(event: any): void {
    this._setSearch(this.suggestions[event.target.dataset.index]);
  }

  /*
    Show suggestions. Needs to be a lambda function in order to be called
    from addEventListener without using bind.
  */
  private _showSuggestions = () => {
    this.showSuggestions = true;
  }

  /*
    Hide suggestions. Needs to be a lambda function in order to be called
    from addEventListener without using bind.
  */
  private _hideSuggestions = () => {
    this.showSuggestions = false;
    this._inputElement().blur();
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
