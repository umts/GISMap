import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

import { SearchFilterClause } from 'app/search';
import {
  AttributeFilter,
  AttributeFilterType
} from 'app/widgets/AttributeFilter';

@subclass('esri.widgets.LayerFilter')
class LayerFilter extends declared(Widget) {
  @property()
  private readonly layerName: string;

  @property()
  private readonly publicName: string;

  @property()
  private readonly attributeFilters: Array<AttributeFilter>;

  @property()
  private visible: boolean;

  @property()
  private clause: string;

  public constructor(properties: {
    layerName: string,
    publicName?: string,
    attributeFilters?: Array<AttributeFilter>,
    visible?: boolean
  }) {
    super();
  }

  // Run after this widget is ready
  public postInitialize(): void {
    if (this.attributeFilters) {
      this.attributeFilters.forEach((attributeFilter) => {
        attributeFilter.watch('filteredValues, filterByPresent', () => {
          this._applyAttributeFilters();
        });
      });
    }
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    let layerLabel = this.layerName;
    if (this.publicName) {
      layerLabel = this.publicName;
    }

    let renderedFilters
    if (this.attributeFilters) {
      renderedFilters = this.attributeFilters.map((attributeFilter) => {
        return attributeFilter.render();
      });
    }
    let filterContainer;
    if (renderedFilters && renderedFilters.length > 0) {
      filterContainer = <div class='indent-1'>{renderedFilters}</div>;
    }

    return (
      <div>
        <label
          class='vertical-input'
          for={`${this.layerName}-checkbox`}>
          <input
            bind={this}
            id={`${this.layerName}-checkbox`}
            name={this.layerName}
            onchange={this._toggleLayer}
            type='checkbox'
            checked />
          {layerLabel}
        </label>
        {filterContainer}
      </div>
    );
  }

  public filterClause(): SearchFilterClause {
    return {
      layerName: this.layerName,
      clause: this.clause,
      visible: this.visible,
      labelsVisible: true
    };
  }

  private _toggleLayer(event: any): void {
    this.visible = event.target.checked;
  }

  private _applyAttributeFilters(): void {
    // Go through each attribute filter, if it 
    this.clause = this.attributeFilters.map((attributeFilter) => {
      return attributeFilter.filterClause();
    }).filter((filterClause) => {
      return filterClause !== null;
    }).join(' and ');
    console.log('NEW CLAUSE', this.clause);
  }
}

// Export layer filter for use in other files
export = LayerFilter;
