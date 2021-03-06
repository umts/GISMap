import { subclass, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

@subclass('esri.widgets.FilteredLayerList')
class FilteredLayerList extends Widget {
  // The column name to filter by
  @property()
  private readonly filterColumnName: string;

  // Potential column values to filter by
  @property()
  private readonly filterOptions: Array<string>;

  // More detailed information about each column value
  @property()
  private readonly filterOptionInfos: any;

  // The where clause that other widgets will look at for filtering
  @property()
  public clause: string;

  public constructor(params?: {
    filterColumnName: string,
    filterOptionInfos: any
  }) {
    super();
    // Assign constructor params
    this.set(params);
    // Set filter options based on the keys to the more detailed info
    this.filterOptions = Object.keys(params.filterOptionInfos);
    // Set the starting clause based on the checkboxes that start checked
    this.clause = this._clause(
      params.filterColumnName,
      this.filterOptions.filter((option) => {
        return params.filterOptionInfos[option].checked === 'checked';
      })
    );
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): tsx.JSX.Element {
    const checkboxes: Array<tsx.JSX.Element> = [];
    this.filterOptions.forEach((filterOption) => {
      let icon;
      const iconUrl = this.filterOptionInfos[filterOption].iconUrl;
      const altText = this.filterOptionInfos[filterOption].altText;
      // If we have an image for this filter use it
      if (iconUrl) {
        icon = <img
          alt={altText}
          class='right'
          width='24px'
          height='24px'
          src={iconUrl} />;
      }
      const label = this.filterOptionInfos[filterOption].label;
      checkboxes.push(
        <label
          aria-label={label}
          class='vertical-input'
          for={this._checkboxId(filterOption)}>
          {icon}
          <input
            bind={this}
            id={this._checkboxId(filterOption)}
            name={filterOption}
            onchange={this.setSelectedFilters}
            type='checkbox'
            checked={this.filterOptionInfos[filterOption].checked} />
          {label}
        </label>
      );
    });

    return (
      <div role='group'>
        {checkboxes}
      </div>
    );
  }

  /*
    Go through each checkbox to update what filters are selected, then apply
    those filters.
  */
  public setSelectedFilters(): void {
    const selectedFilterOptions: Array<string> = [];
    this.filterOptions.forEach((filterOption) => {
      const checkbox = this._checkbox(filterOption);
      if (checkbox.checked) {
        selectedFilterOptions.push(filterOption);
      }
    });
    this.clause = this._clause(this.filterColumnName, selectedFilterOptions);
  }

  // Set all of the checkboxes to true or false
  public toggleFilters(checked: boolean): void {
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

  // Toggle a checkbox
  private _toggleCheckbox(checkbox: HTMLInputElement): void {
    if (checkbox.checked) {
      checkbox.checked = false;
    } else {
      checkbox.checked = true;
    }
  }

  // Return the where clause to filter a layer by
  private _clause(columnName: string, options: Array<string>): string {
    if (options.length > 0) {
      let clause = `${columnName} in (${options.map((option: any) => {return '\'' + option + '\''} ).join()})`;
      if (options.indexOf('Null') > -1) {
        clause += `or ${columnName} is null`;
      }
      return clause;
    } else {
      return '0 = 1';
    }
  }
}

/*
  Set the filtered layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = FilteredLayerList;
