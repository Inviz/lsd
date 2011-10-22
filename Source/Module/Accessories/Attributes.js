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

LSD.Module.Attributes = new Class({
  constructors: {
    attributes: function() {
      var self = this;
      this.pseudos = (new LSD.Object.Stack).addEvent('change', function(name, value, state, old, memo) {
        if (!memo && LSD.States[name]) self.states[state ? 'include' : 'erase'](name, 'pseudos');
        self.fireEvent('selectorChange', ['pseudos', name, state]);
      })
      this.classes = (new LSD.Object.Stack).addEvent('change', function(name, value, state, old, memo) {
        if (!memo && LSD.States[name]) self.states[state ? 'include' : 'erase'](name, 'classes');
        if (self.element) self.element[state ? 'addClass' : 'removeClass'](name);
        self.fireEvent('selectorChange', ['classes', name, state]);
      });
      this.attributes = (new LSD.Object.Stack).addEvent('change', function(name, value, state, old, memo) {
        if (!memo && LSD.States[name]) self.states[state ? 'include' : 'erase'](name, 'attributes');
        value = LSD.Module.Attributes.resolve(name, value, self);
        if (self.element && (name != 'type' || LSD.toLowerCase(self.element.tagName) != 'input')) {
          if (state) self.element.setAttribute(name, LSD.Attributes[name] == 'boolean' ? name : value);
          else self.element.removeAttribute(name);
          if (LSD.Attributes[name] == 'boolean') self.element[name] = state;
        }
        self.fireEvent('selectorChange', ['attributes', name, state]);
        return value;
      }).addEvent('beforechange', function(name, value, state) { 
        self.fireEvent('selectorChange', ['attributes', name, state]);
      });
      this.dataset = new LSD.Object
      this.variables.merge(this.dataset);
    }
  },
  
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
    if (name.substr(0, 5) == 'data-') {
      this.dataset.set(name.substring(5), value);
    } else {
      this.attributes.set(name, value);
    }
    return this;
  },
  
  removeAttribute: function(name) {
    if (name.substr(0, 5) == 'data-') {
      this.dataset.unset(name.substring(5));
    } else this.attributes.unset(name, this.attributes[name]);
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

LSD.Module.Attributes.List = {
  tabindex: 'number',
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
};

Object.each(LSD.Module.Attributes.List, function(value, name) {
  if (!LSD.Attributes[name]) LSD.Attributes[name] = value;
});

LSD.Module.Attributes.resolve = function(name, value, bind) {
  var attribute = LSD.Attributes[name];
  switch (attribute) {
    case "boolean":
      return (name == value || value === true);
    case "number":
      return parseFloat(value);
    default:
      if (attribute && attribute.call) {
        var resolved = attribute.call(bind || this, value)
        return resolved == null ? value : resolved;
      }
  }
  return value;
};

Object.append(LSD.Options, {
  attributes: {
    add: 'setAttribute',
    remove: 'removeAttribute',
    iterate: true
  },
  pseudos: {
    add: 'addPseudo',
    remove: 'removePseudo',
    iterate: true
  },
  classes: {
    add: 'addClass',
    remove: 'removeClass',
    iterate: true
  }
});
