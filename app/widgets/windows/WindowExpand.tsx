import { subclass, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

import { iconButton } from 'app/rendering';

import WindowManager = require('app/widgets/windows/WindowManager');

@subclass('esri.widgets.WindowExpand')
class WindowExpand extends Widget {
  // The window manager we can use to toggle our window
  @property()
  private readonly windowManager: WindowManager;

  // A descriptive name for the window this expand will open
  @property()
  public readonly name: string;

  // Whether or not to display the loading icon instead of our icon
  @property()
  @renderable()
  public loadingIcon: boolean;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(params?: {
    name: string,
    windowManager: WindowManager,
  }) {
    super();
    // Assign constructor params
    this.set(params);
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): tsx.JSX.Element {
    const window = this.windowManager.findWindow(this.name);
    const iconName = this.loadingIcon ? 'loading-indicator' : window.iconName;
    const name = `Open ${this.name} window`;
    const classes = [];
    if (window.visible) {
      classes.push('active');
    }
    return iconButton({
      object: this,
      onclick: this.expand,
      name: name,
      iconName: iconName,
      classes: classes
    });
  }

  // Toggle the window's visibility
  public expand(): void {
    this.windowManager.toggleWindow(this.name);
  }
}

/*
  Set the window expand widget as the export for this file so it can be
  imported and used in other files.
*/
export = WindowExpand;

