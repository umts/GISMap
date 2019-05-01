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

  // The column name to filter by
  @property()
  filterColumnName: string;

  // Potential column values to filter by
  @property()
  filterOptions: Array<string>;

  // More detailed information about each column value
  @property()
  filterOptionInfos: any;

  // Which column values have been selected to filter by
  @property()
  @renderable()
  selectedFilterOptions: Array<string>;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    // Set filter options based on the keys to the more detailed info
    this.filterOptions = Object.keys(properties.filterOptionInfos);
    // Start out with some checkboxes checked
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
      let icon;
      // If we have an image for this filter use it
      if (this.filterOptionInfos[filterOption].iconUrl) {
        icon = <img
          class='image-right'
          data-filter-option={filterOption}
          width='24px'
          height='24px'
          src={this.filterOptionInfos[filterOption].iconUrl} />;
      }
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
            {icon}
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

  // Go through each checkbox to update what filters are selected
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

  // Set all of the checkboxes to true or false
  toggleFilters(checked: boolean) {
    this.filterOptions.forEach((filterOption) => {
      this._checkbox(filterOption).checked = checked;
    });
    this.setSelectedFilters();
  }

  // Apply our filters on the layer column
  private _applyFilters() {
    this.layer.definitionExpression = this._whereClause(this.filterColumnName, this.selectedFilterOptions);
  }

  // Return the checkbox for a specific filter
  private _checkbox(filterOption: string): HTMLInputElement {
    return document.getElementById(this._checkboxId(filterOption)) as HTMLInputElement;
  }

  // Return the checkbox id for a specific filter
  private _checkboxId(filterOption: string): string {
    return `${this.filterColumnName}-${filterOption}-checkbox`;
  }

  /*
    Check or uncheck the corresponding checkbox based on the data-filter-option
    attribute.
  */
  private _toggleFilterCheckbox(event: any) {
    const filterOption = event.target.dataset.filterOption;
    if (filterOption) {
      this._toggleCheckbox(this._checkbox(filterOption));
      this.setSelectedFilters();
    }
  }

  // Toggle a checkbox
  private _toggleCheckbox(checkbox: HTMLInputElement) {
    if (checkbox.checked) {
      checkbox.checked = false;
    } else {
      checkbox.checked = true;
    }
  }

  // Return the where clause used for the layer definitionExpression
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
