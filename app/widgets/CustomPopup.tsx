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

import { spaceRendererInfo, expandable } from 'app/rendering';
import { FeatureForUrl } from 'app/url';

interface ScreenPoint {
  x: number;
  y: number;
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

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.visible = false;
    this.point = new Point();
    this.features = [];
    this.page = 0;
  }

  postInitialize() {
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

    const closeButton = (
      <div
        bind={this}
        class="esri-widget esri-widget--button custom-window-close"
        onclick={this.reset}
        tabindex='0'
        title={`Close popup`}>
        <span class={`esri-icon esri-icon-close`}></span>
      </div>
    );

    let screenPoint = this.view.toScreen(this.point);
    return (
      <div
        class='custom-popup-container'
        style={`
          display: ${this.visible ? 'block' : 'none'};
          left: ${screenPoint.x}px;
          top: ${screenPoint.y}px;
        `}>
        <div class='popup-pointer-container'>
          <div class='popup-pointer'></div>
        </div>
        <div
          class='navigation-window custom-popup'>
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
    console.log('OPEN FROM MOUSE CLICK');
    // Reset popup variables
    this.reset();
    this.point = event.mapPoint;

    const queryGeometry = this._circleAt(event.screenPoint);

    [
      this._getLayer('Sections'),
      this._getLayer('Campus Buildings'),
      this._getLayer('Spaces')
    ].forEach((layer) => {
      let query = layer.createQuery();
      /*
        Query features that intersect the circle around the point from
        the click event.
      */
      query.geometry = queryGeometry;
      query.spatialRelationship = 'intersects';
      // Ensure the query returns all fields, in particular the OBJECTID field
      query.outFields = ['*'];

      layer.queryFeatures(query)
      .then((results) => {
        if (results.features.length > 0) {
          // Add more features to the popup
          this.features = this.features.concat(results.features);
          this.visible = true;
        }
      }).catch((error) => {
        console.error(error);
      });
    });
  }

  // Open a popup to a feature from the url
  openFromUrl(featureForUrl: FeatureForUrl) {
    // Do not try to load the feature if not all the params exist
    if (!featureForUrl.id || !featureForUrl.layer) {
      return;
    }
    /*
      Immediately set this before querying so that the url does not reset to
      have no popup parameter.
    */
    this.featureForUrl = featureForUrl;
    const layer = this._getLayer(featureForUrl.layer);
    let query = layer.createQuery();
    let idColumn = 'OBJECTID_1';
    if (featureForUrl.layer === 'Campus Buildings') {
      idColumn = 'OBJECTID';
    }
    query.where = `${idColumn} = '${featureForUrl.id}'`;
    query.outSpatialReference = new SpatialReference({"wkid":4326});
    // Ensure the query returns all fields, in particular the OBJECTID field
    query.outFields = ['*'];

    layer.queryFeatures(query)
    .then((results) => {
      this.reset();
      console.log('POPUP FEATURE QUERY RETURNED');
      if (results.features.length > 0) {
        // Add more features to the popup
        this.features = this.features.concat(results.features);
        this.visible = true;
        // Grab point from geometry
        if ((results.features[0].geometry as any).centroid) {
          this.point = (results.features[0].geometry as Polygon).centroid;
        } else {
          this.point = results.features[0].geometry as Point;
        }
      }
    }).catch((error) => {
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
    console.log('UPDATING FEATURE FOR URL');
    console.log(this.page);
    console.log(this.features);
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

  /*
    Generate a 'circle' in latitude/longitude given a point on the screen in
    pixels.
  */
  private _circleAt(screenPoint: ScreenPoint): Polygon {
    const delta = 16;
    const screenVertices: Array<ScreenPoint> = [
      {x: screenPoint.x - delta, y: screenPoint.y - delta},
      {x: screenPoint.x + delta, y: screenPoint.y - delta},
      {x: screenPoint.x + delta, y: screenPoint.y + delta},
      {x: screenPoint.x - delta, y: screenPoint.y + delta}
    ]

    const mapVertices = screenVertices.map((screenPoint) => {
      const mapPoint = this.view.toMap(screenPoint);
      /*
        Explicitly grab lat/lon or else the polygon will try to convert back
        to the MA spatial reference.
      */
      return [mapPoint.longitude, mapPoint.latitude];
    });
    let circle = new Polygon();
    // Polygon ring requires the final point to be the same as the first
    circle.addRing(mapVertices.concat([mapVertices[0]]));
    return circle;
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
      title = <p class='widget-label'>
        {feature.attributes.SectionName} ({feature.attributes.SectionColor})
      </p>;
    } else {
      title = <p class='widget-label'>
        {feature.attributes.SectionName}
      </p>;
    }

    const parkmobileLink = (
      <a target='_blank' href='https://www.umass.edu/transportation/pay-cell-parkmobile'>
        ParkMobile
      </a>
    );
    let parkmobile;
    if (feature.attributes.ParkmobileZoneID) {
      parkmobile = <p>{parkmobileLink} Zone: {feature.attributes.ParkmobileZoneID}</p>
    } else {
      parkmobile = <p>No {parkmobileLink} available.</p>
    }

    let sectionHours;
    let paymentInfo;
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
      paymentInfo = ' Payment is $1.50 per hour.';
    }
    if (feature.attributes.SectionHours === 'BusinessHours') {
      sectionHours = <p>{parkingType} required 7:00 AM to {endTime} Monday through Friday.{paymentInfo}</p>;
    } else if (feature.attributes.SectionHours === 'Weekdays') {
      sectionHours = <p>{parkingType} required any time Monday through Friday.{paymentInfo}</p>;
    } else if (feature.attributes.SectionHours === '24Hour') {
      sectionHours = <p>{parkingType} required at all times.{paymentInfo}</p>;
    }

    const permitLink = (
      <a target='_blank' href='https://umass.t2hosted.com/cmn/auth_ext.aspx'>
        Permits
      </a>
    );
    // Who can park here or buy a permit here
    let permitInfo;
    if (feature.attributes.SectionColor === 'Red') {
      permitInfo = <p>{permitLink} for this lot sold to faculty and staff only.</p>;
    } else if (feature.attributes.SectionColor === 'Blue') {
      permitInfo = <p>{permitLink} for this lot sold to faculty,
        staff and graduate students only.</p>;
    } else if (feature.attributes.SectionColor === 'Green') {
      permitInfo = <p>{permitLink} for this lot sold to faculty,
        staff, graduate students and non-residential students only.</p>;
    } else if (feature.attributes.SectionColor === 'Yellow') {
      permitInfo = <p>{permitLink} for this lot sold to any
        university community member.</p>;
    } else if (feature.attributes.SectionColor === 'Purple') {
      permitInfo = <p>{permitLink} for this lot sold to residential students only.</p>;
    } else if (feature.attributes.SectionColor === 'Pink') {
      permitInfo = <p>Visitor and non-permit parking.</p>;
    }

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
          <div>{sectionHours}{permitInfo}{parkmobile}</div>
        )}
        {spaceCountExpand}
      </div>
    );
  }

  // Return a JSX element describing a building
  private _renderBuilding(feature: Graphic): JSX.Element {
    return (
      <div key={feature.layer.title + feature.attributes.OBJECTID}>
        <p class='widget-label'>{feature.attributes.Building_Name}</p>
        <p><b>{feature.attributes.Address}</b></p>
        {
          expandable(
            'Image',
            false,
            'expandable-header',
            <img height='160px' src={feature.attributes.PhotoURL} />
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
      icon = <img class='image-in-text' width='24px' height='24px' src={iconUrl} />;
    }
    let description = '';
    if (feature.attributes.ParkingSpaceSubCategory === 'R-15Min') {
      description += '15 minute loading zone.';
    } else if (['Meter-Paystation', 'Meter-Coin'].indexOf(feature.attributes.ParkingSpaceSubCategory) !== -1) {
      description += '$1.50 per hour.';
    }
    if (feature.attributes.ParkingSpaceClientPublic) {
      description += `Reserved for: ${feature.attributes.ParkingSpaceClientPublic}`;
    }
    return (
      <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
        <p class='widget-label'>
          {categoryInfo.description}{icon}
        </p>
        <p>{description}</p>
      </div>
    );
  }
}

/*
  Set the custom popup widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomPopup;
