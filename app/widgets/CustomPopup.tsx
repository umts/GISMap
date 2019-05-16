import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Graphic = require('esri/Graphic');
import Point = require('esri/geometry/Point');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { spaceRendererInfo } from 'app/rendering';

@subclass('esri.widgets.CustomPopup')
class CustomPopup extends declared(Widget) {
  // The main map view
  @property()
  // Re render any time the view changes so we can re render our popup
  @renderable(['view.center', 'view.zoom', 'view.rotation'])
  view: MapView;

  @property()
  @renderable()
  visible: boolean;

  @property()
  point: Point

  @property()
  @renderable()
  features: Array<Graphic>;

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
    let content: Array<JSX.Element> = [];
    this.features.forEach((feature, index) => {
      if (index === this.page) {
        content.push(this._featureInfo(feature));
      }
    });

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
        <div
          class='navigation-window custom-popup'>
          <div class='popup-pointer'></div>
          {closeButton}
          {pageCounter}
          {content}
        </div>
      </div>
    );
  }

  private _close() {
    this.visible = false;
  }

  private _nextPage() {
    this._changePage(1);
  }

  private _previousPage() {
    this._changePage(-1);
  }

  private _changePage(amount: number) {
    if (this.features.length <= 0) return;
    console.log('change page');
    console.log(`${amount} and ${this.page}/${this.features.length}`);
    this.page += amount;
    this.page = this.page % this.features.length;
    if (this.page < 0) {
      this.page += this.features.length;
    }
  }

  // Return a JSX element describing the feature
  private _featureInfo(feature: Graphic): JSX.Element {
    if (feature.layer.title === 'Sections') {
      const parkmobileLink = (
        <a target='_blank' href='https://parkmobile.io/'>
          Parkmobile
        </a>
      );
      let parkmobile;
      if (feature.attributes.ParkmobileZoneID) {
        parkmobile = <p>{parkmobileLink} Zone #: {feature.attributes.ParkmobileZoneID}</p>
      } else {
        parkmobile = <p>No {parkmobileLink} available</p>
      }
      return (
        <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
          <p class='widget-label'>
            {feature.attributes.SectionName} ({feature.attributes.SectionColor})
          </p>
          {parkmobile}
        </div>
      );
    } else if (feature.layer.title === 'Campus Buildings') {
      return (
        <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
          <p class='widget-label'>{feature.attributes.Building_Name}</p>
          <b>{feature.attributes.Address}</b>
          <p>
            {feature.attributes.Total_Usable_Floors}
            {feature.attributes.Total_Usable_Floors === 1 ? ' floor' : ' floors'}
          </p>
          <img height="160px" src={feature.attributes.PhotoURL} />
        </div>
      );
    } else if (feature.layer.title === 'Spaces') {
      return (
        <div key={feature.layer.title + feature.attributes.OBJECTID_1}>
          <p class='widget-label'>
            {spaceRendererInfo()[feature.attributes.ParkingSpaceSubCategory].description}
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
    return null;
  }
}

/*
  Set the custom popup widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomPopup;