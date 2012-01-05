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

!function() {
LSD.Type.Relations = new LSD.Struct.Group({
});
LSD.Type.Relations.implement({
  onChange: function() {
    
  },
  
  _delegate: function() {
    
  },

  __watcher: function(callback, widget, state) {
    this.set
  }
})

LSD.Type.Relations.Properties = {
  proxy: function(value, ) {
    this.proxies.set()
  },
  
  match: function(value, state, old) {
    if (state && value) this.matches.set(value, {
      fn: this.__watcher, 
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
  
  callbacks: function() {
    
  }
};

LSD.Relation.getScopeName = function(scoped) {
  return function(relation, scope, multiple) {
    var key = Array.prototype.join.call(arguments);
    return (scoped[key] || (scoped[key] = (scope + LSD.capitalize(relation))))
  }
}({});

var Traits = LSD.Relation.Traits = {};
var Targets = LSD.Module.Events.Targets;
}();