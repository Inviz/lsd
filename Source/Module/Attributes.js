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

LSD.Module.Attributes = {
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
  },
  
  store: function(name, value) {
    this.storage[name] = value;
    return this;
  },

  retrieve: function(name, placeholder) {
    var value = this.storage[name];
    if (value == null) {
      if (placeholder != null) this.store(name, placeholder);
      return placeholder
    }
    return value;
  },

  eliminate: function(name, value) {
    delete this.storage[name];
    return this;
  },
};
