import Point = require("esri/geometry/Point");
import MapView = require("esri/views/MapView");

import { umassLongLat } from "app/latLong";

// Encode an object as a query string
function encodeQueryString(data: any): string {
  return "?" + Object.keys(data).map((key) => {
    return [key, data[key]].map(encodeURIComponent).join("=");
  }).join("&");
}

// Decode a query string as an object
function decodeQueryString(queryString: string): any {
  let data = {}
  queryString.slice(1).split("&").forEach((value) => {
    const keyAndValue = value.split("=");
    data[decodeURIComponent(keyAndValue[0])] = decodeURIComponent(keyAndValue[1]);
  });
  return data;
}

/*
  Use the hash parameter of the url to set the position of the view.
  If the view is not ready yet, set as parameters, otherwise use the goTo
  method which will animate.
*/
function updatePositionFromUrl(view: MapView) {
  const urlParams = decodeQueryString(window.location.hash.slice(1));

  if (paramExistsAsNumber(urlParams, "latitude") &&
    paramExistsAsNumber(urlParams, "longitude")
    ) {
    const center = new Point({
      latitude: Number(urlParams.latitude),
      longitude: Number(urlParams.longitude)
    });
    let zoom = 16;
    if (paramExistsAsNumber(urlParams, "zoom")) {
      zoom = Number(urlParams.zoom);
    }
    let rotation = 0;
    if (paramExistsAsNumber(urlParams, "rotation")) {
      rotation = Number(urlParams.rotation);
    }
    if (view.ready) {
      view.goTo({target: center, zoom: zoom, rotation: rotation});
    } else {
      view.center = center;
      view.zoom = zoom;
      view.rotation = rotation;
    }
  } else {
    // Url is invalid so reset it
    resetUrlTimer(view);
  }
}
// Return true if the key exists in the object and its value is a valid number
function paramExistsAsNumber(object: any, key: string): boolean {
  if (object.hasOwnProperty(key) && stringIsNumber(object[key])) {
    return true;
  }
  return false;
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
  Will be called when the some component of the url is changed in the view.
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
  const queryString = encodeQueryString({
    latitude: view.center.latitude.toFixed(5),
    longitude: view.center.longitude.toFixed(5),
    zoom: view.zoom.toFixed(1),
    rotation: Math.round(view.rotation)
  });
  history.replaceState("", "", "#" + queryString);
}

// Encode the query string part of the url, most importantly the ampersands
function safeUrl(): string {
  const startUrl = window.location.href.split("?")[0] + "?";
  const endUrl = encodeURIComponent(window.location.href.split("?")[1]);
  return `${startUrl}${endUrl}`;
}

/*
  Export helper functions related to urls so they can be
  imported and used in other files.
*/
export { resetUrlTimer, updatePositionFromUrl, safeUrl };
