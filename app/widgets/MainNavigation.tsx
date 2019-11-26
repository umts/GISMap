import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { tsx } from 'esri/widgets/support/widget';

import MapView = require('esri/views/MapView');
import Home = require('esri/widgets/Home');
import Locate = require('esri/widgets/Locate');
import Widget = require('esri/widgets/Widget');

import { homeGoToOverride } from 'app/latLong';
import { RenderableWidget } from 'app/rendering';
import { resetUrlTimer } from 'app/url';

import BasemapPicker = require('app/widgets/BasemapPicker');
import CustomDirections = require('app/widgets/CustomDirections');
import CustomFilter = require('app/widgets/CustomFilter');
import CustomLayerList = require('app/widgets/CustomLayerList');
import CustomSearch = require('app/widgets/CustomSearch');
import CustomPedestrianDirections = require('app/widgets/CustomPedestrianDirections');
import CustomPopup = require('app/widgets/CustomPopup');
import CustomWindow = require('app/widgets/CustomWindow');
import { CustomZoom, ZoomDirection } from 'app/widgets/CustomZoom';
import LotNotices = require('app/widgets/LotNotices');
import ShareEmail = require('app/widgets/ShareEmail');
import ShareLink = require('app/widgets/ShareLink');
import WindowExpand = require('app/widgets/WindowExpand');

@subclass('esri.widgets.MainNavigation')
class MainNavigation extends declared(Widget) {
  // Search widget
  @property()
  private readonly search: CustomSearch;

  // The layers expand widget. Exists here and in button widgets.
  @property()
  private readonly layersExpand: WindowExpand;

  // Widgets that serve as navigation buttons in the main window
  @property()
  private readonly buttonWidgets: Array<RenderableWidget>

  // Filter widget
  @property()
  private readonly customFilter: CustomFilter;

  // Custom windows that start hidden and can be opened by window expands
  @property()
  private readonly customWindows: Array<CustomWindow>;

  // The main map view
  @property()
  public readonly view: MapView;

  // Single popup for the whole app
  @property()
  public readonly popup: CustomPopup;

  /*
    Pass in properties like widgets as `any` type which will then be cast to
    their correct types.
  */
  public constructor(properties?: {
    view: MapView,
    popup: CustomPopup,
    searches: Array<CustomSearch>
  }) {
    super();

    /*
      We will give this to both the layer window and the custom filter, that
      way the custom filter can filter based on this widget.
    */
    const layerList = new CustomLayerList({ view: properties.view });

    const customFilter = new CustomFilter({
      view: properties.view,
      layerList: layerList
    });

    // Create a layer window that will be hidden until opened by a window expand
    const layersWindow = new CustomWindow({
      name: 'layers',
      iconName: 'layers',
      useTabs: false,
      widgets: [
        {
          label: 'Layers',
          widget: layerList,
        },
        {
          label: 'Basemap',
          widget: new BasemapPicker({ view: properties.view })
        }
      ]
    });

    /*
      Create a directions window that will be hidden until opened by a
      window expand.
    */
    const directionsWindow = new CustomWindow({
      name: 'directions',
      iconName: 'directions',
      useTabs: true,
      widgets: [
        {
          label: 'Driving directions',
          widget: new CustomDirections({
            view: properties.view, searches: properties.searches
          })
        },
        {
          label: 'Walking directions',
          widget: new CustomPedestrianDirections({
            view: properties.view, searches: properties.searches
          })
        }
      ]
    });

    // Create a share window that will be hidden until opened by a window expand
    const shareWindow = new CustomWindow({
      name: 'share',
      iconName: 'link',
      useTabs: false,
      widgets: [
        {
          label: 'Share link',
          widget: new ShareLink()
        }, {
          label: 'Email',
          widget: new ShareEmail()
        }
      ]
    });

    const lotNoticesWindow = new CustomWindow({
      name: 'lot notices',
      iconName: 'notice-triangle',
      useTabs: false,
      widgets: [
        {
          label: 'Lot notices/events',
          widget: new LotNotices({ popup: properties.popup })
        }
      ]
    });

    /*
      Every window needs to know about the other windows, that way a single
      window can close the other windows when it needs to open.
    */
    const customWindows = [
      layersWindow, directionsWindow, shareWindow, lotNoticesWindow
    ];

    this.search = new CustomSearch({
      view: properties.view,
      name: 'main',
      placeholder: 'Search the map',
      customFilter: customFilter,
      mainSearch: true
    });
    this.layersExpand = new WindowExpand({
      name: 'layers',
      iconName: 'layers',
      window: layersWindow,
      windows: customWindows
    });
    this.buttonWidgets = [
      new CustomZoom({
        view: properties.view,
        direction: ZoomDirection.In
      }),
      new CustomZoom({
        view: properties.view,
        direction: ZoomDirection.Out
      }),
      new Home({
        view: properties.view,
        goToOverride: homeGoToOverride
      }),
      new Locate({ view: properties.view }),
      this.layersExpand,
      new WindowExpand({
        name: 'directions',
        iconName: 'directions',
        window: directionsWindow,
        windows: customWindows
      }),
      new WindowExpand({
        name: 'share',
        iconName: 'link',
        window: shareWindow,
        windows: customWindows
      }),
      new WindowExpand({
        name: 'lot notices',
        iconName: 'notice-triangle',
        window: lotNoticesWindow,
        windows: customWindows
      })
    ];
    this.customFilter = customFilter;
    this.customWindows = customWindows;
  }

