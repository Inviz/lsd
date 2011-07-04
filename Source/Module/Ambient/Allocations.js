/*
---
 
script: Allocations.js
 
description: Spares a few temporal widgets or elements
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module

provides:
  - LSD.Module.Allocations
 
...
*/

LSD.Module.Allocations = new Class({
  initializers: {
    allocations: function() {
      this.allocations = {};
    }
  },
  
  allocate: function(type, name) {
    var allocation = LSD.Allocations[type], allocations = this.allocations;
    if (!allocation) return;
    var options = this.options.allocations && this.options.allocations[type], object;
    if (allocation.multiple) {
      var group = allocations[type] || (allocations[type] = {});
      if (name) {
        var index = type + '-' + name;
        var customized = LSD.Allocations[index];
        if (group[name]) return group[name];
      } else {
        for (name = 0; allocations[++name];);
      }
    } else {
      if (allocations[type]) return allocations[type];
    }
    if (allocation.call) {
      allocation = allocation.call(this, name, options);
      if (allocation.nodeType) object = allocation;
    }
    if (!object) {      
      options = Object.append({}, allocation, customized, options);
      delete options.multiple;
      delete options.parent;
      if (options.source.call) options.source = options.source.call(this, name, options);
      object = parent.buildLayout(options.source, parent, options);
    };
    (group || allocations)[name] = object;
    return object;
  },
  
  release: function(type, name, widget) {
    var allocations = this.allocations, group = allocations[type];
    if (group) {
      if (!name) name = 1;
      if (group[name]) {
        group[name].dispose();
        delete group[name];
      }
    }
  }
  
});

LSD.Module.Events.addEvents.call(LSD.Module.Allocations.prototype, {
  getRelated: function(type, name) {
    if (LSD.Allocations[type]) return this.allocate(type, name);
  }
});

LSD.Allocations = {
  
  lightbox: {
    source: 'body-lightbox'
  },
  
  dialog: {
    multiple: true,
    source: function(name) {
      return 'body-dialog-' + name;
    }
  },
  
  menu: {
    source: 'menu-context'
  },
  
  scrollbar: {
    source: 'scrollbar'
  },
  
  editor: function(type, name) {
    return {
      attributes: {
        name: name
      },
      source: type == 'area' ? 'textarea' : ('input' + (type ? '-' + type : ''))
    }
  },
  
  input: function(type, name) {
    return new Element('input', {
      type: type || 'text',
      name: name
    });
  },
  
  submit: function() {
    return new Element('input', {
      type: 'submit',
      styles: {
        width: 1,
        height: 0,
        display: 'block',
        border: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'absolute'
      },
      events: {
        click: function(e) {
          e.preventDefault()
        }
      }
    });
  }
};