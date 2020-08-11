import { subclass, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

import CustomWindow = require('app/widgets/windows/CustomWindow');

@subclass('esri.widgets.WindowManager')
class WindowManager extends Widget {
  // The windows that this widget can open, close and render
  @property()
  private readonly windows: Array<CustomWindow>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(params?: { windows: Array<CustomWindow> }) {
    super();
    // Assign constructor params
    this.set(params);
  }

  // Return an array of rendered windows
  public renderWindows(): Array<tsx.JSX.Element> {
    /*
      Render each custom window into an array.
      Only one window will be visible at a time. They all need to be rendered,
      even if they are not visible, otherwise inputs and buttons in the windows
      will reset.
    */
    const renderedWindows: Array<tsx.JSX.Element> = [];
    this.windows.forEach((window) => {
      renderedWindows.push(window.render());
    });
    return renderedWindows;
  }

  // Toggle a window's visibility by a custom window name
  public toggleWindow(name: string): void {
    const window = this.findWindow(name);

    // Close the window if it is open
    if (window.visible) {
      window.visible = false;
    // Open the window if it is closed
    } else {
      // Close any other custom windows
      this.windows.forEach((otherWindow) => {
        otherWindow.visible = false;
      });
      window.visible = true;
    }
  }

  // Return a window by a custom window name
  public findWindow(name: string): CustomWindow {
    return this.windows.filter((window) => {
      return window.name === name;
    })[0];
  }
}

/*
  Set the window manager widget as the export for this file so it can be
  imported and used in other files.
*/
export = WindowManager;
