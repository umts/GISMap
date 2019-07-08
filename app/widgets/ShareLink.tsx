import { subclass, declared } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

@subclass('esri.widgets.ShareLink')
class ShareLink extends declared(Widget) {
  public constructor() {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
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
