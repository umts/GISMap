import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

@subclass('esri.widgets.Screenshot')
class Screenshot extends declared(Widget) {
  // Main map view
  @property()
  private readonly view: MapView;

  // Pass in properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: { view: MapView }) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    return (
      <div class='esri-widget'>
        <button
          bind={this}
          class='umass-theme-button'
          onclick={this._takeScreenshot}>
          Take Screenshot
        </button>
      </div>
    );
  }

  private _takeScreenshot(): void {
    this.view.takeScreenshot().then((screenshot) => {
      console.log(screenshot);
      window.open(screenshot.dataUrl);
      return;
    }).catch((error) => {
      throw error;
    });
  }
}

/*
  Set the screenshot widget as the export for this file so it can be
  imported and used in other files.
*/
export = Screenshot;
