import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import FeatureLayer = require('esri/layers/FeatureLayer');
import Query = require('esri/tasks/support/Query');
import Widget = require('esri/widgets/Widget');

@subclass('esri.widgets.FilteredLayerList')
class FilteredLayerList extends declared(Widget) {
  // The layer to filter from
  @property()
  @renderable()
  layer: FeatureLayer;

  @property()
  filterColumnName: string;

  @property()
  filterOptions: Array<string>;

  @property()
  filterOptionInfos: any;

  @property()
  @renderable()
  selectedFilterOptions: Array<string>;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.filterOptions = Object.keys(properties.filterOptionInfos);
    properties.layer.definitionExpression = this._whereClause(
      properties.filterColumnName,
      this.filterOptions.filter((option) => {
        return properties.filterOptionInfos[option].checked === 'checked';
      })
    );
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let checkboxes: Array<JSX.Element> = [];
    this.filterOptions.forEach((filterOption) => {
      checkboxes.push(
        <div
          bind={this}
          class='layer-checkbox'
          onclick={this._toggleFilterCheckbox}
          data-filter-option={filterOption}>
          <label for={filterOption} data-filter-option={filterOption}>
            <input
              bind={this}
              class='layer-checkbox-input'
              id={this._checkboxId(filterOption)}
              name={filterOption}
              onchange={this.setSelectedFilters}
              type='checkbox'
              checked={this.filterOptionInfos[filterOption].checked} />
            {this.filterOptionInfos[filterOption].label}
          </label>
        </div>
      );
    });

    return (
      <div>
        {checkboxes}
      </div>
    );
  }

  setSelectedFilters() {
    this.selectedFilterOptions = [];
    this.filterOptions.forEach((filterOption) => {
      const checkbox = this._checkbox(filterOption);
      if (checkbox.checked) {
        this.selectedFilterOptions.push(filterOption);
      }
    });
    this._applyFilters();
  }

  toggleFilters(checked: boolean) {
    this.filterOptions.forEach((filterOption) => {
      this._checkbox(filterOption).checked = checked;
    });
    this.setSelectedFilters();
  }

  private _applyFilters() {
    this.layer.definitionExpression = this._whereClause(this.filterColumnName, this.selectedFilterOptions);
  }

  private _checkbox(filterOption: string): HTMLInputElement {
    return document.getElementById(this._checkboxId(filterOption)) as HTMLInputElement;
  }

  private _checkboxId(filterOption: string): string {
    return `${this.filterColumnName}-${filterOption}-checkbox`;
  }

  private _toggleFilterCheckbox(event: any) {
    const filterOption = event.target.dataset.filterOption;
    if (filterOption) {
      this._toggleCheckbox(this._checkbox(filterOption));
      this.setSelectedFilters();
    }
  }

  private _toggleCheckbox(checkbox: HTMLInputElement) {
    if (checkbox.checked) {
      checkbox.checked = false;
    } else {
      checkbox.checked = true;
    }
  }

  private _whereClause(columnName: string, options: Array<string>): string {
    if (options.length > 0) {
      return `${columnName} in (${options.map((option: any) => {return "'" + option + "'"} ).join()})`;
    } else {
      return `${columnName} is null and ${columnName} is not null`;
    }
  }
}

/*
  Set the filtered layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = FilteredLayerList;
