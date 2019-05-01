import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import WebMap = require("esri/WebMap");
import Widget = require('esri/widgets/Widget');

import FilteredLayerList = require('app/widgets/FilteredLayerList');
import { spaceRendererInfo, sectionRendererInfo } from 'app/rendering';

@subclass('esri.widgets.CustomLayerList')
class CustomLayerList extends declared(Widget) {
  // List of sections filtered by color into layers
  @property()
  @renderable()
  sectionLayers: FilteredLayerList;

  // List of spaces filtered by category into layers
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
      filterOptionInfos: sectionRendererInfo()
    });
    this.spaceLayers = new FilteredLayerList({
      layer: properties.map.layers.find((layer: any) => {
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
              onchange={this._toggleAll}
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

  // Toggle all checkboxes in a filtered layer list based
  private _toggleAll(event: any) {
    if (event.target.id === 'lots-checkbox') {
      this.sectionLayers.toggleFilters(event.target.checked);
    }
  }

  /*
    Check or uncheck the corresponding checkbox based on the data-checkbox-id
    attribute.
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
      this._toggleAll({target: checkbox});
    }
  }
}

/*
  Set the custom layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomLayerList;
