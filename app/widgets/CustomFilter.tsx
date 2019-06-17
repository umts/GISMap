import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import FeatureLayer = require('esri/layers/FeatureLayer');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { SearchFilter } from 'app/search';
import { expandable } from 'app/rendering';
import CustomLayerList = require('app/widgets/CustomLayerList');

@subclass('esri.widgets.CustomFilter')
class CustomFilter extends declared(Widget) {
  // The map view
  @property()
  @renderable()
  view: MapView;

  // Layer list to apply layer filters when this filter is closed
  @property()
  @renderable()
  layerList: CustomLayerList;

  // Filter to search by
  @property()
  @renderable()
  filter: SearchFilter;

  // Pass in any properties
  constructor(properties?: any) {
    super();
  }

  // Run after this widget is ready
  postInitialize() {
    // Watch our own filter property so we can update the view with the filter
    this.watch('filter', (newFilter: SearchFilter) => {
      newFilter.clauses.forEach((clause) => {
        // Set layer filters
        const layer = (this.view.map.layers.find((layer) => {
          return layer.title === clause.layerName;
        }) as FeatureLayer);
        layer.definitionExpression = clause.clause;
        // Set layer label visibility
        if (clause.labelsVisible === true || clause.labelsVisible === false) {
          layer.labelsVisible = clause.labelsVisible;
        }
      });
    });
    /*
      Watch the layer list filter, which should override any other filter if
      updated.
    */
    this.layerList.watch('filter', (newFilter) => {
      this.filter = newFilter;
    });
    // Set our initial filter based on the layer list filter
    this.resetFilter();
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let filterWindow;
    if (this.filter && this.filter.visible) {
      const title = `Filtering by: ${this.filter.name}`;
      let windowContent;
      if (this.filter.description) {
        windowContent = expandable(
          title,
          false,
          'expandable-filter',
          <p class='standalone-text'>{this.filter.description}</p>
        );
      } else {
        windowContent = <p class='standalone-text'>{title}</p>;
      }
      filterWindow = (
        <div id='filter-window' key='filter-window'>
          {windowContent}
          <div
            bind={this}
            class='esri-widget esri-widget--button custom-filter-close'
            onclick={this.resetFilter}
            tabindex='0'
            title='Stop filtering'>
            <span class='esri-icon esri-icon-close'></span>
          </div>
        </div>
      );
    }

    return filterWindow;
  }

  // Manually set this filter to the layer list filter
  resetFilter() {
    this.filter = this.layerList.filter;
  }
}

/*
  Set the custom layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomFilter;
