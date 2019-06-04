import WebMap = require('esri/WebMap');
import FeatureLayer = require('esri/layers/FeatureLayer');
import LabelClass = require('esri/layers/support/LabelClass');
import UniqueValueRenderer = require('esri/renderers/UniqueValueRenderer');
import PictureMarkerSymbol = require('esri/symbols/PictureMarkerSymbol');
import Font = require('esri/symbols/Font');
import SimpleLineSymbol = require('esri/symbols/SimpleLineSymbol');
import SimpleMarkerSymbol = require('esri/symbols/SimpleMarkerSymbol');
import TextSymbol = require('esri/symbols/TextSymbol');

import { rootUrl } from 'app/url';
import { SearchFilter } from 'app/search';

const iconsPath = 'assets/icons';

// Return info that should be used to render different types of spaces
function spaceRendererInfo(): any {
  return {
    'R-Handicapped': {
      label: 'Handicapped Spaces',
      description: 'Handicapped space',
      checked: 'checked',
      iconUrl: `${rootUrl()}/${iconsPath}/handicapped-space.png`
    },
    'R-Carpool': {
      label: 'Carpool Spaces',
      description: 'Carpool space',
      iconUrl: `${rootUrl()}/${iconsPath}/carpool-space.png`
    },
    'R-State': {
      label: 'State Vehicle Spaces',
      description: 'State vehicle space',
      iconUrl: `${rootUrl()}/${iconsPath}/state-space.png`
    },
    'Meter-Paystation': {
      label: 'Paystation Spaces',
      description: 'Paystation space',
      iconUrl: `${rootUrl()}/${iconsPath}/paystation-space.png`
    },
    'Meter-Coin': {
      label: 'Meter Spaces',
      description: 'Meter space',
      iconUrl: `${rootUrl()}/${iconsPath}/meter-space.png`
    },
    'R-EV Stations': {
      label: 'Electric Vehicle Charging Stations',
      description: 'Electric vehicle charging station',
      iconUrl: `${rootUrl()}/${iconsPath}/electric-space.png`
    },
    'R-Visitor': {label: 'Visitor Spaces', description: 'Visitor space'},
    'R-Client': {label: 'Reserved Spaces', description: 'Reserved space'},
    'R-15Min': {label: '15 Minute Spaces', description: '15 minute space'}
  };
}

// Return info that should be used to render different section colors
function sectionRendererInfo(): any {
  return {
    'Red': {
      label: 'Red Lots',
      checked: 'checked',
      iconUrl: `${iconsPath}/red-lot.png`
    },
    'Blue': {
      label: 'Blue Lots',
      checked: 'checked',
      iconUrl: `${iconsPath}/blue-lot.png`
    },
    'Purple': {
      label: 'Purple Lots',
      checked: 'checked',
      iconUrl: `${iconsPath}/purple-lot.png`
    },
    'Yellow': {
      label: 'Yellow Lots',
      checked: 'checked',
      iconUrl: `${iconsPath}/yellow-lot.png`
    },
    'Green': {
      label: 'Green Lots',
      checked: 'checked',
      iconUrl: `${iconsPath}/green-lot.png`
    },
    'Pink': {
      label: 'Meter Lots',
      checked: 'checked',
      iconUrl: `${iconsPath}/meter-lot.png`
    }
  };
}

function filterInfo(): Array<SearchFilter> {
  return [
    {
      name: 'Red lots',
      visible: true,
      clauses: [{layerName: 'Sections', clause: "SectionColor = 'Red'"}],
      subFilters: [
        {
          name: 'Lot 41',
          visible: true,
          clauses: [{layerName: 'Sections', clause: "Sectionname = 'Lot 41'"}]
        }
      ]
    }
  ];
}

// Update the renderers of layers to add our own icons
function updateRenderers(map: WebMap) {
  const spaceRenderer = new UniqueValueRenderer({
    field: 'ParkingSpaceSubCategory',
    defaultSymbol: new SimpleMarkerSymbol({
      color: 'black',
      size: '16px',
      outline: new SimpleLineSymbol({
        color: 'white',
        width: '1px'
      })
    }),
    defaultLabel: 'Other Spaces',
    uniqueValueInfos: Object.keys(spaceRendererInfo()).map((spaceCategory) => {
      const rendererInfo = spaceRendererInfo()[spaceCategory];
      if (rendererInfo.iconUrl) {
        return {
          value: spaceCategory,
          label: rendererInfo.label,
          symbol: new PictureMarkerSymbol({
            url: rendererInfo.iconUrl,
            width: '24px',
            height: '24px'
          })
        };
      }
      return null;
    }).filter((info) => { return info !== null })
  });
  const spacesLayer = map.layers.find((layer) => {
    return layer.title === 'Spaces';
  }) as FeatureLayer;
  spacesLayer.renderer = spaceRenderer;
}

// Update the labeling of layers
function updateLabeling(map: WebMap) {
  const sectionLabel = new LabelClass({
    labelExpressionInfo: {
      expression: 'IIf($feature.SectionColor != "Pink", $feature.SectionName, "")'
    },
    labelPlacement: 'always-horizontal',
    symbol: new TextSymbol({
      color: 'black',
      haloColor: 'white',
      haloSize: '1px',
      font: new Font({
        size: 12,
        family: 'sans-serif',
        weight: 'bold'
      })
    })
  });
  const buildingLabel = new LabelClass({
    labelExpressionInfo: {
      expression: '$feature.Building_Name'
    },
    labelPlacement: 'always-horizontal',
    symbol: new TextSymbol({
      color: 'white',
      haloColor: 'black',
      haloSize: '1px',
      font: new Font({
        size: 10,
        family: 'sans-serif',
        weight: 'bold'
      })
    })
  });

  const sectionsLayer = map.layers.find((layer) => {
    return layer.title === 'Sections';
  }) as FeatureLayer;
  sectionsLayer.labelingInfo = [sectionLabel];
  const buildingsLayer = map.layers.find((layer) => {
    return layer.title === 'Campus Buildings';
  }) as FeatureLayer;
  buildingsLayer.labelingInfo = [buildingLabel];
}

/*
  Return the current padding or margin in pixels of an element assuming the
  padding or margin is uniform on every side.
*/
function getElementStyleSize(element: Element, property: string): number {
  if (['padding', 'margin'].indexOf(property) > -1) {
    return Number(
      window.getComputedStyle(element)
        .getPropertyValue(`${property}-top`).slice(0, -2)
      );
  } else {
    return 0;
  }
}

/*
  Export helper functions related to rendering so they can be
  imported and used in other files.
*/
export {
  updateRenderers,
  updateLabeling,
  spaceRendererInfo,
  sectionRendererInfo,
  filterInfo,
  getElementStyleSize
};
