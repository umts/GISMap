import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Graphic = require('esri/Graphic');
import Widget = require('esri/widgets/Widget');

import { getHubData, getSectionData } from 'app/data';
import { attributeRow } from 'app/rendering';
import CustomPopup = require('app/widgets/CustomPopup');

@subclass('esri.widgets.LotNotices')
class LotNotices extends declared(Widget) {
  @property()
  private readonly popup: CustomPopup;

  // Pass in any properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: { popup: CustomPopup }) {
    super();
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const noticeElements: Array<JSX.Element> = [];
    const hubData = getHubData();
    const sectionData = getSectionData();
    // If the hub data has been loaded yet
    if (hubData && sectionData) {
      const lotNotices = hubData.lot_notices;
      lotNotices.forEach((lotNotice: any) => {
        // Grab the lot names based on citation location id from section data
        const lots = sectionData.features.filter((feature: Graphic) => {
          return lotNotice.citation_location_ids.indexOf(Number(feature.attributes.CitationLocationID)) !== -1
        });

        lots.forEach((lot: Graphic) => {
          noticeElements.push(
            <div
              bind={this}
              class='lot-notice pointer-cursor'
              key={`${lotNotice.id}-${lot.attributes.CitationLocationID}`}
              onclick={() => {
                this._openLotNotice(lot.attributes.CitationLocationID)}
              }>
              {attributeRow(lot.attributes.SectionName, lotNotice.title)}
            </div>
          );
        });
      });
    } else {
      noticeElements.push(<div class='error'>Could not load lot notices</div>);
    }

    return (
      <div class='esri-widget'>
        {noticeElements}
      </div>
    );
  }

  private _openLotNotice(id: string): void {
    this.popup.openFromCitationLocationId(id);
  }
}

/*
  Set the lot notices widget as the export for this file so it can be
  imported and used in other files.
*/
export = LotNotices;
