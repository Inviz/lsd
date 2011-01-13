/*
---
 
script: Attributes.js
 
description: A mixin that adds support for setting attributes, adding and removing classes and pseudos
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Core/Slick.Parser
 
provides: 
  - LSD.Module.Attributes
 
...
*/

LSD.Module.Attributes = new Class({
  
  initialize: function() {
    var classes = (this.classes || []).concat(this.options.classes || []);
    var pseudos = (this.pseudos || []).concat(this.options.pseudos || []);
    this.classes = new FastArray
    this.pseudos = new FastArray
    this.attributes = {}
    if (this.options.attributes) for (var name in this.options.attributes) if (!LSD.Attributes.Ignore[name]) this.attributes[name] = this.options.attributes[name]
    pseudos.each(function(value) {
      this.setStateTo(value, true);
    }, this);
    for (var attribute in this.attributes) this.setAttribute(attribute, this.attributes[attribute]);
    classes.each(this.addClass.bind(this));
    
    this.parent.apply(this, arguments);
  },
  
  getAttribute: function(attribute) {
    switch (attribute) {
      case "id": return this.options.id || this.identifier;
      case "class": return this.classes.join(' ');
      default:   return this.attributes[attribute]
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
    if (attribute != 'slick:uniqueid')
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
    this.classes.erase(name);
    if (this.element) this.element.removeClass(name);
  },
  
  getAttributeNode: function(attribute) {
    return {
      nodeName: attribute,
      nodeValue: (attribute in this.options.states) || (attribute in this.pseudos) 
                  ? this.pseudos[attribute] 
                  : this.getAttribute(attribute)
    }
  }
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
      this.setStyle.apply(this, bits);
    }, this);
  },
  'disabled': function(value) {
    if (value == false) this.enable()
    else this.disable();
  },
  'label': function(value) {
    this.setContent(value)
  }
}