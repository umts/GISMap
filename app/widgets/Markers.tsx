import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Point = require('esri/geometry/Point');
import Widget = require('esri/widgets/Widget');

import CustomSearch = require('app/widgets/CustomSearch');
import CustomPopup = require('app/widgets/CustomPopup');

interface Marker {
  name: string;
  point: Point;
  visible: boolean;
  search?: CustomSearch;
  popup?: CustomPopup;
}

@subclass('esri.widgets.Markers')
class Markers extends declared(Widget) {
  @property()
  private markers: Array<Marker>;

  public constructor() {
    super();
    this.markers = [];
  }

  public render(): JSX.Element {
    const renderedMarkers = [];
    this.markers.forEach((marker) => {
      if 
    });
    return (
      <div></div>
    );
  }

  public searchById(id: string): CustomSearch {
    return this.markers.filter((marker) => {
      return id === marker.search.name;
    })[0];
  }
}

/*
  Set the markers widget as the export for this file so it can be
  imported and used in other files.
*/
export = Markers;
