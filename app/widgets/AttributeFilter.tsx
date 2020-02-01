import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

import { ValueInfo } from 'app/search';

@subclass('esri.widgets.AttributeFilter')
class AttributeFilter extends declared(Widget) {
  @property()
  private readonly layerName: string;

  @property()
  private readonly valueInfos: Array<ValueInfo>;

  @property()
  public readonly attributeName: string;

  @property()
  public filteredValues: Array<string>;

  public constructor(properties: {
    layerName: string,
    attributeName: string,
    valueInfos: Array<ValueInfo>
  }) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const renderedCheckboxes = this.valueInfos.map((valueInfo) => {
      const valueId = this._valueId(valueInfo);
      
      let valueLabel = valueInfo.value;
      if (valueInfo.label) {
        valueLabel = valueInfo.label;
      }
      
      return (
        <label
          class='vertical-input'
          for={valueId}>
          <input
            bind={this}
            id={valueId}
            name={valueInfo.label}
            onchange={this._updateFilteredValues}
            type='checkbox' />
          {valueLabel}
        </label>
      );
    });

    return (
      <div>
        {renderedCheckboxes}
      </div>
    );
  }

  private _valueId(valueInfo: ValueInfo): string {
    return `${this.layerName}-${this.attributeName}-${valueInfo.value}-checkbox`;
  }

  private _updateFilteredValues(): void {
    this.filteredValues = [];
    this.valueInfos.forEach((valueInfo) => {
      const checkbox = document.getElementById(this._valueId(valueInfo)) as HTMLInputElement;
      if (checkbox.checked) {
        this.filteredValues.push(valueInfo.value);
      }
    });
  }
}

// Export attribute filter for use in other files
export = AttributeFilter;
