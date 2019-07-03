/*
  Use `setPromise` and `then` to only handle promises if they resolve in
  chronological order from when they started.
*/
class RequestSet {
  private lastStartDate: Date;
  private promise: Promise<any>;

  public constructor() {
    this.lastStartDate = new Date();
  }

  // Set the promise that will be handled next
  public setPromise(promise: Promise<any>): RequestSet {
    this.promise = promise;
    return this;
  }

  /*
    Resolve this promise. Only call the handleResponse function when the
    current promise was started after the last promise that called
    handleResponse was started.
  */
  public then(handleResponse: Function, handleError: Function): any {
    const requestStartDate = new Date();
    this.promise.then((response) => {
      /*
        We only handle the response if this request started after the last
        handled request was started.
      */
      if (requestStartDate >= this.lastStartDate) {
        this.lastStartDate = requestStartDate;
        return handleResponse(response);
      }
      return;
    }).catch((error) => {
      return handleError(error);
    });
  }
}

/*
  Set request set as the export for this file so it can be imported and
  used in other files.
*/
export = RequestSet;
