import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Basemap = require('esri/Basemap');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

interface BasemapOption {
  id: string;
  name: string;
}

@subclass('esri.widgets.BasemapPicker')
class BasemapPicker extends declared(Widget) {
  // The map view
  @property()
  private view: MapView;

  // Basemaps to choose from
  @property()
  private basemapOptions: Array<BasemapOption>;

  // The id of the current basemap
  @property()
  @renderable()
  public basemapId: string;

  // Pass in any properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: any) {
    super();
    this.basemapId = 'topo';
    this.basemapOptions = [
      {id: 'satellite', name: 'Satellite'},
      {id: 'topo', name: 'Topographical'},
      {id: 'gray-vector', name: 'Vector'}
    ];
  }

  // Run after initialization
  public postInitialize(): void {
    this._setBasemap(this.basemapId);
    this.watch('basemapId', (newBasemapId) => {
      this._setBasemap(newBasemapId);
    });
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    // Generate options with one selected
    const options: Array<JSX.Element> = [];
    this.basemapOptions.forEach((basemapOption) => {
      options.push(
        <option
          value={basemapOption.id}
          selected={basemapOption.id === this.basemapId}>
          {basemapOption.name}
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
    this.basemapId = (event.target as HTMLInputElement).value;
  }

  // Set the basemap by preset id
  private _setBasemap(id: string): void {
    if (this._validId(id)) {
      this.view.map.basemap = Basemap.fromId(id);
    }
  }

  // Return whether or not the given id is a valid basemap id
  private _validId(id: string): boolean {
    return this.basemapOptions.filter((basemapOption) => {
      return basemapOption.id === id;
    }).length > 0;
  }
}

/*
  Set the basemap picker widget as the export for this file so it can be
  imported and used in other files.
*/
export = BasemapPicker;
