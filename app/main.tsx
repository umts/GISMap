import Basemap = require('esri/Basemap');
import WebMap = require("esri/WebMap");
import SpatialReference = require('esri/geometry/SpatialReference');
import FeatureLayer = require('esri/layers/FeatureLayer');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import MapView = require("esri/views/MapView");
import Compass = require("esri/widgets/Compass");
import Directions = require('esri/widgets/Directions');
import Home = require("esri/widgets/Home");
import LayerList = require("esri/widgets/LayerList");
import Locate = require("esri/widgets/Locate");
import Print = require("esri/widgets/Print");

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
import { updateRenderers, updateLabeling } from 'app/rendering';
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
  },
  // Don't use the default popups
  popup: null
});

// Update the position of the view when the url hash changes
updatePositionFromUrl(view);
window.addEventListener("hashchange", () => { updatePositionFromUrl(view) });
// Update the url hash when the position of the view changes
view.watch(["center", "zoom", "rotation"], () => { resetUrlTimer(view) });

// Wait until the view has loaded before loading the widgets
view.when(() => {
  // Set the default basemap
  map.basemap = Basemap.fromId('topo');

  // Special layer for popup feature selection
  map.add(new GraphicsLayer({
    title: 'Selection'
  }));

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

  // Create a layer window that will be hidden until opened by a window expand
  const layersWindow = new CustomWindow({
    name: 'layers',
    widgets: [
      {
        label: 'Layers',
        widget: new CustomLayerList({
          view: view
        })
      }
    ]
  });

  const customDirections = new CustomDirections({
    startSearch: new CustomSearch({
      view: view,
      name: 'directions-origin',
      placeholder: 'Origin',
      required: true
    }),
    endSearch: new CustomSearch({
      view: view,
      name: 'directions-destination',
      placeholder: 'Destination',
      required: true
    })
  });

  const customPedestrianDirections = new Directions({
    view: view,
    routeServiceUrl: 'https://maps.umass.edu/arcgis/rest/services/Research/CampusPedestrianNetwork/NAServer/Route'
  });
  /*
    These parameters must be set outside the constructor. If we try to set
    them on the view model within the constructor the widget will break.
  */
  // Pedestrian route service doesn't support hierarchy
  customPedestrianDirections.viewModel.routeParameters.useHierarchy = false;
  // Directions widget seems to want lat and lon
  customPedestrianDirections.viewModel.routeParameters.outSpatialReference = new SpatialReference({wkid: 4326});

  /*
    Create a directions window that will be hidden until opened by a
    window expand.
  */
  const directionsWindow = new CustomWindow({
    name: 'directions',
    widgets: [
      {
        label: 'Driving directions',
        widget: customDirections
      },
      {
        label: 'Walking directions',
        widget: customPedestrianDirections
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
    view: view,
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
    search: new CustomSearch({
      view: view,
      name: 'main',
      placeholder: 'Search',
      mainSearch: true
    }),
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
