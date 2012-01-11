/*
---
 
script: Relation.js
 
description: An unsettable relation that dispatches options to specific widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script/LSD.Struct.Group.Array

provides: 
  - LSD.Type.Relation
 
...
*/

LSD.Type.Relations = new LSD.Struct.Group.Array({
  matches: '.matches'
});
LSD.Type.Relations.prototype.onChange = function(key, value, state, old) {
  if (value.lsd) {
    if (this._parent) {
      if (state) {
        if (this._parent[key] != this[key])
          this._parent.set(key, this[key]);
      } else {
        if (this._parent[key] == this[key] && this[key].length == 0)
          this._parent.unset(key, this[key]);
      }
    }
    return value;
  } else {
    var property = this._Properties[key];
    if (property != null) {
    }
  }
};
LSD.Type.Relations.prototype.onGroup = function(key, value, state) {
  if (state !== false) {
    value.watch({
      callback: this,
      fn: this._observer,
      key: key,
      bind: this,
      array: value
    });
  } else {
    value.unwatch(this);
  }
}
LSD.Type.Relations.prototype.onStore = function(key, value, state, name) {
  if (name == null) {
    var method = typeof value.has == 'function' ? 'has' : 'hasOwnProperty'; 
    for (var prop in value) {
      if (value[method](prop)) {
        var property = this._Properties[prop];
        if (property != null) {
          property.call(this, key, value[prop], state);
        }
      }
    }
  }
  return true;
};
LSD.Type.Relations.prototype._delegate = function(object, key, value, state) {
  var property = LSD.Type.Relations.Properties[key];
  if (property) return true;
};
LSD.Type.Relations.prototype.__watcher = function(callback, widget, state) {
    
};
LSD.Type.Relations.prototype.__proxier = function() {
    
};
LSD.Type.Relations.prototype.__filter = function() {

};
LSD.Type.Relations.prototype._observer = function(call, value, index, state, old) {
  var key = call.key;
  var callbacks = this._callbacks && this._callbacks[key];
  if (callbacks) {
    var fill = state && call.array.length === 1 && typeof old == 'undefined';
    var empty = !state && call.array.length === 0;
    loop: for (var name in callbacks) {
      var group = callbacks[name];
      switch (name) {
        case 'fill':
          if (!fill) continue loop;
          break;
        case 'empty':
          if (!empty) continue loop;
          break;
        case 'add':
          if (!state) continue loop;
          break;
        case 'remove':
          if (state) continue loop;
          break;
      }
      
      for (var i = 0, fn; fn = group[i++];)
        fn.call(this, key, value);
    }
  }
}

LSD.Type.Relations.prototype._Properties = 
LSD.Type.Relations.prototype._unstorable = 
LSD.Type.Relations.Properties = {
  proxy: function(value, state) {
    if (value != null) this.proxies.set(value, {
      fn: this.__proxier,
      bind: this,
      callback: this,
      name: name
    });
    if (old != null) this.proxies.unset(old, this);
  },
  
  match: function(value, state) {
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
  
  callbacks: function(key, value, state) {
    if (!this._callbacks) this._callbacks = {};
    var group = (this._callbacks[key] || (this._callbacks[key] = {}));
    for (var name in value) {
      var subgroup = group[name];
      if (!subgroup) subgroup = group[name] = [];
      if (state === false) {
        var index = subgroup.indexOf(value[name]);
        if (index > -1) subgroup.splice(index, 1);
      } else {
        subgroup.push(value[name]);
      }
    }
  }
};

LSD.Type.Relations.getScopeName = function(scoped) {
  return function(relation, scope, multiple) {
    var key = Array.prototype.join.call(arguments);
    return (scoped[key] || (scoped[key] = (scope + LSD.capitalize(relation))))
  }
}({});