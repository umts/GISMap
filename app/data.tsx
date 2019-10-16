import esriRequest = require('esri/request');

import WebMap = require('esri/WebMap');
import FeatureLayer = require('esri/layers/FeatureLayer');
import MapView = require('esri/views/MapView');

import { toNativePromise } from 'app/promises';
import MainNavigation = require('app/widgets/MainNavigation');

let hubData: any;

/*
  Get data from the hub. If the hub data contains lot notices, then open the
  lot notices window immediately.
*/
function updateHubData(mainNavigation: MainNavigation): void {
  toNativePromise(esriRequest('http://localhost:3000/gis')
    .then((response) => {
      if (response.data.lot_notices.length > 0) {
        mainNavigation.findWindow('lot notices').visible = true;
      }
      hubData = response.data;
      return;
    }).catch((error) => {
      console.error(error);
    }));
}

function getHubData(): any {
  return hubData;
}

let sectionData: any;

function updateSectionData(view: MapView): any {
  const layer = (view.map as WebMap).layers.find((layer) => {
    return layer.title === 'Sections';
  }) as FeatureLayer;
  const query = layer.createQuery();
  query.where = '1 = 1'
  layer.queryFeatures(query).then((response: any) => {
    sectionData = response;
    return;
  }).catch((error: any) => {
    console.error(error);
  });
}

function getSectionData(): any {
  return sectionData;
}

/*
  Export helper functions related to raw data so they can be
  imported and used in other files.
*/
export { updateHubData, getHubData, updateSectionData, getSectionData };
