/*
---
 
script: Attributes.js
 
description: A mixin that adds support for setting attributes, adding and removing classes and pseudos
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - Core/Slick.Parser
 
provides: 
  - LSD.Module.Attributes
 
...
*/

LSD.Module.Attributes = new Class({
  initializers: {
    attributes: function() {
      this.classes = new FastArray;
      this.pseudos = new FastArray;
      this.attributes = {};
    }
  },
  
  getAttribute: function(attribute) {
    switch (attribute) {
      case "class":           return this.classes.join(' ');
      case "slick-uniqueid":  return this.lsd;
      default:                return this.attributes[attribute];
    }
  },
  
  removeAttribute: function(attribute) {
    this.fireEvent('selectorChange', ['attributes', name, false]);
    delete this.attributes[attribute];
    if (this.element) this.element.removeAttribute(attribute);
  },

  setAttribute: function(attribute, value) {
    if (LSD.Attributes.Numeric[attribute]) value = value.toInt();
    else {
      var logic = LSD.Attributes.Setter[attribute];
      if (logic) logic.call(this, value)
    }
    this.fireEvent('selectorChange', ['attributes', name, false]);
    this.attributes[attribute] = value;    
    this.fireEvent('selectorChange', ['attributes', name, true]);
    if (this.element) this.element.setAttribute(attribute, value);
  },

  addPseudo: function(pseudo){
    this.pseudos.include(pseudo);
    this.fireEvent('selectorChange', ['pseudos', name, true]);
  },

  removePseudo: function(pseudo){
    this.fireEvent('selectorChange', ['pseudos', name, false]);
    this.pseudos.erase(pseudo);
  },

  addClass: function(name) {
    this.classes.include(name);
    if (this.element) this.element.addClass(name);
    this.fireEvent('selectorChange', ['classes', name, true]);
  },

  removeClass: function(name) {
    this.fireEvent('selectorChange', ['classes', name, false]);
    var state = LSD.States.Classes[name];
    if (state) this.pseudos.erase(state)
    this.classes.erase(name);
    if (this.element) this.element.removeClass(name);
  },
  
  hasClass: function(name) {
    return this.classes[name]
  },
  
  setState: function(state) {
    var attribute = LSD.States.Attributes[state];
    if (attribute) this.setAttribute(attribute, attribute)
    else this.addClass(LSD.States.Classes[state] || 'is-' + state);
    this.addPseudo(state);
  },
  
  unsetState: function(state) {
    var attribute = LSD.States.Attributes[state];
    if (attribute) this.removeAttribute(attribute);
    else this.removeClass(LSD.States.Classes[state] || 'is-' + state);
    this.removePseudo(state);
  },
  
  getSelector: function(){
    var parent = this.parentNode;
    var selector = (parent && parent.getSelector) ? parent.getSelector() + ' ' : '';
    selector += this.options.tag;
    if (this.attributes.id) selector += '#' + this.attributes.id;
    for (var klass in this.classes)  if (this.classes.hasOwnProperty(klass))  selector += '.' + klass;
    for (var pseudo in this.pseudos) if (this.pseudos.hasOwnProperty(pseudo)) selector += ':' + pseudo;
    for (var name in this.attributes) if (name != 'id') selector += '[' + name + '=' + this.attributes[name] + ']';
    return selector;
  }
});


LSD.Attributes.Setter = {
  'id': function(id) {
    this.id = id;
  },
  'class': function(value) {
    value.split(' ').each(this.addClass.bind(this));
  },
  'style': function(value) {
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

Object.append(LSD.Options, {
  attributes: {
    add: 'setAttribute',
    remove: 'removeAttribute',
    iterate: true
  },
  classes: {
    add: function(name) {
      this[LSD.States.Classes[name] ? 'addPseudo' : 'addClass'](name);
    },
    remove: function(name) {
      this[LSD.States.Classes[name] ? 'removePseudo' : 'removeClass'](name);
    },
    iterate: true
  },
  pseudos: {
    add: function(name) {
      if (this.$states[name]) this.setStateTo(name, true);
      else this.addPseudo(name);
    },
    remove: function(name) {
      if (this.$states[name]) this.setStateTo(name, false);
      else this.removePseudo(name);
    },
    iterate: true
  }
});
