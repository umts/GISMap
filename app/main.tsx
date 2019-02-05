import WebMap = require("esri/WebMap");
import MapView = require("esri/views/MapView");
import Compass = require("esri/widgets/Compass");
import Home = require("esri/widgets/Home");
import Search = require("esri/widgets/Search");

import MainNavigation = require("app/widgets/MainNavigation");
import { CustomZoom, ZoomDirection } from "app/widgets/CustomZoom";

// Set the map to load data from our ArcGIS Online web map
const map = new WebMap({
  portalItem: {
    id: "15298012bff94b1482cf3fee6277fad8"
  }
});

const view = new MapView({
  container: "viewDiv",
  // Start the map centered on UMass' latitude and longitude
  center: [-72.5293, 42.3903],
  zoom: 16,
  map: map,
  // Tell the view to only load the attribution widget by default
  ui: {
    components: ["attribution"]
  }
});

// Wait until the view has loaded before loading the widgets
view.when(() => {
  /*
    Create the main navigation widget.
    The main navigation widget is the box that contains most of the
    other widgets.
  */
  const mainNavigation = new MainNavigation({
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
  // Add the main navigation widget to the map
  view.ui.add(mainNavigation, "top-left");
})
.otherwise((error) => console.warn(error));
