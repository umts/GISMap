import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import MapView = require('esri/views/MapView');
import Compass = require('esri/widgets/Compass');
import Home = require('esri/widgets/Home');
import Locate = require('esri/widgets/Locate');
import Widget = require('esri/widgets/Widget');

import CustomFilter = require('app/widgets/CustomFilter');
import CustomSearch = require('app/widgets/CustomSearch');
import CustomPopup = require('app/widgets/CustomPopup');
import CustomWindow = require('app/widgets/CustomWindow');
import { CustomZoom } from 'app/widgets/CustomZoom';
import WindowExpand = require('app/widgets/WindowExpand');

@subclass('esri.widgets.MainNavigation')
class MainNavigation extends declared(Widget) {
  // Compass widget
  @property()
  @renderable()
  private compass: Compass;

  // Directions expand widget
  @property()
  @renderable()
  private directionsExpand: WindowExpand;

  // Home widget
  @property()
  @renderable()
  private home: Home;

  // Layers expand widget
  @property()
  @renderable()
  private layersExpand: WindowExpand;

  // Locate widget
  @property()
  @renderable()
  private locate: Locate;

  // Zoom in widget
  @property()
  @renderable()
  private zoomIn: CustomZoom;

  // Zoom out widget
  @property()
  @renderable()
  private zoomOut: CustomZoom;

  // Search widget
  @property()
  @renderable()
  private search: CustomSearch;

  // Filter widget
  @property()
  @renderable()
  private customFilter: CustomFilter;

  // Share expand widget
  @property()
  @renderable()
  private shareExpand: WindowExpand;

  // Custom windows that start hidden and can be opened by window expands
  @property()
  @renderable()
  private customWindows: Array<CustomWindow>;

  // The main map view
  @property()
  @renderable()
  public view: MapView;

  // Single popup for the whole app
  @property()
  @renderable()
  public popup: CustomPopup;

  /*
    Pass in properties like widgets as `any` type which will then be cast to
    their correct types.
  */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(properties?: any) {
    super();
  }

  // Run after this widget is ready
  public postInitialize(): void {
    this._setLoading(true);
    this.view.watch('updating', (updating) => { this._setLoading(updating) });
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    const renderedWindows: Array<JSX.Element> = [];
    /*
      Render each custom window into an array.
      Only one window will be visible at a time.
    */
    this.customWindows.forEach((window) => {
      renderedWindows.push(window.render());
    });

    return (
      <div id="main-navigation" role='presentation'>
        <div class="column-left">
          <div
            aria-label='Main navigation window'
            id="main-navigation-window"
            class="navigation-window shadow">
            {this.search.render()}

            <div class="widget-list" role='presentation'>
              <ul aria-label='Main menu' role='menubar'>
                <li class="widget-list-item" role='menuitem'>{this.zoomIn.render()}</li>
                <li class="widget-list-item" role='menuitem'>{this.zoomOut.render()}</li>
                <li class="widget-list-item" role='menuitem'>{this.compass.render()}</li>
                <li class="widget-list-item" role='menuitem'>{this.home.render()}</li>
                <li class="widget-list-item" role='menuitem'>{this.locate.render()}</li>
                <li class="widget-list-item" role='menuitem'>{this.layersExpand.render()}</li>
                <li class="widget-list-item" role='menuitem'>{this.directionsExpand.render()}</li>
                <li class="widget-list-item" role='menuitem'>{this.shareExpand.render()}</li>
              </ul>
            </div>
          </div>
          {this.customFilter.render()}
          {renderedWindows}
        </div>
        {this.popup.render()}
      </div>
    );
  }

  public findWindow(windowName: string): CustomWindow {
    return this.customWindows.find((window) => {
      return window.name === windowName;
    });
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
