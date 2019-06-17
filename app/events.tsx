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
  const event = document.createEvent('MouseEvent');
  event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  const cancelled = !element.dispatchEvent(event);
}

/*
  Export helper functions related to events so they can be
  imported and used in other files.
*/
export { clickOnSpaceOrEnter };
