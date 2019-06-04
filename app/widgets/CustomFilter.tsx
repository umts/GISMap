import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import FeatureLayer = require('esri/layers/FeatureLayer');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { SearchFilter } from 'app/search';
import CustomLayerList = require('app/widgets/CustomLayerList');

@subclass('esri.widgets.CustomFilter')
class CustomFilter extends declared(Widget) {
  // The map view
  @property()
  @renderable()
  view: MapView

  // Layer list to apply layer filters when this filter is closed
  @property()
  @renderable()
  layerList: CustomLayerList;

  // Filter to search by
  @property()
  @renderable()
  filter: SearchFilter

  constructor(properties?: any) {
    super();
  }

  postInitialize() {
    this.watch('filter', (newFilter: SearchFilter) => {
      newFilter.clauses.forEach((clause) => {
        const layer = (this.view.map.layers.find((layer) => {
          return layer.title === clause.layerName;
        }) as FeatureLayer);
        layer.definitionExpression = clause.clause;
      });
    });

    this.layerList.watch('filter', (newFilter) => {
      this.filter = newFilter;
    });

    this.resetFilter();
  }

  render() {
    let filterWindow;
    if (this.filter && this.filter.visible) {
      filterWindow = (
        <div id='filter-window' key='filter-window'>
          <div
            bind={this}
            class='esri-widget esri-widget--button custom-filter-close'
            onclick={this.resetFilter}
            tabindex='0'
            title='Close filter'>
            <span class='esri-icon esri-icon-close'></span>
          </div>
          <p class='text-center'>Filter by: {this.filter.name}</p>
        </div>
      );
    }

    return filterWindow;
  }

  resetFilter() {
    this.filter = this.layerList.filter;
  }
}

/*
  Set the custom layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomFilter;
