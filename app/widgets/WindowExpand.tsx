import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Widget = require("esri/widgets/Widget");

import CustomWindow = require('app/widgets/CustomWindow');

@subclass("esri.widgets.WindowExpand")
class WindowExpand extends declared(Widget) {
  // A descriptive name for the window this expand will open
  @property()
  @renderable()
  name: string;

  // The name of the esri icon class to use
  @property()
  @renderable()
  iconName: string;

  // The window that this expand will actually open
  @property()
  window: CustomWindow;

  // Any other windows that need to be closed before this window can be opened
  @property()
  windows: Array<CustomWindow>;

  // Pass in any properties
  constructor(properties?: any) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    return (
      <div
        bind={this}
        class="esri-widget esri-widget--button"
        onclick={this._expand}
        tabindex='0'
        title={this.name.charAt(0).toUpperCase() + this.name.slice(1)}>
        <span class={`esri-icon esri-icon-${this.iconName}`}></span>
      </div>
    );
  }

  /*
    Referencing the custom window by the same name, open the window if it
    is closed, and close the window if it is open.
  */
  private _expand() {
    if (this.window.visible) {
      // Close this window
      this.window.visible = false;
    } else {
      // Close any other custom windows before opening this one
      this.windows.forEach((window) => {
        window.visible = false;
      });
      // Open this window
      this.window.visible = true;
    }
  }
}

/*
  Set the window expand widget as the export for this file so it can be
  imported and used in other files.
*/
export = WindowExpand;

