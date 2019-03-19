import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Widget = require("esri/widgets/Widget");

@subclass("esri.widgets.WindowExpand")
class WindowExpand extends declared(Widget) {
  /*
    The reference name used to open the corresponding custom window by the
    same name.
  */
  @property()
  @renderable()
  name: string;

  // The name of the esri icon class to use
  @property()
  @renderable()
  iconName: string;

  // Pass in a name and an icon name
  constructor(properties?: { name: string, iconName: string }) {
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
    const attachedWindow = document.getElementById(`${this.name}-window`);
    if (attachedWindow.style.display === 'block') {
      attachedWindow.style.display = 'none';
    } else {
      // Close any other custom windows before opening this one
      const customWindows = document.getElementsByClassName('custom-window');
      for (let i = 0; i < customWindows.length; i += 1) {
        (customWindows[i] as HTMLElement).style.display = 'none';
      }
      attachedWindow.style.display = 'block';
    }
  }
}

/*
  Set the window expand widget as the export for this file so it can be
  imported and used in other files.
*/
export = WindowExpand;

