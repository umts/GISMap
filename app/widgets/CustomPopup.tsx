import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Graphic = require('esri/Graphic');
import Point = require('esri/geometry/Point');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');
import SimpleLineSymbol = require('esri/symbols/SimpleLineSymbol');
import SimpleFillSymbol = require('esri/symbols/SimpleFillSymbol');

import { spaceRendererInfo, attributeRow, expandable } from 'app/rendering';

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

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.visible = false;
    this.point = new Point();
    this.features = [];
    this.page = 0;
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let featureInfo;
    if (this.page >= 0 && this.page < this.features.length) {
      this._updateSelectionGraphic();
      featureInfo = this._renderFeature(this.features[this.page]);
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
        onclick={this._close}
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
          class='navigation-window custom-popup shadow'>
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

  // Close this popup by hiding it
  private _close() {
    this.visible = false;
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
      <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
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
        <p class='widget-label'>
          {categoryInfo.description}{icon}
        </p>
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
