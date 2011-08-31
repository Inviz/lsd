/*
---
 
script: Attribute.js
 
description: Changes the attribute of the node
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.Attribute
 
...
*/

LSD.Action.Attribute = LSD.Action.build({
  enable: function(target, name, value) {
    target.setAttribute(name, value);
  },
  
  disable: function(target, name, value) {
    target.removeAttribute(name, value);
  },
  
  getState: function(target, name, value) {
    return target.attributes[name] != value;
  }
});