import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Graphic = require('esri/Graphic');
import Point = require('esri/geometry/Point');
import SpatialReference = require('esri/geometry/SpatialReference');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import SimpleLineSymbol = require('esri/symbols/SimpleLineSymbol');
import FeatureSet = require('esri/tasks/support/FeatureSet');
import RouteParameters = require('esri/tasks/support/RouteParameters');
import RouteResult = require('esri/tasks/support/RouteResult');
import RouteTask = require('esri/tasks/RouteTask');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { clickOnSpaceOrEnter } from 'app/events';
import {
  goToSmart,
  imperialDistance,
  featureTitle,
  featurePoint
} from 'app/rendering';
import { SearchSourceType } from 'app/search';

import CustomSearch = require('app/widgets/CustomSearch');

@subclass('esri.widgets.CustomPedestrianDirections')
class CustomPedestrianDirections extends declared(Widget) {
  // The route task to use to query for routes
  private static routeTask = new RouteTask({
    url: 'https://maps.umass.edu/arcgis/rest/services/Research/CampusPedestrianNetwork/NAServer/Route'
  });

  @property()
  private readonly view: MapView;

  // Custom search widget for the starting location
  @property()
  private readonly startSearch: CustomSearch;

  // Custom search widget for the ending location
  @property()
  private readonly endSearch: CustomSearch;

  // The result of querying using a route task. Contains directions.
  @property()
  @renderable()
  private routeResult: RouteResult;

  // Which direction is currently selected both in the menu and on the map
  private directionIndex: number;

  // Generic error message to display
  @property()
  @renderable()
  private error: string;

  // Pass in any properties
  public constructor(properties?: {
    view: MapView,
    searches: Array<CustomSearch>
  }) {
    super();
    this.startSearch = properties.searches.filter((search) => {
      return search.name === 'pedestrian-directions-origin';
    })[0];
    this.endSearch = properties.searches.filter((search) => {
      return search.name === 'pedestrian-directions-destination';
    })[0];
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    let directionsElement;
    if (this.routeResult && this.routeResult.directions) {
      const directions: Array<JSX.Element> = [];
      this.routeResult.directions.features.forEach((graphic, i) => {
        directions.push(this._renderDirection(graphic, i));
      })
      directionsElement = (
        <div class='directions-list'>
          <h2 bind={this} class='directions-header' onclick={this._clickHeader}>
            {this.routeResult.directions.routeName}
          </h2>
          <div class='spaced-row'>
            <p>
              {imperialDistance(this.routeResult.directions.totalLength)}
            </p>
            <button
              aria-label='Clear directions'
              bind={this}
              class='umass-theme-button'
              onclick={this._reset}>
              Clear
            </button>
          </div>
          <div role='list'>
            {directions}
          </div>
        </div>
      );
    }
    let error;
    if (this.error) {
      error = <div class='error' role='alert'>{this.error}</div>;
    }
    return (
      <div class='esri-widget'>
        {error}
        <p>Drag and drop the green and red markers, or start typing a location</p>
        <form>
          {this.startSearch.render()}
          {this.endSearch.render()}
          <div class='form-row'>
            <button
              bind={this}
              class='right umass-theme-button'
              onclick={this._submit}
              type='submit'>
              Go
            </button>
          </div>
        </form>
        {directionsElement}
      </div>
    );
  }

  // Set the destination search to be the given feature
  public setDestination(feature: Graphic): void {
    this.endSearch.setSearchExplicit({
      name: featureTitle(feature),
      sourceType: SearchSourceType.Location,
      latitude: featurePoint(feature).latitude,
      longitude: featurePoint(feature).longitude,
    });
  }

