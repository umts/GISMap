import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Widget = require("esri/widgets/Widget");

@subclass("esri.widgets.WindowExpand")
class WindowExpand extends declared(Widget) {
  // The name to reference a custom window by the same name
  @property()
  @renderable()
  name: string;

  // The name of the esri icon class to use
  @property()
  @renderable()
  iconName: string;

  /*
    Pass in properties as `any` type which will then be cast to
    their correct types.
  */
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
        title={this.name.charAt(0).toUpperCase() + this.name.slice(1)}>
        <span class={`esri-icon esri-icon-${this.iconName}`}></span>
      </div>
    );
  }

  // Open or close the custom window based on our name
  private _expand() {
    const attachedWindow = document.getElementById(`${this.name}-window`);
    if (attachedWindow.style.display === 'none') {
      // Close any other custom windows first
      const customWindows = document.getElementsByClassName('custom-window');
      for (let i = 0; i < customWindows.length; i += 1) {
        (customWindows[i] as HTMLElement).style.display = 'none';
      }
      attachedWindow.style.display = 'block';
    } else {
      attachedWindow.style.display = 'none';
    }
  }
}

/*
  Set the window expand widget as the export for this file so it can be
  imported and used in other files.
*/
export = WindowExpand;

