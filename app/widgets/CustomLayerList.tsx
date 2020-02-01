import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import MapView = require('esri/views/MapView');
import LayerFilter = require('app/widgets/LayerFilter');
import Widget = require('esri/widgets/Widget');

import { spaceRendererInfo, sectionRendererInfo } from 'app/rendering';
import { SearchFilter } from 'app/search';

@subclass('esri.widgets.CustomLayerList')
class CustomLayerList extends declared(Widget) {
  // The map view
  @property()
  private readonly view: MapView

  // List of sections filtered by color into layers
  @property()
  private readonly layerFilters: Array<LayerFilter>;

  /*
    The filter representing how the map layers should be filtered by the
    custom filter widget.
  */
  @property()
  @renderable()
  public filter: SearchFilter

  // Pass in any properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties: {
    view: MapView,
    layerFilters: Array<LayerFilter>
  }) {
    super();
  }

  // Run after this widget is ready
  public postInitialize(): void {
    this.layerFilters.forEach((layerFilter) => {
      layerFilter.watch('clause, visible', () => {
        this._applyLayerFilters();
      });
    });
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const renderedFilters: Array<JSX.Element> = [];
    this.layerFilters.forEach((layerFilter) => {
      renderedFilters.push(layerFilter.render());
    });
    return (
      <div>
        {renderedFilters}
      </div>
    );
  }

  private _applyLayerFilters(): void {
    const clauses = this.layerFilters.map((layerFilter) => {
      return layerFilter.filterClause();
    });
    this.filter = {
      name: 'CustomLayerList',
      visible: false,
      showInFilterList: false,
      clauses: clauses
    }
  }
}

/*
  Set the custom layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomLayerList;
