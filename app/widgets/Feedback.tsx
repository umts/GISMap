import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

@subclass('esri.widgets.Feedback')
class Feedback extends declared(Widget) {
  // Whether or not the window is open
  @property()
  @renderable()
  private open: boolean;

  public constructor() {
    super();
    this.open = true;
  }

  // Render this widget by returning JSX which is converted to HTML
  public render(): JSX.Element {
    let feedbackWindow;
    if (this.open) {
      const githubLink = <a target='_blank' href='https://github.com/umts/GISMap'>
        GitHub
      </a>;
      const emailLink = (
        <a href='mailto:parking@umass.edu?subject=UMass Parking Map Feedback'>
          email
        </a>
      );
      feedbackWindow = <div
        class='feedback-window navigation-window shadow'
        aria-label='Feedback window'>
        Please give us feedback on {githubLink} or by {emailLink}.
      </div>;
    }
    return (
      <div class='feedback'>
        {feedbackWindow}
        <div
          bind={this}
          class='feedback-button shadow'
          onclick={this._toggle}
          role='button'
          tabindex='0'
          title={`${this.open ? 'Close' : 'Open'} feedback`}>
          <span class='esri-icon esri-icon-description' aria-hidden='true'>
          </span>
        </div>
      </div>
    );
  }

  // Toggle the feedback window
  private _toggle(): void {
    if (this.open) {
      this.open = false;
    } else {
      this.open = true;
    }
  }
}

/*
  Set the feedback widget as the export for this file so it can be
  imported and used in other files.
*/
export = Feedback;
