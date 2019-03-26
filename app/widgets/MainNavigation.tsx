import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import MapView = require("esri/views/MapView");
import Compass = require("esri/widgets/Compass");
import Home = require("esri/widgets/Home");
import LayerList = require("esri/widgets/LayerList");
import Locate = require("esri/widgets/Locate");
import Search = require("esri/widgets/Search");
import Widget = require("esri/widgets/Widget");

import CustomWindow = require("app/widgets/CustomWindow");
import { CustomZoom } from "app/widgets/CustomZoom";
import WindowExpand = require("app/widgets/WindowExpand");

@subclass("esri.widgets.MainNavigation")
class MainNavigation extends declared(Widget) {
  // Compass widget
  @property()
  @renderable()
  compass: Compass;

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
            </ul>
          </div>
        </div>
        {renderedWindows}
      </div>
    );
  }

  private _element(): HTMLElement {
    return document.getElementById('main-navigation');
  }
}

/*
  Set the main navigation widget as the export for this file so it can be
  imported and used in other files.
*/
export = MainNavigation;
