import Point = require("esri/geometry/Point");
import MapView = require("esri/views/MapView");

const umassLongLat = [-72.5293, 42.3903];

/*
  Use the hash parameter of the url to set the position of the view.
  If the view is not ready yet, set as parameters, otherwise use the goTo
  method which will animate.
*/
function updatePositionFromUrl(view: MapView) {
  const urlParams = window.location.hash.slice(1).split("/");
  if (urlParams.length >= 3 &&
    stringIsNumber(urlParams[0]) &&
    stringIsNumber(urlParams[1]) &&
    stringIsNumber(urlParams[2])
  ) {
    const center = new Point({
      latitude: Number(urlParams[0]),
      longitude: Number(urlParams[1])
    });
    const zoom = Number(urlParams[2]);
    if (view.ready) {
      view.goTo({target: center, zoom: zoom});
    } else {
      view.center = center;
      view.zoom = zoom;
    }
  }
}
/*
  Return true if string is a valid number, which also means it is not the
  empty string.
*/
function stringIsNumber(s: string): boolean {
  if (s !== "" && !isNaN(Number(s))) {
    return true;
  }
  return false;
}

let urlTimerId: number;
/*
  Will be called when the center or zoom of the view changes.
  Once the view has stopped moving for a moment we will update the url with
  the new position.
*/
function resetUrlTimer(view: MapView) {
  clearTimeout(urlTimerId);
  urlTimerId = setTimeout(() => {
    updateUrlFromPosition(view);
  }, 500);
}

// Update the url hash to use the center and zoom of the view
function updateUrlFromPosition(view: MapView) {
  history.replaceState(
    "",
    "",
    `/#${view.center.latitude.toFixed(5)}/${view.center.longitude.toFixed(5)}/${view.zoom}`
  );
}

// Always go to center of UMass
function homeGoToOverride(view: MapView, goToParams: any) {
  return view.goTo({
    target: new Point({
      latitude: umassLongLat[1],
      longitude: umassLongLat[0]
    }),
    zoom: 16
  }, goToParams.options);
}

/*
  Export helper functions related to positioning so they can be
  imported and used in other files.
*/
export { homeGoToOverride, resetUrlTimer, umassLongLat, updatePositionFromUrl};
