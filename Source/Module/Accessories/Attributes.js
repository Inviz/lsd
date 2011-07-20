/*
---
 
script: Attributes.js
 
description: A mixin that adds support for setting attributes, adding and removing classes and pseudos
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Object
  - Core/Slick.Parser
 
provides: 
  - LSD.Module.Attributes
 
...
*/

LSD.Module.Attributes = new Class({
  constructors: {
    attributes: function() {
      var self = this;
      this.pseudos = (new LSD.Object).addEvent('change', function(name, value, state) {
        self.fireEvent('selectorChange', ['pseudos', name, state]);
        if (self.$states[name]) self.setStateTo(name, state);
      });
      this.classes = (new LSD.Object).addEvent('change', function(name, value, state) {
        self.fireEvent('selectorChange', ['classes', name, state]);
        if (LSD.States.Known[name]) self.setStateTo(name, state);
        if (self.element) self.element[state ? 'addClass' : 'removeClass'](name);
      });
      this.attributes = (new LSD.Object).addEvent('change', function(name, value, state) {
        self.fireEvent('selectorChange', ['attributes', name, state]);
        if (LSD.States.Attributes[name]) self.setStateTo(name, state);
        if (self.element) {
          if (state) self.element.setAttribute(name, value);
          else self.element.removeAttribute(name);
          if (LSD.Attributes.Boolean[name]) self.element[name] = state;
        }
      }).addEvent('beforechange', function(name, value, state) { 
        self.fireEvent('selectorChange', ['attributes', name, state]);
      });
      this.dataset = new LSD.Object;
    }
  },
  
  getAttribute: function(attribute) {
    switch (attribute) {
      case "class":           return this.classes.join(' ');
      case "slick-uniqueid":  return this.lsd;
      default:                return this.attributes[attribute];
    }
  },

  setAttribute: function(name, value) {
    if (LSD.Attributes.Numeric[name]) value = value.toInt();
    else {
      var logic = LSD.Attributes.Setter[name];
      if (logic) logic.call(this, value)
    }
    if (name.substr(0, 5) == 'data-') {
      this.dataset.set(name.substr(5, name.length - 5), value);
    } else {
      if (this.options && this.options.interpolate)
        value = LSD.Interpolation.attempt(value, this.options.interpolate) || value;
      this.attributes.set(name, value);
    }
    return this;
  },
  
  removeAttribute: function(name) {
    if (name.substr(0, 5) == 'data-') {
      delete this.dataset.unset(name.substr(5, name.length - 5));
    } else this.attributes.unset(name)
    return this;
  },
  
  addPseudo: function(name){
    this.pseudos.set(name, true);
    return this;
  },

  removePseudo: function(name) {
    this.pseudos.unset(name);
    return this;
  },
  
  addClass: function(name) {
    this.classes.set(name, true);
    return this;
  },

  removeClass: function(name){
    this.classes.unset(name);
    return this;
  },
  
  hasClass: function(name) {
    return this.classes[name]
  },
  
  setState: function(name) {
    var attribute = LSD.States.Attributes[name];
    if (attribute) this.setAttribute(attribute, attribute)
    else this.addClass(LSD.States.Known[name] ? name : 'is-' + name);
    this.addPseudo(name);
    return this;
  },
  
  unsetState: function(name) {
    var attribute = LSD.States.Attributes[name];
    if (attribute) this.removeAttribute(attribute);
    else this.removeClass(LSD.States.Known[name] ? name : 'is-' + name);
    this.removePseudo(name);
    return this;
  },
  
  getSelector: function(){
    var parent = this.parentNode;
    var selector = (parent && parent.getSelector) ? parent.getSelector() + ' ' : '';
    selector += this.tagName;
    if (this.attributes.id) selector += '#' + this.attributes.id;
    for (var klass in this.classes)  if (this.classes.hasProperty(klass))  selector += '.' + klass;
    for (var pseudo in this.pseudos) if (this.pseudos.hasProperty(pseudo)) selector += ':' + pseudo;
    for (var name in this.attributes) if (this.attributes.hasProperty(name))
      if (name != 'id') selector += '[' + name + '=' + this.attributes[name] + ']';
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
