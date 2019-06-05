import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Widget = require("esri/widgets/Widget");

import { getElementStyleSize } from 'app/rendering';

// Interface for objects with a render method
interface RenderableWidget {
  render: any;
}

// Interface for objects with widget and label properties
interface WidgetWithLabel {
  label: string;
  widget: RenderableWidget;
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

  // Whether or not this window is visible
  @property()
  @renderable()
  visible: boolean;

  // Pass in a name and an explicit array of widgets
  constructor(properties?: any) {
    super();
    this.visible = properties.visible || false;
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let renderedElements: Array<JSX.Element> = [];
    /*
      Render each widget label pair in this window and put the result into
      an array.
    */
    this.widgets.forEach((widgetWithLabel) => {
      // Only render the label if it exists
      if (widgetWithLabel.label !== "") {
        renderedElements.push(<p class="widget-label">{widgetWithLabel.label}</p>);
      }
      renderedElements.push(widgetWithLabel.widget.render());
    });

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
        class='navigation-window custom-window'
        key={`${this.name}-window`}
        style={`display: ${this.visible ? 'block' : 'none'}`}>
        {closeButton}
        {renderedElements}
      </div>
    );
  }

  // Close this window
  private _close() {
    this.visible = false;
  }
}

/*
  Set the custom window widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomWindow;

