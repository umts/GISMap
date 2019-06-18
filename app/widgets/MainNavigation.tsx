import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import WebMap = require('esri/WebMap');
import Point = require('esri/geometry/Point');
import Polygon = require('esri/geometry/Polygon');
import FeatureLayer = require('esri/layers/FeatureLayer');
import MapView = require("esri/views/MapView");
import Compass = require("esri/widgets/Compass");
import Home = require("esri/widgets/Home");
import LayerList = require("esri/widgets/LayerList");
import Locate = require("esri/widgets/Locate");
import Widget = require("esri/widgets/Widget");

import CustomFilter = require('app/widgets/CustomFilter');
import CustomSearch = require('app/widgets/CustomSearch');
import CustomPopup = require('app/widgets/CustomPopup');
import CustomWindow = require("app/widgets/CustomWindow");
import { CustomZoom } from "app/widgets/CustomZoom";
import WindowExpand = require("app/widgets/WindowExpand");

import { resetUrlTimer } from 'app/url';

interface ScreenPoint {
  x: number;
  y: number;
}

@subclass("esri.widgets.MainNavigation")
class MainNavigation extends declared(Widget) {
  // The main map view
  @property()
  @renderable()
  view: MapView;

  // Compass widget
  @property()
  @renderable()
  compass: Compass;

  // Single popup for the whole app
  @property()
  @renderable()
  popup: CustomPopup;

  // Directions expand widget
  @property()
  @renderable()
  directionsExpand: WindowExpand;

  // Home widget
  @property()
  @renderable()
  home: Home;

  // Layers expand widget
  @property()
  @renderable()
  layersExpand: WindowExpand;

  // Locate widget
  @property()
  @renderable()
  locate: Locate;

  // Zoom in widget
  @property()
  @renderable()
  zoomIn: CustomZoom;

  // Zoom out widget
  @property()
  @renderable()
  zoomOut: CustomZoom;

  // Search widget
  @property()
  @renderable()
  search: CustomSearch;

  // Filter widget
  @property()
  @renderable()
  customFilter: CustomFilter;

  // Share expand widget
  @property()
  @renderable()
  shareExpand: WindowExpand;

  // Custom windows that start hidden and can be opened by window expands
  @property()
  @renderable()
  customWindows: Array<CustomWindow>;

  /*
    Pass in properties like widgets as `any` type which will then be cast to
    their correct types.
  */
  constructor(properties?: any) {
    super();
  }

  // Run after this widget is ready
  postInitialize() {
    // Set up popup and popup event listener
    this.popup = new CustomPopup({view: this.view});
    this.view.on('click', (event) => { this._updatePopup(event) });
    this.popup.watch('featureForUrl', (featureForUrl) => {
      resetUrlTimer(this);
    });
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let renderedWindows: Array<JSX.Element> = [];
    /*
      Render each custom window into an array.
      Only one window will be visible at a time.
    */
    this.customWindows.forEach((window) => {
      renderedWindows.push(window.render());
    });

    return (
      <div id="main-navigation">
        <div id="main-navigation-window" class="navigation-window">
          {this.search.render()}

          <div id="widgets-list">
            <ul>
              <li class="widget-list-item">{this.zoomIn.render()}</li>
              <li class="widget-list-item">{this.zoomOut.render()}</li>
              <li class="widget-list-item">{this.compass.render()}</li>
              <li class="widget-list-item">{this.home.render()}</li>
              <li class="widget-list-item">{this.locate.render()}</li>
              <li class="widget-list-item">{this.layersExpand.render()}</li>
              <li class="widget-list-item">{this.directionsExpand.render()}</li>
              <li class="widget-list-item">{this.shareExpand.render()}</li>
            </ul>
          </div>
        </div>
        {this.customFilter.render()}
        {renderedWindows}
        {this.popup.render()}
      </div>
    );
  }

  private _element(): HTMLElement {
    return document.getElementById('main-navigation');
  }

  // Return a feature layer by title
  private _getLayer(name: string): FeatureLayer {
    return (this.view.map as WebMap).layers.find((layer) => {
      return layer.title === name;
    }) as FeatureLayer;
  }

  // Update the popup widget based on a mouse click event
  private _updatePopup(event: any) {
    // Reset popup variables
    this.popup.reset();
    this.popup.point = event.mapPoint;

    const queryGeometry = this._circleAt(event.screenPoint);

    [
      this._getLayer('Sections'),
      this._getLayer('Campus Buildings'),
      this._getLayer('Spaces')
    ].forEach((layer) => {
      let query = layer.createQuery();
      /*
        Query features that intersect the circle around the point from
        the click event.
      */
      query.geometry = queryGeometry;
      query.spatialRelationship = 'intersects';

      layer.queryFeatures(query)
      .then((results) => {
        if (results.features.length > 0) {
          // Add more features to the popup
          this.popup.features = this.popup.features.concat(results.features);
          this.popup.visible = true;
        }
      }, (error) => {
        console.error(error);
      });
    });
  }

  /*
    Generate a 'circle' in latitude/longitude given a point on the screen in
    pixels.
  */
  private _circleAt(screenPoint: ScreenPoint): Polygon {
    const delta = 16;
    const screenVertices: Array<ScreenPoint> = [
      {x: screenPoint.x - delta, y: screenPoint.y - delta},
      {x: screenPoint.x + delta, y: screenPoint.y - delta},
      {x: screenPoint.x + delta, y: screenPoint.y + delta},
      {x: screenPoint.x - delta, y: screenPoint.y + delta}
    ]

    const mapVertices = screenVertices.map((screenPoint) => {
      const mapPoint = this.view.toMap(screenPoint);
      /*
        Explicitly grab lat/lon or else the polygon will try to convert back
        to the MA spatial reference.
      */
      return [mapPoint.longitude, mapPoint.latitude];
    });
    let circle = new Polygon();
    // Polygon ring requires the final point to be the same as the first
    circle.addRing(mapVertices.concat([mapVertices[0]]));
    return circle;
  }
}

/*
  Set the main navigation widget as the export for this file so it can be
  imported and used in other files.
*/
export = MainNavigation;
