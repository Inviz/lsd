/*
---
 
script: Properties.js
 
description: A watchable proxy object that holds internal widget properties
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Script/LSD.Script.Scope
  - LSD.Script/LSD.Struct
  - LSD.Module.Options
  - LSD.Module.Events
  - LSD.Module.Attributes
  
  
provides:
  - LSD.Module.Properties

...
*/


LSD.Properties = Object.append(LSD.Properties || {}, {

  context: function(value, state, old) {
    var source = this.source;
    if (source) this.properties.unset('source', source);
    if (state) {
      if (typeof value == 'string') {
        var camel = LSD.toClassName(value);
        this.factory = LSD.global[this.options.namespace][camel];
        if (!this.factory) throw "Can not find LSD.Type in " + ['window', this.options.namespace, camel].join('.');
      } else {
        this.factory = value;
      }
    }
    if (source) this.properties.set('source', source);
  },

  tag: function(value, state, old) {
    if (!this.options.source && this.prepared) {
      if (state && value) this.properties.set('source', value)
      else if (old) this.properties.unset('source', value);
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
      } else if (this.properties.role) {
        this.properties.unset('role', this.role);
      }
    }
  },
  
  role: function(value, state, old) {
    if (state) return LSD.Module.Properties.setRole(this, value)
    else if (old) LSD.Module.Properties.unsetRole(this, value)
  },
  
  scope: function(value, state, old) {
    if (state) return LSD.Script.Scope.setScope(this, value)
    else if (old) LSD.Script.Scope.unsetScope(this, value);
  }
});

LSD.Module.Properties = new Class({

  store: function(name, value) {
    this.storage[name] = value;
    return this;
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
    delete this.storage[name];
    return this;
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