import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Widget = require("esri/widgets/Widget");

@subclass("esri.widgets.ShareLink")
class ShareLink extends declared(Widget) {
  /*
    Pass in properties as `any` type which will then be cast to
    their correct types.
  */
  constructor(properties?: any) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    return (
      <div class="esri-widget">
        <button
          bind={this}
          class="button-right umass-theme-button"
          onclick={this._copy}>
          Copy
        </button>
        <div class="input-container-left">
          <input
            bind={this}
            class="esri-input"
            id="share-input"
            onclick={this._select}
            readonly=""
            type="text"
            value={`${window.location.href}`} />
        </div>
      </div>
    );
  }

  private _select() {
    this._inputElement()
      .setSelectionRange(0, this._inputElement().value.length);
  }

  private _copy() {
    this._inputElement().select();
    document.execCommand("copy");
  }

  private _inputElement(): HTMLInputElement {
    return (document.getElementById("share-input") as HTMLInputElement);
  }
}

/*
  Set the share link widget as the export for this file so it can be
  imported and used in other files.
*/
export = ShareLink;
