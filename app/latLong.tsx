import Point = require('esri/geometry/Point');
import Polygon = require('esri/geometry/Polygon');
import MapView = require('esri/views/MapView');

const umassLongLat = [-72.5293, 42.3903];

// Represents a point on the screen in pixels
interface ScreenPoint {
  x: number;
  y: number;
}

// Always go to center of UMass
function homeGoToOverride(view: MapView, goToParams: any): IPromise<any> {
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
  Generate a 'circle' in latitude/longitude given a point on the screen in
  pixels.
*/
function circleAt(screenPoint: ScreenPoint, view: MapView): Polygon {
  const delta = 16;
  const screenVertices: Array<ScreenPoint> = [
    {x: screenPoint.x - delta, y: screenPoint.y - delta},
    {x: screenPoint.x + delta, y: screenPoint.y - delta},
    {x: screenPoint.x + delta, y: screenPoint.y + delta},
    {x: screenPoint.x - delta, y: screenPoint.y + delta}
  ]

  const mapVertices = screenVertices.map((screenPoint) => {
    const mapPoint = view.toMap(screenPoint);
    /*
      Explicitly grab lat/lon or else the polygon will try to convert back
      to the MA spatial reference.
    */
    return [mapPoint.longitude, mapPoint.latitude];
  });
  const circle = new Polygon();
  // Polygon ring requires the final point to be the same as the first
  circle.addRing(mapVertices.concat([mapVertices[0]]));
  return circle;
}

// Return a promise to the location of the client using the geolocation api
function myLocation(): Promise<Point> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((location) => {
      resolve(new Point({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }));
    }, () => {
      reject('Could not find your location. Try a different query.');
    });
  });
}

/*
  Export helper functions related to positioning so they can be
  imported and used in other files.
*/
export { umassLongLat, ScreenPoint, homeGoToOverride, circleAt, myLocation };
