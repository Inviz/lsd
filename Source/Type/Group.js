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
  if (typeof object == 'string') { constructor = object, object = null };
  if (constructor) this.__constructor = typeof constructor == 'string' ? LSD[constructor] : constructor;
  if (object != null) this.mix(object)
};
LSD.Group.prototype = new LSD.Object;
LSD.Group.prototype.constructor = LSD.Group;
LSD.Group.prototype.__constructor = Array;
LSD.Group.prototype.set = function(key, value, meta, old, prepend, hash) {
  if (this._hash) {
    if ((hash = this._hash(key, value, meta, true)) === true) return true;
    if (typeof hash == 'string' && (key = hash)) hash = null;
  }
  var setting = typeof value != 'undefined';
  if (hash == null) {
    var index = key.indexOf('.');
    if (index == -1 && !this._skip[key] && !(this._properties && this._properties[key])) {
      var group = this[key];
      if (group == null) {
        group = this[key] = new this.__constructor;
        if (this.onGroup) this.onGroup(key, value, true, group)
      }
    }
  } else var group = hash;
  if (typeof (this._set(key, value, meta, old, index, group)) != 'undefined' && group != null) {
    if (typeof old != 'undefined') {
      var i = group.indexOf(old);
      group.splice(i, 1);
    }
    if (setting) {
      (prepend || value == null) ? group.unshift(value) : group.push(value);
    }
  }
    
  return true;
};