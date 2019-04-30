import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import WebMap = require("esri/WebMap");
import Widget = require('esri/widgets/Widget');

import FilteredLayerList = require('app/widgets/FilteredLayerList');

@subclass('esri.widgets.CustomLayerList')
class CustomLayerList extends declared(Widget) {
  @property()
  @renderable()
  sectionLayers: FilteredLayerList;

  @property()
  @renderable()
  spaceLayers: FilteredLayerList;

  // Pass in any properties
  constructor(properties?: { map: WebMap }) {
    super();
    this.sectionLayers = new FilteredLayerList({
      layer: properties.map.layers.find((layer: any) => {
        return layer.title === 'Sections';
      }),
      filterColumnName: 'SectionColor',
      filterOptionInfos: {
        'Red': {label: 'Red Lots', checked: 'checked'},
        'Blue': {label: 'Blue Lots', checked: 'checked'},
        'Purple': {label: 'Purple Lots', checked: 'checked'},
        'Yellow': {label: 'Yellow Lots', checked: 'checked'},
        'Green': {label: 'Green Lots', checked: 'checked'},
        'Pink': {label: 'Meter Lots', checked: 'checked'}
      }
    });
    this.spaceLayers = new FilteredLayerList({
      layer: properties.map.layers.find((layer: any) => {
        return layer.title === 'Spaces';
      }),
      filterColumnName: 'ParkingSpaceSubCategory',
      filterOptionInfos: {
        'R-Client': {label: 'Reserved Spaces'},
        'R-15Min': {label: '15 Minute Spaces'},
        'R-Handicapped': {label: 'Handicapped Spaces', checked: 'checked'},
        'R-Carpool': {label: 'Carpool Spaces'},
        'R-State': {label: 'State Vehicle Spaces'},
        'Meter-Paystation': {label: 'Paystation Spaces'},
        'Meter-Coin': {label: 'Meter Spaces'},
        'R-Visitor': {label: 'Visitor Spaces'},
        'R-EV Stations': {label: 'Electric Vehicle Charging Stations'},
        'Other': {label: 'Other Spaces'}
      }
    })
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    return (
      <div>
        <div
          bind={this}
          class='layer-checkbox'
          onclick={this._toggleCheckbox}
          data-checkbox-id='lots-checkbox'>
          <label for='lots' data-checkbox-id='lots-checkbox'>
            <input
              bind={this}
              class='layer-checkbox-input'
              id='lots-checkbox'
              name='lots'
              onchange={this._setFilters}
              type='checkbox'
              checked />
            Lots
          </label>
        </div>
        <div class='indent-1'>
          {this.sectionLayers.render()}
        </div>
        {this.spaceLayers.render()}
      </div>
    );
  }

  private _setFilters(event: any) {
    if (event.target.id === 'lots-checkbox') {
      this.sectionLayers.toggleFilters(event.target.checked);
    }
  }

  private _toggleCheckbox(event: any) {
    const checkboxId = event.target.dataset.checkboxId;
    if (checkboxId) {
      const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
      if (checkbox.checked) {
        checkbox.checked = false;
      } else {
        checkbox.checked = true;
      }
      this._setFilters({target: checkbox});
    }
  }
}

/*
  Set the custom layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomLayerList;
