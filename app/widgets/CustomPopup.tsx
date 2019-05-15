import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Graphic = require('esri/Graphic');
import Point = require('esri/geometry/Point');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

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
  features: Array<Graphic>;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.visible = false;
    this.point = new Point();
    this.features = [];
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let content: Array<JSX.Element> = [];
    this.features.forEach((feature) => {
      content.push(this._featureInfo(feature));
    });

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
          {content}
        </div>
      </div>
    );
  }

  private _close() {
    this.visible = false;
  }

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
        <div>
          <p class='widget-label'>
            {feature.attributes.SectionName} ({feature.attributes.SectionColor})
          </p>
          {parkmobile}
        </div>
      );
    } else if (feature.layer.title === 'Campus Buildings') {
      return (
        <div>
          <p class='widget-label'>{feature.attributes.Building_Name}</p>
          <b>{feature.attributes.Address}</b>
          <p>
            {feature.attributes.Total_Usable_Floors}
            {feature.attributes.Total_Usable_Floors === 1 ? ' floor' : ' floors'}
          </p>
          <img height="160px" src={feature.attributes.PhotoURL} />
        </div>
      );
    }
    return <div></div>
  }
}

/*
  Set the custom popup widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomPopup;