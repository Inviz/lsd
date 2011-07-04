/*
---
 
script: Allocations.js
 
description: Spares a few temporal widgets or elements
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events

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
  
  allocate: function(type, name, options) {
    var allocation = LSD.Allocations[type];
    if (!allocation) return;
    var allocations = this.allocations, object;
    var opts = this.options.allocations && this.options.allocations[type];
    if (allocation.multiple) {
      var group = allocations[type] || (allocations[type] = {});
      if (name) {
        var index = type + '-' + name;
        var customized = LSD.Allocations[index];
        if (group[name]) return group[name];
      } else {
        for (var id = name; allocations[++id];);
      }
    } else {
      if (allocations[type]) return allocations[type];
    }
    if (allocation.call) {
      allocation = allocation.call(this, name, options);
      if (allocation.nodeType) object = allocation;
    } else {
      if (allocation.options)
        var generated = allocation.options.call ? allocation.options.call(this, name) : allocation.options;
    }
    if (!object) {
      options = Object.append({}, allocation, generated, customized, opts, options);
      delete options.multiple;
      delete options.options;
      if (options.source && options.source.call) options.source = options.source.call(this, name, options);
      options.invoker = this;
      var parent = options.parent ? (options.parent.call ? options.parent.call(this) : option.parent) : this;
      delete options.parent;
      if (!parent.lsd) parent = [parent, this];
      object = this.buildLayout(options.source || options.tag, parent, options);
      console.log(object.element, options, parent)
    };
    (group || allocations)[name || id] = object;
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
  getRelated: function(type, id, classes, attributes, pseudos) {
    if (!LSD.Allocations[type]) return;
    var name, options = {};
    if (attributes) attributes: 
      for (var i = 0, attribute; attribute = attributes[i++];) 
        switch (attribute.name) {
          case "name":
            name = attribute.value;
            break attributes;
          default:
            (options.attributes || (options.attributes = {}))[attribute.name] = attribute.value;
        }
    if (pseudos) pseudos: 
      for (var i = 0, pseudo; pseudo = pseudos[i++];) 
        switch (pseudo.key) {
          case "of-type":
            name = pseudo.value;
            break pseudos;
        }
      console.log('please alocate', type, name, options, this.tagName, this.element)
    return this.allocate(type, name, options);
  }
});

LSD.Allocations = {
  
  lightbox: {
    source: 'body-lightbox'
  },
  
  dialog: {
    multiple: true,
    options: function(name) {
      return {
        tag: 'body',
        attributes: {
          type: 'dialog',
          kind: name
        }
      }
    },
    parent: function() {
      return document.body;
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