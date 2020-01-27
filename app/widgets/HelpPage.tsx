import { subclass, declared } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

@subclass('esri.widgets.HelpPage')
class HelpPage extends declared(Widget) {
  public constructor() {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const emailLink = (
      <a href='mailto:parking@umass.edu?subject=UMass Parking Map Feedback'>
        email
      </a>
    );
    return (
      <div>
        Please give us feedback by {emailLink}.
      </div>
    );
  }
}

/*
  Set the help page widget as the export for this file so it can be
  imported and used in other files.
*/
export = HelpPage;
