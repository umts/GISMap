import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

@subclass('esri.widgets.FilteredLayerList')
class FilteredLayerList extends declared(Widget) {
  // The column name to filter by
  @property()
  filterColumnName: string;

  // Potential column values to filter by
  @property()
  filterOptions: Array<string>;

  // More detailed information about each column value
  @property()
  filterOptionInfos: any;

  // The where clause that other widgets will look at for filtering
  @property()
  clause: string;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    // Set filter options based on the keys to the more detailed info
    this.filterOptions = Object.keys(properties.filterOptionInfos);
    // Set the starting clause based on the checkboxes that start checked
    this.clause = this._clause(
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
      const iconUrl = this.filterOptionInfos[filterOption].iconUrl;
      // If we have an image for this filter use it
      if (iconUrl) {
        icon = <img
          class='image-right'
          data-filter-option={filterOption}
          width='24px'
          height='24px'
          src={iconUrl} />;
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

  /*
    Go through each checkbox to update what filters are selected, then apply
    those filters.
  */
  setSelectedFilters() {
    let selectedFilterOptions: Array<string> = [];
    this.filterOptions.forEach((filterOption) => {
      const checkbox = this._checkbox(filterOption);
      if (checkbox.checked) {
        selectedFilterOptions.push(filterOption);
      }
    });
    this.clause = this._clause(this.filterColumnName, selectedFilterOptions);
  }

  // Set all of the checkboxes to true or false
  toggleFilters(checked: boolean) {
    this.filterOptions.forEach((filterOption) => {
      this._checkbox(filterOption).checked = checked;
    });
    this.setSelectedFilters();
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

  // Return the where clause to filter a layer by
  private _clause(columnName: string, options: Array<string>): string {
    if (options.length > 0) {
      let clause = `${columnName} in (${options.map((option: any) => {return "'" + option + "'"} ).join()})`;
      if (options.indexOf('Null') > -1) {
        clause += `or ${columnName} is null`;
      }
      return clause;
    } else {
      return `0 = 1`;
    }
  }
}

/*
  Set the filtered layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = FilteredLayerList;
