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
  - LSD.Module.Attributes
  - LSD.Script.Scope
  
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
      this.properties = (new LSD.Object.Stack).addEvent('change', function(name, value, state, old, memo) {
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
      });
      LSD.Script.Scope(this);
    },
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
  beforeBuild: function() {
    if (this.source == null) 
      this.properties.set('source', LSD.Module.Properties.getSource(this));
  },
  finalize: function() {
    if (this.source || this.attributes.type || this.attributes.kind) {
      var role = LSD.Module.Properties.getRole(this);
      if (this.role !== role) this.properties.set('role', role)
    }
  }
});

['tag', 'context', 'source', 'scope'].each(function(name) {
  LSD.Options[name] = {
    add: function(value) {
      this.properties.set(name, value);
    },
    remove: function(value) {
      this.properties.unset(name, value);
    }
  }
});

LSD.Module.Properties.Methods = {

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

  tag: function(value, state, old) {
    if (!this.options.source && this.prepared) {
      if (state && value) this.properties.set('source', value)
      else if (old) this.properties.unset('source', old);
    }
  },
  
  source: function(value, state, old) {
    if (state && value) {
      var role = LSD.Module.Properties.getRole(this);
      if (role && this.role === role) return;
    }
    if (this.prepared) {
      if (state) {
        this.properties.set('role', role);
      } else {
        if (this.properties.role) 
          this.properties.unset('role', this.role);
      }
    }
  },
  
  role: function(value, state, old) {
    if (state) return LSD.Module.Properties.setRole(this, value)
    else if (old) LSD.Module.Properties.unsetRole(this, old)
  },
  
  scope: function(value, state, old) {
    if (state) return LSD.Script.Scope.setScope(this, value)
    else if (old) LSD.Script.Scope.unsetScope(this, old);
  }
};

Object.append(LSD.Module.Properties, {
  getSource: function(widget, tagName) {
    var source = LSD.Layout.getSource(widget.attributes, tagName === false ? null : tagName || widget.options.source || widget.tagName);
    return source && source.join ? source.join('-') : source;
  },
  
  getRole: function(widget, tagName) {
    var source = LSD.Module.Properties.getSource(widget, tagName);
    if (!source) return;
    if (widget.attributes.type) source += '-' + widget.attributes.type;
    if (widget.attributes.kind) source += '-' + widget.attributes.kind;
    return widget.factory && widget.factory.find(source);
  },
  
  setRole: function(widget, role) {
    if (role == null) role = LSD.Module.Properties.getRole(widget)
    if (role) {
      widget.mixin(role);
      if ((widget.sourced = widget.captureEvent('setRole', role)))
        widget.setOptions(widget.sourced);
    }
    return role;
  },
  
  unsetRole: function(widget, role) {
    widget.unmix(role);
    var options = widget.sourced;
    if (options) {
      delete widget.sourced;
      widget.unsetOptions(options);
    }
  }
});

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