function clickOnSpaceOrEnter(event: KeyboardEvent) {
  if (event.key === 'Space' || event.key === 'Enter' ||
    event.keyCode === 13 || event.keyCode === 32
  ) {
    clickElement(event.target as HTMLElement);
  }
}

function clickElement(element: HTMLElement) {
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
