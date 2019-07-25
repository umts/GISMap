import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Point = require('esri/geometry/Point');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { SearchSourceType } from 'app/search';
import CustomSearch = require('app/widgets/CustomSearch');
import CustomPopup = require('app/widgets/CustomPopup');

// Neccesary information to display a marker
interface Marker {
  color: string;
  // The text that displays on hover beneath the marker
  annotation?: string;
  point?: Point;
  visible?: boolean;
  /*
    If a marker has a search it will set the search result to the location
    of the marker.
  */
  search?: CustomSearch;
  // If a marker has a popup the popup determines the position of the marker
  popup?: CustomPopup;
}

@subclass('esri.widgets.Markers')
class Markers extends declared(Widget) {
  // The map view
  @property()
  private readonly view: MapView;

  // All the markers that this widget handles
  @property()
  private readonly markers: Array<Marker>;

  public constructor(properties?: { view: MapView, markers: Array<Marker> }) {
    super();
    // Set the marker of each custom search
    properties.markers.forEach((marker) => {
      if (marker.search) {
        marker.search.marker = marker;
      }
    });
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const renderedMarkers: Array<JSX.Element> = [];
    this.markers.forEach((marker) => {
      if (marker.popup) {
        marker.point = marker.popup.point;
        marker.visible = marker.popup.visible && marker.popup.docked;
      }
      const screenPoint = this.view.toScreen(marker.point);
      const styles = [
        `display: ${marker.visible ? 'block' : 'none'}`,
        `left: ${screenPoint.x}px`,
        `top: ${screenPoint.y}px`
      ];
      const classes = ['marker-container'];
      // Special class for the marker for the popup
      if (marker.popup) {
        classes.push('marker-popup');
      }
      renderedMarkers.push(
        <div
          class={classes.join(' ')}
          data-id={marker.search ? marker.search.name : ''}
          draggable='true'
          ondragstart={this._startDrag}
          style={styles.join(';')}>
          <div
            class='marker shadow'
            style={`background-color: ${marker.color}`}>
            <div class='marker-circle'></div>
          </div>
          <div class='marker-annotation shadow'>{marker.annotation}</div>
        </div>
      );
    });
    return (
      <div>
        {renderedMarkers}
      </div>
    );
  }

  // Set the marker and the marker search by name to the given point on the map
  public setSearch(name: string, point: Point): void {
    const marker = this.markers.filter((marker) => {
      if (marker.search) {
        return marker.search.name === name;
      }
      return false;
    })[0];
    marker.visible = true;
    marker.point = point;
    marker.search.setSearchExplicit({
      name: `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`,
      sourceType: SearchSourceType.Location,
      latitude: point.latitude,
      longitude: point.longitude,
    });
    // Render all the markers again
    this.scheduleRender();
  }

  // Store the id of the markers search in the drag event
  private _startDrag(event: any): void {
    event.dataTransfer.setData('search-id', event.target.dataset.id);
  }
}

/*
  Set the markers widget and the marker interface as the export for this file
  so they can be imported and used in other files.
*/
export { Marker, Markers };
