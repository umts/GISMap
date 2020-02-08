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
  // If this value should be checked by default
  checked?: boolean;
  // The icon to display for this value
  iconUrl?: string;
  // The alt text for the icon
  altText?: string;
}

@subclass('esri.widgets.AttributeFilter')
class AttributeFilter extends declared(Widget) {
  // Name of the layer this attribute belongs to
  @property()
  private readonly layerName: string;

  // Info on possible values for this attribute
  @property()
  private readonly valueInfos: Array<ValueInfo>;

  // The user facing label to use for this attribute
  @property()
  private readonly attributeLabel: string;

  // The name of the attribute to filter on
  @property()
  public readonly attributeName: string;

  // What type of filtering should be done
  @property()
  public readonly attributeFilterType: AttributeFilterType;

  // The specific values currently being filtered
  @property()
  public filteredValues: Array<string>;

  // Whether or not we are currently filtering by this attribute being present
  @property()
  public filterByPresent: boolean;

  // Whether or not to currently ignore this attribute filter
  @property()
  @renderable()
  public dontCare: boolean;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties: {
    layerName: string,
    attributeName: string,
    attributeLabel?: string,
    attributeFilterType: AttributeFilterType,
    valueInfos: Array<ValueInfo>
  }) {
    super();
  }

  // Run after this widget is ready
  public postInitialize(): void {
    // Ensure filtered values are initialized
    if (this.attributeFilterType === AttributeFilterType.AnyValue) {
      this.filteredValues = this.valueInfos.filter((valueInfo) => {
        return valueInfo.checked;
      }).map((valueInfo) => {
        return valueInfo.value;
      })
    }

    /*
      Uncheck the dont care radio button if dontCare is now false. Uncheck
      the value checkboxes if dontCare is now true.
    */
    this.watch('dontCare', (dontCare) => {
      const dontCareCheckbox = this._dontCareCheckbox();
      if (dontCareCheckbox) {
        if (dontCare) {
          dontCareCheckbox.checked = true;
          this.valueInfos.forEach((valueInfo) => {
            this._valueCheckbox(valueInfo).checked = false;
          });
        } else {
          dontCareCheckbox.checked = false;
        }
      }
    });

    // Set dont care if none of our values are checked to start
    const numCheckedValues = this.valueInfos.filter((valueInfo) => {
      return valueInfo.checked;
    }).length;
    if (numCheckedValues === 0) {
      this.dontCare = true;
    }
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const dontCareId = this._dontCareId();
    const dontCareButton = (
      <label
        class='vertical-input'
        for={dontCareId}>
        <input
          bind={this}
          id={dontCareId}
          name={dontCareId}
          onchange={this._setDontCare}
          type='radio' 
          checked={this.dontCare} />
        Don't care
      </label>
    );

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
            onchange={this._updateFilter}
            type='checkbox' 
            checked={valueInfo.checked} />
          {valueLabel}
        </label>
      );
    });

    const checkboxContainerClasses = [];
    if (this.dontCare) {
      checkboxContainerClasses.push('grayed-out');
    }

    return (
      <div>
        <div class='attribute-filter-separator'>{this.attributeLabel}</div>
        {dontCareButton}
        <div class={checkboxContainerClasses.join(' ')}>
          {renderedCheckboxes}
        </div>
      </div>
    );
  }

  /*
    Return a filter clause that will be applied to the layer. Return null
    if there is nothing to filter by.
  */
  public filterClause(): string {
    // Return if the user has selected dont care for this attribute
    if (this.dontCare) {
      return null;
    }
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

  private _valueCheckbox(valueInfo: ValueInfo): HTMLInputElement {
    return document.getElementById(this._valueId(valueInfo)) as HTMLInputElement;
  }

  private _dontCareId(): string {
    return `${this.layerName}-${this.attributeName}-dont-care`;
  }

  private _dontCareCheckbox(): HTMLInputElement {
    return document.getElementById(this._dontCareId()) as HTMLInputElement;
  }

  private _updateFilter(): void {
    this.filteredValues = [];
    this.filterByPresent = false;
    /*
      Scan through each value info checkbox and update our filters based on
      what was checked.
    */
    this.valueInfos.forEach((valueInfo) => {
      const checkbox = this._valueCheckbox(valueInfo);
      
      if (checkbox && checkbox.checked) {
        this.dontCare = false;
        if (this.attributeFilterType === AttributeFilterType.Present) {
          this.filterByPresent = true;
        } else {
          this.filteredValues.push(valueInfo.value);
        }
      }
    });
  }

  private _setDontCare(event: any): void {
    this.dontCare = event.target.checked;
  }
}

// Export attribute filter for use in other files
export { AttributeFilter, AttributeFilterType };
