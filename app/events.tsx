/*
  Add an event listener to the UMass menu button to open and close the menu
  on mobile.
*/
function setupUmassMenu(): void {
  document.getElementById('umass--global--navigation--navicon').onclick = () => {
    document.getElementById('umass--global--header').classList.toggle('overlay-active');
    document.getElementById('umass--global--navigation--links').classList.toggle('is-active');
    document.getElementById('umass--global--navigation--navicon').classList.toggle('is-active');
  }
}

// Send a mouse click event to an element
function _clickElement(element: HTMLElement): void {
  // Create an IE compatible mouse event
  const event = document.createEvent('MouseEvent');
  event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  element.dispatchEvent(event);
}

/*
  If space or enter is pressed while focused on an element then click that
  element.
*/
function clickOnSpaceOrEnter(event: KeyboardEvent): void {
  if (event.key === 'Space' || event.key === 'Enter' ||
    event.keyCode === 32 || event.keyCode === 13
  ) {
    _clickElement(event.target as HTMLElement);
  }
}

/*
  Export helper functions related to events so they can be
  imported and used in other files.
*/
export { setupUmassMenu, clickOnSpaceOrEnter };
