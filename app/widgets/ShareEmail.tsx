import { subclass, declared } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');
import { safeUrl } from 'app/url';

@subclass('esri.widgets.ShareEmail')
class ShareEmail extends declared(Widget) {
  public constructor() {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    return (
      <div class="esri-widget">
        <form>
          <div class="form-row">
            <button
              bind={this}
              class='button-right umass-theme-button'
              onclick={this._submit}
              type='submit'>
              Email
            </button>
            <div class="input-container-left">
              <input
                class="esri-input"
                id="share-email-input"
                type="text"
                placeholder="Email address to send to" />
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Submit the form to email a link
  private _submit(): boolean {
    window.location.href = `mailto:${this._inputElement().value}?subject=UMass Map&body=%0A%0A${safeUrl()}`;
    return false;
  }

  // Return this input element
  private _inputElement(): HTMLInputElement {
    return (document.getElementById('share-email-input') as HTMLInputElement);
  }
}

/*
  Set the share email widget as the export for this file so it can be
  imported and used in other files.
*/
export = ShareEmail;
