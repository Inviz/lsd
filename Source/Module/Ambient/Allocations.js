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
  
  allocate: function(type, kind, options, arg) {
    if (type && !type.indexOf) {
      kind = type.kind;
      options = type.options;
      type = type.type;
    }
    var allocation = LSD.Allocations[type];
    if (!allocation) throw "Dont know how to allocate " + type;
    var group = this.allocations[type];
    if (allocation.multiple) {
      if (!group) group = this.allocations[type] = {};
      if (kind == null) kind = (group.length ? group.length++ : (group.length = 1) - 1);
      else if (group[kind]) return group[kind];
      var id = kind;
    } else {
      if (group) return group;
      var id = type;
    }
    options = this.preallocate(type, kind, options, arg)
    if (options.nodeType) {
      var object = options;
    } else {
      var parent = options.parent;
      delete options.parent;
      if (!options.source || options.source.indexOf) 
        var object = this.document.layout.selector(options, parent);
      else 
        var object = this.document.layout.render(source, parent, {options: options});
      var stored = options.stored;
      if (stored && object.store) {
        for (var name in stored) stored[name].call(this, object);
        object.store('allocation', stored);
        delete options.stored;
      }
    }
    if (id == null) id = type;
    (group || this.allocations)[id] = object;
    return object;
  },
  
  release: function(type, kind, options) {
    if (type && !type.indexOf) {
      kind = type.kind;
      options = type.options;
      type = type.type;
    }
    var allocation = LSD.Allocations[type];
    if (!allocation) throw "Dont know how to release " + type;
    var group = this.allocations, object = group[type];
    if (allocation.multiple) {
      var index = name || group.length++ - 1;
      group = object;
      object = group[index];
    }
    if (!object) throw "Cant release " + type + " because it was not allocated";
    if (object && object.retrieve) {
      var options = object.retrieve('allocation');
      if (options) for (var name in options) if (options[name]) {
        var handler = LSD.Module.Allocations.Options[name];
        if (handler) {
          var result = handler.call(this, object, false, options[name]);
        }
        if (options[name] != null) object.eliminate('allocation', options[name]);
      }
      object.parentNode.removeChild(object);
      delete group[index || type];
    }
  },
  
  preallocate: function(type, kind, options, arg) {
    if (type && !type.indexOf) {
      kind = type.kind;
      options = type.options;
      type = type.type;
    }
    var allocation = LSD.Allocations[type];
    if (!allocation) throw "Dont know how to preallocate " + type;
    var opts = this.options.allocations && this.options.allocations[type];
    if (allocation.multiple) {
      if (kind == null) {
        var group = this.allocations[type];
        if (!group.length) group.length = 0;
        kind = group.length++;
      }
      var customized = LSD.Allocations[type + '-' + kind];
      if (opts) opts = opts[kind];
    }
    if (allocation.call) {
      allocation = allocation.apply(this, arguments);
      if (allocation.nodeType) return allocation;
    } else {
      if (allocation.options)
        var generated = allocation.options.call 
          ? allocation.options.call(this, options, typeof kind == 'number' ? null : kind, arg) 
          : allocation.options;
    }
    options = Object.merge({}, allocation, generated, customized, opts, options);
    if (type && !options.attributes || !options.attributes.type) (options.attributes || (options.attributes = {})).type = type;
    if (kind && !options.attributes || !options.attributes.kind) (options.attributes || (options.attributes = {})).kind = kind;
    delete options.multiple;
    delete options.options;
    var source = options.source;
    if (source && source.call) options.source = source = source.call(this, kind, options);
    var parent = options.parent ? (options.parent.call ? options.parent.call(this) : options.parent) : this;
    //switch (parent) {
    //  case "parent":
    //    parent = this.parentNode;
    //    break;
    //  case "root":
    //    parent = this.root;
    //    break;
    //  case "document":
    //    parent = document.body;
    //}
    if (!parent.lsd) parent = [this, parent];
    options.parent = parent.push ? [].concat(parent) : parent;
    var callbacks;
    for (var name in options) if (options[name]) {
      var handler = LSD.Module.Allocations.Options[name];
      if (handler) {
        var result = handler.call(this, options[name], true);
        if (result != null) {
          if (!callbacks) callbacks = {};
          callbacks[name] = result;
          delete options[name];
        }
      }
    }  
    if (callbacks) options.stored = callbacks;
    return options;
  }
  
});

LSD.Module.Events.addEvents.call(LSD.Module.Allocations.prototype, {
  getRelated: function(type, id, classes, attributes, pseudos) {
    if (!LSD.Allocations[type]) return;
    return this.allocate(LSD.Module.Allocations.compile(type, classes, attributes, pseudos));
  }
});

LSD.Module.Allocations.Options = {
  position: function(position, state, memo) {
    if (state) {
      if (position.match || position.push) position = {attachment: position};
      if (!position.anchor && position.anchor !== false) position.anchor = this;
      if (!position.boundaries && position.boundaries !== false) position.boundaries = true;
      var callback = function(object) {
        callback.position = new LSD.Position(object, position);
      }
      return callback;
    } else {  
      if (memo.position) memo.position.detach();
    }
  },
  
  proxy: function(proxy, state, memo) {
    if (state) {
      if (proxy === true || !proxy) proxy = {};
      proxy.container = false;
      this.addProxy('allocated', proxy);
      var callback = function(object) {
        LSD.Module.Proxies.realize(object, this, proxy)
      }.bind(this);
      callback.proxy = proxy;
      return callback;
    } else {
      this.removeProxy('allocated', memo.proxy);
    }
  }
}

LSD.Module.Allocations.compile = function(type, classes, attributes, pseudos) {
  var name, kind, options = {}
  if (classes)
    for (var i = 0, klass; klass = classes[i++];)
      (options.classes || (options.classes = {}))[klass.name] = true;
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
  return {type: type, name: name, kind: kind, options: options}
}

LSD.Allocations = {
  
  lightbox: {
    source: 'body[type=lightbox]'
  },
  
  dialog: {
    multiple: true,
    source: 'body[type=dialog]',
    options: function(options, kind) {
      if (kind) return {attributes: {kind: kind}}
    }
  },
  
  menu: {
    source: 'menu[type=context]'
  },
  
  scrollbar: {
    source: 'scrollbar'
  },
  
  container: {
    source: '.container',
    proxy: {
      mutation: true,
      priority: -1,
      rewrite: false
    }
  },
  
  message: {
    source: 'p.message',
    parent: 'document',
    options: function(options, type, message) {
      var opts = {}
      opts.content = message;
      if (type) opts.classes = Array.object(type);
      return opts;
    }
  },
  
  editor: {
    options: function(options, type, name) {
      return Object.merge(
        {source: type == 'area' ? 'textarea' : ('input' + (type ? '[type=' + type : ']'))}, 
        name ? {attributes: {name: name}} : null
      )
    }
  },
  
  input: function(options, type, name) {
    return new Element('input', Object.merge({
      type: type || 'text',
      name: name
    }, options));
  },
  
  submit: function(options) {
    var widget = this;
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
      }
    }, options));
  }
};