import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

import { SearchFilterClause } from 'app/search';
import { AttributeFilter } from 'app/widgets/AttributeFilter';

@subclass('esri.widgets.LayerFilter')
class LayerFilter extends declared(Widget) {
  @property()
  private readonly layerName: string;

  @property()
  private readonly publicName: string;

  // Whether or not to show a checkbox to toggle labels for this layer
  @property()
  private readonly allowLabelToggle: boolean;

  // Label that should be used for the label toggle checkbox
  @property()
  private readonly labelToggleLabel: string;

  @property()
  private readonly attributeFilters: Array<AttributeFilter>;

  // Whether or not this layer is visible
  @property()
  private visible: boolean;

  // Whether or not the labels for this layer are visible
  @property()
  private labelsVisible: boolean;

  @property()
  private clause: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties: {
    layerName: string,
    publicName?: string,
    allowLabelToggle?: boolean,
    labelToggleLabel?: string,
    attributeFilters?: Array<AttributeFilter>,
    visible?: boolean,
    labelsVisible?: boolean
  }) {
    super();
    if (properties.visible === undefined) {
      this.visible = true;
    }
    if (properties.labelsVisible === undefined) {
      this.labelsVisible = true;
    }
  }

  // Run after this widget is ready
  public postInitialize(): void {
    if (this.attributeFilters) {
      this.attributeFilters.forEach((attributeFilter) => {
        attributeFilter.watch('filteredValues, filterByPresent, dontCare', () => {
          this._applyAttributeFilters();
        });
      });
      // Apply attribute filters first time
      this._applyAttributeFilters();
    }
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    let layerLabel = this.layerName;
    if (this.publicName) {
      layerLabel = this.publicName;
    }

    let labelToggle;
    if (this.allowLabelToggle) {
      let labelToggleLabel = 'Show labels';
      if (this.labelToggleLabel) {
        labelToggleLabel = this.labelToggleLabel;
      }
      labelToggle = (
        <label
          class='vertical-input'
          for={`${this.layerName}-labels-checkbox`}>
          <input
            bind={this}
            id={`${this.layerName}-labels-checkbox`}
            name={`${this.layerName}-labels`}
            onchange={this._toggleLabels}
            type='checkbox'
            checked={this.labelsVisible} />
          {labelToggleLabel}
        </label>
      );
    }
    let renderedFilters;
    if (this.attributeFilters) {
      renderedFilters = this.attributeFilters.map((attributeFilter) => {
        return attributeFilter.render();
      });
    }
    let filterContainer;
    if (labelToggle || renderedFilters) {
      filterContainer = (
        <div class='indent-1'>
          {labelToggle}
          {renderedFilters}
        </div>
      );
    }

    return (
      <div>
        <label
          class='vertical-input layer-checkbox'
          for={`${this.layerName}-checkbox`}>
          <input
            bind={this}
            id={`${this.layerName}-checkbox`}
            name={this.layerName}
            onchange={this._toggleLayer}
            type='checkbox'
            checked={this.visible} />
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
      labelsVisible: this.labelsVisible
    };
  }

  private _toggleLayer(event: any): void {
    this.visible = event.target.checked;
  }

  private _toggleLabels(event: any): void {
    this.labelsVisible = event.target.checked;
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
