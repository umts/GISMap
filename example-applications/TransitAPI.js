require([
      "esri/config",
      "esri/request",
      "esri/geometry/Point",
      "esri/layers/FeatureLayer"
  ],function(
      esriConfig,
      esriRequest,
      Point,
      FeatureLayer
  ) {
    
    var layer

    /**************************************************
     * Define the specification for each field to create in the layer
     **************************************************/
    
    var fields = [
    {
      name: "ObjectID",
      alias: "ObjectID",
      type: "oid"
    },
    {
      name: "Description",
      alias: "Description",
      type: "string"
    },
    {
      name: "Name",
      alias: "Name",
      type: "string"
    }, {
      name: "StopId",
      alias: "StopId",
      type: "small-integer"
    }, {
      name: "StopRecordId",
      alias: "StopRecordId",
      type: "small-integer"
    } // boolean isn't a type so I'm not sure what to do about IsTimePoint (or if it matters): 
    // https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-Field.html#type
    ];

    // Set up popup template for the layer
    var pTemplate = {
      title: "{Description}",
      content: [{
        type: "fields",
        fieldInfos: [{
          fieldName: "Name",
          label: "Name",
          visible: true}]
      }]
    };

    /**************************************************
     * Define the renderer for symbolizing bus stops
     **************************************************/

    var stopsRenderer = {
      type: "simple", // autocasts as new SimpleRenderer()
      symbol: {
        type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
        style: "triangle",
        size: 10,
        color: [255,255,255,255],
        outline: {
          width: 1,
          color: "#FF0055",
          style: "solid"
        }
      },
    };

      getData()
      .then(createGraphics) // then send it to the createGraphics() method
      .then(createLayer) // when graphics are created, create the layer
      // .then(createLegend) // when layer is created, create the legend
      .catch(errback);

  // Request the bus stop data
  
  function getData() {
    var url = "https://bustracker.pvta.com/InfoPoint/rest/Stops/GetAllStops";

    esriConfig.request.corsEnabledServers.push(url);
    // [esri.config] request.corsEnabledServers is not supported and will be removed
    // in a future release. See http://esriurl.com/cors8664

    return esriRequest(url, {
      responseType: "json"
    });
  }

  // /**************************************************
  //  * Create graphics with returned data
  //  **************************************************/

  function createGraphics(response) {
    // Create an array of Graphics
    return response.data.map(function(feature,i){
      return {
        geometry: new Point({
          x: feature.Longitude,
          y: feature.Latitude
        }),
        // get whatever attributes we'd like to use
        attributes: {
          ObjectID: i,
          Description: feature.Description, // does this differ from Name?
          IsTimePoint: feature.IsTimePoint,
          Name: feature.Name,
          StopId: feature.StopId,
          StopRecordId: feature.StopRecordId
        }
      };
    });
  }

  // /**************************************************
  //  * Create a FeatureLayer with the array of graphics
  //  **************************************************/

  function createLayer(graphics) {

    layer = new FeatureLayer({
      source: graphics, // autocast as an array of esri/Graphic
      title: "Bus Stops",
      // create an instance of esri/layers/support/Field for each field object
      fields: fields, // This is required when creating a layer from Graphics
      objectIdField: "ObjectID", // This must be defined when creating a layer from Graphics
      renderer: stopsRenderer, // set the visualization on the layer
      popupTemplate: pTemplate
    });

    map.add(layer);
    return layer;
  }

  // Executes if data retrieval was unsuccessful.
  function errback(error) {
    console.error("Fetching bus stop data failed: ", error);
  }


});
