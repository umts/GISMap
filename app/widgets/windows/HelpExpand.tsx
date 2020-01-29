import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

import WindowManager = require('app/widgets/windows/WindowManager');

@subclass('esri.widgets.HelpExpand')
class HelpExpand extends declared(Widget) {
  // The window that this expand will actually open
  @property()
  private readonly windowManager: WindowManager;

  // Pass in any properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties: { windowManager: WindowManager }) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const window = this.windowManager.findWindow('help');
    return (
      <div
        bind={this}
        onclick={this._expand}
        id='help-expand'
        class='shadow'
        title={window.visible ? 'Close help window' : 'Open help window'}>
        <span aria-hidden='true' class='esri-icon esri-icon-question'></span>
        <div id='help-expand-text'>Help</div>
      </div>
    );
  }

  // Toggle the help window's visibility
  private _expand(): void {
    this.windowManager.toggleWindow('help');
  }
}

/*
  Set the help expand widget as the export for this file so it can be
  imported and used in other files.
*/
export = HelpExpand;

