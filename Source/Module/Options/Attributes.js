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
    attributes: {
      this.classes = new FastArray;
      this.pseudos = new FastArray;
      this.attributes = {};
    }
  },
  
  getAttribute: function(attribute) {
    switch (attribute) {
      case "class": return this.classes.join(' ');
      default:      return this.attributes[attribute] || this.pseudos[attribute]
    }
  },
  
  removeAttribute: function(attribute) {
    delete this.attributes[attribute];
    if (this.element) this.element.removeAttribute(attribute);
  },

  setAttribute: function(attribute, value) {
    if (LSD.Attributes.Numeric[attribute]) value = value.toInt();
    else {
      var logic = LSD.Attributes.Setter[attribute];
      if (logic) logic.call(this, value)
    }
    this.attributes[attribute] = value;
    if (this.element) this.element.setAttribute(attribute, value);
  },

  addPseudo: function(pseudo){
    this.pseudos.include(pseudo);
  },

  removePseudo: function(pseudo){
    this.pseudos.erase(pseudo);
  },

  addClass: function(name) {
    this.classes.include(name);
    if (this.element) this.element.addClass(name);
  },

  removeClass: function(name) {
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
    if (this.options.id) selector += '#' + this.options.id;
    for (var klass in this.classes)  if (this.classes.hasOwnProperty(klass))  selector += '.' + klass;
    for (var pseudo in this.pseudos) if (this.pseudos.hasOwnProperty(pseudo)) selector += ':' + pseudo;
    if (this.attributes) for (var name in this.attributes) selector += '[' + name + '=' + this.attributes[name] + ']';
    return selector;
  },
  
  onStateChange: function(state, value, args) {
    var args = Array.prototype.slice.call(arguments, 0);
    args.slice(1, 2); //state + args
    this[value ? 'setState' : 'unsetState'].apply(this, args);
    this.fireEvent('stateChange', [state, args])
    return true;
  },
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