/*
---
 
script: Attributes.js
 
description: A mixin that adds support for setting attributes, adding and removing classes and pseudos
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Script/LSD.Object
  - Core/Slick.Parser
 
provides: 
  - LSD.Module.Attributes
 
...
*/

LSD.Module.Pseudos = LSD.Struct.Stack();
LSD.Module.Pseudos.implement({
  onChange: function(name, value, state, old, memo) {
    if (!memo && LSD.States[name]) this._parent.states[state ? 'include' : 'erase'](name, 'pseudos');
    this._parent.fireEvent('selectorChange', ['pseudos', name, state]);
  }
})

LSD.Module.Classes = LSD.Struct.Stack();
LSD.Module.Classes.implement({
  onChange: function(name, value, state, old, memo) {
    if (!memo && LSD.States[name]) this._parent.states[state ? 'include' : 'erase'](name, 'classes');
    if (this._parent.element) this._parent.element[state ? 'addClass' : 'removeClass'](name);
    this._parent.fireEvent('selectorChange', ['classes', name, state]);
  }
})


LSD.Module.Attributes = LSD.Struct.Stack();
LSD.Module.Attributes.implement({
  onChange: function(name, value, state, old, memo) {
    if (!memo && LSD.States[name]) this._parent.states[state ? 'include' : 'erase'](name, 'attributes');
    value = LSD.Module.Attributes.resolve(name, value, this._parent);
    if (this._parent.element && (name != 'type' || LSD.toLowerCase(this._parent.element.tagName) != 'input')) {
      if (state) this._parent.element.setAttribute(name, LSD.Attributes[name] == 'boolean' ? name : value);
      else this._parent.element.removeAttribute(name);
      if (LSD.Attributes[name] == 'boolean') this._parent.element[name] = state;
    }
    if (name.substr(0, 5) == 'data-') {
      if (typeof value != 'undefined') this.dataset[state ? 'set' : 'unset'](name.substring(5), value);
      if (typeof old != 'undefined') this.dataset.unset(name.substring(5), old);
    }
    this._parent.fireEvent('selectorChange', ['attributes', name, state]);
    return value;
  },
  
  onBeforeChange: function() {
    this._parent.fireEvent('selectorChange', ['attributes', name, state]);
  }
});

LSD.Attributes = Object.append({
  tabindex: Number,
  width:    'number',
  height:   'number',
  readonly: 'boolean',
  disabled: 'boolean',
  hidden:   'boolean',
  checked:  'boolean',
  multiple:  'boolean',
  id: function(id) {
    this.id = id;
  },
  'class': function(value) {
    value.split(' ').each(this.addClass.bind(this));
  },
  style: function(value) {
    value.split(/\s*;\s*/).each(function(definition) {
      var bits = definition.split(/\s*:\s*/)
      if (!bits[1]) return;
      bits[0] = bits[0].camelCase();
      var integer = bits[1].toInt();
      if (bits[1].indexOf('px') > -1 || (integer == bits[1])) bits[1] = integer
      //this.setStyle.apply(this, bits);
    }, this);
  }
}, LSD.Attributes);

LSD.Module.Dataset = LSD.Struct.Stack();
LSD.Module.Variables = LSD.Struct.Stack()

LSD.Module.Attributes = new Class({
  getAttribute: function(name) {
    switch (name) {
      case "class":           return this.classes.join(' ');
      case "slick-uniqueid":  return this.lsd;
      default:                return this.attributes[name];
    }
  },
  
  getAttributeNode: function(name) {
    return {
      name: name,
      value: this.getAttribute(name),
      ownerElement: this
    }
  },

  setAttribute: function(name, value) {
    this.attributes.set(name, value);
    return this;
  },
  
  removeAttribute: function(name) {
    this.attributes.unset(name, this.attributes[name]);
    return this;
  },
  
  addPseudo: function(name){
    this.pseudos.include(name);
    return this;
  },

  removePseudo: function(name) {
    this.pseudos.erase(name);
    return this;
  },
  
  addClass: function(name) {
    this.classes.include(name);
    return this;
  },

  removeClass: function(name){
    this.classes.erase(name);
    return this;
  },
  
  hasClass: function(name) {
    return this.classes[name]
  },
  
  getSelector: function() {
    var parent = this.parentNode;
    var selector = (parent && parent.getSelector) ? parent.getSelector() + ' ' : '';
    selector += this.tagName;
    if (this.attributes.id) selector += '#' + this.attributes.id;
    for (var klass in this.classes)  if (this.classes.has(klass))  selector += '.' + klass;
    for (var pseudo in this.pseudos) if (this.pseudos.has(pseudo)) selector += ':' + pseudo;
    for (var name in this.attributes) if (this.attributes.has(name))
      if (name != 'id') {
        selector += '[' + name;
        if (LSD.Attributes[name] != 'boolean') selector += '=' + this.attributes[name]
        selector += ']';
      }
    return selector;
  }
});
