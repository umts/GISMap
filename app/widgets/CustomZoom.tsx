import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import MapView = require("esri/views/MapView");
import Widget = require("esri/widgets/Widget");

enum ZoomDirection {
  In = 0,
  Out = 1
}

@subclass("esri.widgets.CustomZoom")
class CustomZoom extends declared(Widget) {
  @property()
  @renderable()
  view: MapView;

  @property()
  direction: ZoomDirection;

  constructor(properties?: any) {
    super();
  }

  render() {
    let iconClass;
    if (this.direction === ZoomDirection.In) {
      iconClass = "esri-icon-plus";
    } else {
      iconClass = "esri-icon-minus";
    }

    return (
      <div
        bind={this}
        class="esri-widget esri-widget--button"
        onclick={this._zoom}
        title={`Zoom ${(this.direction === ZoomDirection.In) ? "in" : "out"}`}>
        <span class={`esri-icon ${iconClass}`}></span>
      </div>
    );
  }

  // Called when widget is clicked
  private _zoom() {
    let newZoom = this.view.zoom +
      (this.direction === ZoomDirection.In ? 1 : -1);
    this.view.goTo({ zoom: newZoom });
  }
}

export { CustomZoom, ZoomDirection };
