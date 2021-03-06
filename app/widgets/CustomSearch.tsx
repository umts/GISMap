import { subclass, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Point = require('esri/geometry/Point');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { clickOnSpaceOrEnter } from 'app/events';
import { myLocation } from 'app/latLong';
import { iconButton } from 'app/rendering';
import { SearchSourceType, SearchResult, Suggestion } from 'app/search';
import CustomSearchSources = require('app/CustomSearchSources');
import RequestSet = require('app/RequestSet');
import CustomFilter = require('app/widgets/CustomFilter');
import CustomPopup = require('app/widgets/CustomPopup');
import { Marker } from 'app/widgets/Markers'

@subclass('esri.widgets.CustomSearch')
class CustomSearch extends Widget {
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

  // Popup to open when searching using the main search
  @property()
  private readonly popup: CustomPopup;

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

  // The error message to display when error is true
  @property()
  @renderable()
  private errorMessage: string;

  // The warning to show related to the search input
  @property()
  @renderable()
  private warning: string;

  // Name used to uniquely identify elements
  @property()
  public readonly name: string;

  // The single search result returned from the geolocator services
  @property()
  @renderable()
  public searchResult: SearchResult;

  // Markers sets the marker for each search
  @property()
  public marker: Marker;

  // True if this search should return on campus locations only
  @property()
  @renderable()
  public onCampusLocationsOnly: boolean;

  public constructor(params?: {
    view: MapView,
    name: string,
    placeholder: string,
    customFilter?: CustomFilter,
    required?: boolean,
    mainSearch?: boolean,
    popup?: CustomPopup,
    onCampusLocationsOnly?: boolean,
  }) {
    super();
    // Assign constructor params
    this.set(params);

    this.suggestions = [];
    this.suggestionRequestSet = new RequestSet();
    this.showSuggestions = false;
    this.required = params.required || false;
    this.mainSearch = params.mainSearch || false;
    this.warning = '';
    this.sources = new CustomSearchSources({
      view: params.view,
      locationsOnly: !params.mainSearch,
      onCampusLocationsOnly: params.onCampusLocationsOnly,
    });

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

  // Run after this widget is ready
  public postInitialize(): void {
    // Need to update on campus locations for the sources
    this.watch('onCampusLocationsOnly', (onCampusLocationsOnly) => {
      this.sources.onCampusLocationsOnly = onCampusLocationsOnly;
    });
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): tsx.JSX.Element {
    /*
      Render suggestions assuming suggestions from the same source are
      consecutive.
    */
    const suggestionElements: Array<tsx.JSX.Element> = [];
    const visitedSources: Array<string> = [];
    if (this.showSuggestions) {
      this.suggestions.forEach((suggestion, i) => {
        // No headers for the main search
        if (!this.mainSearch) {
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
      // Push error message
      } else if (this.error) {
        let errorMessage = 'Error loading suggestions. Please try again later.';
        if (this.errorMessage) {
          errorMessage = this.errorMessage;
        }
        suggestionElements.push(
          <div
            class='custom-search-header suggestion-item'
            key='error-header'
            role='heading'>
            {errorMessage}
          </div>
        );
      // Push no results text
      } else if (
        this.suggestions.length === 0 &&
        this._inputElement().value !== ''
      ) {
        suggestionElements.push(
          <div
            class='custom-search-header suggestion-item'
            key='no-results-header'
            role='heading'>
            No Results.
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

    let locateButton;
    if (!this.mainSearch) {
      locateButton = iconButton({
        object: this,
        onclick: this.setMyLocation,
        name: 'Use my location',
        iconName: 'locate',
        classes: ['button-input']
      })
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
        {locateButton}
        {submitButton}
      </div>
    );

    let mainElement;
    if (this.mainSearch) {
      mainElement = (
        <form bind={this} onsubmit={this._submitSearch}>
          {input}
        </form>
      );
    } else {
      // Draggable marker icon if there is a marker for this search
      let marker;
      if (this.marker) {
        marker = <div
          bind={this}
          class='marker-mini'
          style={`background-color: ${this.marker.color};`}
          draggable='true'
          ondragstart={this._startDrag}>
          <div class='marker-mini-circle'></div>
        </div>;
      }
      mainElement = (
        <div class='shelf space-between'>
          {marker}
          {input}
        </div>
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

  // Set the search result directly without using a suggestion
  public setSearchExplicit(searchResult: SearchResult): void {
    this.searchResult = searchResult;
    // Display the marker for this search over results with a latitude/longitude
    if (searchResult.latitude && searchResult.longitude && this.marker) {
      this.marker.point = new Point({
        latitude: searchResult.latitude,
        longitude: searchResult.longitude
      });
      this.marker.visible = true;
    }
    // Set the search input text to the name of the search result
    (document.getElementById(this.name) as HTMLInputElement)
      .value = this.searchResult.name;
    this._hideSuggestions();
    this._hideWarning();
    // When this is the main search bar submit when a suggestion is selected
    if (this.mainSearch) {
      this._submitSearch();
    }
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

  // Set the search result to my location
  public setMyLocation(): void {
    myLocation().then((location) => {
      this.setSearchExplicit({
        name: 'My location',
        sourceType: SearchSourceType.MyLocation,
        latitude: location.latitude,
        longitude: location.longitude
      });
      return;
    }).catch((error) => {
      console.error(error);
      this.showWarning(error);
    });
  }

  // Store the id of this search in the drag event
  private _startDrag(event: any): void {
    event.dataTransfer.setData('search-id', this.name);
  }

  // Hide the validation warning
  private _hideWarning(): void {
    this.warning = '';
  }

  // Called when the main search is submitted
  private _submitSearch(): boolean {
    if (this.searchResult) {
      if (
        this.searchResult.sourceType === SearchSourceType.Location ||
        this.searchResult.sourceType === SearchSourceType.Building ||
        this.searchResult.sourceType === SearchSourceType.MyLocation
      ) {
        // Open and go to a generic popup for this result
        this.popup.openFromGeneric(
          this.searchResult.name,
          this.searchResult.latitude,
          this.searchResult.longitude
        )
        this._hideSuggestions();
      } else if (
        this.searchResult.sourceType === SearchSourceType.Filter ||
        this.searchResult.sourceType === SearchSourceType.Space
      ) {
        // Filter by a filter or space result
        this.customFilter.filter = this.searchResult.filter;
      }
    // No search result, so use the first suggestion
    } else {
      if (this.suggestions.length > 0) {
        this._setSearch(this.suggestions[0]);
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
    this.errorMessage = '';
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
      this.setSearchExplicit(searchResult);
      return;
    }).catch((error) => {
      console.error(error);
      this._clearSearch();
      this.error = true;
      this.errorMessage = error;
    });
  }

  // Completely clear the search bar
  private _clearSearch(): void {
    this.searchResult = null;
    this.suggestions = [];
    this._inputElement().value = '';
    this._inputElement().focus();
    // Hide marker if it was visible
    if (this.marker) {
      this.marker.visible = false;
    }
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
