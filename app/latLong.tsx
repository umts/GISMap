import Point = require("esri/geometry/Point");
import MapView = require("esri/views/MapView");

const umassLongLat = [-72.5293, 42.3903];

// Always go to center of UMass
function homeGoToOverride(view: MapView, goToParams: any) {
  return view.goTo({
    target: new Point({
      latitude: umassLongLat[1],
      longitude: umassLongLat[0]
    }),
    zoom: 16,
    rotation: 0
  }, goToParams.options);
}

/*
  Export helper functions related to positioning so they can be
  imported and used in other files.
*/
export { homeGoToOverride, umassLongLat };
