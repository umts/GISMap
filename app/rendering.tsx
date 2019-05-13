import WebMap = require('esri/WebMap');
import PopupTemplate = require('esri/PopupTemplate');
import FeatureLayer = require('esri/layers/FeatureLayer');
import LabelClass = require('esri/layers/support/LabelClass');
import UniqueValueRenderer = require('esri/renderers/UniqueValueRenderer');
import PictureMarkerSymbol = require('esri/symbols/PictureMarkerSymbol');
import Font = require('esri/symbols/Font');
import SimpleLineSymbol = require('esri/symbols/SimpleLineSymbol');
import SimpleMarkerSymbol = require('esri/symbols/SimpleMarkerSymbol');
import TextSymbol = require('esri/symbols/TextSymbol');

const iconsPath = 'assets/icons';

// Return info that should be used to render different types of spaces
function spaceRendererInfo(): any {
  return {
    'R-Handicapped': {
      label: 'Handicapped Spaces',
      checked: 'checked',
      iconUrl: `${iconsPath}/handicapped-space.png`
    },
    'R-Carpool': {
      label: 'Carpool Spaces',
      iconUrl: `${iconsPath}/carpool-space.png`
    },
    'R-State': {
      label: 'State Vehicle Spaces',
      iconUrl: `${iconsPath}/state-space.png`
    },
    'Meter-Paystation': {
      label: 'Paystation Spaces',
      iconUrl: `${iconsPath}/paystation-space.png`
    },
    'Meter-Coin': {
      label: 'Meter Spaces',
      iconUrl: `${iconsPath}/meter-space.png`
    },
    'R-EV Stations': {
      label: 'Electric Vehicle Charging Stations',
      iconUrl: `${iconsPath}/electric-space.png`
    },
    'R-Visitor': {label: 'Visitor Spaces'},
    'R-Client': {label: 'Reserved Spaces'},
    'R-15Min': {label: '15 Minute Spaces'},
    'Other': {label: 'Other Spaces'}
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
    uniqueValueInfos: Object.keys(spaceRendererInfo()).map((spaceCategory) => {
      const iconUrl = spaceRendererInfo()[spaceCategory].iconUrl;
      if (iconUrl) {
        return {
          value: spaceCategory,
          symbol: new PictureMarkerSymbol({
            url: iconUrl,
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
  const sectionsLayer = map.layers.find((layer) => {
    return layer.title === 'Sections';
  }) as FeatureLayer;
  sectionsLayer.labelingInfo = [sectionLabel];
}

function updatePopups(map: WebMap) {
  const sectionPopupTemplate = new PopupTemplate({
    title: '{SectionName}'
  });
  const sectionsLayer = map.layers.find((layer) => {
    return layer.title === 'Sections';
  }) as FeatureLayer;
  sectionsLayer.popupTemplate = sectionPopupTemplate;
}

/*
  Export helper functions related to rendering so they can be
  imported and used in other files.
*/
export {
  updateRenderers,
  updateLabeling,
  updatePopups,
  spaceRendererInfo,
  sectionRendererInfo
};