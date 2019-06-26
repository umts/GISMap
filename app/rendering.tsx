import { tsx } from 'esri/widgets/support/widget';

import WebMap = require('esri/WebMap');
import FeatureLayer = require('esri/layers/FeatureLayer');
import LabelClass = require('esri/layers/support/LabelClass');
import UniqueValueRenderer = require('esri/renderers/UniqueValueRenderer');
import PictureMarkerSymbol = require('esri/symbols/PictureMarkerSymbol');
import Font = require('esri/symbols/Font');
import SimpleLineSymbol = require('esri/symbols/SimpleLineSymbol');
import SimpleMarkerSymbol = require('esri/symbols/SimpleMarkerSymbol');
import TextSymbol = require('esri/symbols/TextSymbol');

import { SearchFilter } from 'app/search';

const iconsPath = 'assets/icons';

// Info that should be used to render different types of spaces
const spaceRendererInfo = {
  'R-Handicapped': {
    label: 'Handicapped Spaces',
    description: 'Handicapped space',
    checked: 'checked',
    iconUrl: `${iconsPath}/handicapped-space.png`
  },
  'R-Carpool': {
    label: 'Carpool Spaces',
    description: 'Carpool space',
    iconUrl: `${iconsPath}/carpool-space.png`
  },
  'R-State': {
    label: 'State Vehicle Spaces',
    description: 'State vehicle space',
    iconUrl: `${iconsPath}/state-space.png`
  },
  'Meter-Paystation': {
    label: 'Paystation Spaces',
    description: 'Paystation space',
    iconUrl: `${iconsPath}/paystation-space.png`
  },
  'Meter-Coin': {
    label: 'Meter Spaces',
    description: 'Meter space',
    iconUrl: `${iconsPath}/meter-space.png`
  },
  'R-EV': {
    label: 'Electric Vehicle Charging Stations',
    description: 'Electric vehicle charging station',
    iconUrl: `${iconsPath}/electric-space.png`
  },
  'R-Visitor': {
    label: 'Visitor Spaces',
    description: 'Visitor space',
    iconUrl: `${iconsPath}/visitor-space.png`
  },
  'R-Client': {
    label: 'Reserved Spaces',
    description: 'Reserved space',
    iconUrl: `${iconsPath}/reserved-space.png`
  },
  'R-15Min': {
    label: 'Loading Zones',
    description: 'Loading zone',
    iconUrl: `${iconsPath}/loading-zone.png`
  }
};

// Info that should be used to render different section colors
const sectionRendererInfo = {
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
  },
  'Null': {
    label: 'Other Lots',
    checked: 'checked',
    iconUrl: `${iconsPath}/other-lot.png`
  }
}

let _filterInfo: Array<SearchFilter> = [
  {
    name: 'Metered/Visitor Parking',
    description: 'Locations to park without a permit. Pay at a meter or a paystation.',
    tags: ['meter', 'paystation', 'pink', 'visitor'],
    visible: true,
    clauses: [
      {layerName: 'Sections', clause: "SectionColor = 'Pink'"},
      {layerName: 'Spaces', clause: "ParkingSpaceSubCategory in ('Meter-Coin','Meter-Paystation')"}
    ]
  }, {
    name: 'ParkMobile Lots',
    description: 'Payment in these lots available using the ParkMobile app.',
    tags: ['parkmobile'],
    visible: true,
    clauses: [{layerName: 'Sections', clause: "ParkmobileZoneID is not null"}]
  }, {
    name: 'Free Parking (On Weekends)',
    description: 'These lots are only free to park in on the weekend, with the exception of special events.',
    tags: ['free', 'weekend'],
    visible: true,
    clauses: [
      {layerName: 'Sections', clause: "SectionHours in ('Weekdays','BusinessHours')"},
      {layerName: 'Spaces', clause: '0 = 1'}
    ]
  }, {
    name: 'Free Parking (After Business Hours)',
    description: 'These lots are only free to park in after business hours, with the exception of special events. They are restricted on weekdays from 7:00 AM to 7:00 PM.',
    tags: ['free', 'business'],
    visible: true,
    clauses: [
      {layerName: 'Sections', clause: "SectionHours in ('BusinessHours')"},
      {layerName: 'Spaces', clause: '0 = 1'}
    ]
  }
];

['Red', 'Blue', 'Purple', 'Yellow', 'Green'].forEach((color) => {
  _filterInfo.push({
    name: `${color} Lots`,
    tags: [color],
    visible: true,
    clauses: [{layerName: 'Sections', clause: `SectionColor = '${color}'`}]
  });
});
// For simplicity we should never be modifying filterInfo outside of this file
const filterInfo = _filterInfo;

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
    uniqueValueInfos: Object.keys(spaceRendererInfo).map((spaceCategory) => {
      const rendererInfo = spaceRendererInfo[spaceCategory];
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
      expression: '$feature.SectionCode'
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

// Return two elements formatted as row with a label and content
function attributeRow(label: string, content: string): JSX.Element {
  return (
    <div class='space-between attribute-row'>
      <b class='attribute-row-label'>{label}</b>
      <p class='attribute-row-content'>{content}</p>
    </div>
  );
}

// Return an expandable element containing mainElement. Title should be unique.
function expandable(
  title: string,
  startExpanded: boolean,
  className: string,
  mainElement: JSX.Element
): JSX.Element {
  return (
    <div>
      <div
        class={`expandable ${className}`}
        data-title={title}
        onclick={_expandExpandable}>
        <span
          data-title={title}
          class={`expandable-icon esri-icon ${startExpanded ? 'esri-icon-down-arrow' : 'esri-icon-right-triangle-arrow'}`}
          id={`expandable-icon-${title}`}></span>
        {title}
      </div>
      <div id={`expandable-content-${title}`} style={`display: ${startExpanded ? 'block' : 'none'};`}>
        {mainElement}
      </div>
    </div>
  );
}

// Expand an expandable element by a unique title
function _expandExpandable(event: any) {
  const icon = document.getElementById(`expandable-icon-${event.target.dataset.title}`);
  const content = document.getElementById(`expandable-content-${event.target.dataset.title}`);
  if (content.style.display === 'block') {
    content.style.display = 'none';
    icon.classList.remove('esri-icon-down-arrow');
    icon.classList.add('esri-icon-right-triangle-arrow');
  } else {
    content.style.display = 'block';
    icon.classList.remove('esri-icon-right-triangle-arrow');
    icon.classList.add('esri-icon-down-arrow');
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
  attributeRow,
  expandable
};
