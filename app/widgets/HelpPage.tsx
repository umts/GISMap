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
        <h2>Navigation</h2>
        <p>
          Tap/click on a lot, space or building to see more information about
          it.
        </p>
        <p>
          Click one of the square maroon icons in the menu above to perform
          an action or open a window.
        </p>
        <table>
          <thead>
            <tr><th>Button</th><th>What it does</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{this._staticIconButton('plus')}</td>
              <td>Zoom in on the map</td>
            </tr>
            <tr>
              <td>{this._staticIconButton('minus')}</td>
              <td>Zoom out on the map</td>
            </tr>
            <tr>
              <td>{this._staticIconButton('home')}</td>
              <td>Center the map on UMass Amherst</td>
            </tr>
            <tr>
              <td>{this._staticIconButton('locate')}</td>
              <td>Find my location</td>
            </tr>
            <tr>
              <td>{this._staticIconButton('layers')}</td>
              <td>
                Open the layers window, which allows you to toggle different
                lot colors and space types
              </td>
            </tr>
            <tr>
              <td>{this._staticIconButton('directions')}</td>
              <td>
                Open the directions window, which allows you to find
                walking or driving directions
              </td>
            </tr>
            <tr>
              <td>{this._staticIconButton('link')}</td>
              <td>
                Open the share window, which allows you to copy or email a link
                that leads to your current view of the map
              </td>
            </tr>
            <tr>
              <td>{this._staticIconButton('notice-triangle')}</td>
              <td>
                Open the lot notices/events window, which will display any
                ongoing events that may affect regular parking
              </td>
            </tr>
          </tbody>
        </table>

        <h2>Filters</h2>
        <p>
          The layers window has two tabs, one to toggle layers, and another to
          switch between filters. Only one filter can be enabled at a time,
          and will override any layers you have checked off in the layers tab.
        </p>

        <h2>Satellite imagery</h2>
        <p>
          Switch between satellite and topographical maps by clicking the
          square box in the bottom right corner of the map.
        </p>

        <h2>Feedback</h2>
        <p>Please give us feedback by {emailLink}.</p>

        <h2>External links</h2>
        <ul>
          <li>
            <a
              href='https://www.umass.edu/transportation/where-park'
              target='_blank'>
              Where to park
            </a>
          </li>
          <li>
            <a
              href='https://www.umass.edu/transportation/purchase-permits'
              target='_blank'>
              Purchase a permit
            </a>
          </li>
          <li>
            <a href='https://github.com/umts/GISMap' target='_blank'>
              Source code
            </a>
          </li>
        </ul>
      </div>
    );
  }

  // Return a static icon button
  private _staticIconButton(iconName: string): JSX.Element {
    return (
      <div class='static-icon-button'>
        <span aria-hidden='true' class={`esri-icon esri-icon-${iconName}`}>
        </span>
      </div>
    );
  }
}

/*
  Set the help page widget as the export for this file so it can be
  imported and used in other files.
*/
export = HelpPage;
