import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Basemap = require('esri/Basemap');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

@subclass('esri.widgets.BasemapPicker')
class BasemapPicker extends declared(Widget) {
  // The map view
  @property()
  private view: MapView;

  // The id of the current basemap
  @property()
  @renderable()
  private basemapId: string;

  // Pass in any properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: any) {
    super();
    this.basemapId = 'topo';
  }

  public postInitialize(): void {
    this._setBasemap(this.basemapId);
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const optionInfos = [
      {id: 'satellite', name: 'Satellite'},
      {id: 'topo', name: 'Topographical'},
      {id: 'gray-vector', name: 'Vector'}
    ];
    // Generate options with one selected
    const options: Array<JSX.Element> = [];
    optionInfos.forEach((optionInfo) => {
      options.push(
        <option
          value={optionInfo.id}
          selected={optionInfo.id === this.basemapId}>
          {optionInfo.name}
        </option>
      );
    });
    return (
      <div class='form-row'>
        <select
          bind={this}
          class='umass-theme-button'
          oninput={this._select}>
          {options}
        </select>
      </div>
    );
  }

  // Called when the basemap select is changed
  private _select(event: Event): void {
    this._setBasemap((event.target as HTMLInputElement).value);
  }

  // Set the basemap by preset id
  private _setBasemap(id: string): void {
    this.basemapId = id;
    this.view.map.basemap = Basemap.fromId(id);
  }
}

/*
  Set the basemap picker widget as the export for this file so it can be
  imported and used in other files.
*/
export = BasemapPicker;
