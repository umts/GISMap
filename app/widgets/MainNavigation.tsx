import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import MapView = require("esri/views/MapView");
import Compass = require("esri/widgets/Compass");
import Home = require("esri/widgets/Home");
import Search = require("esri/widgets/Search");
import Widget = require("esri/widgets/Widget");

import { CustomZoom } from "app/widgets/CustomZoom";

@subclass("esri.widgets.MainNavigation")
class MainNavigation extends declared(Widget) {
  // Compass widget
  @property()
  @renderable()
  compass: Compass;

  // Home widget
  @property()
  @renderable()
  home: Home;

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

  /*
    Pass in properties like widgets as `any` type which will then be cast to
    their correct types.
  */
  constructor(properties?: any) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    return (
      <div id="main-navigation">
        {this.search.render()}

        <div id="widgets-list">
          <ul>
            <li class="widget-list-item">{this.zoomIn.render()}</li>
            <li class="widget-list-item">{this.zoomOut.render()}</li>
            <li class="widget-list-item">{this.compass.render()}</li>
            <li class="widget-list-item">{this.home.render()}</li>
          </ul>
        </div>
      </div>
    );
  }
}

/*
  Set the main navigation widget as the export for this file so it can be
  imported and used in other files.
*/
export = MainNavigation;
