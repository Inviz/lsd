/*
---
 
script: Allocations.js
 
description: Spares a few temporal widgets or elements
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events
  - LSD.Position

provides:
  - LSD.Module.Allocations
 
...
*/

LSD.Module.Allocations = new Class({
  constructors: {
    allocations: function() {
      this.allocations = {};
    }
  },
  
  allocate: function() {
    var args = Array.prototype.slice.call(arguments);
    var last = args[args.length - 1];
    if (last == args[0] && last.type) args = [last.type, last.kind, (last = last.options)];
    if (last && !last.indexOf && !last.push) var options = args.pop();
    var type = args[0], kind = args[1];
    var allocation = LSD.Allocations[type];
    if (!allocation) return;
    var allocations = this.allocations, object;
    var opts = this.options.allocations && this.options.allocations[type];
    if (allocation.multiple) {
      var group = allocations[type] || (allocations[type] = {});
      if (kind) {
        var id = kind;
        var index = type + '-' + kind;
        var customized = LSD.Allocations[index];
        if (group[kind]) return group[kind];
        if (opts) opts = opts[kind];
      } else {
        for (var id = kind; allocations[++id];) null;
      }
    } else {
      if (allocations[type]) return allocations[type];
    }
    if (allocation.call) {
      args[0] = options;
      allocation = allocation.apply(this, args);
      if (allocation.nodeType) object = allocation;
    } else {
      if (allocation.options)
        var generated = allocation.options.call ? allocation.options.call(this, options, kind) : allocation.options;
    }
    if (!object) {
      options = Object.merge({}, allocation, generated, customized, opts, options);
      delete options.multiple;
      delete options.options;
      if (options.source && options.source.call) options.source = options.source.call(this, kind, options);
      var parent = options.parent ? (options.parent.call ? options.parent.call(this) : options.parent) : this;
      delete options.parent;
      if (!parent.lsd) parent = [this, parent];
      object = this.buildLayout(options.source || options.tag, parent, options);
      if (object.localName && options.position) {
        Element.store(object, 'position', new LSD.Position(object, this, options.position));
      }
    };
    if (id == null) id = type;
    (group || allocations)[id] = object;
    return object;
  },
  
  release: function(type, name, widget) {
    var group = this.allocations, object = group[type];
    if (object) {
      if (!object.nodeType) {
        var index = name || group.length;
        group = object;
        object = group[index];
      }
      if (object.localName) {
        var position = Element.retrieve(object, 'position');
        if (position) {
          position.detach();
          Element.eliminate(object, 'position');
          delete position;
        }
      }
      object.parentNode.removeChild(object);
      delete group[index || type];
    }
  }
  
});

LSD.Module.Events.addEvents.call(LSD.Module.Allocations.prototype, {
  getRelated: function(type, id, classes, attributes, pseudos) {
    if (!LSD.Allocations[type]) return;
    var allocation = LSD.Module.Allocations.prepare(type, classes, attributes, pseudos);
    return this.allocate(allocation);
  }
});

LSD.Module.Allocations.prepare = function(type, classes, attributes, pseudos) {
  var name, kind;
  if (attributes)
    for (var i = 0, attribute; attribute = attributes[i++];) 
      (options.attributes || (options.attributes = {}))[attribute.name] = attribute.value;
  if (pseudos)
    for (var i = 0, pseudo; pseudo = pseudos[i++];) 
      switch (pseudo.key) {
        case "of-kind": case "of-type":
          kind = pseudo.value;
          break;
        case "of-name":
          name = pseudo.value;
          break;
        default:
          (options.pseudos || (options.pseudos = {}))[pseudo.key] = pseudo.value || true;
      }
  return {type: type, name: name, kind: kind}
}

LSD.Allocations = {
  
  lightbox: {
    source: 'body-lightbox'
  },
  
  dialog: {
    multiple: true,
    options: function(options, kind) {
      return Object.merge(
        {
          tag: 'body',
          attributes: {
            type: 'dialog'
          }
        },
        kind ? {attributes: {kind: kind}} : null,
        options
      )
    }
  },
  
  menu: {
    source: 'menu-context'
  },
  
  scrollbar: {
    source: 'scrollbar'
  },
  
  message: function(options, message, type) {
    if (!options) options = {};
    if (!options.source) options.source = 'p.message';
    if (message) options.content = message;
    if (type) (options.classes || (options.classes = {}))[type] = true;
    options.parent = document.body;
    return options;
  },
  
  editor: function(options, type, name) {
    return Object.merge(
      {source: type == 'area' ? 'textarea' : ('input' + (type ? '-' + type : ''))}, 
      name ? {attributes: {name: name}} : null,
      options
    );
  },
  
  input: function(options, type, name) {
    return new Element('input', Object.merge({
      type: type || 'text',
      name: name
    }, options));
  },
  
  submit: function(options) {
    return new Element('input', Object.merge({
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
    }, options));
  }
};