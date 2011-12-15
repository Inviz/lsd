/*
---
 
script: Helpers.js
 
description: Some useful functions that are used internally 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  
provides:
  - LSD.Helpers
  
...
*/

Object.append(LSD, {
  toLowerCase: function(lowercased) {
    return function(string) { 
      return (lowercased[string]) || (lowercased[string] = string.toLowerCase())
    }
  }(LSD.lowercased = {}),
  
  capitalize: function(capitalized) {
    return function(string) {
      return (capitalized[string]) || (capitalized[string] = string.capitalize())
    }
  }(LSD.capitalized = {}),
  
  toClassName: function(classnamed) {
    return function(string) {
      return (classnamed[string]) || (classnamed[string] = string.replace(/(^|-|_)([a-z])/g, function(a, b, c) { return (b == '-' ? '.' : '') + c.toUpperCase()}))
    }
  }(LSD.classnamed = {}),
  
  uid: function(object) {
    if (object.lsd) return object.lsd;
    if (object.nodeName) return $uid(object);
    return (object.lsd = ++LSD.UID); 
  },
  
  UID: 0,
  
  slice: (Browser.ie ? function(list, start) {
    for (var i = start || 0, j = list.length, ary = []; i < j; i++) ary.push(list[i]);
    return ary;
  } : function(list, start) {
    return Array.prototype.slice.call(list, start || 0);
  }),
  
  reverseMerge: function(object, another) {
    for (var name in another) {
      var old = object[name], value = another[name];
      if (old !== value) {
        if (typeof old == 'undefined') {
          if (!value.nodeType && !value.$family) value = Object.clone(value)
          object[name] = value;
        } else if (!old.nodeType && !old.$family) {
          LSD.reverseMerge(old, value);
        }
      }
    }
    return object;
  },
  
  getID: function(object) {
    if (this !== LSD) object = this;
    if (object != null)
      for (var i = 0, identifier; identifier = LSD.identifiers[i++];)
        if (typeof object[identifier] != 'undefined') return object[identifier];
  },
  
  identifiers: ['id', '_id', '$id']
});
LSD.Test = {};

if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function() {};
['log', 'error', 'warn', 'info', 'dir'].each(function(method) {
  try { 
    LSD[method] = function() {
      try {
        (console[method] || console.log).apply(console.arguments);
      } catch(e){}
    } 
  } catch(e) {};
});

(function(toString) {
  Type.isEnumerable = function(item){
    return (item != null && !item.nodeName && !item.nodeType && toString.call(item) != '[object Function]' && typeof item.length == 'number');
  };
})(Object.prototype.toString);
