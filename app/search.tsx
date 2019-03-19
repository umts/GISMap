import Locator = require("esri/tasks/Locator");
import MapView = require("esri/views/MapView");

/*
  Called when search widget changes the view to center on a location.
  This will blur any text inputs to hide mobile keyboards after completing a
  search.
*/
function searchGoToOverride(view: MapView, goToParams: any) {
  const inputs = document.getElementsByClassName('esri-input');
  for (let i = 0; i < inputs.length; i += 1) {
    (inputs[i] as HTMLElement).blur();
  }
  return view.goTo(goToParams.target, goToParams.options);
}

// Return the sources that a search widget should search in
function searchSources() {
  return [{ 
    locator: new Locator({
      url: "https://maps.umass.edu/arcgis/rest/services/Locators/CampusAddressLocatorWithSuggestions/GeocodeServer"
    }),
    singleLineFieldName: "SingleLine",
    name: "UMass Amherst Campus Geolocator Service",
    placeholder: "Find on-campus locations",
    exactMatch: false,
    suggestionsEnabled: true
  }, {
    locator: new Locator({
      url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
    }),
    singleLineFieldName: "SingleLine",
    outFields: ["Addr_type"],
    name: "ArcGIS World Geocoding Service",
    placeholder: "Find off-campus locations",
    localSearchOptions: {
      minScale: 300000,
      distance: 50000
    },
    exactMatch: false,
    suggestionsEnabled: true
  }]
}

/*
  Export helper functions related to search so they can be
  imported and used in other files.
*/
export { searchGoToOverride, searchSources };
