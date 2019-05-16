import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import WebMap = require('esri/WebMap');
import watchUtils = require('esri/core/watchUtils');
import Polygon = require('esri/geometry/Polygon');
import Point = require('esri/geometry/Point');
import FeatureLayer = require('esri/layers/FeatureLayer');
import MapView = require("esri/views/MapView");
import Compass = require("esri/widgets/Compass");
import Home = require("esri/widgets/Home");
import LayerList = require("esri/widgets/LayerList");
import Locate = require("esri/widgets/Locate");
import Search = require("esri/widgets/Search");
import Widget = require("esri/widgets/Widget");
import Query = require('esri/tasks/support/Query');

import CustomPopup = require('app/widgets/CustomPopup');
import CustomWindow = require("app/widgets/CustomWindow");
import { CustomZoom } from "app/widgets/CustomZoom";
import WindowExpand = require("app/widgets/WindowExpand");

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
  search: Search;

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

  postInitialize() {
    this.popup = new CustomPopup({view: this.view});
    this.view.on('click', (event) => { this._updatePopup(event) });
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let renderedWindows = [];
    /*
      Render each custom window into an array.
      Only one window will be visible at a time.
    */
    let noWindowsVisible = true;
    for (let i = 0; i < this.customWindows.length; i += 1) {
      if (this.customWindows[i].isVisible()) {
        noWindowsVisible = false;
      }
      renderedWindows.push(this.customWindows[i].render());
    }
    /*
      If no windows are visible reset the height, something that rendering
      a window would normally do.
    */
    if (noWindowsVisible && this._element()) {
      this._element().style.height = '';
    }

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
        {renderedWindows}
        {this.popup.render()}
      </div>
    );
  }

  private _element(): HTMLElement {
    return document.getElementById('main-navigation');
  }

  private _getLayer(name: string): FeatureLayer {
    return (this.view.map as WebMap).layers.find((layer) => {
      return layer.title === name;
    }) as FeatureLayer;
  }

  private _updatePopup(event: any) {
    this.popup.visible = false;
    this.popup.point = event.mapPoint;
    this.popup.features = [];
    this.popup.page = 0;

    [
      this._getLayer('Sections'),
      this._getLayer('Campus Buildings'),
      this._getLayer('Spaces')
    ].forEach((layer) => {
      let query = layer.createQuery();
      // Query features that intersect the point from the click event
      query.geometry = this._circleAt(event.mapPoint);
      //query.geometry = new Point({latitude: event.mapPoint.latitude, longitude: event.mapPoint.longitude});
      query.spatialRelationship = 'intersects';

      layer.queryFeatures(query)
      .then((results) => {
        if (results.features.length > 0) {
          this.popup.features = this.popup.features.concat(results.features);
          this.popup.visible = true;
        }
      }, (error) => {
        console.error(error);
      });
    });
  }

  private _circleAt(screenPoint: Point): Polygon {
    const delta = [0.00003, 0.00003];
    return new Polygon({
      rings: [
        [
          [screenPoint.longitude - delta[1], screenPoint.latitude - delta[0]],
          [screenPoint.longitude + delta[1], screenPoint.latitude - delta[0]],
          [screenPoint.longitude + delta[1], screenPoint.latitude + delta[0]],
          [screenPoint.longitude - delta[1], screenPoint.latitude + delta[0]],
          [screenPoint.longitude - delta[1], screenPoint.latitude - delta[0]]
        ]
      ]
    });
  }
}

/*
  Set the main navigation widget as the export for this file so it can be
  imported and used in other files.
*/
export = MainNavigation;
