/*
---
 
script: Accessors.js
 
description: A mutator that generates routine methods of traversing the related elements
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  
provides:
  LSD.Mutator.Accessors

*/

(function() {
  
var parsed = {};
var object = {
  selector: null,   // selector to find elements in DOM
  anchor: null,     // object to traverse from (default: this.element)
  as: null,         // optional widget class name (e.g. input[type=search]) 
  multiple: null    // is it an array of elements or a single element?
}

var parse = function(selector) {
  var object = parsed[selector];
  if (!object) object = parsed[selector] = Slick.parse(selector);
  var last = object.expressions[0].getLast();
  var pseudos = last.pseudos;
  var options = {selector: object}
  if (pseudos) {
    pseudos.each(function(pseudo) {
      options[pseudo.key] = pseudo.value || true;
      object.raw = object.raw.replace(new RegExp(':' + pseudo.key + '[^:]+'), '')
    })
  }  
  delete last.pseudos
  return options;
}
  
LSD.Mutator.Accessors = Class.Mutators.Accessors = function(accessors) {
  var proto = {
    elements: {}
  };
  Hash.each(accessors, function(options, name) {
    if (typeof options == 'string') options = parse(options);
    proto['get' + name.capitalize()] = function() {
      if (this.elements[name] == null) {
        if (!(this.elements[name] = this.getTarget(options.selector, options.anchor || this.element))) return;
        if (options.multiple) {
          this.elements[name] = this.elements[name].map(function(element) {
            return this.buildWidget(options.as, element);
          }.bind(this));
        } else {  
          this.elements[name] = this.elements[name][0];
          if (options.as) this.elements[name] = this.buildWidget(options.as, this.elements[name])
        }
      }
      return this.elements[name];
    }
  });

  this.implement('Implements', new Class(proto));
}

})();