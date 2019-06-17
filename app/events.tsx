/*
  If space or enter is pressed while focused on an element then click that
  element.
*/
function clickOnSpaceOrEnter(event: KeyboardEvent) {
  if (event.key === 'Space' || event.key === 'Enter' ||
    event.keyCode === 32 || event.keyCode === 13
  ) {
    _clickElement(event.target as HTMLElement);
  }
}

// Send a mouse click event to an element
function _clickElement(element: HTMLElement) {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  const cancelled = !element.dispatchEvent(event);
}

/*
  Export helper functions related to events so they can be
  imported and used in other files.
*/
export { clickOnSpaceOrEnter };
