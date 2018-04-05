/*
 * Helper class for representing enums
 *
 * @author kinesis
 */

class Enum {
  constructor(enumList) {
    this._list = enumList.slice();
    this._list.forEach((name) => {
      this[name] = name;
    });
  }

  values() {
    return this._list;
  }
}

module.exports = Enum;
