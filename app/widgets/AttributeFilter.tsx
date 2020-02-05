import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

enum AttributeFilterType {
  AnyValue = 0,
  Present = 1,
}

// Represents a single value of an attribute while filtering a layer
interface ValueInfo {
  // The value to use in filtering
  value: string;
  /*
    The label that will appear for this value. If this is blank value will be
    used instead.
  */
  label?: string;
  // The text 'checked' if this value should be checked by default
  checked?: string;
  // The icon to display for this value
  iconUrl?: string;
  // The alt text for the icon
  altText?: string;
}

@subclass('esri.widgets.AttributeFilter')
class AttributeFilter extends declared(Widget) {
  @property()
  private readonly layerName: string;

  @property()
  private readonly valueInfos: Array<ValueInfo>;

  @property()
  private readonly presenceOnly: boolean;

  @property()
  public readonly attributeName: string;

  @property()
  public readonly attributeFilterType: AttributeFilterType;

  @property()
  public filteredValues: Array<string>;

  // Whether or not we are currently filtering by this attribute being present
  @property()
  public filterByPresent: boolean;

  public constructor(properties: {
    layerName: string,
    attributeName: string,
    attributeFilterType: AttributeFilterType,
    valueInfos: Array<ValueInfo>
  }) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const renderedCheckboxes = this.valueInfos.map((valueInfo) => {
      const valueId = this._valueId(valueInfo);

      let icon;
      if (valueInfo.iconUrl) {
        icon = <img
          alt={valueInfo.altText}
          class='right'
          width='24px'
          height='24px'
          src={valueInfo.iconUrl} />;
      }

      let valueLabel = valueInfo.value;
      if (valueInfo.label) {
        valueLabel = valueInfo.label;
      }

      return (
        <label
          class='vertical-input'
          for={valueId}>
          {icon}
          <input
            bind={this}
            id={valueId}
            name={valueInfo.label}
            onchange={this._updateFilteredValues}
            type='checkbox' 
            checked={valueInfo.checked} />
          {valueLabel}
        </label>
      );
    });

    return (
      <div class='attribute-filters'>
        {renderedCheckboxes}
      </div>
    );
  }

  /*
    Return a filter clause that will be applied to the layer. Return null
    if there is nothing to filter by.
  */
  public filterClause(): string {
    // Filter features where attribute is present
    if (this.attributeFilterType === AttributeFilterType.Present) {
      if (this.filterByPresent) {
        return `${this.attributeName} is not null`;
      } else {
        return null;
      }
    // Filter features where attribute is any of the values given
    } else {
      const values = this.filteredValues.map((value) => {
        return `'${value}'`;
      }).join(',');
      if (values.length > 0) {
        return `${this.attributeName} in (${values})`;
      } else {
        return null;
      }
    }
  }

  private _valueId(valueInfo: ValueInfo): string {
    return `${this.layerName}-${this.attributeName}-${valueInfo.value}-checkbox`;
  }

  private _updateFilteredValues(): void {
    this.filteredValues = [];
    this.filterByPresent = false;
    /*
      Scan through each value info checkbox and update our filters based on
      what was checked.
    */
    this.valueInfos.forEach((valueInfo) => {
      const checkbox = document.getElementById(this._valueId(valueInfo)) as HTMLInputElement;
      
      if (checkbox.checked) {
        if (this.attributeFilterType === AttributeFilterType.Present) {
          this.filterByPresent = true;
        } else {
          this.filteredValues.push(valueInfo.value);
        }
      }
    });
  }
}

// Export attribute filter for use in other files
export { AttributeFilter, AttributeFilterType };
