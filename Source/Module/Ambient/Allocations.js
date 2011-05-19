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
  
  require: function(type, name) {
    var allocation = LSD.Allocations[type];
    if (allocation) {
      if (allocation.multiple) {
        var group = this.allocated[type] || (this.allocated[type] = {});
        if (group[name]) return group[name];
      } else {
        if (this.allocated[type]) return this.allocated[type];
      }
      this.allocate
    }
  },
  
  allocate: function(type, name) {
    var allocation = LSD.Allocations[type], allocations = this.allocations;
    if (!allocation) return;
    var options = this.options.allocations && this.options.allocations[type];
    if (allocation.multiple) {
      var group = allocations[type] || (allocations[type] = {});
      if (group[name]) return group[name];
      if (options) options = options[name];
    } else {
      if (allocations[type]) return allocations[type];
    }
    return ((group || allocations)[name] = allocation.call(this, type, name, options));
  },
  
  release: function(type, name) {
    
  }
  
});

LSD.Allocations = {
  input: {
    layout: function() {
      
    }
  },
  
  dialog: {
    multiple: true,
    initialize: function(type) {
      return {
        source: 'body-dialog' + (type ? '-' + type : '')
      }
    }
  },
  
  menu: {
    selector: 'menu[type=context]',
    proxy: function(widget) {
      return widget.pseudos.item;
    },
    states: {
      set: {
        expanded: 'hidden'
      }
    }
  },
  
  scrollbar: {
    
  },
  
  editor: function(name, type) {
    return {
      options: {
        attributes: {
          name: name
        }
      },
      source: type == 'area' ? 'textarea' : ('input-' + (type || 'text'))
    }
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
}


