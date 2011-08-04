/*
---
 
script: Interpolations.js
 
description: Retrieves meta data from widgets and runs expressions with it
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events
  - LSD.Interpolation

provides: 
  - LSD.Module.Interpolations
 
...
*/

LSD.Module.Interpolations = new Class

Object.append(LSD.Module.Interpolations, {
  addInterpolation: function(token, callback) {
    var index = token.indexOf('.');
    if (index > -1) {
      var string = token.substr(0, index), saved;
      var finder = function(value) {
        var key = token.substring(index + 1);
        if (value == null) {
          saved.unwatch(key, callback);
          delete saved;
        } else if (typeof value == 'object' && value.watch) {  
          saved = value;
          value.watch(key, callback);
        } else {
          callback(value);
        }
      };
      finder.callback = callback;
      LSD.Module.Interpolations.addInterpolation.call(this, string, finder);
    } else {
      for (var node = this, length, interpolators, interpolations, group; node; node = node.parentNode) {
        if (!(interpolations = node.interpolations)) interpolations = node.interpolations = {};
        if (!(group = node.interpolations[token])) group = node.interpolations[token] = [];
        group.push(callback);
        if ((interpolators = node.interpolators) && (interpolators = interpolators[token])) {
          if (length = interpolators.length) {
            var value = interpolators[length - 1];
            if (value.call) value = value.call(node, token, callback, true);
            if (value != null) callback(value);
            break;
          }
        }
      }
    }
  },
  
  removeInterpolation: function(token, callback) {
    var index = token.indexOf('.');
    if (index > -1) {
      var string = index.substr(shift || 0, index);
      LSD.Module.Interpolations.removeInterpolation.call(this, string, callback);
    } else {
      for (var node = this; node; node = node.parentNode) {
        var group = node.interpolations[token];
        var index = group.indexOf(callback);
        if (index > -1) group.splice(index, 1);
      }
    }
  },
  
  getInterpolationCallback: function() {
    return (this.interpolationCallback || (this.interpolationCallback = function(name, value, state) {
      this[state ? 'addInterpolator' : 'removeInterpolator'](name, value);
    }.bind(this)));
  },
  
  findParentInterpolator: function(name) {
    for (var node = this, group; node = node.parentNode;)
      if ((group = node.interpolators) && (group = group[name]) && group.length)
        return group[group.length - 1];
  },
  
  addInterpolator: function(name, value) {
    if (name.toObject) {
      var callback = LSD.Module.Interpolations.getInterpolationCallback.call(this);
      name.addEvent('change', callback).addEvent('beforechange', callback);
      for (var property in name) if (name.has(property)) 
        LSD.Module.Interpolations.addInterpolator.call(this, property, name[property]);
    } else if (name.call) {

    } else if (!name.indexOf) {
      for (var property in name)
        LSD.Module.Interpolations.addInterpolator.call(this, property, name[property]);
    } else {
      var interpolators = this.interpolators;
      if (!interpolators) interpolators = this.interpolators = {};
      var group = interpolators[name];
      if (!group) group = interpolators[name] = [];
      group.push(value);
      var interpolations = this.interpolations;
      if (interpolations) {
        var fns = interpolations[name];
        if (fns) for (var i = 0, fn, lazy = true; fn = fns[i++];) {
          if (value.call && lazy && !(lazy = false)) value = value.call(this, name, value);
          fn(value);
        }
      }
    }
  },
  
  removeInterpolator: function(name, value) {
    if (name.toObject) {
      var callback = LSD.Module.Interpolations.getInterpolationCallback.call(this);
      name.removeEvent('change', callback).removeEvent('beforechange', callback);
      for (var property in name) if (name.has(property)) this.removeInterpolator(property, name[property])
    } else if (name.call) {

    } else if (!name.indexOf) {
      for (var property in name)
        LSD.Module.Interpolations.removeInterpolator.call(this, property, name[property]);
    } else {
      var group = this.interpolators[name];
      var index = group.indexOf(value);
      if (index > -1) {
        group.splice(index, 1);
        var length = group.length;
        if (index == length) {
          if (!length) delete this.interpolators[name];
          var interpolations = this.interpolations;
          if (interpolations) {
            var fns = interpolations[name];
            var replacement = length ? group[length - 1] : LSD.Module.Interpolations.findParentInterpolator.call(this, name);
            if (fns) for (var i = 0, fn; fn = fns[i++];) fn(replacement);
          }
        }
      }
    }
  }
});

['addInterpolator', 'removeInterpolator', 'addInterpolation', 'removeInterpolation'].each(function(method) {
  LSD.Module.Interpolations.implement(method, LSD.Module.Interpolations[method]);
});