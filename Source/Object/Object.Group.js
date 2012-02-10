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

provides:
  - LSD.Object.Group
  - LSD.Object.Group.Array
  - LSD.Object.Group.NodeList
  - LSD.Struct.Group
  - LSD.Struct.Group.Array
  - LSD.Struct.Group.NodeList
...
*/

LSD.Object.Group = function(object) {
  if (object != null) this.mix(object)
};

LSD.Object.Group.prototype = {
  constructor: LSD.Object.Stack,
  
  set: function(key, value, memo, prepend, hash) {
    if (typeof key === 'string' && hash !== true) {
      var index = key.indexOf('.');
    } else {
      if (hash == null || hash === true) hash = this._hash(key, value);
      if (typeof hash == 'string') {
        key = hash;
        hash = null;
        var index = key.indexOf('.');
      }
    }
    if (index === -1 && hash == null && key.charAt(0) != '_' && !(this._properties && this._properties[key])) {
      hash = this[key];
      if (hash == null) {
        hash = this[key] = new (this.___constructor || Array);
        if (this.onGroup) this.onGroup(key, hash)
      }
    }
    if (typeof (this._set(key, value, memo, index, hash)) != 'undefined') {
      if (hash != null) (prepend || value == null) ? hash.unshift(value) : hash.push(value);
      return true;
    }
  },
  
  unset: function(key, value, memo, prepend, hash) {
    if (typeof key === 'string' && hash !== true) {
      var index = key.indexOf('.');
    } else {
      if (hash == null || hash === true) hash = this._hash(key, value);
      if (typeof hash == 'string') {
        key = hash;
        hash = null;
        var index = key.indexOf('.');
      } else {  
        if (hash == null) return;
      }
    }
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
  },
  
  _skip: Object.append({
    ___constructor: true
  }, LSD.Object.prototype._skip)
};

LSD.Object.Group.prototype = Object.append(new LSD.Object, LSD.Object.Group.prototype);

/*
  LSD.Object.Group.Array groups values into observable LSD.Arrays
*/

LSD.Object.Group.Array = function() {
  LSD.Object.apply(this, arguments);
};
LSD.Object.Group.Array.prototype = new LSD.Object.Group;
LSD.Object.Group.Array.prototype.___constructor = LSD.Array

/*
  LSD.Object.Group.Collection groups values into observable LSD.Collections
  sorted by their sourceIndex. The collection is resorted as sourceIndex
  values of the nodes are changed.
*/

LSD.Object.Group.NodeList = function() {
  LSD.Object.apply(this, arguments);
};
LSD.Object.Group.NodeList.prototype = new LSD.Object.Group;
LSD.Object.Group.NodeList.prototype.___constructor = LSD.NodeList



/*
  Group struct has LSD.Object.Group its base object. 
  To put it simply, it's an hash of arrays. 
*/

LSD.Struct.Group = function(properties) {
  return LSD.Struct(properties, LSD.Object.Group)
}

LSD.Struct.Group.Array = function(properties) {
  return LSD.Struct(properties, LSD.Object.Group.Array)
}

LSD.Struct.Group.NodeList = function(properties) {
  return LSD.Struct(properties, LSD.Object.Group.NodeList)
}
