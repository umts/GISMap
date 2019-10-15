import { tsx } from 'esri/widgets/support/widget';

import Graphic = require('esri/Graphic');
import WebMap = require('esri/WebMap');
import FeatureLayer = require('esri/layers/FeatureLayer');
import LabelClass = require('esri/layers/support/LabelClass');
import UniqueValueRenderer = require('esri/renderers/UniqueValueRenderer');
import PictureMarkerSymbol = require('esri/symbols/PictureMarkerSymbol');
import Font = require('esri/symbols/Font');
import SimpleFillSymbol = require('esri/symbols/SimpleFillSymbol');
import SimpleLineSymbol = require('esri/symbols/SimpleLineSymbol');
import SimpleMarkerSymbol = require('esri/symbols/SimpleMarkerSymbol');
import TextSymbol = require('esri/symbols/TextSymbol');
import MapView = require('esri/views/MapView');

import { clickOnSpaceOrEnter } from 'app/events';
import { SearchFilter } from 'app/search';

// Interface for objects with a render method
interface RenderableWidget {
  render: any;
}

const iconsPath = 'assets/icons';

// Info that should be used to render different types of spaces
const spaceRendererInfo = {
  'R-Handicapped': {
    label: 'Handicapped Spaces',
    description: 'Handicapped space',
    checked: 'checked',
    iconUrl: `${iconsPath}/handicapped-space.png`,
    altText: 'White H in a blue circle'
  },
  'R-Carpool': {
    label: 'Carpool Spaces',
    description: 'Carpool space',
    iconUrl: `${iconsPath}/carpool-space.png`,
    altText: 'White C in an orange circle'
  },
  'R-State': {
    label: 'State Vehicle Spaces',
    description: 'State vehicle space',
    iconUrl: `${iconsPath}/state-space.png`,
    altText: 'White M A in a light blue rectangle'
  },
  'Meter-Paystation': {
    label: 'Paystation Spaces',
    description: 'Paystation space',
    iconUrl: `${iconsPath}/paystation-space.png`,
    altText: 'White P in a dark blue square'
  },
  'Meter-Coin': {
    label: 'Meter Spaces',
    description: 'Meter space',
    iconUrl: `${iconsPath}/meter-space.png`,
    altText: 'Gray parking meter with an M on it'
  },
  'R-EV': {
    label: 'Electric Vehicle Charging Stations',
    description: 'Electric vehicle charging station',
    iconUrl: `${iconsPath}/electric-space.png`,
    altText: 'White E V in a light green square'
  },
  'R-Visitor': {
    label: 'Visitor Spaces',
    description: 'Visitor space',
    iconUrl: `${iconsPath}/visitor-space.png`,
    altText: 'Black V in a yellow circle'
  },
  'R-Client': {
    label: 'Reserved Spaces',
    description: 'Reserved space',
    iconUrl: `${iconsPath}/reserved-space.png`,
    altText: 'White R in a red circle'
  },
  'R-15Min': {
    label: 'Loading Zones',
    description: 'Loading zone',
    iconUrl: `${iconsPath}/loading-zone.png`,
    altText: 'White L in a green circle'
  },
  'Painted-Dock': {
    label: 'Loading Docks',
    description: 'Loading dock',
    iconUrl: `${iconsPath}/loading-dock.png`,
    altText: 'White D in a purple circle'
  }
};

// Info that should be used to render different section colors
const sectionRendererInfo = {
  'Red': {
    label: 'Red Lots',
    color: [255, 0, 0],
    checked: 'checked',
    iconUrl: `${iconsPath}/red-lot.png`,
    altText: 'Red rectangle'
  },
  'Blue': {
    label: 'Blue Lots',
    color: [0, 112, 255],
    checked: 'checked',
    iconUrl: `${iconsPath}/blue-lot.png`,
    altText: 'Blue rectangle'
  },
  'Purple': {
    label: 'Purple Lots',
    color: [132, 0, 168],
    checked: 'checked',
    iconUrl: `${iconsPath}/purple-lot.png`,
    altText: 'Purple rectangle'
  },
  'Yellow': {
    label: 'Yellow Lots',
    color: [255, 255, 0],
    checked: 'checked',
    iconUrl: `${iconsPath}/yellow-lot.png`,
    altText: 'Yellow rectangle'
  },
  'Green': {
    label: 'Green Lots',
    color: [56, 168, 0],
    checked: 'checked',
    iconUrl: `${iconsPath}/green-lot.png`,
    altText: 'Green rectangle'
  },
  'Pink': {
    label: 'Meter Lots',
    color: [255, 0, 197],
    checked: 'checked',
    iconUrl: `${iconsPath}/meter-lot.png`,
    altText: 'Pink rectangle'
  },
  'Null': {
    label: 'Other Lots',
    color: [153, 153, 153],
    checked: 'checked',
    iconUrl: `${iconsPath}/other-lot.png`,
    altText: 'Gray rectangle'
  }
}

