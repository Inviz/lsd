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
  
  allocate: function(type, kind, options) {
    options = arguments[arguments.length - 1];
    if (options.type) {
      type = options.type;
      if (options.kind) kind = options.kind;
      options = options.options || {};
    }
    var allocation = LSD.Allocations[type];
    if (!allocation) throw "Dont know how to allocate " + type;
    var group = this.allocations[type];
    if (allocation.multiple && kind == null) {
      if (!group.length) group.length = 0;
      kind = group.length++;
    }
    if (group) {
      if (kind && group[kind]) return group[kind];
      else return group;
    } else if (allocation.multiple) {
      group = this.allocations[type] = {};
    }
    var id = (kind == null) ? type : kind;
    var options = this.preallocate.apply(this, arguments);
    var parent = options.parent;
    delete options.parent;
    var object = this.buildLayout(options.source || options.tag, parent, {options: options});
    var stored = options.stored;
    if (stored && object.store) {
      for (var name in stored) stored[name].apply(this, object);
      object.store('allocation', stored);
      delete options.stored;
    }
    if (id == null) id = type;
    (group || this.allocations)[id] = object;
    return object;
  },
  
  release: function(type, kind, options) {
    options = arguments[arguments.length - 1];
    if (options.type) {
      type = options.type;
      if (options.kind) kind = options.kind;
      options = options.options || {};
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
        var result = handler.call(this, object, options[name], true, value);
        if (options[name] != null) object.eliminate(key, options[name]);
      }
      object.parentNode.removeChild(object);
      delete group[index || type];
    }
  },
  
  preallocate: function(type, kind, options) {
    options = arguments[arguments.length - 1];
    if (options.type) {
      type = options.type;
      if (options.kind) kind = options.kind;
      options = options.options || {};
    }
    var allocation = LSD.Allocations[type];
    if (!allocation) throw "Dont know how to preallocate " + type;
    var opts = this.options.allocations && this.options.allocations[type];
    if (allocation.multiple) {
      if (kind == null) {
        if (!group.length) group.length = 0;
        kind = group.length++;
      }
      var customized = LSD.Allocations[type + '-' + kind];
      if (opts) opts = opts[kind];
    }
    if (allocation.call) {
      allocation = allocation.apply(this, arguments);
      if (allocation.nodeType) var object = allocation;
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
    };
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
        if (object.lsd) var element = object.element || object.toElement(), widget = object;
        else var element = object, widget = this;
        if (proxy.queued) 
          for (var i = 0, child; child = proxy.queued[i++];)
            this.layout.appendChild(child.lsd ? widget : element, child, null, child.lsd ? element : null);
        proxy.container = object;
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
    options: function(options, message, type) {
      var opts = {}
      opts.content = message;
      if (type) opts.classes = Object.array(type);
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