/*
  Use `setPromise` and `then` to only handle promises if they resolve in
  chronological order from when they started.
*/
class RequestSet {
  private _lastStartDate: Date;
  promise: Promise<any>;

  constructor() {
    this._lastStartDate = new Date();
  }

  // Set the promise that will be handled next
  setPromise(promise: Promise<any>): RequestSet {
    this.promise = promise;
    return this;
  }

  /*
    Resolve this promise. Only call the handleResponse function when the
    current promise was started after the last promise that called
    handleResponse was started.
  */
  then(handleResponse: Function, handleError: Function) {
    const requestStartDate = new Date();
    this.promise.then((response) => {
      /*
        We only handle the response if this request started after the last
        handled request was started.
      */
      if (requestStartDate >= this._lastStartDate) {
        this._lastStartDate = requestStartDate;
        handleResponse(response);
      }
    }).catch((error) => {
      handleError(error);
    });
  }
}

/*
  Set request set as the export for this file so it can be imported and
  used in other files.
*/
export = RequestSet;