  // Run after this widget is ready
  public postInitialize(): void {
    // Popup needs this widget to open the directions window and set searches
    this.popup.mainNavigation = this;
    this._setLoading(true);
    this.view.watch('updating', (updating) => { this._setLoading(updating) });
    // Update the url when the basemap changes
    (this.findWindow('layers').findWidget('Basemap') as BasemapPicker)
      .watch('basemapId', () => { resetUrlTimer(this) });
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const renderedButtons: Array<JSX.Element> = [];
    // Render each navigation button into an array
    this.buttonWidgets.forEach((buttonWidget) => {
      renderedButtons.push(
        <li class='widget-list-item' role='menuitem'>
          {buttonWidget.render()}
        </li>
      );
    });

    const renderedWindows: Array<JSX.Element> = [];
    /*
      Render each custom window into an array.
      Only one window will be visible at a time.
    */
    this.customWindows.forEach((window) => {
      renderedWindows.push(window.render());
    });

    return (
      <div id='main-navigation' role='presentation'>
        <div class='column-left'>
          <div
            aria-label='Main navigation window'
            id='main-navigation-window'
            class='navigation-window shadow'>
            <div class='navigation-window-inner'>
              {this.search.render()}

              <div class='widget-list' role='presentation'>
                <ul aria-label='Main menu' role='menubar'>
                  {renderedButtons}
                </ul>
              </div>
            </div>
          </div>
          {this.customFilter.render()}
          {renderedWindows}
        </div>
        {this.popup.render()}
      </div>
    );
  }

  // Return a custom window by name
  public findWindow(windowName: string): CustomWindow {
    return this.customWindows.filter((window) => {
      return window.name === windowName;
    })[0];
  }

  private _element(): HTMLElement {
    return document.getElementById('main-navigation');
  }

  /*
    Set body to waiting class to display that the view is loading external
    resources. Also set the loading icon for the layers expand.
  */
  private _setLoading(loading: boolean): void {
    const waitingClass = 'progress-cursor';
    if (loading) {
      document.body.classList.add(waitingClass);
      this.layersExpand.loadingIcon = true;
    } else {
      document.body.classList.remove(waitingClass);
      this.layersExpand.loadingIcon = false;
    }
  }
}

/*
  Set the main navigation widget as the export for this file so it can be
  imported and used in other files.
*/
export = MainNavigation;
