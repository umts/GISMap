import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import FeatureLayer = require('esri/layers/FeatureLayer');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import FilteredLayerList = require('app/widgets/FilteredLayerList');
import { spaceRendererInfo, sectionRendererInfo } from 'app/rendering';

@subclass('esri.widgets.CustomLayerList')
class CustomLayerList extends declared(Widget) {
  // The map view
  @property()
  @renderable()
  view: MapView

  // List of sections filtered by color into layers
  @property()
  @renderable()
  sectionLayers: FilteredLayerList;

  // List of spaces filtered by category into layers
  @property()
  @renderable()
  spaceLayers: FilteredLayerList;

  // Pass in any properties
  constructor(properties?: { view: MapView }) {
    super();
    this.sectionLayers = new FilteredLayerList({
      layer: properties.view.map.layers.find((layer: any) => {
        return layer.title === 'Sections';
      }),
      filterColumnName: 'SectionColor',
      filterOptionInfos: sectionRendererInfo()
    });
    this.spaceLayers = new FilteredLayerList({
      layer: properties.view.map.layers.find((layer: any) => {
        return layer.title === 'Spaces';
      }),
      filterColumnName: 'ParkingSpaceSubCategory',
      filterOptionInfos: spaceRendererInfo()
    })
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    return (
      <div>
        {this._renderCustomCheckbox('lots', 'Lots')}
        <div class='indent-1'>
          {this.sectionLayers.render()}
        </div>
        {this._renderCustomCheckbox('lot-labels', 'Lot Numbers')}
        {this._renderCustomCheckbox('building-labels', 'Building Names')}
        {this.spaceLayers.render()}
      </div>
    );
  }

  private _renderCustomCheckbox(uniqueId: string, text: string): JSX.Element {
    return (
      <div
        bind={this}
        class='layer-checkbox'
        onclick={this._toggleCheckbox}
        data-checkbox-id={`${uniqueId}-checkbox`}>
        <label for={uniqueId} data-checkbox-id={`${uniqueId}-checkbox`}>
          <input
            bind={this}
            class='layer-checkbox-input'
            id={`${uniqueId}-checkbox`}
            name={uniqueId}
            onchange={this._checkboxEvent}
            type='checkbox'
            checked />
          {text}
        </label>
      </div>
    );
  }

  // Given an event on a checkbox perform the corresponding event
  private _checkboxEvent(event: any) {
    if (event.target.id === 'lots-checkbox') {
      /*
        Toggle all checkboxes in a filtered layer list based on which checkbox
        the event is coming from.
      */
      this.sectionLayers.toggleFilters(event.target.checked);
    } else if (event.target.id === 'lot-labels-checkbox') {
      // Toggle the visibility of the lot labels
      const sectionsLayer = this.view.map.layers.find((layer) => {
        return layer.title === 'Sections';
      }) as FeatureLayer;
      sectionsLayer.labelsVisible = event.target.checked;
    } else if (event.target.id === 'building-labels-checkbox') {
      // Toggle the visibility of the lot labels
      const buildingsLayer = this.view.map.layers.find((layer) => {
        return layer.title === 'Campus Buildings';
      }) as FeatureLayer;
      buildingsLayer.labelsVisible = event.target.checked;
    }
  }

  /*
    Any element with the attribute data-checkbox-id that triggers this
    function will toggle the corresponding checkbox.
  */
  private _toggleCheckbox(event: any) {
    const checkboxId = event.target.dataset.checkboxId;
    if (checkboxId) {
      const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
      if (checkbox.checked) {
        checkbox.checked = false;
      } else {
        checkbox.checked = true;
      }
      this._checkboxEvent({target: checkbox});
    }
  }
}

/*
  Set the custom layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomLayerList;
