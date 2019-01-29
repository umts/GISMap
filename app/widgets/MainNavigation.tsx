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
  @property()
  @renderable()
  view: MapView;

  @property()
  @renderable()
  compass: Compass;

  @property()
  @renderable()
  home: Home;

  @property()
  @renderable()
  zoomIn: CustomZoom;

  @property()
  @renderable()
  zoomOut: CustomZoom;

  @property()
  @renderable()
  search: Search;

  // Allow us to pass in properties like widgets
  constructor(properties?: any) {
    super();
  }

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

export = MainNavigation;
