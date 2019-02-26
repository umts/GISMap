import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Widget = require("esri/widgets/Widget");

// Interface for objects with a render method
interface RenderableWidget {
  render: any;
}

// Interface for objects with widget and label properties
interface WidgetWithLabel {
  label: string;
  widget: RenderableWidget;
}

/*
  Return the current padding or margin in pixels of an element assuming the
  padding or margin is uniform on every side.
*/
function getElementStyleSize(element: Element, property: string): number {
  if (['padding', 'margin'].indexOf(property) > -1) {
    return Number(
      window.getComputedStyle(element)
        .getPropertyValue(`${property}-top`).slice(0, -2)
      );
  } else {
    return 0;
  }
}

@subclass("esri.widgets.CustomWindow")
class CustomWindow extends declared(Widget) {
  /*
    Used for id and title, and is referenced by a window expand with the
    same name.
  */
  @property()
  @renderable()
  name: string;

  // The widgets to render in this window
  @property()
  @renderable()
  widgets: Array<WidgetWithLabel>;

  // Pass in a name and an explicit array of widgets
  constructor(properties?: { name: string, widgets: Array<WidgetWithLabel> }) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let renderedElements = [];
    /*
      Render each widget label pair in this window and put the result into
      an array.
    */
    for (let i = 0; i < this.widgets.length; i += 1) {
      const widgetWithLabel = this.widgets[i];
      // Only render the label if it exists
      if (widgetWithLabel.label !== "") {
        renderedElements.push(<p class="widget-label">{widgetWithLabel.label}</p>);
      }
      renderedElements.push(widgetWithLabel.widget.render());
    }

    /*
      Set the height of the main navigation widget so that the custom window
      can scroll off the bottom of the screen properly.
    */
    if (this._isVisible()) {
      const mainNavigation = document.getElementById('main-navigation');
      if (this._mainNavigationHeight() + this._element().scrollHeight > window.innerHeight) {
        // If the window needs to scroll set the height explicitly to 100%
        mainNavigation.style.height = '100%';
        this._element().style['overflow-y'] = 'auto';
      } else {
        // Let it determine its own height if the window does not need to scroll
        mainNavigation.style.height = '';
        this._element().style['overflow-y'] = 'visible';
      }
    }

    const closeButton = (
      <div
        bind={this}
        class="esri-widget esri-widget--button custom-window-close"
        onclick={this._close}
        tabindex='0'
        title={`Close ${this.name}`}>
        <span class={`esri-icon esri-icon-close`}></span>
      </div>
    );

    return (
      <div
        id={`${this.name}-window`}
        class="navigation-window custom-window"
        style={`max-height: calc(100% - ${this._mainNavigationHeight()}px)`}>
        {closeButton}
        {renderedElements}
      </div>
    );
  }

  // Return this element
  private _element() {
    return document.getElementById(`${this.name}-window`);
  }

  // Close this window
  private _close() {
    this._element().style.display = 'none';
  }

  // Return whether or not this window is visible
  private _isVisible() {
    if (this._element()) {
      return !(this._element().style.display === 'none');
    }
    return false;
  }

  /*
    Return the height of the main navigation widget in pixels not including
    the size of this custom window.
  */
  private _mainNavigationHeight(): number {
    const mainWindow = document.getElementById("main-navigation-window");
    const thisWindow = this._element();
    const attribution = document.querySelector(".esri-attribution") as HTMLElement;
    let height = 0;
    if (mainWindow && thisWindow && attribution) {
      const extraHeight = getElementStyleSize(mainWindow, 'margin') +
        getElementStyleSize(thisWindow, 'margin') * 2 +
        getElementStyleSize(thisWindow, 'padding') * 2;
      height = mainWindow.offsetHeight + extraHeight + attribution.offsetHeight;
    }
    return height;
  }
}

/*
  Set the custom window widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomWindow;

