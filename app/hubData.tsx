import esriRequest = require('esri/request');

import { toNativePromise } from 'app/promises';

let hubData: any;

function updateHubData(): void {
  toNativePromise(esriRequest('https://hub.parking.umass.edu/gis')
    .then((response) => {
      hubData = response.data;
      return;
    }).catch((error) => {
      console.error(error);
    }));
}

function getHubData(): any {
  return hubData;
}

/*
  Export helper functions related to hub data so they can be
  imported and used in other files.
*/
export { updateHubData, getHubData };
