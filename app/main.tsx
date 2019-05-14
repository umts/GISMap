import Basemap = require('esri/Basemap');
import WebMap = require("esri/WebMap");
import FeatureLayer = require('esri/layers/FeatureLayer');
import MapView = require("esri/views/MapView");
import Compass = require("esri/widgets/Compass");
import Home = require("esri/widgets/Home");
import LayerList = require("esri/widgets/LayerList");
import Locate = require("esri/widgets/Locate");
import Print = require("esri/widgets/Print");
import Search = require("esri/widgets/Search");

import MainNavigation = require("app/widgets/MainNavigation");
import CustomDirections = require("app/widgets/CustomDirections");
import CustomLayerList = require("app/widgets/CustomLayerList");
import CustomSearch = require("app/widgets/CustomSearch");
import CustomWindow = require("app/widgets/CustomWindow");
import { CustomZoom, ZoomDirection } from "app/widgets/CustomZoom";
import ShareEmail = require("app/widgets/ShareEmail");
import ShareLink = require("app/widgets/ShareLink");
import WindowExpand = require("app/widgets/WindowExpand");
import { homeGoToOverride, umassLongLat } from "app/latLong";
import { updateRenderers, updateLabeling, updatePopups } from 'app/rendering';
import { searchGoToOverride, searchSources } from "app/search";
import { resetUrlTimer, updatePositionFromUrl } from "app/url";

// Set the map to load data from our ArcGIS Online web map
const map = new WebMap({
  portalItem: {
    id: "15298012bff94b1482cf3fee6277fad8"
  }
});

const view = new MapView({
  container: "viewDiv",
  // Start the map centered on UMass
  center: umassLongLat,
  constraints: {
    maxZoom: 20
  },
  zoom: 16,
  map: map,
  // Tell the view to only load the attribution widget by default
  ui: {
    components: ["attribution"]
  }
});

// Update the position of the view when the url hash changes
updatePositionFromUrl(view);
window.addEventListener("hashchange", () => { updatePositionFromUrl(view) });
// Update the url hash when the position of the view changes
view.watch(["center", "zoom", "rotation"], () => { resetUrlTimer(view) });

// Wait until the view has loaded before loading the widgets
view.when(() => {
  map.basemap = Basemap.fromId('gray-vector');
  // Set the url hash based on the initial view
  resetUrlTimer(view);

  // Hide the lots layer
  map.layers.find((layer) => {
    return layer.title === 'Lots';
  }).visible = false;

  // Ensure that the section layer shows up when zoomed in to max
  (map.layers.find((layer) => {
    return layer.title === 'Sections';
  }) as FeatureLayer).maxScale = 500;

  // Set custom icons in the layer renderers
  updateRenderers(map);
  // Set labels on layers
  updateLabeling(map);

  updatePopups(map);

  // Create a layer window that will be hidden until opened by a window expand
  const layersWindow = new CustomWindow({
    name: 'layers',
    widgets: [
      {
        label: 'Layers',
        widget: new CustomLayerList({
          map: map
        })
      }
    ]
  });

  const searchProperties = {
    view: view,
    includeDefaultSources: false,
    popupEnabled: false,
    goToOverride: searchGoToOverride,
    sources: searchSources()
  };

  const customDirections = new CustomDirections({
    startSearch: new CustomSearch({
      name: 'directions-origin',
      placeholder: 'Origin',
      search: new Search(searchProperties)
    }),
    endSearch: new CustomSearch({
      name: 'directions-destination',
      placeholder: 'Destination',
      search: new Search(searchProperties)
    })
  });

  /*
    Create a directions window that will be hidden until opened by a
    window expand.
  */
  const directionsWindow = new CustomWindow({
    name: 'directions',
    widgets: [
      {
        label: 'Directions',
        widget: customDirections
      }
    ]
  });

  // Create a share window that will be hidden until opened by a window expand
  const shareWindow = new CustomWindow({
    name: 'share',
    widgets: [
      {
        label: "Share link",
        widget: new ShareLink()
      }, {
        label: "Email",
        widget: new ShareEmail()
      }, {
        label: "Print",
        widget: new Print({
          view: view,
          printServiceUrl: "https://maps.umass.edu/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
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
    directionsExpand: new WindowExpand({
      name: 'directions',
      iconName: 'directions'
    }),
    home: new Home({
      view: view,
      goToOverride: homeGoToOverride
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
    search: new Search(searchProperties),
    shareExpand: new WindowExpand({
      name: 'share',
      iconName: 'link'
    }),
    customWindows: [layersWindow, directionsWindow, shareWindow]
  });

  // Add the main navigation widget to the map
  view.ui.add(mainNavigation, "manual");
})
.otherwise((error) => console.warn(error));
