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

  // The name of the esri icon class to use
  @property()
  @renderable()
  iconName: string;

  // Whether or not to use tabs to separate the widgets
  @property()
  useTabs: boolean;

  // Which widget is currently being shown when using tabs
  @property()
  widgetIndex: number;

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
    this.widgetIndex = 0;
    this.visible = properties.visible || false;
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let renderedElements: Array<JSX.Element> = [];
    // Render tabs for each widget if we are using tabs
    if (this.useTabs) {
      for (let i = 0; i < this.widgets.length; i += 1) {
        let classes = 'widget-tab';
        if (i === this.widgetIndex) {
          classes += ' widget-tab-active';
        }
        const tab = (
          <div
            bind={this}
            onclick={this._clickTab}
            class={classes}
            data-index={`${i}`}
            role='tab'
            tabindex='0'>
            {this.widgets[i].label}
          </div>
        );
        renderedElements.push(tab);
      }
    }
    /*
      Render each widget label pair in this window and put the result into
      an array.
    */
    this.widgets.forEach((widgetWithLabel, i) => {
      // Only render the label if it exists
      let widgetLabel;
      if (widgetWithLabel.label) {
        let widgetIcon;
        // Only include the icon on the first widget or on every tab
        if (i === 0 || this.useTabs) {
          widgetIcon = (
            <span
              aria-hidden='true'
              class={`widget-label-icon esri-icon esri-icon-${this.iconName}`}>
            </span>
          );
        }
        widgetLabel = (
          <p role='heading' class="widget-label">
            {widgetIcon}
            {widgetWithLabel.label}
          </p>
        );
      }
      if (!this.useTabs || i === this.widgetIndex) {
        renderedElements.push(widgetLabel);
        renderedElements.push(widgetWithLabel.widget.render());
      }
    });

    const closeButton = (
      <div
        bind={this}
        class="esri-widget esri-widget--button custom-window-close"
        onclick={this._close}
        role='button'
        tabindex='0'
        title={`Close ${this.name} window`}>
        <span aria-hidden='true' class={`esri-icon esri-icon-close`}></span>
      </div>
    );

    return (
      <div
        aria-label={`${this.name} window`}
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

  // Set the active tab to be the index of the tab that was clicked
  private _clickTab(event: any) {
    this.widgetIndex = parseInt(event.target.dataset.index);
  }
}

/*
  Set the custom window widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomWindow;

