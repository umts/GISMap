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

  // Pass in any properties
  constructor(properties?: { map: WebMap }) {
    super();
    this.sectionLayers = new FilteredLayerList({
      layer: properties.map.layers.find((layer: any) => {
        return layer.title === 'Sections';
      }),
      filterColumnName: 'SectionColor',
      filterOptionInfos: {
        'Red': {label: 'Red Lots'},
        'Blue': {label: 'Blue Lots'},
        'Purple': {label: 'Purple Lots'},
        'Yellow': {label: 'Yellow Lots'},
        'Green': {label: 'Green Lots'},
        'Pink': {label: 'Meter Lots'}
      }
    });
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
              oninput={this._setFilters}
              type='checkbox'
              checked />
            Lots
          </label>
        </div>
        {this.sectionLayers.render()}
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