  // Render a direction which is given to us as a graphic by the api
  private _renderDirection(graphic: Graphic, index: number): JSX.Element {
    const classes = ['direction'];
    if (index === this.directionIndex) {
      classes.push('active');
    }
    const distance = imperialDistance(graphic.attributes.length);
    let distanceElement;
    if (distance) {
      distanceElement = (
        <div
          aria-label='Distance'
          class='direction-distance'
          data-index={`${index}`}>
          {distance}
        </div>
      );
    }

    return (
      <div
        bind={this}
        class={classes.join(' ')}
        data-index={`${index}`}
        key={index}
        onclick={this._clickDirection}
        onkeydown={clickOnSpaceOrEnter}
        role='listitem'
        tabindex='0'>
        {graphic.attributes.text}
        {distanceElement}
      </div>
    );
  }

  // Called when a direction is clicked. Move the view to the direction.
  private _clickDirection(event: any): void {
    this.directionIndex = parseInt(event.target.dataset.index);

    const graphic = this.routeResult.directions.features[this.directionIndex].clone();
    graphic.symbol = new SimpleLineSymbol({
      color: '#000000',
      width: '4px'
    });
    goToSmart(this.view, [graphic]);
    const directionsSelectionLayer = this._getLayer('Directions Selection');
    directionsSelectionLayer.removeAll();
    directionsSelectionLayer.add(graphic);
  }

  // See the whole route when the directions list header is clicked
  private _clickHeader(): void {
    if (this.routeResult) {
      this.view.goTo(this.routeResult.route);
    }
  }

  /*
    Intercept the form submit to open a new window to the requested
    directions and return false.
  */
  private _submit(): boolean {
    // Reset the error message
    this.error = null;
    const origin = this.startSearch.latitudeLongitude();
    const destination = this.endSearch.latitudeLongitude();
    if (origin && destination) {
      CustomPedestrianDirections.routeTask.solve(new RouteParameters({
        stops: new FeatureSet({
          features: [
            new Graphic({
              attributes: {
                'Name': this.startSearch.searchResult.name
              },
              geometry: new Point({
                latitude: parseFloat(origin.split(',')[0]),
                longitude: parseFloat(origin.split(',')[1])
              })
            }),
            new Graphic({
              attributes: {
                'Name': this.endSearch.searchResult.name
              },
              geometry: new Point({
                latitude: parseFloat(destination.split(',')[0]),
                longitude: parseFloat(destination.split(',')[1])
              })
            })
          ]
        }),
        directionsLengthUnits: 'feet',
        // Pedestrian route service doesn't support hierarchy
        useHierarchy: false,
        returnDirections: true,
        returnRoutes: true,
        outSpatialReference: new SpatialReference({wkid: 4326})
      })).then((response: any) => {
        this._reset();
        this.routeResult = response.routeResults[0];
        this._applyCurrentRoute();
        return;
      }).catch((error) => {
        this.error = 'Failed to find route. Please try again later.';
        console.error(error);
      });
    } else {
      // Show warnings for blank custom searches
      const warning = 'Please enter a search term and select a suggestion.';
      if (!origin) {
        this.startSearch.showWarning(warning);
      }
      if (!destination) {
        this.endSearch.showWarning(warning);
      }
    }
    return false;
  }

  // Draw the current route result and move the view to it
  private _applyCurrentRoute(): void {
    const graphic = this.routeResult.route;
    graphic.symbol = new SimpleLineSymbol({
      color: '#99ccff',
      width: '6px'
    });
    this._getLayer('Directions').add(graphic);
    this.view.goTo(graphic);
  }

  // Reset the widget back to its initial state
  private _reset(): void {
    this._getLayer('Directions Selection').removeAll();
    this._getLayer('Directions').removeAll();
    this.routeResult = null;
  }

  private _getLayer(name: string): GraphicsLayer {
    return this.view.map.layers.find((layer) => {
      return layer.title === name;
    }) as GraphicsLayer;
  }
}

/*
  Set the custom pedestrian directions widget as the export for this
  file so it can be imported and used in other files.
*/
export = CustomPedestrianDirections;
