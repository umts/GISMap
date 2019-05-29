import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Graphic = require('esri/Graphic');
import Point = require('esri/geometry/Point');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');
import SimpleLineSymbol = require('esri/symbols/SimpleLineSymbol');
import SimpleFillSymbol = require('esri/symbols/SimpleFillSymbol');

import { spaceRendererInfo } from 'app/rendering';

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
      <a target='_blank' href='https://www.umass.edu/transportation/pay-cell-parkmobile'>
        ParkMobile
      </a>
    );
    let parkmobile;
    if (feature.attributes.ParkmobileZoneID) {
      parkmobile = <p>{parkmobileLink} Zone {feature.attributes.ParkmobileZoneID}</p>
    } else {
      parkmobile = <p>No {parkmobileLink} available.</p>
    }

    const permitLink = (
      <a target='_blank' href='https://umass.t2hosted.com/cmn/auth_ext.aspx'>
        Permits
      </a>
    );
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

    return (
      <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
        {title}
        {permitInfo}
        {parkmobile}
      </div>
    );
  }

  // Return a JSX element describing a building
  private _renderBuilding(feature: Graphic): JSX.Element {
    return (
      <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
        <p class='widget-label'>{feature.attributes.Building_Name}</p>
        <b>{feature.attributes.Address}</b>
        <p>
          {feature.attributes.Total_Usable_Floors}
          {feature.attributes.Total_Usable_Floors === 1 ? ' floor' : ' floors'}
        </p>
        <img height='160px' src={feature.attributes.PhotoURL} />
      </div>
    );
  }

  // Return a JSX element describing a space
  private _renderSpace(feature: Graphic): JSX.Element {
    const categoryInfo = spaceRendererInfo()[feature.attributes.ParkingSpaceSubCategory];
    let icon;
    const iconUrl = categoryInfo.iconUrl;
    if (iconUrl) {
      icon = <img class='image-in-text' width='24px' height='24px' src={iconUrl} />;
    }
    return (
      <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
        <p class='widget-label'>
          {categoryInfo.description}{icon}
        </p>
        <p>
          {
            feature.attributes.ParkingSpaceClient &&
            feature.attributes.ParkingSpaceClient !== 'Parking Services' ?
            'Reserved for: ' + feature.attributes.ParkingSpaceClient :
            ''
          }
        </p>
      </div>
    );
  }
}

/*
  Set the custom popup widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomPopup;
