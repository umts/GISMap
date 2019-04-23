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
        <p>Copy the link below to share this view</p>
        <div class="form-row">
          <input
            class="esri-input"
            onclick="this.setSelectionRange(0, this.value.length)"
            readonly=""
            type="text"
            value={`${window.location.href}`} />
        </div>
      </div>
    );
  }
}

/*
  Set the share link widget as the export for this file so it can be
  imported and used in other files.
*/
export = ShareLink;
