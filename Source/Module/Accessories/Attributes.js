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
  constructors: {
    attributes: function() {
      this.classes = new FastArray;
      this.pseudos = new FastArray;
      this.dataset = {};
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
  
  removeAttribute: function(name) {
    if (name.substring(0, 5) == 'data') {
      delete this.dataset[name.substring(5, name.length - 5)];
    } else if (this.attributes[name] != null) {
      this.fireEvent('selectorChange', ['attributes', name, false]);
      delete this.attributes[name];
      if (this.element) this.element.removeAttribute(name);
      if (LSD.States.Attributes[name])
        if (this[name]) this.setStateTo(name, false);
    }
    return this;
  },

  setAttribute: function(name, value) {
    if (LSD.Attributes.Numeric[name]) value = value.toInt();
    else {
      var logic = LSD.Attributes.Setter[name];
      if (logic) logic.call(this, value)
    }
    if (name.substring(0, 5) == 'data-') {
      this.dataset[name.substring(5, name.length - 5)] = value;
    } else {
      if (this.options && this.options.interpolate)
        value = LSD.Interpolation.attempt(value, this.options.interpolate) || value;
      if (this.attributes[name] != value) {
        if (LSD.States.Attributes[name]) {
          var mode = (value == true || value == name);
          if (this[name] != mode) this.setStateTo(name, mode);
        }
        this.fireEvent('selectorChange', ['attributes', name, false]);
        this.attributes[name] = value;    
        this.fireEvent('selectorChange', ['attributes', name, true]);
        if (this.element && this.element[name] != value) this.element.setAttribute(name, value);
      }
    }
    return this;
  },

  addPseudo: function(name){
    if (!this.pseudos[name]) {
      if (this.$states[name]) this.setStateTo(name, true);
      this.pseudos[name] = true;
      this.fireEvent('selectorChange', ['pseudos', name, true]);
    }
    return this;
  },

  removePseudo: function(name) {
    if (this.pseudos[name]) {
      if (this.$states[name]) this.setStateTo(name, false);
      this.fireEvent('selectorChange', ['pseudos', name, false]);
      delete this.pseudos[name];
    }  
    return this;
  },
  
  addClass: function(name) {
    if (LSD.States.Classes[name] && !this[name]) this.setStateTo(name, true);
    if (!this.classes[name]) {
      this.classes[name] = true;
      this.fireEvent('selectorChange', ['classes', name, true]);
      if (this.element) this.element.addClass(name);
    }
    return this;
  },

  removeClass: function(name){
    if (LSD.States.Classes[name] && this[name]) return this.setStateTo(name, false);
    if (this.classes[name]) {
      this.fireEvent('selectorChange', ['classes', name, false]);
      delete this.classes[name];
      if (this.element) this.element.removeClass(name);
    }  
    return this;
  },
  
  hasClass: function(name) {
    return this.classes[name]
  },
  
  setState: function(name) {
    var attribute = LSD.States.Attributes[name];
    if (attribute) this.setAttribute(attribute, attribute)
    else this.addClass(LSD.States.Classes[name] || 'is-' + name);
    this.addPseudo(name);
    return this;
  },
  
  unsetState: function(name) {
    var attribute = LSD.States.Attributes[name];
    if (attribute) this.removeAttribute(attribute);
    else this.removeClass(LSD.States.Classes[name] || 'is-' + name);
    this.removePseudo(name);
    return this;
  },
  
  getSelector: function(){
    var parent = this.parentNode;
    var selector = (parent && parent.getSelector) ? parent.getSelector() + ' ' : '';
    selector += this.tagName;
    if (this.attributes.id) selector += '#' + this.attributes.id;
    for (var klass in this.classes)  if (this.classes.hasOwnProperty(klass))  selector += '.' + klass;
    for (var pseudo in this.pseudos) if (this.pseudos.hasOwnProperty(pseudo)) selector += ':' + pseudo;
    for (var name in this.attributes) if (name != 'id') selector += '[' + name + '=' + this.attributes[name] + ']';
    return selector;
  },
  
  onStateChange: function(state, value, args) {
    var args = Array.prototype.slice.call(arguments, 0);
    args.slice(1, 2); //state + args
    this[value ? 'setState' : 'unsetState'][args && ("length" in args) ? 'apply' : 'call'](this, args);
    this.fireEvent('stateChange', [state, args]);
    return true;
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
