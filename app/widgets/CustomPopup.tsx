import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Graphic = require('esri/Graphic');
import WebMap = require('esri/WebMap');
import Point = require('esri/geometry/Point');
import Polygon = require('esri/geometry/Polygon');
import SpatialReference = require('esri/geometry/SpatialReference');
import FeatureLayer = require('esri/layers/FeatureLayer');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');
import SimpleLineSymbol = require('esri/symbols/SimpleLineSymbol');
import SimpleFillSymbol = require('esri/symbols/SimpleFillSymbol');

import RequestSet = require('app/RequestSet');
import { circleAt } from 'app/latLong';
import {
  spaceRendererInfo,
  attributeRow,
  expandable,
  iconButton
} from 'app/rendering';
import { FeatureForUrl } from 'app/url';

// Direction the popup window should open towards
enum Direction {
  Up = 0,
  Down = 1
}

@subclass('esri.widgets.CustomPopup')
class CustomPopup extends declared(Widget) {
  // The main map view
  @property()
  // Re-render any time the view changes so we can re-render our popup
  @renderable(['view.center', 'view.zoom', 'view.rotation'])
  view: MapView;

  // Whether or not the popup is visible
  @property()
  @renderable()
  visible: boolean;

  // The map point this popup points to
  @property()
  point: Point

  /*
    An array of features in the popup's selection. These are Graphics since
    that is what is returned from a feature layer query.
  */
  @property()
  @renderable()
  features: Array<Graphic>;

  // Keep feature request promises in chronological order
  @property()
  featureRequestSet: RequestSet;

  /*
    The current index to a feature in features. Represents what feature
    is being displayed at the moment.
  */
  @property()
  @renderable()
  page: number;

  // Representation of current feature in the popup for use in the URL
  @property()
  featureForUrl: FeatureForUrl;

