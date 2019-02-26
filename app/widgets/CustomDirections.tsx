import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

import Search = require("esri/widgets/Search");
import Widget = require("esri/widgets/Widget");

@subclass("esri.widgets.CustomDirections")
class CustomDirections extends declared(Widget) {
  @property()
  @renderable()
  startSearch: Search;

  @property()
  @renderable()
  endSearch: Search;

  // Pass in any properties
  constructor(properties?: any) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    return (
      <div class='esri-widget'>
        <form>
          {this.startSearch.render()}
          {this.endSearch.render()}
          <select class='umass-theme-button'>
            <option>Google Maps</option>
            <option>OpenStreetMap</option>
          </select>
          <button class='submit-button umass-theme-button' type='submit'>
            Go
          </button>
        </form>
      </div>
    );
  }
}

/*
  Set the custom directions widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomDirections;
