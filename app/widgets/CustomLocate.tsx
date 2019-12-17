import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { myLocation } from 'app/latLong';
import { iconButton } from 'app/rendering';
import { isUrlInsecure } from 'app/url';

import CustomPopup = require('app/widgets/CustomPopup');

@subclass('esri.widgets.CustomLocate')
class CustomLocate extends declared(Widget) {
  // The map view
  @property()
  private readonly view: MapView;

  // The popup to open when location is found
  @property()
  private readonly popup: CustomPopup;

  // Whether or not this widget is disabled
  @property()
  private readonly disabled: boolean;

  // Pass in properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: { view: MapView, popup: CustomPopup }) {
    super();

    // The geolocation api only works on secure connections
    this.disabled = isUrlInsecure();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const classes = [];
    let name = 'Find my location';
    if (this.disabled) {
      classes.push('disabled');
      name = 'Find my location disabled over insecure connection';
    }
    return iconButton({
      object: this,
      onclick: this._locate,
      name: name,
      iconName: 'locate',
      classes: classes
    });
  }

  // Called when this widget is clicked
  private _locate(): void {
    if (this.disabled) return;

    myLocation().then((location) => {
      this.popup.openFromGeneric(
        'My location',
        location.latitude,
        location.longitude
      );
      return;
    }).catch((error) => {
      console.error(error);
    });
  }
}

/*
  Export the custom locate widget so it can be imported and used in other
  files.
*/
export = CustomLocate;
