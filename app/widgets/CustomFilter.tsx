import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import FeatureLayer = require('esri/layers/FeatureLayer');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import { SearchFilter } from 'app/search';
import { goToSmart, expandable, iconButton } from 'app/rendering';
import CustomLayerList = require('app/widgets/CustomLayerList');

@subclass('esri.widgets.CustomFilter')
class CustomFilter extends declared(Widget) {
  // Clauses that should always be applied to specific layers
  private static defaultClauses = {
    'Sections': 'SectionPublicVisible = \'Yes\''
  }

  // The map view
  @property()
  private readonly view: MapView;

  // Layer list to apply layer filters when this filter is closed
  @property()
  private readonly layerList: CustomLayerList;

  // Filter to search by
  @property()
  @renderable()
  public filter: SearchFilter;

  // Pass in any properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: {
    view: MapView,
    layerList: CustomLayerList
  }) {
    super();
  }

  // Run after this widget is ready
  public postInitialize(): void {
    // Watch our own filter property so we can update the view with the filter
    this.watch('filter', (newFilter: SearchFilter) => {
      // Apply clauses for each layer
      newFilter.clauses.forEach((clause) => {
        // Set layer filters
        const layer = (this.view.map.layers.find((layer) => {
          return layer.title === clause.layerName;
        }) as FeatureLayer);
        // Try to append a default clause if it exists
        const defaultClause = CustomFilter.defaultClauses[clause.layerName];
        if (defaultClause) {
          if (clause.clause) {
            layer.definitionExpression = `(${clause.clause}) and ${defaultClause}`;
          } else {
            layer.definitionExpression = defaultClause;
          }
        } else {
          layer.definitionExpression = clause.clause;
        }

        // Set layer label visibility
        if (clause.labelsVisible === true || clause.labelsVisible === false) {
          layer.labelsVisible = clause.labelsVisible;
        }
      });
      // Go to filter target
      if (newFilter.target) {
        goToSmart(this.view, newFilter.target);
      }
    });
    /*
      Watch the layer list filter, which should override any other filter if
      updated.
    */
    this.layerList.watch('filter', (newFilter) => {
      this.filter = newFilter;
    });
    // Set our initial filter based on the layer list filter
    this.resetFilter();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    let filterWindow;
    if (this.filter && this.filter.visible) {
      const title = `Filtering by: ${this.filter.name}`;
      let windowContent;
      if (this.filter.description) {
        windowContent = expandable(
          title,
          false,
          'expandable-filter',
          <p class='standalone-text'>{this.filter.description}</p>
        );
      } else {
        windowContent = <p class='standalone-text'>{title}</p>;
      }
      filterWindow = (
        <div aria-label='Filter window' id='filter-window' key='filter-window'>
          {windowContent}
          {iconButton({
            object: this,
            onclick: this.resetFilter,
            name: 'Stop filtering',
            iconName: 'close',
            classes: ['custom-filter-close']
          })}
        </div>
      );
    }

    return filterWindow;
  }

  // Manually set this filter to the layer list filter
  public resetFilter(): void {
    this.filter = this.layerList.filter;
  }
}

/*
  Set the custom layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomFilter;
