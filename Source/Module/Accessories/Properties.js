/*
---
 
script: Properties.js
 
description: A watchable proxy object that holds internal widget properties
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Object
  - LSD.Module.Options
  - LSD.Module.Events
  
provides:
  - LSD.Module.Properties

...
*/

LSD.Module.Properties = new Class({
  options: {
    context: 'element',
    namespace: 'LSD'
  },
  
  constructors: {
    properties: function() {
      var self = this;
      this.storage = new LSD.Object;
      this.properties = (new LSD.Object).addEvent('change', function(name, value, state, old, memo) {
        var property = LSD.Module.Properties.Exported[name] || name;
        var method = LSD.Module.Properties.Methods[name];
        var alias = LSD.Module.Properties.Aliased[name];
        var events = self.events && self.events[name];
        if (!state) old = value;
        if (old != null) {
          if (alias) delete self[alias];
          delete self[property];
          self.fireEvent('unset' + name.capitalize(), old);
          if (events) LSD.Module.Events.setStoredEvents.call(old, events, false, self);
          if (method) method.call(self, old, false, value, memo);
        }
        if (state && value != null) {
          if (alias) self[alias] = value;
          self[property] = value;
          self.fireEvent('set' + name.capitalize(), value);
          if (events) LSD.Module.Events.setStoredEvents.call(value, events, true, self);
          if (method) method.call(self, value, true, old, memo);
        }
      })
    }
  },

  store: function(name, value) {
    return this.storage.set(name, value);
  },

  retrieve: function(name, placeholder) {
    var value = this.storage[name];
    if (value == null) {
      if (placeholder != null) this.store(name, placeholder);
      return placeholder
    }
    return value;
  },

  eliminate: function(name, value) {
    return this.storage.unset(name, value)
  }
});

LSD.Module.Events.addEvents.call(LSD.Module.Properties.prototype, {
  initialize: function() {
    if (!this.options.source)
      this.properties.set('source', LSD.Module.Properties.getSource(this));
  },
  beforeBuild: function() {
    if (this.source == null) this.properties.set('source', LSD.Module.Properties.getSource(this));
  }
});

Object.append(LSD.Options, {
  tag: {
    add: function(value) {
      this.properties.set('tag', value);
    },
    remove: function(value) {
      this.properties.unset('tag', value);
    }
  },
  
  context: {
    add: function(value) {
      this.properties.set('context', value)
    },
    remove: function(value) {
      this.properties.unset('context', value)
    }
  },
  
  source: {
    add: function(value) {
      this.properties.set('source', value)
    },
    remove: function(value) {
      this.properties.unset('source', value)
    }
  },
  //
  //namespace: {
  //  add: function(value) {
  //    this.properties.set('source', value)
  //  },
  //  remove: function(value) {
  //    this.properties.unset('source', value)
  //  }
  //}
});

LSD.Module.Properties.Methods = {
  tag: function(value, state, old) {
    if (!state || old) 
      if (this.source) this.properties.unset('source', this.source);
    var source = this.options.source;
    this.properties.set('source', source || LSD.Module.Properties.getSource(this, state ? value : false));
  },
  
  context: function(value, state, old) {
    var source = this.source;
    if (source) this.properties.unset('source', source);
    if (state) {
      var camel = LSD.toClassName(value);
      this.factory = window[this.options.namespace][camel];
      if (!this.factory) throw "Can not find LSD.Type in " + ['window', this.options.namespace, camel].join('.');
    }
    if (source) this.properties.set('source', source);
  },
  
  source: function(value, state, old) {
    if (state && value) {
      var role = this.factory.find(value);
      if (role && this.role == role) return;
    }
    if (!state || old) {
      var previous = this.role;
      if (previous) {
        delete this.role;
        this.unmix(previous);
      }
      var options = this.sourced;
      if (options) {
        delete this.sourced;
        this.unsetOptions(this.sourced);
      }
    }
    if (state) {
      if (role) {
        var kind = this.attributes.kind
        if (kind) role = role[LSD.toClassName(kind)] || role;
        this.role = role;
        this.mixin(role);
        if ((this.sourced = this.captureEvent('setRole', role))) this.setOptions(this.sourced);
      }
    }
  }
};

LSD.Module.Properties.getSource = function(widget, tagName) {
  var source = LSD.Layout.getSource(widget.attributes, tagName === false ? null : tagName || widget.tagName);
  return source && source.join ? source.join('-') : source;
};

LSD.Module.Properties.Exported = {
  parent: 'parentNode',
  next: 'nextSibling',
  previous: 'previousSibling',
  first: 'firstChild',
  last: 'lastChild',
  tag: 'tagName'
};

LSD.Module.Properties.Aliased = {
  document: 'ownerDocument',
  tag: 'nodeName'
};