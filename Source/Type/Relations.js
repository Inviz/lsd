/*
---
 
script: Relations.js
 
description: An dynamic collection or link with specific configuration
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Struct.Group.Array

provides: 
  - LSD.Type.Relations
 
...
*/

LSD.Type.Relations = LSD.Struct.Group.Collection({
  matches: '.matches'
});
LSD.Type.Relations.prototype.onChange = function(key, value, state, old) {
  if (value.lsd) {
    var group = this[key]
    if (this._parent) {
      var widget = state ? group[0] || value : group[1] || null;
      var options = this._options && this._options[key];
      if (options) {
        for (var name in options) {
          var opts = options[name];
          if (!opts.length) continue;
          switch (name) {
            case 'singular':
              var previous = this._parent[key];
              this._parent.set(key, widget);
              if (previous !== this[key]) this._parent.unset(key, previous);
              break;
            case 'as':
              if (state) {
                if (old == null) value.set(opts[opts.length - 1], this._parent);
              } else {
                value.unset(opts[opts.length - 1], this._parent);
              }
              break;
            case 'collection':  
              var collection = opts[opts.length - 1];
              if (state) {
                if (old == null) {
                  if (value[collection] == null) value[collection] = new LSD.Array;
                  value[collection].push(this._parent);
                }
              } else {
                var index = value[collection].indexOf(this._parent);
                value[collection].splice(index, 1);
              }
          }
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
    this._parent.set(key, value, null, true);
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
    var skip = value._skip; 
    for (var prop in value) {
      if (value.hasOwnProperty(prop) && (skip == null || !skip[prop])) {
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
LSD.Type.Relations.prototype._setOption = function(index, key, value, state, prepend) {
  var options = this._options;
  if (!options) options = this._options = {};
  var storage = options[key];
  if (!storage) storage = options[key] = {};
  var group = storage[index];
  if (!group) group = storage[index] = [];
  if (state !== false) {
    if (prepend) group.unshift(value);
    else group.push(value);
  } else {
    if (prepend) {
      for (var i = 0, j = group.length; i < j; i++)
        if (group[i] === value) {
          group.splice(i, 1);
          break;
        }
      if (j == i) return
    } else {
      for (var j = group.length; --j > -1;)
        if (group[j] === value) {
          group.splice(j, 1);
          break;
        }
      if (j == -1) return
    }
  }
  return group[group.length - 1];
};

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
    var group = this._options && this._options[key];
    if (group && (group = group.as)) var old = group[group.length - 1];
    var alias = this._setOption('as', key, value, state, prepend);
    var related = this[key];
    if (related) for (var i = 0, widget; widget = related[i++];) {
      if (alias != null) widget.set(alias, this._parent);
      if (old != null) widget.unset(old, this._parent);
    }
  },
  
  collection: function(key, value, state, prepend) {
    var group = this._options && this._options[key];
    if (group && (group = group.as)) var old = group[group.length - 1];
    var alias = this._setOption('collection', key, value, state, prepend);
    var related = this[key];
    if (related) for (var i = 0, widget; widget = related[i++];) {
      if (alias != null) {
        if (!widget[alias]) widget[alias].set(alias, new LSD.Array);
        widget[alias].push(this._parent);
      }
      if (old != null) {
        widget[alias].splice(widget[alias].indexOf(this._parent), 1)
      }
    }
  },
  
  singular: function(key, value, state, prepend) {
    var singular = this._setOption('singular', key, true, state, prepend);
    var group = this[key];
    var widget = group && group[0] || null;
    if (singular) this._parent.set(key, widget);
    else this._parent.unset(key, widget);
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