import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Widget = require("esri/widgets/Widget");

import CustomSearch = require("app/widgets/CustomSearch");

function inputValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value;
}

@subclass("esri.widgets.CustomDirections")
class CustomDirections extends declared(Widget) {
  @property()
  @renderable()
  startSearch: CustomSearch;

  @property()
  @renderable()
  endSearch: CustomSearch;

  // Pass in any properties
  constructor(properties?: any) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    return (
      <div class='esri-widget'>
        <form>
          <div class='form-row'>
            {this.startSearch.render()}
          </div>
          <div class='form-row'>
            {this.endSearch.render()}
          </div>
          <div class='form-row'>
            <select id='directions-service' class='umass-theme-button'>
              <option value='google'>Google Maps</option>
              <option value='osm'>OpenStreetMap</option>
            </select>
            <button
              bind={this}
              class='submit-button umass-theme-button'
              onclick={this._submit}
              type='submit'>
              Go
            </button>
          </div>
        </form>
      </div>
    );
  }

  private _submit(): boolean {
    const origin = this.startSearch.latitudeLongitude();
    const destination = this.endSearch.latitudeLongitude();
    const service = inputValue('directions-service');
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
    }
    return false;
  }
}

/*
  Set the custom directions widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomDirections;