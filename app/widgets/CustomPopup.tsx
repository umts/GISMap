import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Graphic = require('esri/Graphic');
import WebMap = require('esri/WebMap');
import Point = require('esri/geometry/Point');
import SpatialReference = require('esri/geometry/SpatialReference');
import FeatureLayer = require('esri/layers/FeatureLayer');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');
import SimpleLineSymbol = require('esri/symbols/SimpleLineSymbol');
import SimpleFillSymbol = require('esri/symbols/SimpleFillSymbol');

import RequestSet = require('app/RequestSet');
import { circleAt } from 'app/latLong';
import { getHubData } from 'app/data';
import {
  spaceRendererInfo,
  attributeRow,
  expandable,
  iconButton,
  featureTitle,
  featurePoint,
  formatDate
} from 'app/rendering';
import { SearchSourceType } from 'app/search';
import { FeatureForUrl } from 'app/url';

import CustomDirections = require('app/widgets/CustomDirections');
import CustomPedestrianDirections = require('app/widgets/CustomPedestrianDirections');
import MainNavigation = require('app/widgets/MainNavigation');

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
  private readonly view: MapView;

  // Keep feature request promises in chronological order
  private readonly featureRequestSet: RequestSet;

  /*
    An array of features in the popup's selection. These are Graphics since
    that is what is returned from a feature layer query.
  */
  @property()
  @renderable()
  private features: Array<Graphic>;

  // If the current popup is for a section then this is the associated lot
  @property()
  @renderable()
  private lot: Graphic;

  /*
    The current index to a feature in features. Represents what feature
    is being displayed at the moment.
  */
  @property()
  @renderable()
  private page: number;

  // Direction the popup window should open towards
  @property()
  @renderable()
  private direction: Direction;

  // Whether or not an error has occurred while loading features
  @property()
  @renderable()
  private error: boolean;

  // The main navigation widget so we can open the directions window
  @property()
  public mainNavigation: MainNavigation;

  // Representation of current feature in the popup for use in the URL
  @property()
  public featureForUrl: FeatureForUrl;

  // Whether or not the popup is visible
  @property()
  @renderable()
  public visible: boolean;

  // The map point this popup points to
  @property()
  public point: Point

  // Whether or not the popup is docked to part of the screen
  @property()
  @renderable()
  public docked: boolean;

  // Pass in any properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: { view: MapView }) {
    super();
    this.visible = false;
    this.docked = true;
    this.point = new Point();
    this.features = [];
    this.featureRequestSet = new RequestSet();
    this.page = 0;
  }

  public postInitialize(): void {
    // Open popup by click event listener
    this.view.on('click', (event) => { this.openFromMouseClick(event) });
    // Update the feature for the URL when the current page or features change
    this.watch(['page', 'features'], () => {
      this._updateFeatureForUrl();
      this._updateLot();
    });
    // Update the selection graphic when the popup visibility changes or the
    // selected feature changes.
    this.watch(['visible', 'page', 'features'], () => {
      this._updateSelectionGraphic();
    });
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    let featureInfo;
    let feature;
    // Render the feature information
    if (this.page >= 0 && this.page < this.features.length) {
      feature = this.features[this.page];
      featureInfo = this._renderFeature(feature);
    }
    // If there is an error override feature information with an error message
    if (this.error) {
      featureInfo = <p>
        Error loading feature information. Please try again later.
      </p>;
    }

    const pageCounter = (
      <div
        style={`
          display: ${this.features.length > 1 ? 'flex' : 'none'}
        `}
        class='window-bar-buttons'>
        <button
          bind={this}
          class='umass-theme-button'
          onclick={this._previousPage}>
          Previous
        </button>
        <div class='page-counter-text window-bar-text'>
          ({this.page + 1}/{this.features.length})
        </div>
        <button
          bind={this}
          class='umass-theme-button'
          onclick={this._nextPage}>
          Next
        </button>
      </div>
    );

    const directionsToButton = iconButton({
      object: this,
      onclick: this._directionsTo,
      name: 'Directions to feature',
      iconName: 'directions',
      classes: ['window-bar-button']
    });

    const dockButton = iconButton({
      object: this,
      onclick: this._dock,
      name: `${this.docked ? 'Un-dock' : 'Dock'} feature information`,
      iconName: 'dock-bottom',
      classes: ['window-bar-button']
    });

    const closeButton = iconButton({
      object: this,
      onclick: this.reset,
      name: 'Close feature information',
      iconName: 'close',
      classes: ['window-bar-button']
    });

    const screenPoint = this.view.toScreen(this.point);

    const containerClasses = ['custom-popup-container'];
    if (this.direction === Direction.Up) {
      containerClasses.push('direction-up');
    }
    if (this.docked) {
      containerClasses.push('docked');
    } else {
      containerClasses.push('undocked');
    }
    const styles = [];
    // Styles when docked
    if (this.docked) {
      styles.push(`display: ${this.visible ? 'flex' : 'none'}`);
    // Styles when not docked
    } else {
      styles.push(`display: ${this.visible ? 'block' : 'none'}`);
      styles.push(`left: ${screenPoint.x}px`);
      styles.push(`top: ${screenPoint.y}px`);
    }

    return (
      <div
        class={containerClasses.join(' ')}
        style={styles.join(';')}>
        <div class='popup-pointer-container'>
          <div class='popup-pointer'></div>
        </div>
        <div
          aria-label='Feature information'
          class='navigation-window scrollable custom-popup shadow'
          role='dialog'>
          <div class='window-bar'>
            <div>{pageCounter}</div>
            <div class='window-bar-buttons'>
              {directionsToButton}
              {dockButton}
              {closeButton}
            </div>
          </div>
          <div class='navigation-window-inner scrollable'>
            {featureInfo}
          </div>
        </div>
      </div>
    );
  }

  // Reset variables, hide selection
  public reset(): void {
    this.error = false;
    this.visible = false;
    this.features = [];
    this.page = 0;
    this._updateSelectionGraphic();
  }

  // Open a generic popup for some text at a location
  public openFromGeneric(
    name: string, latitude: number, longitude: number
  ): void {
    this.reset();
    this.point = new Point({ latitude: latitude, longitude: longitude });
    const layer = new FeatureLayer({ title: 'Generic' });
    this.features = [
      new Graphic({
        geometry: this.point, layer: layer, attributes: { name: name }
      })
    ]
    this._open(true, 18);
  }

  // Update the popup widget based on a mouse click event
  public openFromMouseClick(event: any): void {
    this._queryAndUseFeatures(
      ['Sections', 'Campus Buildings', 'Spaces'],
      {
        geometry: circleAt(event.screenPoint, this.view),
        spatialRelationship: 'intersects',
        // Ensure the query returns all fields, in particular the OBJECTID field
        outFields: ['*'],
      }, {
        useGeometry: false,
        goTo: false,
        point: event.mapPoint
      }
    );
  }

  // Open a popup to a feature from the url
  public openFromUrl(featureForUrl: FeatureForUrl): void {
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
        outSpatialReference: new SpatialReference({'wkid': 4326}),
        // Ensure the query returns all fields, in particular the OBJECTID field
        outFields: ['*']
      },
      { useGeometry: true, goTo: false }
    );
  }

  // Open a section popup using a citation location id
  public openFromCitationLocationId(id: string): void {
    this._queryAndUseFeatures(
      ['Sections'],
      { where: `CitationLocationID = ${id}` },
      { useGeometry: true, goTo: true }
    );
  }

  /*
    Use the same query to query features on multiple layers and use them as
    features for this popup.
  */
  private _queryAndUseFeatures(
    layerNames: Array<string>,
    queryParams: any,
    pointParams: { useGeometry: boolean, goTo: boolean, point?: Point }
  ): void {
    // Generate promises to query each layer
    const layerPromises: Array<Promise<any>> = [];
    layerNames.map((layerName) => { return this._getLayer(layerName) })
      .forEach((layer) => {
        const query = layer.createQuery();
        // Set query params
        Object.keys(queryParams).forEach((key) => {
          query[key] = queryParams[key];
        });
        // Add query promise array of layer promises
        layerPromises.push(layer.queryFeatures(query));
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
              this.point = featurePoint(results.features[0]);
            }
          }
        });
        // Open popup only if any of the layer queries returned features
        if (this.features.length > 0) {
          this._open(pointParams.goTo);
        }
        return;
      }).catch((error: string) => {
        console.error(error);
        // Show the error popup
        this.point = pointParams.point;
        this.error = true;
        this._open();
      });
  }

  // Open the popup
  private _open(goTo?: boolean, zoom?: number): void {
    this.visible = true;
    this._setDirection();
    // Make the view go to where the popup was opened if requested
    if (goTo) {
      const target: any = { target: this.point };
      if (zoom) {
        target.zoom = zoom;
      }
      this.view.goTo(target);
    }
  }

  // Go to the next page or feature
  private _nextPage(): void {
    this._changePage(1);
  }

  // Go to the previous page or feature
  private _previousPage(): void {
    this._changePage(-1);
  }

  /*
    Set the destinations of the direction searches to the current popup
    feature. Also open the directions window.
  */
  private _directionsTo(): void {
    const feature = this.features[this.page];
    if (!feature || !this.mainNavigation) {
      return;
    }
    const searchResult = {
      name: featureTitle(feature),
      sourceType: SearchSourceType.Location,
      latitude: featurePoint(feature).latitude,
      longitude: featurePoint(feature).longitude,
    }
    // Set the directions window inputs
    const directionsWindow = this.mainNavigation.windowManager
      .findWindow('directions');
    (directionsWindow.findWidget('Driving directions') as CustomDirections)
      .endSearch.setSearchExplicit(searchResult);
    (directionsWindow.findWidget('Walking directions') as CustomPedestrianDirections)
      .endSearch.setSearchExplicit(searchResult);
    // Open the directions window if needed
    if (!directionsWindow.visible) {
      this.mainNavigation.findWindowExpand('directions').expand();
    }
  }

  // Toggle whether or not the popup is docked
  private _dock(): void {
    if (this.docked) {
      this._setDirection();
      this.docked = false;
    } else {
      this.docked = true;
    }
  }

  /*
    Go forward by the given amount of pages, making sure to stay within
    the bounds of our features.
  */
  private _changePage(amount: number): void {
    if (this.features.length <= 0) return;
    this.page += amount;
    this.page = this.page % this.features.length;
    if (this.page < 0) {
      this.page += this.features.length;
    }
  }

  // Set the direction based on where the point currently is on the screen
  private _setDirection(): void {
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
  private _updateSelectionGraphic(): void {
    const selectionLayer = this.view.map.layers.find((layer) => {
      return layer.title === 'Selection';
    }) as GraphicsLayer;
    selectionLayer.removeAll();

    // Don't render a selection if this popup is closed
    if (!this.visible) return;
    // Don't try to render a selection for point geometry
    if (this.features[this.page].geometry.type === 'point') return;

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
  private _updateFeatureForUrl(): void {
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
    If the current popup feature is a section then query the lots layer
    for the lot corresponding to this section.
  */
  private _updateLot(): void {
    this.lot = null;
    if (this.page >= 0 && this.page < this.features.length) {
      const feature = this.features[this.page];
      if (feature.layer.title === 'Sections') {
        const lotsLayer = this._getLayer('Lots');
        const query = lotsLayer.createQuery();
        query.where = `CitationZoneID = ${feature.attributes.CitationZoneID}`;

        lotsLayer.queryFeatures(query)
          .then((featureSet) => {
            if (featureSet.features.length > 0) {
              this.lot = featureSet.features[0];
            }
            return;
          }).catch((error) => {
            console.error(error);
          });
      }
    }
  }

  // Return a feature layer by title
  private _getLayer(name: string): FeatureLayer {
    return (this.view.map as WebMap).layers.find((layer) => {
      return layer.title === name;
    }) as FeatureLayer;
  }

  // Return waitlist info using data from the hub and the associated lot
  private _waitlistInfo(): any {
    const hubData = getHubData();
    if (hubData && this.lot) {
      return hubData.facilities[this.lot.attributes.FacilityID];
    }
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
    } else if (feature.layer.title === 'Generic') {
      return this._renderGeneric(feature);
    }
    return null;
  }

  // Return a JSX element describing a section
  private _renderSection(feature: Graphic): JSX.Element {
    const title = <h1>{featureTitle(feature)}</h1>;

    const noticeElements: Array<JSX.Element> = [];
    const hubData = getHubData();
    // If the hub data has been loaded yet
    if (hubData) {
      const lotNotices = hubData.lot_notices;
      lotNotices.forEach((lotNotice: any) => {
        const useLotNotice = lotNotice.citation_location_ids
          .find((id: number) => {
            return id.toString() === feature.attributes.CitationLocationID;
          });
        // If this lot notice is for this lot (section)
        if (useLotNotice) {
          // If there is a url with the lot notice, display it as a link
          let linkElement;
          if (lotNotice.url !== '') {
            linkElement = <p>
              <a href={lotNotice.url} target='_blank'>Click here for more info</a>
            </p>;
          }
          const start = formatDate(new Date(lotNotice.start_date));
          const end = formatDate(new Date(lotNotice.end_date));
          noticeElements.push(
            <div class='lot-notice' key='lot-notice'>
              <h2>{lotNotice.title}</h2>
              <p>{lotNotice.description}</p>
              {linkElement}
              <p>From {start} to {end}</p>
            </div>
          );
        }
      });
    // If there is no hub data display an error
    } else {
      noticeElements.push(
        <div class='error' key='lot-notice-error'>Could not load lot notices</div>
      );
    }

    let parkmobile;
    if (feature.attributes.ParkmobileZoneID) {
      parkmobile = attributeRow(
        'ParkMobile',
        `Zone #${feature.attributes.ParkmobileZoneID}`,
        'https://www.umass.edu/transportation/pay-cell-parkmobile'
      );
    }

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
    let sectionHours;
    if (sectionHoursDescription) {
      sectionHours = attributeRow('Hours', sectionHoursDescription);
    }

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
    }
    let permitInfo;
    if (permitInfoDescription) {
      permitInfo = attributeRow(
        'Permit eligibility',
        permitInfoDescription,
        'https://www.umass.edu/transportation/permits'
      );
    }

    // Waitlist info for entire lot
    const waitlistInfo = this._waitlistInfo();
    let waitlistCount;
    let waitlistTime;
    // If there is no hub data display an error
    if (!hubData) {
      waitlistCount = <div class='error'>
        Could not load waitlist information
      </div>;
    // Otherwise try to load waitlist info
    } else if (
      waitlistInfo &&
      feature.attributes.SectionColor &&
      feature.attributes.SectionColor !== 'Pink'
    ) {
      const people = waitlistInfo.waitlist_count === 1 ? 'person' : 'people';
      waitlistCount = attributeRow(
        `${this.lot.attributes.ParkingLotName} waitlist`,
        `${waitlistInfo.waitlist_count} ${people}`
      );
      waitlistTime = attributeRow(
        'Approximate waitlist time',
        waitlistInfo.approximate_wait_time
      );
    }

    // Render space counts
    const spaceCountElements: Array<JSX.Element> = [];
    if (feature.attributes.SpaceCounts) {
      const spaceCounts = JSON.parse(feature.attributes.SpaceCounts);
      // Add special space counts
      Object.keys(spaceCounts).forEach((category) => {
        if (Object.prototype.hasOwnProperty.call(spaceRendererInfo, category)) {
          spaceCountElements.push(
            <tr>
              <td>{spaceRendererInfo[category].label}</td>
              <td class='number'>{spaceCounts[category]}</td>
            </tr>
          );
        }
      });
      // Add total space counts
      if (Object.prototype.hasOwnProperty.call(spaceCounts, 'Total')) {
        spaceCountElements.push(
          <tr>
            <th>Total Spaces</th><th class='number'>{spaceCounts['Total']}</th>
          </tr>
        );
      }
    }

    let spaceCountExpand;
    if (spaceCountElements.length > 0) {
      spaceCountExpand = expandable(
        'Spaces',
        false,
        'expandable-header',
        <table>
          <thead>
            <tr><th>Space Type</th><th>Count</th></tr>
          </thead>
          <tbody>
            {spaceCountElements}
          </tbody>
        </table>
      );
    }

    return (
      <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
        {title}
        {noticeElements}
        <p><b>{feature.attributes.SectionAddress}</b></p>
        {expandable(
          'Description',
          true,
          'expandable-header',
          <div>
            {sectionHours}
            {payment}
            {permitInfo}
            {parkmobile}
            {waitlistCount}
            {waitlistTime}
          </div>
        )}
        {spaceCountExpand}
      </div>
    );
  }

  // Return a JSX element describing a building
  private _renderBuilding(feature: Graphic): JSX.Element {
    return (
      <div key={feature.layer.title + feature.attributes.OBJECTID}>
        <h1>{featureTitle(feature)}</h1>
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
        <h1>{featureTitle(feature)}{icon}</h1>
        {reserved}{payment}{duration}
      </div>
    );
  }

  private _renderGeneric(feature: Graphic): JSX.Element {
    return (
      <div key={feature.layer.title + feature.attributes.name}>
        <h1>{featureTitle(feature)}</h1>
      </div>
    );
  }
}

/*
  Set the custom popup widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomPopup;
