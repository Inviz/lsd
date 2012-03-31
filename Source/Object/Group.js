/*
---

script: Object.Group.js

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
  if (typeof object == 'string') { constructor = object, object = null };
  if (constructor) this.__constructor = typeof constructor == 'string' ? LSD[constructor] : constructor;
  if (object != null) this.mix(object)
};
LSD.Group.prototype = new LSD.Object;
LSD.Group.prototype.constructor = LSD.Group;
LSD.Group.prototype.__constructor = Array;
LSD.Group.prototype.set = function(key, value, memo, prepend, hash) {
  if (this._hash && hash == null && typeof (hash = this._hash(key, value)) == 'string' && (key = hash)) hash = null;
  if (typeof key == 'string') var index = key.indexOf('.');
  if (index === -1 && hash == null && key.charAt(0) != '_' && !(this._properties && this._properties[key])) {
    hash = this[key];
    if (hash == null) {
      hash = this[key] = new this.__constructor;
      if (this.onGroup) this.onGroup(key, hash)
    }
  }
  if (typeof (this._set(key, value, memo, index, hash)) != 'undefined') {
    if (hash != null) (prepend || value == null) ? hash.unshift(value) : hash.push(value);
    return true;
  }
},
LSD.Group.prototype.unset = function(key, value, memo, prepend, hash) {
  if (this._hash && hash == null && typeof (hash = this._hash(key, value)) == 'string' && (key = hash)) hash = null;
  if (typeof key == 'string') var index = key.indexOf('.');
  if (index === -1 && hash == null && key.charAt(0) != '_' && !(this._properties && this._properties[key]))
    hash = this[key];
  if (hash == null) return;
  var length = hash.length;
  if (typeof (this._unset(key, value, memo, index, hash)) != 'undefined') {
    if (prepend) {
      for (var i = 0, j = length; i < j; i++)
        if (hash[i] === value) {
          hash.splice(i, 1);
          break;
        }
      if (j == i) return
    } else {
      for (var j = length; --j > -1;)
        if (hash[j] === value) {
          hash.splice(j, 1);
          break;
        }
      if (j == -1) return;
    }
    return true;
  }
};