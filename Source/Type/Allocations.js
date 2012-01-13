/*
---
 
script: Relation.js
 
description: An unsettable relation that dispatches options to specific widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Struct.Stack

provides: 
  - LSD.Type.Allocations
  - LSD.allocations.lightbox
  - LSD.allocations.dialog
  - LSD.allocations.contextmenu
  - LSD.allocations.scrollbar
  - LSD.allocations.container
  - LSD.allocations.message
  - LSD.allocations.input
  - LSD.allocations.submit
 
...
*/

LSD.Type.Allocations = LSD.Struct({

});
LSD.Type.Allocations.prototype.onChange = function(key, value, state, old, memo) {
  var ns = this._parent.namespace || LSD;
  var options = ns.allocations[key];
  if (options) value.mix(options, null, state);
  return value;
}
LSD.Type.Allocations.prototype._eager = true;
LSD.Type.Allocations.prototype._getConstructor = function(key) {
  var ns = this._parent.namespace || LSD;
  if (ns.allocations[key]) return this._parent.__constructor || this._parent._constructor;
}
LSD.Type.Allocations.Properties = {
  proxy: function() {
    
  },
  
  options: function() {
    
  }
};
LSD.mix('allocations', {
  lightbox: {
    tagName: 'body',
    attributes: {
      type: 'lightbox'
    }
  },
  dialog: {
    multiple: true,
    tagName: 'body',
    attributes: {
      type: 'dialog'
    }
  },
  contextmenu: {
    tagName: 'menu',
    attributes: {
      type: 'context'
    }
  },
  scrollbar: {
    tagName: 'scrollbar'
  },
  container: {
    clases: ['container'],
    proxy: {
      type: 'promise',
      mutation: true,
      priority: -1,
      rewrite: false
    }
  },
  message: {
    tagName: 'p',
    classes: ['message'],
    parent: 'document',
    options: function(options, type, message) {
      var opts = {}
      opts.content = message;
      if (type) opts.classes = Array.object(type);
      return opts;
    }
  },
  editableField: {
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
        margin: 0,
        display: 'block',
        border: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'absolute'
      }
    }, options));
  }
})