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
  
  initialize: function() {
    this.classes = new FastArray
    this.pseudos = new FastArray
    this.attributes = {}
    this.parent.apply(this, arguments);
    if (this.options.id) this.id = this.options.id;
    var attributes = this.options.attributes;
    if (attributes) for (var name in attributes) if (!LSD.Attributes.Ignore[name]) this.attributes[name] = attributes[name];
    this.classes.concat(this.options.classes || []).each(function(kls) {
      if (LSD.States.Classes[kls]) this.pseudos.push(kls);
      else this.addClass(kls);
    }, this);
    this.pseudos.concat(this.options.pseudos || []).each(function(value) {
      if (this.options.states[value]) this.setStateTo(value, true);
      else this.addPseudo(value);
    }, this);
  },
  
  getAttribute: function(attribute) {
    switch (attribute) {
      case "id":    return this.id;
      case "class": return this.classes.join(' ');
      default:      return this.attributes[attribute] || this.pseudos[attribute]
    }
  },
  
  removeAttribute: function(attribute) {
    delete this.attributes[attribute];
    if (this.element) this.element.removeProperty(attribute);
  },

  setAttribute: function(attribute, value) {
    if (LSD.Attributes.Ignore[attribute]) return;
    if (LSD.Attributes.Numeric[attribute]) value = value.toInt();
    else {
      var logic = LSD.Attributes.Setter[attribute];
      if (logic) logic.call(this, value)
    }
    if (value === attribute) value = true;
    if (typeof value != 'string') value = value.toString()  //Slick compat
    this.attributes[attribute] = value;
    if (attribute != 'slick-uniqueid')
    if (this.element) this.element.setProperty(attribute, value);
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
    if (LSD.States.Attributes[state]) {
      this.setAttribute(state, true)
    } else {
      this.addClass(LSD.States.Classes[state] ? state : 'is-' + state);
    }
    this.addPseudo(state);
  },
  
  unsetState: function(state) {
    if (LSD.States.Attributes[state]) {
      this.removeAttribute(state)
    } else {
      this.removeClass(LSD.States.Classes[state] ? state : 'is-' + state);
    }
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
  },
  'disabled': function(value) {
    if (value == false) this.enable()
    else this.disable();
  }
};