import { subclass, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

import { filterInfo } from 'app/rendering';

import CustomFilter = require('app/widgets/CustomFilter');

@subclass('esri.widgets.CustomFilterList')
class CustomFilterList extends Widget {
  // The custom filter to update
  @property()
  @renderable()
  public customFilter: CustomFilter;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(params?: { customFilter: CustomFilter }) {
    super();
    // Assign constructor params
    this.set(params);
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): tsx.JSX.Element {
    // Insert the no filter element
    const noFilter = this.customFilter.filter.name === 'CustomLayerList';
    const labelClasses = ['vertical-input'];
    if (noFilter) {
      labelClasses.push('active');
    }
    const filterElements: Array<tsx.JSX.Element> = [
      <label for='CustomLayerList' class={labelClasses.join(' ')}>
        <input
          bind={this}
          checked={noFilter}
          type='radio'
          id='CustomLayerList'
          name='custom-filter-list'
          onchange={this._updateFilter}
          value='No Filter' />
        No Filter
      </label>
    ];
    // Insert the rest of the filters
    filterInfo.filter((info) => {
      return info.showInFilterList;
    }).sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else {
        return 1;
      }
    }).forEach((info) => {
      const isCurrentFilter = this.customFilter.filter.name === info.name;
      const labelClasses = ['vertical-input'];
      if (isCurrentFilter) {
        labelClasses.push('active');
      }
      filterElements.push(
        <label for={info.name} class={labelClasses.join(' ')}>
          <input
            bind={this}
            checked={isCurrentFilter}
            type='radio'
            id={info.name}
            name='custom-filter-list'
            onchange={this._updateFilter}
            value={info.name} />
          {info.name}
        </label>
      );
    });

    return <div>{filterElements}</div>;
  }

  // Called by filter elements to set the custom filter's filter
  private _updateFilter(event: any): void {
    if (event.target.value === 'No Filter') {
      this.customFilter.resetFilter();
    } else {
      this.customFilter.filter = filterInfo.filter((info) => {
        return info.name === event.target.value;
      })[0];
    }
  }
}

/*
  Set the custom filter list widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomFilterList;
