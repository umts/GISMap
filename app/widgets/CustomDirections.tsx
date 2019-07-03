import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

import CustomSearch = require('app/widgets/CustomSearch');

@subclass('esri.widgets.CustomDirections')
class CustomDirections extends declared(Widget) {
  // Custom search widget for the starting location
  @property()
  @renderable()
  private startSearch: CustomSearch;

  // Custom search widget for the ending location
  @property()
  @renderable()
  private endSearch: CustomSearch;

  // Pass in any properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: any) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    return (
      <div class='esri-widget'>
        <form>
          {this.startSearch.render()}
          {this.endSearch.render()}
          <div class='form-row'>
            <select
              aria-label='Directions service'
              id='directions-service'
              class='umass-theme-button'
              required>
              <option value='google' selected>Google Maps</option>
              <option value='osm'>OpenStreetMap</option>
            </select>
            <button
              bind={this}
              class='button-right umass-theme-button'
              onclick={this._submit}
              type='submit'>
              Go
            </button>
          </div>
        </form>
      </div>
    );
  }

  /*
    Intercept the form submit to open a new window to the requested
    directions and return false.
  */
  private _submit(): boolean {
    const origin = this.startSearch.latitudeLongitude();
    const destination = this.endSearch.latitudeLongitude();
    const service = (document.getElementById('directions-service') as HTMLInputElement).value;
    if (origin && destination && service) {
      let url;
      if (service === 'google') {
        url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      } else if (service === 'osm') {
        url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin};${destination}`;
      } else {
        return false;
      }
      window.open(url, '_blank');
    } else {
      // Show warnings for blank custom searches
      const warning = 'Please enter a search term and select a suggestion.';
      if (!origin) {
        this.startSearch.showWarning(warning);
      }
      if (!destination) {
        this.endSearch.showWarning(warning);
      }
    }
    return false;
  }
}

/*
  Set the custom directions widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomDirections;
