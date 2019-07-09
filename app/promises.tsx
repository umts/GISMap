// Convert IPromise to Promise
function toNativePromise(otherPromise: IPromise<any>): Promise<any> {
  return new Promise((resolve, reject) => {
    otherPromise.then((response) => {
      return resolve(response);
    }).catch((error) => {
      return reject(error);
    });
  });
}

/*
  Export helper functions related to promises so they can be
  imported and used in other files.
*/
export { toNativePromise };