const filterInfo: Array<SearchFilter> = [
  {
    name: 'Metered/Visitor Parking',
    description: 'Locations to park without a permit. Pay at a meter or a paystation.',
    tags: ['meter', 'paystation', 'pink', 'visitor'],
    visible: true,
    clauses: [
      {layerName: 'Sections', clause: 'SectionColor = \'Pink\''},
      {layerName: 'Spaces', clause: 'ParkingSpaceSubCategory in (\'Meter-Coin\',\'Meter-Paystation\')'}
    ]
  }, {
    name: 'ParkMobile Lots',
    description: 'Payment in these lots available using the ParkMobile app.',
    tags: ['parkmobile'],
    visible: true,
    clauses: [{layerName: 'Sections', clause: 'ParkmobileZoneID is not null'}]
  }, {
    name: 'Free Parking (On Weekends)',
    description: 'These lots are only free to park in on the weekend, with the exception of special events.',
    tags: ['free', 'weekend'],
    visible: true,
    clauses: [
      {layerName: 'Sections', clause: 'SectionHours in (\'Weekdays\',\'BusinessHours\')'},
      {layerName: 'Spaces', clause: '0 = 1'}
    ]
  }, {
    name: 'Free Parking (After Business Hours)',
    description: 'These lots are only free to park in after business hours, with the exception of special events. They are restricted on weekdays from 7:00 AM to 7:00 PM.',
    tags: ['free', 'business'],
    visible: true,
    clauses: [
      {layerName: 'Sections', clause: 'SectionHours in (\'BusinessHours\')'},
      {layerName: 'Spaces', clause: '0 = 1'}
    ]
  }
];

// Add lot search filters
['Red', 'Blue', 'Purple', 'Yellow', 'Green'].forEach((color) => {
  filterInfo.push({
    name: `${color} Lots`,
    tags: [color],
    visible: true,
    clauses: [{layerName: 'Sections', clause: `SectionColor = '${color}'`}]
  });
});

// Add space search filters
Object.keys(spaceRendererInfo).forEach((spaceCategory) => {
  filterInfo.push({
    name: spaceRendererInfo[spaceCategory].label,
    tags: spaceRendererInfo[spaceCategory].label.split(' '),
    visible: true,
    clauses: [{layerName: 'Spaces', clause: `ParkingSpaceSubCategory = '${spaceCategory}'`}]
  });
});

// Update the renderers of layers to add our own icons
function updateRenderers(map: WebMap): void {
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
  const sectionRenderer = new UniqueValueRenderer({
    field: 'SectionColor',
    defaultSymbol: new SimpleFillSymbol({
      color: [153, 153, 153],
      outline: new SimpleLineSymbol({
        color: [153, 153, 153],
        width: '1px'
      })
    }),
    defaultLabel: 'Other Lots',
    uniqueValueInfos: Object.keys(sectionRendererInfo).map((sectionColor) => {
      const rendererInfo = sectionRendererInfo[sectionColor];
      return {
        value: sectionColor,
        label: rendererInfo.label,
        symbol: new SimpleFillSymbol({
          color: rendererInfo.color,
          outline: new SimpleLineSymbol({
            color: rendererInfo.color,
            width: '1px'
          })
        })
      }
    })
  });

  const spacesLayer = map.layers.find((layer) => {
    return layer.title === 'Spaces';
  }) as FeatureLayer;
  spacesLayer.renderer = spaceRenderer;

  const sectionsLayer = map.layers.find((layer) => {
    return layer.title === 'Sections';
  }) as FeatureLayer;
  sectionsLayer.renderer = sectionRenderer;
}