  // Direction the popup window should open towards
  @property()
  @renderable()
  direction: Direction;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.visible = false;
    this.point = new Point();
    this.features = [];
    this.featureRequestSet = new RequestSet();
    this.page = 0;
  }

  postInitialize() {
    // Open popup by click event listener
    this.view.on('click', (event) => { this.openFromMouseClick(event) });
    // Update the feature for the URL when the current page or features change
    this.watch(['page', 'features'], this._updateFeatureForUrl);
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let featureInfo;
    if (this.page >= 0 && this.page < this.features.length) {
      const feature = this.features[this.page];
      this._updateSelectionGraphic();
      featureInfo = this._renderFeature(feature);
    }

    const pageCounter = (
      <div
        style={`
          display: ${this.features.length > 1 ? 'inline-block' : 'none'}
        `}>
        <button
          bind={this}
          class='horizontal-list-item umass-theme-button'
          onclick={this._previousPage}>
          Previous
        </button>
        <div class='horizontal-list-item page-counter-text'>
          ({this.page + 1}/{this.features.length})
        </div>
        <button
          bind={this}
          class='horizontal-list-item umass-theme-button'
          onclick={this._nextPage}>
          Next
        </button>
      </div>
    );

    const closeButton = iconButton({
      object: this,
      onclick: this.reset,
      name: 'Close feature information',
      iconName: 'close',
      classes: ['custom-window-close']
    });

    const screenPoint = this.view.toScreen(this.point);

    let containerClasses = ['custom-popup-container'];
    if (this.direction === Direction.Up) {
      containerClasses.push('direction-up');
    }

    return (
      <div
        class={containerClasses.join(' ')}
        style={`
          display: ${this.visible ? 'block' : 'none'};
          left: ${screenPoint.x}px;
          top: ${screenPoint.y}px;
        `}>
        <div class='popup-pointer-container'>
          <div class='popup-pointer'></div>
        </div>
        <div
          aria-label='Feature information'
          class='navigation-window custom-popup shadow'
          role='dialog'>
          {closeButton}
          {pageCounter}
          {featureInfo}
        </div>
      </div>
    );
  }

  // Reset variables, hide selection
  reset() {
    this.visible = false;
    this.features = [];
    this.page = 0;
    this._updateSelectionGraphic();
  }

  // Update the popup widget based on a mouse click event
  openFromMouseClick(event: any) {
    this._queryAndUseFeatures(
      ['Sections', 'Campus Buildings', 'Spaces'],
      {
        geometry: circleAt(event.screenPoint, this.view),
        spatialRelationship: 'intersects',
        // Ensure the query returns all fields, in particular the OBJECTID field
        outFields: ['*'],
      }, {
        useGeometry: false,
        point: event.mapPoint
      }
    );
  }

  // Open a popup to a feature from the url
  openFromUrl(featureForUrl: FeatureForUrl) {
    // Do not try to load the feature if not all the params exist
    if (!featureForUrl.id || !featureForUrl.layer) {
      return;
    }
    /*
      Immediately set featureForUrl before querying so that the url does
      not reset to have no popup parameter.
    */
    this.featureForUrl = featureForUrl;

    let idColumn = 'OBJECTID_1';
    if (featureForUrl.layer === 'Campus Buildings') {
      idColumn = 'OBJECTID';
    }

    this._queryAndUseFeatures(
      [featureForUrl.layer],
      {
        where: `${idColumn} = '${featureForUrl.id}'`,
        outSpatialReference: new SpatialReference({"wkid":4326}),
        // Ensure the query returns all fields, in particular the OBJECTID field
        outFields: ['*']
      }, {
        useGeometry: true
      }
    );
  }

  /*
    Use the same query to query features on multiple layers and use them as
    features for this popup.
  */
  private _queryAndUseFeatures(
    layerNames: Array<string>,
    queryParams: any,
    pointParams: { useGeometry: boolean, point?: Point }
  ) {
    // Generate promises to query each layer
    let layerPromises: Array<Promise<any>> = [];
    layerNames.map((layerName) => { return this._getLayer(layerName) })
    .forEach((layer) => {
      let query = layer.createQuery();
      // Set query params
      Object.keys(queryParams).forEach((key) => {
        query[key] = queryParams[key];
      });
      /*
        Esri is using their own promise type `IPromise`, which is why we
        are wrapping it in a `Promise`.
      */
      layerPromises.push(new Promise((resolve, reject) => {
        resolve(layer.queryFeatures(query));
      }));
    });
    /*
      Tell the request set to use the wrapper promise (all of the
      layer promises) then resolve that promise. By using a `RequestSet` we
      ensure that an older query does not override a newer query just because
      it resolved later than the newer query resolved.
    */
    this.featureRequestSet.setPromise(Promise.all(layerPromises))
    .then((featuresByLayer: Array<any>) => {
      // Reset popup variables
      this.reset();
      this.point = pointParams.point;
      featuresByLayer.forEach((results) => {
        if (results.features.length > 0) {
          // Add features from this layer
          this.features = this.features.concat(results.features);
          // Set point from geometry
          if (pointParams.useGeometry) {
            if ((results.features[0].geometry as any).centroid) {
              this.point = (results.features[0].geometry as Polygon).centroid;
            } else {
              this.point = results.features[0].geometry as Point;
            }
          }
        }
      });
      // Set visible only if any of the layer queries returned features
      if (this.features.length > 0) {
        this.visible = true;
        this._setDirection();
      }
    }, (error: string) => {
      console.error(error);
    });
  }

  // Go to the next page or feature
  private _nextPage() {
    this._changePage(1);
  }

  // Go to the previous page or feature
  private _previousPage() {
    this._changePage(-1);
  }

  /*
    Go forward by the given amount of pages, making sure to stay within
    the bounds of our features.
  */
  private _changePage(amount: number) {
    if (this.features.length <= 0) return;
    this.page += amount;
    this.page = this.page % this.features.length;
    if (this.page < 0) {
      this.page += this.features.length;
    }
  }

  // Set the direction based on where the point currently is on the screen
  private _setDirection() {
    const screenPoint = this.view.toScreen(this.point);
    if (screenPoint.y > this.view.height / 2) {
      this.direction = Direction.Up;
    } else {
      this.direction = Direction.Down;
    }
  }

  /*
    Clear the selection graphics layer then add a new graphic if an element
    in this popup is still selected.
  */
  private _updateSelectionGraphic() {
    const selectionLayer = this.view.map.layers.find((layer) => {
      return layer.title === 'Selection';
    }) as GraphicsLayer;
    selectionLayer.removeAll();

    if (!this.visible) return;

    const graphic = this.features[this.page].clone();
    graphic.symbol = new SimpleFillSymbol({
      color: '#e6f2ff',
      outline: new SimpleLineSymbol({
        color: '#99ccff',
        width: '3px'
      })
    });
    selectionLayer.add(graphic);
  }

  // Update the popup feature for the url
  private _updateFeatureForUrl() {
    if (this.page >= 0 && this.page < this.features.length) {
      const feature = this.features[this.page];
      let id;
      if (feature.layer.title === 'Campus Buildings') {
        id = feature.attributes.OBJECTID;
      } else {
        id = feature.attributes.OBJECTID_1;
      }
      this.featureForUrl = {
        id: id,
        layer: feature.layer.title
      };
    /*
      There is no popup currently selected, so the feature for the url should
      be null.
    */
    } else {
      this.featureForUrl = null;
    }
  }

  // Return a feature layer by title
  private _getLayer(name: string): FeatureLayer {
    return (this.view.map as WebMap).layers.find((layer) => {
      return layer.title === name;
    }) as FeatureLayer;
  }

  /*
    Return a JSX element describing the feature. Note that each div has to
    have its own unique key attribute for rendering, otherwise it errors.
  */
  private _renderFeature(feature: Graphic): JSX.Element {
    if (feature.layer.title === 'Sections') {
      return this._renderSection(feature);
    } else if (feature.layer.title === 'Campus Buildings') {
      return this._renderBuilding(feature);
    } else if (feature.layer.title === 'Spaces') {
      return this._renderSpace(feature);
    }
    return null;
  }

  // Return a JSX element describing a section
  private _renderSection(feature: Graphic): JSX.Element {
    let title;
    if (feature.attributes.SectionColor) {
      title = <h1>
        {feature.attributes.SectionName} ({feature.attributes.SectionColor})
      </h1>;
    } else {
      title = <h1>
        {feature.attributes.SectionName}
      </h1>;
    }

    const parkmobileLink = (
      <b class='attribute-row-label'>
        <a
          target='_blank'
          href='https://www.umass.edu/transportation/pay-cell-parkmobile'>
          ParkMobile
        </a>
      </b>
    );
    let parkmobileDescription;
    if (feature.attributes.ParkmobileZoneID) {
      parkmobileDescription = `Zone #${feature.attributes.ParkmobileZoneID}`;
    } else {
      parkmobileDescription = 'Not available';
    }
    const parkmobile = <div class='space-between attribute-row'>
      {parkmobileLink}
      <p class='attribute-row-content'>{parkmobileDescription}</p>
    </div>;

    let payment;
    let sectionHoursDescription;
    let parkingType = 'Permit';
    /*
      Enforcement end time for lots that are restricted during business hours
      if different for metered lots.
    */
    let endTime = '5:00 PM';
    // Changes in wording for metered lots
    if (feature.attributes.SectionColor === 'Pink') {
      parkingType = 'Payment';
      endTime = '7:00 PM';
      payment = attributeRow('Payment', '$1.50 per hour');
    }
    if (feature.attributes.SectionHours === 'BusinessHours') {
      sectionHoursDescription = `${parkingType} required 7:00 AM to ${endTime} Monday through Friday`;
    } else if (feature.attributes.SectionHours === 'Weekdays') {
      sectionHoursDescription = `${parkingType} required any time Monday through Friday`;
    } else if (feature.attributes.SectionHours === '24Hour') {
      sectionHoursDescription = `${parkingType} required at all times`;
    }
    const sectionHours = attributeRow('Hours', sectionHoursDescription);

    // Who can park here or buy a permit here
    let permitInfoDescription;
    if (feature.attributes.SectionColor === 'Red') {
      permitInfoDescription = 'Faculty and staff only';
    } else if (feature.attributes.SectionColor === 'Blue') {
      permitInfoDescription = 'Faculty, staff and graduate students only';
    } else if (feature.attributes.SectionColor === 'Green') {
      permitInfoDescription = 'Faculty, staff, graduate students and non-residential students only';
    } else if (feature.attributes.SectionColor === 'Yellow') {
      permitInfoDescription = 'Any university community member';
    } else if (feature.attributes.SectionColor === 'Purple') {
      permitInfoDescription = 'Residential students only';
    } else if (feature.attributes.SectionColor === 'Pink') {
      permitInfoDescription = 'No permit required';
    }
    const permitInfo = attributeRow('Permit eligibility', permitInfoDescription);

    // Render space counts
    let spaceCountElements: Array<JSX.Element> = [];
    if (feature.attributes.SpaceCounts) {
      const spaceCounts = JSON.parse(feature.attributes.SpaceCounts);
      Object.keys(spaceCounts).forEach((category) => {
        if (spaceRendererInfo.hasOwnProperty(category)) {
          spaceCountElements.push(
            <li>
              {spaceRendererInfo[category].label}: {spaceCounts[category]}
            </li>
          );
        }
      });
    }

    let spaceCountExpand;
    if (spaceCountElements.length > 0) {
      spaceCountExpand = expandable(
        'Spaces',
        false,
        'expandable-header',
        <ul>{spaceCountElements}</ul>
      );
    }

    return (
      <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
        {title}
        <p><b>{feature.attributes.SectionAddress}</b></p>
        {expandable(
          'Description',
          true,
          'expandable-header',
          <div>{sectionHours}{payment}{permitInfo}{parkmobile}</div>
        )}
        {spaceCountExpand}
      </div>
    );
  }

  // Return a JSX element describing a building
  private _renderBuilding(feature: Graphic): JSX.Element {
    return (
      <div key={feature.layer.title + feature.attributes.OBJECTID}>
        <h1>{feature.attributes.Building_Name}</h1>
        <p><b>{feature.attributes.Address}</b></p>
        {
          expandable(
            'Image',
            false,
            'expandable-header',
            <img
              height='160px'
              src={feature.attributes.PhotoURL}
              alt={feature.attributes.Building_Name} />
          )
        }
      </div>
    );
  }

  // Return a JSX element describing a space
  private _renderSpace(feature: Graphic): JSX.Element {
    const categoryInfo = spaceRendererInfo[feature.attributes.ParkingSpaceSubCategory];
    let icon;
    const iconUrl = categoryInfo.iconUrl;
    if (iconUrl) {
      icon = (
        <img
          class='image-in-text'
          width='24px'
          height='24px'
          src={iconUrl}
          alt={categoryInfo.altText} />
      );
    }
    let duration;
    let payment;
    let reserved;
    if (feature.attributes.ParkingSpaceSubCategory === 'R-15Min') {
      duration = attributeRow('Max duration', '15 minutes');
    } else if (['Meter-Paystation', 'Meter-Coin'].indexOf(feature.attributes.ParkingSpaceSubCategory) !== -1) {
      payment = attributeRow('Payment', '$1.50 per hour');
    }
    if (feature.attributes.ParkingSpaceClientPublic) {
      reserved = attributeRow(
        'Reserved for', feature.attributes.ParkingSpaceClientPublic
      );
    }
    return (
      <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
        <h1>
          {categoryInfo.description}{icon}
        </h1>
        {reserved}{payment}{duration}
      </div>
    );
  }
}

/*
  Set the custom popup widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomPopup;
