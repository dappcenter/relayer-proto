/**
 * Given params and a function, will take the callback and create
 * a Promise
 *
 * @param {Object} params
 * @param {Function} fn
 */
function promisefy(params, fn) {
  return new Promise((resolve, reject) => {
    fn(params, (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
}

module.exports = promisefy;
