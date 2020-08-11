import { subclass, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import Graphic = require('esri/Graphic');
import Widget = require('esri/widgets/Widget');

import { getHubData, getSectionData } from 'app/data';
import { attributeRow } from 'app/rendering';
import CustomPopup = require('app/widgets/CustomPopup');

@subclass('esri.widgets.LotNotices')
class LotNotices extends Widget {
  @property()
  private readonly popup: CustomPopup;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(params?: { popup: CustomPopup }) {
    super();
    // Assign constructor params
    this.set(params);
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): tsx.JSX.Element {
    const noticeElements: Array<tsx.JSX.Element> = [];
    const hubData = getHubData();
    const sectionData = getSectionData();
    // If the hub data has been loaded yet
    if (hubData && sectionData) {
      const lotNotices = hubData.lot_notices;

      // Create a 'notice' for every lot associated with a single notice
      const sortedNotices: Array<any> = [];
      lotNotices.forEach((lotNotice: any) => {
        // Grab the lot names based on citation location id from section data
        const lots = sectionData.features.filter((feature: Graphic) => {
          return lotNotice.citation_location_ids.indexOf(Number(feature.attributes.CitationLocationID)) !== -1
        });

        lots.forEach((lot: Graphic) => {
          sortedNotices.push({ lotNotice: lotNotice, lot: lot });
        });
      });
      // For all lot notices, sort by lot name then start time
      sortedNotices.sort((a: any, b: any) => {
        const aName = a.lot.attributes.SectionName.toUpperCase();
        const bName = b.lot.attributes.SectionName.toUpperCase();
        if (aName < bName) {
          return -1;
        }
        if (aName > bName) {
          return 1;
        }
        if (a.lotNotice.start < b.lotNotice.start) {
          return -1;
        }
        if (a.lotNotice.start > b.lotNotice.start) {
          return 1;
        }
        return 0;
      });
      // Go through each sorted notice and render it
      sortedNotices.forEach((sortedNotice: any) => {
        const lotNotice = sortedNotice.lotNotice;
        const lot = sortedNotice.lot;
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
      // No lot notices
      if (sortedNotices.length <= 0) {
        noticeElements.push(
          <p>No lot notices or events are active at this time.</p>
        );
      }
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
