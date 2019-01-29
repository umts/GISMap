import WebMap = require("esri/WebMap");
import MapView = require("esri/views/MapView");
import Compass = require("esri/widgets/Compass");
import Home = require("esri/widgets/Home");
import Search = require("esri/widgets/Search");

import MainNavigation = require("app/widgets/MainNavigation");
import { CustomZoom, ZoomDirection } from "app/widgets/CustomZoom";

const map = new WebMap({
  portalItem: {
    id: "15298012bff94b1482cf3fee6277fad8"
  }
});

const view = new MapView({
  container: "viewDiv",
  center: [-72.5293, 42.3903],
  zoom: 16,
  map: map,
  ui: {
    components: ["attribution"]
  }
});

view.when(() => {
  // Main navigation widget contains most of the other widgets
  const mainNavigation = new MainNavigation({
    view: view,
    compass: new Compass({
      view: view
    }),
    home: new Home({
      view: view
    }),
    zoomIn: new CustomZoom({
      view: view,
      direction: ZoomDirection.In
    }),
    zoomOut: new CustomZoom({
      view: view,
      direction: ZoomDirection.Out
    }),
    search: new Search({
      view: view
    })
  });
  view.ui.add(mainNavigation, "top-left");
})
.otherwise((error) => console.warn(error));
