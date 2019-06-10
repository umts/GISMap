import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import FeatureLayer = require('esri/layers/FeatureLayer');
import MapView = require('esri/views/MapView');
import Widget = require('esri/widgets/Widget');

import FilteredLayerList = require('app/widgets/FilteredLayerList');
import { spaceRendererInfo, sectionRendererInfo } from 'app/rendering';
import { SearchFilter, SearchFilterClause } from 'app/search';

@subclass('esri.widgets.CustomLayerList')
class CustomLayerList extends declared(Widget) {
  // The map view
  @property()
  @renderable()
  view: MapView

  // List of sections filtered by color into layers
  @property()
  @renderable()
  sectionLayers: FilteredLayerList;

  // List of spaces filtered by category into layers
  @property()
  @renderable()
  spaceLayers: FilteredLayerList;

  /*
    The filter representing how the map layers should be filtered by the
    custom filter widget.
  */
  @property()
  @renderable()
  filter: SearchFilter

  // Pass in any properties
  constructor(properties?: { view: MapView }) {
    super();
    this.sectionLayers = new FilteredLayerList({
      filterColumnName: 'SectionColor',
      filterOptionInfos: sectionRendererInfo
    });
    this.spaceLayers = new FilteredLayerList({
      filterColumnName: 'ParkingSpaceSubCategory',
      filterOptionInfos: spaceRendererInfo
    })
  }

  // Run after this widget is ready 
  postInitialize() {
    /*
      Check the filtered layer lists for clause changes, and update our filter
      when that happens.
    */
    this.sectionLayers.watch('clause', (_clause) => {
      this._updateFilter();
    });
    this.spaceLayers.watch('clause', (_clause) => {
      this._updateFilter();
    });
    // Set our initial filter
    this._updateFilter();
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    return (
      <div>
        {this._renderCustomCheckbox('lots', 'Lots')}
        <div class='indent-1'>
          {this.sectionLayers.render()}
        </div>
        {this._renderCustomCheckbox('lot-labels', 'Lot Numbers')}
        {this._renderCustomCheckbox('building-labels', 'Building Names')}
        {this.spaceLayers.render()}
      </div>
    );
  }

  /*
    Render a generic checkbox that will trigger generic checkbox events in
    this widget.
  */
  private _renderCustomCheckbox(uniqueId: string, text: string): JSX.Element {
    return (
      <div
        bind={this}
        class='layer-checkbox'
        onclick={this._toggleCheckbox}
        data-checkbox-id={`${uniqueId}-checkbox`}>
        <label for={uniqueId} data-checkbox-id={`${uniqueId}-checkbox`}>
          <input
            bind={this}
            class='layer-checkbox-input'
            id={`${uniqueId}-checkbox`}
            name={uniqueId}
            onchange={this._checkboxEvent}
            type='checkbox'
            checked />
          {text}
        </label>
      </div>
    );
  }

  // Return a checkbox by id
  private _checkbox(id: string): HTMLInputElement {
    return document.getElementById(id) as HTMLInputElement;
  }

  // Given an event on a checkbox perform the corresponding event
  private _checkboxEvent(event: any) {
    if (event.target.id === 'lots-checkbox') {
      /*
        Toggle all checkboxes in a filtered layer list based on which checkbox
        the event is coming from.
      */
      this.sectionLayers.toggleFilters(event.target.checked);
    }
    this._updateFilter();
  }

  /*
    Any element with the attribute data-checkbox-id that triggers this
    function will toggle the corresponding checkbox.
  */
  private _toggleCheckbox(event: any) {
    const checkboxId = event.target.dataset.checkboxId;
    if (checkboxId) {
      const checkbox = this._checkbox(checkboxId);
      if (checkbox.checked) {
        checkbox.checked = false;
      } else {
        checkbox.checked = true;
      }
      this._checkboxEvent({target: checkbox});
    }
  }

  /*
    Update our filter based on the state of our own checkboxes and the
    filtered layer list checkboxes.
  */
  private _updateFilter() {
    let lotLabelsVisible = true;
    let buildingLabelsVisible = true;

    const lotLabelsCheckbox = this._checkbox('lot-labels-checkbox');
    if (lotLabelsCheckbox) {
      lotLabelsVisible = lotLabelsCheckbox.checked;
    }
    const buildingLabelsCheckbox = this._checkbox('building-labels-checkbox');
    if (buildingLabelsCheckbox) {
      buildingLabelsVisible = buildingLabelsCheckbox.checked;
    }
    this.filter = {
      visible: false,
      clauses: [
        {
          layerName: 'Sections',
          clause: this.sectionLayers.clause,
          labelsVisible: lotLabelsVisible
        }, {
          layerName: 'Spaces',
          clause: this.spaceLayers.clause
        }, {
          layerName: 'Campus Buildings',
          labelsVisible: buildingLabelsVisible
        }
      ]
    }
  }
}

/*
  Set the custom layer list widget as the export for this file so it can be
  imported and used in other files.
*/
export = CustomLayerList;
