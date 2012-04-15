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
LSD.Group.prototype.set = function(key, value, memo, prepend, old) {
  if (this._hash) {
    var hash = this._hash(key, value);
    if (typeof hash == 'string' && (key = hash)) hash = null;
  }
  if (hash == null) {
    var index = key.indexOf('.');
    if (index == -1 && !this._skip[key] && !(this._properties && this._properties[key])) {
      var group = this[key];
      if (group == null) {
        group = this[key] = new this.__constructor;
        if (this.onGroup) this.onGroup(key, group)
      }
    }
  } else var group = hash;
  if (typeof (this._set(key, value, memo, index, group)) != 'undefined' && group != null)
    if (group != null) (prepend || value == null) ? group.unshift(value) : group.push(value);
  return true;
},
LSD.Group.prototype.unset = function(key, value, memo, prepend, old) {
  if (this._hash) {
    var hash = this._hash(key, value);
    if (typeof hash == 'string' && (key = hash)) hash = null;
  }
  if (hash == null) {
    var index = key.indexOf('.');
    if (index == -1 && !this._skip[key] && !(this._properties && this._properties[key]))
      var group = this[key];
  } else var group = hash; 
  var length = group.length;
  if (typeof (this._unset(key, value, memo, index, group)) != 'undefined' && group != null)
    if (prepend) {
      for (var i = 0, j = length; i < j; i++)
        if (group[i] === value) {
          group.splice(i, 1);
          break;
        }
      if (j == i) return false;
    } else {
      for (var j = length; --j > -1;)
        if (group[j] === value) {
          group.splice(j, 1);
          break;
        }
      if (j == -1) return false;
    }
  return true;
};