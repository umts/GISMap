import WebMap = require("esri/WebMap");
import MapView = require("esri/views/MapView");
import Compass = require("esri/widgets/Compass");
import Home = require("esri/widgets/Home");
import LayerList = require("esri/widgets/LayerList");
import Locate = require("esri/widgets/Locate");
import Search = require("esri/widgets/Search");

import MainNavigation = require("app/widgets/MainNavigation");
import CustomWindow = require("app/widgets/CustomWindow");
import { CustomZoom, ZoomDirection } from "app/widgets/CustomZoom";
import WindowExpand = require("app/widgets/WindowExpand");
import { searchGoToOverride, searchSources } from "app/search";

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
  // Hide other layers by default
  map.layers.filter((layer) => {
    return ['Lots', 'Spaces'].indexOf(layer.title) > -1;
  }).forEach((layer) => { layer.visible = false });

  const layersWindow = new CustomWindow({
    name: 'layers',
    widgets: [
      {
        label: "Layers",
        widget: new LayerList({
          view: view,
          container: document.createElement('div') as HTMLElement
        })
      }
    ]
  });

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
    layersExpand: new WindowExpand({
      name: 'layers',
      iconName: 'layers'
    }),
    locate: new Locate({
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
      view: view,
      includeDefaultSources: false,
      popupEnabled: false,
      goToOverride: searchGoToOverride,
      sources: searchSources()
    }),
    customWindows: [layersWindow]
  });

  // Add the main navigation widget to the map
  view.ui.add(mainNavigation, "manual");
})
.otherwise((error) => console.warn(error));
