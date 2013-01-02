/*
---

script: Group.js

description: An observable object that groups values by key

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Object
  - LSD.Struct
  - LSD.Array
  - LSD.NodeList
  - LSD.Journal

provides:
  - LSD.Group
...
*/

LSD.Group = function(object, constructor) {
  if (typeof object == 'string') { 
    constructor = object;
    object = null;
  }
  if (constructor) this.__constructor = typeof constructor == 'string' ? LSD[constructor] : constructor;
  if (object != null) this.mix(object)
};
LSD.Group.prototype = new LSD.Object;
LSD.Group.prototype.constructor = LSD.Group;
LSD.Group.prototype.__constructor = Array;
LSD.Group.prototype._hash = function(key, value, old, meta, prepend, index) {
  var index = key.indexOf('.');
  if (index == -1 && !this._nonenumerable[key] && !(this._properties && this._properties[key])) {
    var group = this[key];
    if (group == null) {
      group = this[key] = new this.__constructor;
      if (this.onGroup) this.onGroup(key, value, true, group)
    }
    return group;
  }
};
LSD.Group.prototype._finalize = function(key, value, old, meta, prepend, hash, val) {
  if (hash == null) return;
  if (old !== undefined) {
    var index = hash.indexOf(old);
    if (index > -1) hash.splice(index, 1);
  }
  if (value !== undefined)
    hash[prepend === true || value == null ? 'unshift' : 'push'](value);
}