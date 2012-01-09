/*
---
 
script: Relation.js
 
description: An unsettable relation that dispatches options to specific widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Module.Events

provides: 
  - LSD.Relation
 
...
*/

LSD.Type.Relations = new LSD.Struct.Group({
});
LSD.Type.Relations.prototype.onChange = function() {
  
};
LSD.Type.Relations.prototype._delegate = function() {
    
};
LSD.Type.Relations.prototype.__watcher = function(callback, widget, state) {
    
};
LSD.Type.Relations.prototype.__proxier = function() {
    
};
LSD.Type.Relations.prototype.__filter = function() {

};

LSD.Type.Relations.Properties = {
  proxy: function(value, state, old) {
    if (value != null) this.proxies.set(value, {
      fn: this.__proxier,
      bind: this,
      callback: this,
      name: name
    });
    if (old != null) this.proxies.unset(old, this);
  },
  
  match: function(value, state, old) {
    if (state && value) this.matches.set(value, {
      fn: this.__watcher,
      bind: this,
      callback: this,
      name: name
    });
    if (!state || old) this.matches.unset(state ? old : value, this.__watcher);
  },
  
  filter: function() {
    
  },
  
  scopes: function() {
    
  },
  
  scope: function() {
    
  },
  
  as: function() {
    
  },
  
  collection: function() {
    
  },
  
  singular: function() {
    
  },
  
  callbacks: function(callback, state, old) {
    
  }
};

LSD.Relation.getScopeName = function(scoped) {
  return function(relation, scope, multiple) {
    var key = Array.prototype.join.call(arguments);
    return (scoped[key] || (scoped[key] = (scope + LSD.capitalize(relation))))
  }
}({});