var map;

require([
    "esri/WebMap",
    "esri/views/MapView",
    "esri/widgets/Expand",
    "esri/widgets/Home",
    "esri/widgets/Print",
    "esri/widgets/LayerList",
    "esri/widgets/BasemapToggle",
    "esri/widgets/Search",
    "esri/tasks/Locator",
    "esri/widgets/ScaleBar"
],function(
    WebMap,
    MapView,
    Expand,
    Home,
    Print,
    LayerList,
    BasemapToggle,
    Search,
    Locator,
    ScaleBar
) {
  const mapID = "9330c364e64a491ba00442e050c52f4c"; 
  // set up the web map and view
  map = new WebMap({
    portalItem: {
      id: mapID
    }
  });  
  var view = new MapView({
    container:"viewDiv",
    map: map,
      ui: {
        components: ["zoom","compass","attribution"]
      }
  });

  view.when(function(){

    // handle popup location
    view.popup.dockEnabled = true;
    view.popup.dockOptions = {
      buttonEnabled: false,
      position: "bottom-right"
    }

    // set up widgets 
    var homeWidget = new Home({
      view: view
    });

    var printWidget = new Print({
      view: view,
      container: document.createElement("div"),
      printServiceUrl: 'https://maps.umass.edu/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task'
    })

    var listWidget = new LayerList({ //layer list (allows visibility toggling) + legend
      // there is a separate legend widget too if we'd rather have a non-interactive legend
      view: view,
      listItemCreatedFunction: function (event){
        const item = event.item;
        if (item.layer.type != 'group'){
          item.panel = {
            content: "legend",
            open: false
          };
        }
      }
    });

    var basemapWidget = new BasemapToggle ({
      view: view,
      nextBasemap: "hybrid"
    });

    var searchWidget = new Search({
      view: view,
      includeDefaultSources: false,
      popupEnabled: false,
      sources: [{ 
       locator: new Locator({
         url: "https://maps.umass.edu/arcgis/rest/services/Locators/CampusAddressLocatorWithSuggestions/GeocodeServer"
       }),
        singleLineFieldName: "SingeLine",
        name: "UMass Amherst Campus Geolocator Service",
        placeholder: "Search Campus Locations",
        exactMatch: false,
        suggestionsEnabled: true
      }]
    });
    
    var scaleWidget = new ScaleBar({
      view: view  
    })

    // set up Expand widgets
    var printExpand = new Expand({
      view: view,
      content: printWidget.domNode,
      expandIconClass: "esri-icon-printer"
    })

    // add widgets
    view.ui.add(homeWidget, {position: "top-left"});
    view.ui.add(printExpand, {position: "top-left"});
    view.ui.add(listWidget, {position: "top-right"});
    view.ui.add(basemapWidget, {position: "bottom-left"});
    view.ui.add(searchWidget, {position: "top-left", index: 0});
    view.ui.add(scaleWidget, {position: "bottom-left"})
    })
  });
