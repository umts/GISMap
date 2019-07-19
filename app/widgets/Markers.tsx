import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Point = require('esri/geometry/Point');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { SearchSourceType } from 'app/search';
import CustomSearch = require('app/widgets/CustomSearch');
import CustomPopup = require('app/widgets/CustomPopup');

interface Marker {
  color: string;
  annotation?: string;
  point?: Point;
  visible?: boolean;
  search?: CustomSearch;
  popup?: CustomPopup;
}

@subclass('esri.widgets.Markers')
class Markers extends declared(Widget) {
  @property()
  private readonly view: MapView;

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

  public setSearch(name: string, point: Point): void {
    const marker = this.markers.find((marker) => {
      if (marker.search) {
        return marker.search.name === name;
      }
      return false;
    });
    marker.visible = true;
    marker.point = point;
    marker.search.setSearchExplicit({
      name: `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`,
      sourceType: SearchSourceType.Location,
      latitude: point.latitude,
      longitude: point.longitude,
    });
    this.scheduleRender();
  }

  private _startDrag(event: any): void {
    event.dataTransfer.setData('search-id', event.target.dataset.id);
  }
}

/*
  Set the markers widget and the marker interface as the export for this file
  so they can be imported and used in other files.
*/
export { Marker, Markers };
