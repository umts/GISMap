import esriRequest = require('esri/request');

import { toNativePromise } from 'app/promises';

let lotNotices: any;

function updateLotNotices(): void {
  toNativePromise(esriRequest('http://localhost:3000/gis')
    .then((response) => {
      lotNotices = response.data.lot_notices;
      return;
    }).catch((error) => {
      console.error(error);
    }));
}

function getLotNotices(): any {
  return lotNotices;
}

/*
  Export helper functions related to lot notices so they can be
  imported and used in other files.
*/
export { updateLotNotices, getLotNotices };
