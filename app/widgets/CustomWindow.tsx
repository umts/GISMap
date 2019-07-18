import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

import { clickOnSpaceOrEnter } from 'app/events';
import { RenderableWidget, iconButton } from 'app/rendering';

// Interface for objects with widget and label properties
interface WidgetWithLabel {
  label: string;
  widget: RenderableWidget;
}

@subclass('esri.widgets.CustomWindow')
class CustomWindow extends declared(Widget) {
  // The name of the esri icon class to use
  @property()
  private readonly iconName: string;

  // Whether or not to use tabs to separate the widgets
  @property()
  private readonly useTabs: boolean;

  // The widgets to render in this window
  @property()
  private readonly widgets: Array<WidgetWithLabel>;

  // Which widget is currently being shown when using tabs
  @property()
  private widgetIndex: number;

  /*
    Used for id and title, and is referenced by a window expand with the
    same name.
  */
  @property()
  public readonly name: string;

  // Whether or not this window is visible
  @property()
  @renderable()
  public visible: boolean;

  // Pass in any properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: {
    name: string,
    iconName: string,
    useTabs: boolean,
    widgets: Array<WidgetWithLabel>
  }) {
    super();
    this.widgetIndex = 0;
    this.visible = false;
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const renderedElements: Array<JSX.Element> = [];
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
            onkeydown={clickOnSpaceOrEnter}
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
          <h1>
            {widgetIcon}
            {widgetWithLabel.label}
          </h1>
        );
      }
      if (!this.useTabs || i === this.widgetIndex) {
        renderedElements.push(widgetLabel);
        renderedElements.push(widgetWithLabel.widget.render());
      }
    });

    const closeButton = iconButton({
      object: this,
      onclick: this._close,
      name: `Close ${this.name} window`,
      iconName: 'close',
      classes: ['right']
    });

    return (
      <div
        aria-label={`${this.name} window`}
        class='navigation-window custom-window shadow'
        key={`${this.name}-window`}
        style={`display: ${this.visible ? 'block' : 'none'}`}>
        {closeButton}
        {renderedElements}
      </div>
    );
  }

  // Return a widget by label
  public findWidget(label: string): RenderableWidget {
    return this.widgets.filter((widgetWithLabel) => {
      return widgetWithLabel.label === label;
    })[0].widget;
  }

  // Close this window
  private _close(): void {
    this.visible = false;
  }

  // Set the active tab to be the index of the tab that was clicked
  private _clickTab(event: any): void {
    this.widgetIndex = parseInt(event.target.dataset.index);
  }
}

/*
  Set the custom window widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomWindow;

