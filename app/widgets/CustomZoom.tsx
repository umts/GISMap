import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { iconButton } from 'app/rendering';

/*
  This enum allows us to give a human readable name to numbers that will
  represent which direction the widget can zoom.
*/
enum ZoomDirection {
  In = 0,
  Out = 1
}

@subclass('esri.widgets.CustomZoom')
class CustomZoom extends declared(Widget) {
  /*
    The map view.
    We need this in order to manipulate properties of the view like `zoom`.
  */
  @property()
  private readonly view: MapView;

  // Which direction the zoom widget should zoom, either in or out
  @property()
  private readonly direction: ZoomDirection;

  /*
    Pass in properties like widgets as `any` type which will then be cast to
    their correct types.
  */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: { view: MapView, direction: ZoomDirection }) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    /*
      Set which icon we should use depending on if this widget zooms in or out.
      Use a plus sign for zooming in and a minus sign for zooming out.
    */
    const iconName = (this.direction === ZoomDirection.In) ? 'plus' : 'minus';
    const name = `Zoom ${(this.direction === ZoomDirection.In) ? 'in' : 'out'}`;
    return iconButton({
      object: this,
      onclick: this._zoom,
      name: name,
      iconName: iconName
    });
  }

  // Called when widget is clicked
  private _zoom(): void {
    // Determine what the new zoom should be
    const newZoom = this.view.zoom +
      (this.direction === ZoomDirection.In ? 1 : -1);
    // Tell the view we want to animate when we to go to this new zoom level
    this.view.goTo({ zoom: newZoom });
  }
}

/*
  Export the custom zoom widget and the zoom direction enum so they can be
  imported and used in other files.
*/
export { CustomZoom, ZoomDirection };
