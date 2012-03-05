/*
---
 
script: NodeList.js
 
description: A presorted observable array of DOM nodes 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Array

provides:
  - LSD.NodeList
  - LSD.Struct.NodeList
  
...
*/
/*
  LSD.NodeList is a variation of LSD.Array that keeps its elements
  sorted by source index.
*/

LSD.NodeList = function() {
  if (this === LSD) {
    var collection = LSD.NodeList;
    collection.push.apply(collection, arguments);
    return collection;
  } else {
    if (this._sortBy) this.watch(this._observeIndex);
    return LSD.Array.apply(this, arguments);
  }
}
LSD.NodeList.prototype = new LSD.Array;
LSD.NodeList.prototype.push = function() {
  for (var i = 0, j = arguments.length, l = this.__length; i < j; i++) {
    var k = this.indexFor(arguments[i]);
    if (k == l) this.set(l, arguments[i])
    else this.splice(k, 0, arguments[i]);
  }
  return this.__length;
};
LSD.NodeList.prototype.indexFor = function(value, criteria) {
  if (!value) return this.__length;
  for (var i = 0, j = this.__length, k = value[this._sortBy]; i < j; i++)
    if (!this[i] || this[i][this._sortBy] > k) break;
  return i;
};
LSD.NodeList.prototype._sortBy = 'sourceIndex';
LSD.NodeList.prototype._observeIndex = function(value, index, state, old) {
  if (old == null) value[state ? 'watch' : 'unwatch'](this._sortBy, this)
  return value;
};
LSD.NodeList.prototype.fn = function(collection, value, old) {
  collection.move(collection.indexOf(this), collection.indexFor(this));
};

/*
  A special kind of object that is based on LSD.NodeList but also 
  has its own properties.
*/

LSD.Struct.NodeList = function(properties) {
  return LSD.Struct(properties, LSD.NodeList);
};