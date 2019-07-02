import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import CustomPopup = require('app/widgets/CustomPopup');

@subclass('esri.widgets.PopupPointer')
class PopupPointer extends declared(Widget) {
  // The main map view
  @property()
  @renderable()
  view: MapView;

  @property()
  @renderable(['point', 'docked', 'visible'])
  popup: CustomPopup;

  constructor(properties?: any) {
    super();
  }

  render() {
    const screenPoint = this.view.toScreen(this.popup.point);
    const visible = this.popup.visible && this.popup.docked;
    const styles = [
      `display: ${visible ? 'block' : 'none'}`,
      `left: ${screenPoint.x}px`,
      `top: ${screenPoint.y}px`
    ];
    return (
      <div class='independent-popup-pointer shadow' style={styles.join(';')}>
        <div class='independent-popup-pointer-circle'></div>
      </div>
    );
  }
}

/*
  Set the popup pointer widget as the export for this file so it can be
  imported and used in other files.
*/
export = PopupPointer;
