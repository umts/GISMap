import Point = require('esri/geometry/Point');

import MainNavigation = require('app/widgets/MainNavigation');

// The bare minimum required to identify a feature for the URL
interface FeatureForUrl {
  id: number;
  layer: string;
}

// Encode an object as a query string
function encodeQueryString(data: any): string {
  return '?' + Object.keys(data).map((key) => {
    return [key, data[key]].map(encodeURIComponent).join('=');
  }).join('&');
}

// Decode a query string as an object
function decodeQueryString(queryString: string): any {
  const data = {}
  queryString.slice(1).split('&').forEach((value) => {
    const keyAndValue = value.split('=');
    data[decodeURIComponent(keyAndValue[0])] = decodeURIComponent(keyAndValue[1]);
  });
  return data;
}

/*
  Return true if string is a valid number, which also means it is not the
  empty string.
*/
function stringIsNumber(s: string): boolean {
  if (s !== '' && !isNaN(Number(s))) {
    return true;
  }
  return false;
}

// Return true if the key exists in the object and its value is a valid number
function paramExistsAsNumber(object: any, key: string): boolean {
  if (
    Object.prototype.hasOwnProperty.call(object, key) &&
    stringIsNumber(object[key])
  ) {
    return true;
  }
  return false;
}

// Update the url hash to use the center and zoom of the view
function updateUrlFromApp(mainNavigation: MainNavigation): void {
  const queryParams: any = {
    latitude: mainNavigation.view.center.latitude.toFixed(5),
    longitude: mainNavigation.view.center.longitude.toFixed(5),
    zoom: mainNavigation.view.zoom.toFixed(1),
    rotation: Math.round(mainNavigation.view.rotation),
    basemap: mainNavigation.basemapToggle.activeBasemap.id
  }
  if (mainNavigation.popup.featureForUrl) {
    // Encode with base 64 and remove the padding at the end
    queryParams.popup = btoa(JSON.stringify(
      mainNavigation.popup.featureForUrl
    )).split('=')[0];
  }

  history.replaceState('', '', '#' + encodeQueryString(queryParams));
}

let urlTimerId: number;
/*
  Will be called when the some component of the url is changed in the view.
  Once the view has stopped moving for a moment we will update the url with
  the new position.
*/
function resetUrlTimer(mainNavigation: MainNavigation): void {
  clearTimeout(urlTimerId);
  urlTimerId = setTimeout(() => {
    updateUrlFromApp(mainNavigation);
  }, 500);
}

/*
  Use the hash parameter of the url to set the position of the view and
  the popup of the main navigation.
  If the view is not ready yet, set as parameters, otherwise use the goTo
  method which will animate.
*/
function updateAppFromUrl(mainNavigation: MainNavigation): void {
  const urlParams = decodeQueryString(window.location.hash.slice(1));

  // Ensure that the URL is valid
  if (paramExistsAsNumber(urlParams, 'latitude') &&
    paramExistsAsNumber(urlParams, 'longitude')
  ) {
    const center = new Point({
      latitude: Number(urlParams.latitude),
      longitude: Number(urlParams.longitude)
    });
    let zoom = 16;
    if (paramExistsAsNumber(urlParams, 'zoom')) {
      zoom = Number(urlParams.zoom);
    }
    let rotation = 0;
    if (paramExistsAsNumber(urlParams, 'rotation')) {
      rotation = Number(urlParams.rotation);
    }
    let basemap = 'topo';
    if (urlParams.basemap) {
      basemap = urlParams.basemap;
    }
    let featureForUrl;
    if (urlParams.popup) {
      try {
        featureForUrl = JSON.parse(atob(urlParams.popup));
      } catch(error) {
        featureForUrl = undefined;
        console.error(error);
      }
    }
    // View is ready, animate the transition
    if (mainNavigation.view.ready) {
      mainNavigation.view.goTo({target: center, zoom: zoom, rotation: rotation});
      // Only set the popup if it is a parameter and the view is ready
      if (featureForUrl) {
        mainNavigation.popup.openFromUrl(featureForUrl);
      }
      // Set the basemap
      if (
        mainNavigation.basemapToggle.activeBasemap.id !== basemap &&
        (basemap === 'topo' || basemap === 'satellite')
      ) {
        mainNavigation.basemapToggle.toggle();
      }
    // View is not ready, so set the initial parameters
    } else {
      mainNavigation.view.center = center;
      mainNavigation.view.zoom = zoom;
      mainNavigation.view.rotation = rotation;
    }
  } else {
    // Url is invalid so reset it
    resetUrlTimer(mainNavigation);
  }
}

// Return an IE safe root url
function rootUrl(): string {
  return location.protocol + '//' + location.host;
}

// Encode the query string part of the url, most importantly the ampersands
function safeUrl(): string {
  const startUrl = window.location.href.split('?')[0] + '?';
  const endUrl = encodeURIComponent(window.location.href.split('?')[1]);
  return `${startUrl}${endUrl}`;
}

// Return true if the url is http not including localhost
function isUrlInsecure(): boolean {
  return location.protocol === 'http:' && location.hostname !== 'localhost';
}

/*
  Export helper functions related to urls so they can be
  imported and used in other files.
*/
export {
  FeatureForUrl,
  resetUrlTimer,
  updateAppFromUrl,
  safeUrl,
  isUrlInsecure,
  rootUrl
};
