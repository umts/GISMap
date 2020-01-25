import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

import CustomWindow = require('app/widgets/windows/CustomWindow');

import { iconButton } from 'app/rendering';

@subclass('esri.widgets.WindowExpand')
class WindowExpand extends declared(Widget) {
  // The name of the esri icon class to use
  @property()
  private readonly iconName: string;

  // The window that this expand will actually open
  @property()
  private readonly window: CustomWindow;

  // Any other windows that need to be closed before this window can be opened
  @property()
  private readonly windows: Array<CustomWindow>;

  // A descriptive name for the window this expand will open
  @property()
  public readonly name: string;

  // Whether or not to display the loading icon instead of our icon
  @property()
  @renderable()
  public loadingIcon: boolean;

  // Pass in any properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: {
    name: string,
    iconName: string,
    window: CustomWindow,
    windows: Array<CustomWindow>
  }) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const iconName = this.loadingIcon ? 'loading-indicator' : this.iconName;
    const name = `Open ${this.name} window`;
    const classes = [];
    if (this.window.visible) {
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

  /*
    Referencing the custom window by the same name, open the window if it
    is closed, and close the window if it is open.
  */
  public expand(): void {
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

