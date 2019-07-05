import { subclass, declared, property } from 'esri/core/accessorSupport/decorators';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');

@subclass('esri.widgets.Feedback')
class Feedback extends declared(Widget) {
  @property()
  @renderable()
  open: boolean;

  // Pass in any properties
  constructor(properties?: any) {
    super();
    this.open = false;
  }

  // Render this widget by returning JSX which is converted to HTML
  render() {
    let feedbackWindow;
    if (this.open) {
      const githubLink = <a target='_blank' href='https://github.com/umts/GISMap'>
        GitHub
      </a>;
      const emailLink = (
        <a href='mailto:parking-it@admin.umass.edu?subject=UMass Map Feedback'>
          email
        </a>
      );
      feedbackWindow = <div class='feedback-window navigation-window shadow'>
        Give us feedback on {githubLink} or by {emailLink}.
      </div>;
    }
    return (
      <div class='feedback'>
        {feedbackWindow}
        <div
          bind={this}
          class='feedback-button shadow'
          onclick={this._toggle}
          tabindex='0'
          title={`${this.open ? 'Close' : 'Open'} feedback`}>
          <span class='esri-icon esri-icon-description'></span>
        </div>
      </div>
    );
  }

  // Toggle the feedback window
  private _toggle() {
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