// Update the labeling of layers
function updateLabeling(map: WebMap): void {
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
        size: 14,
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
  Make the view go to target normally, but use max zoom when the
  target is just a point.
*/
function goToSmart(view: MapView, target: Array<Graphic>): void {
  const targetParams = {
    target: target
  };
  if (target.length === 1 && target[0].geometry.type === 'point') {
    targetParams['zoom'] = 20;
  }
  view.goTo(targetParams);
}

/*
  Given a distance in feet return the imperial distance as a human
  readable string.
*/
function imperialDistance(distanceInFeet: number): string {
  if (distanceInFeet === 0) {
    return null;
  }
  let distance = distanceInFeet;
  let unit = 'feet';
  let places = 0;
  if (distance > 1000) {
    distance = distance / 5280;
    unit = 'miles';
    places = 1;
  }
  return `${distance.toFixed(places)} ${unit}`
}

let uniqueKey = 0;
// Return two elements formatted as row with a label and content
function attributeRow(label: string, content: string, link?: string): JSX.Element {
  // Label content is either text or a link
  let labelContent: JSX.Element | string = label;
  if (link) {
    labelContent = <a target='_blank' href={link}>{label}</a>;
  }
  uniqueKey += 1;
  return (
    <div class='space-between attribute-row' key={uniqueKey}>
      <b class='attribute-row-label'>{labelContent}</b>
      <p class='attribute-row-content'>{content}</p>
    </div>
  );
}

// Expand an expandable element by a unique title
function _expandExpandable(event: any): void {
  const header = document.getElementById(`expandable-header-${event.target.dataset.title}`);
  const icon = document.getElementById(`expandable-icon-${event.target.dataset.title}`);
  const content = document.getElementById(`expandable-content-${event.target.dataset.title}`);
  if (content.style.display === 'block') {
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-label', `Expand ${header.dataset.title}`);
    content.style.display = 'none';
    icon.classList.remove('esri-icon-down-arrow');
    icon.classList.add('esri-icon-right-triangle-arrow');
  } else {
    header.setAttribute('aria-expanded', 'true');
    header.setAttribute('aria-label', `Collapse ${header.dataset.title}`);
    content.style.display = 'block';
    icon.classList.remove('esri-icon-right-triangle-arrow');
    icon.classList.add('esri-icon-down-arrow');
  }
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
        aria-expanded={startExpanded ? 'true' : 'false'}
        aria-label={startExpanded ? `Collapse ${title}` : `Expand ${title}`}
        class={`expandable ${className}`}
        data-title={title}
        id={`expandable-header-${title}`}
        onclick={_expandExpandable}
        onkeydown={clickOnSpaceOrEnter}
        role='button'
        tabindex='0'>
        <span
          aria-hidden='true'
          data-title={title}
          class={`expandable-icon esri-icon ${startExpanded ? 'esri-icon-down-arrow' : 'esri-icon-right-triangle-arrow'}`}
          id={`expandable-icon-${title}`}></span>
        {title}
      </div>
      <div
        aria-label={title}
        id={`expandable-content-${title}`}
        style={`display: ${startExpanded ? 'block' : 'none'};`}>
        {mainElement}
      </div>
    </div>
  );
}

/*
  Return an icon button that handles keyboard events for clicks and calls a
  function when clicked.
*/
function iconButton(properties: {
  object: any,
  onclick: Function,
  name: string,
  iconName: string,
  classes?: Array<string>
}): JSX.Element {
  const allClasses = ['esri-widget', 'esri-widget--button'];
  if (properties.classes) {
    properties.classes.forEach((someClass) => { allClasses.push(someClass) });
  }
  return (
    <div
      bind={properties.object}
      class={allClasses.join(' ')}
      onclick={properties.onclick}
      onkeydown={clickOnSpaceOrEnter}
      role='button'
      tabindex='0'
      title={properties.name}>
      <span
        aria-hidden='true'
        class={`esri-icon esri-icon-${properties.iconName}`}>
      </span>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}

/*
  Export helper functions related to rendering so they can be
  imported and used in other files.
*/
export {
  RenderableWidget,
  updateRenderers,
  updateLabeling,
  spaceRendererInfo,
  sectionRendererInfo,
  filterInfo,
  goToSmart,
  imperialDistance,
  attributeRow,
  expandable,
  iconButton,
  formatDate
};
