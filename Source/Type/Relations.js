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
    var group = this[key]
    if (this._parent) {
      var widget = group[0] || value;
      if (!state) widget = group[1];
      if (this._singular && this._singular[key]) {
        if (this._parent[key] != widget) this._parent[key] = widget;
      } else {
        if (state) {
          if (this._parent[key] != group)
            this._parent.set(key, group);
        } else {
          if (this._parent[key] == group && group.length == 0)
            this._parent.unset(key, group);
        }
      }
      var as = this._as && this._as[key];
      if (as != null && (as = as[0]) != null) {
        if (state) {
          if (old == null) value.set(as, this._parent);
        } else {
          value.unset(as, this._parent);
        }
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
LSD.Type.Relations.prototype.onStore = function(key, value, memo, state, name) {
  if (name == null) {
    var method = typeof value.has == 'function' ? 'has' : 'hasOwnProperty'; 
    for (var prop in value) {
      if (value[method](prop)) {
        var property = this._Properties[prop];
        if (property != null) property.call(this, key, value[prop], state);
      }
    }
  }
  return true;
};
LSD.Type.Relations.prototype._delegate = function(object, key, value, state) {
  var property = LSD.Type.Relations.Properties[key];
  if (property) return true;
};
LSD.Type.Relations.prototype.__watcher = function(call, widget, state) {
    
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
};
LSD.Type.Relations.prototype._save = function(index, key, value, state, prepend) {
  var storage = this[index];
  if (!storage) storage = this[index] = {};
  var group = storage[key];
  if (!group) group = storage[key] = [];
  if (state) {
    if (prepend) group.unshift(value);
    else group.push(value);
  } else {
    if (prepend) {
      for (var i = 0, j = length; i < j; i++)
        if (group[i] === value) {
          group.splice(i, 1);
          break;
        }
      if (j == i) return
    } else {
      for (var j = length; --j > -1;)
        if (group[j] === value) {
          group.splice(j, 1);
          break;
        }
      if (j == -1) return
    }
  }
  return group[group.length - 1];
}

LSD.Type.Relations.prototype._Properties = 
LSD.Type.Relations.prototype._unstorable = 
LSD.Type.Relations.Properties = {
  proxy: function(key, value, state) {
    if (value != null) this.proxies.set(value, {
      fn: this.__proxier,
      bind: this,
      callback: this,
      key: key
    });
    if (old != null) this.proxies.unset(value, this);
  },
  
  match: function(key, value, state) {
    if (state) { 
      this.matches.set(value, {
        fn: this.__watcher,
        bind: this,
        callback: this,
        key: key
      });
    } else {
      this.matches.unset(state ? old : value, this);
    }
  },
  
  filter: function() {
    
  },
  
  scopes: function() {
    
  },
  
  scope: function() {
    
  },
  
  as: function(key, value, state, prepend) {
    var group = this._as && this._as[key];
    if (group) var old = group[key];
    var value = this._save('_as', key, value, state, prepend);
    var related = this[key];
    if (related) for (var i = 0, widget; widget = related[i++];) {
      widget.set(value, this._parent);
      if (old != null) widget.unset(old, this._parent);
    }
  },
  
  collection: function() {
    
  },
  
  singular: function(key, value, state) {
    if (!this._singular) this._singular = {};
    if (!this._singular[key]) this._singular[key] = 0;
    var index = (this._singular[key] += (state !== false ? 1 : -1))
    var group = this[key];
    if (group) {
      if (index) {
        if (this._parent[key] != group[0]) this._parent[key] = group[0];
      } else {
        if (this._parent[key] != group)
          this._parent.set(key, group);
      }
    }
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