import { subclass, property } from 'esri/core/accessorSupport/decorators';
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
class CustomWindow extends Widget {
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

  // The name of the esri icon class to use
  @property()
  public readonly iconName: string;

  // Whether or not this window is visible
  @property()
  @renderable()
  public visible: boolean;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(params?: {
    name: string,
    iconName: string,
    useTabs: boolean,
    widgets: Array<WidgetWithLabel>,
    visible?: boolean
  }) {
    super();
    // Assign constructor params
    this.set(params);
    this.set({
      widgetIndex: 0,
      visible: params.visible || false
    });
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): tsx.JSX.Element {
    const renderedElements: Array<tsx.JSX.Element> = [];
    // Render tabs for each widget if we are using tabs
    if (this.useTabs) {
      const tabs = [];
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
        tabs.push(tab);
      }
      renderedElements.push(<div class='widget-tab-list'>{tabs}</div>);
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
      const visible = !this.useTabs || i === this.widgetIndex;
      renderedElements.push(
        <div style={`display: ${visible ? 'block' : 'none'}`}>
          {widgetLabel}
          {widgetWithLabel.widget.render()}
        </div>
      );
    });

    const closeButton = iconButton({
      object: this,
      onclick: this._close,
      name: `Close ${this.name} window`,
      iconName: 'close',
      classes: ['window-bar-button']
    });

    return (
      <div
        aria-label={`${this.name} window`}
        class='navigation-window scrollable custom-window shadow'
        key={`${this.name}-window`}
        style={`display: ${this.visible ? 'flex' : 'none'}`}>
        <div class='window-bar'>
          <div class='window-bar-text'>
            {this.name.charAt(0).toUpperCase() + this.name.slice(1)}
          </div>
          <div class='window-bar-right'>
            {closeButton}
          </div>
        </div>
        <div class='navigation-window-inner scrollable'>
          {renderedElements}
        </div>
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

