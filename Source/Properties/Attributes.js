/*
---
 
script: Attributes.js
 
description: Base objects for accessories holders - attributes, classes, dataset
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - LSD.Struct.Stack
  - LSD.Document

provides: 
  - LSD.Properties.Classes
  - LSD.Properties.Attributes
  - LSD.Properties.Dataset
  - LSD.Properties.Variables
 
...
*/

LSD.Properties.Attributes = LSD.Struct.Stack(LSD.attributes);
LSD.Properties.Attributes.prototype.onChange = function(name, value, state, old, memo) {
  var ns = this._parent.document || LSD.Document.prototype;
  if ((!memo || memo !== 'states') && ns.states[name])
    this._parent[state ? 'set' : 'unset'](name, true, 'attributes');
  if (this._parent.element && (name != 'type' || LSD.toLowerCase(this._parent.element.tagName) != 'input')) {  
    if (value === true) this._parent.element[name] = state;
    if (state) this._parent.element.setAttribute(name, value === true ? name : value);
    else this._parent.element.removeAttribute(name);
  }
  if (name.substr(0, 5) == 'data-') {
    var property = name.substring(5);
    if (typeof value != 'undefined') this[state ? 'set' : 'unset'](property, value);
    if (typeof old != 'undefined') this.unset(property, old);
  }
  return value;
};

LSD.Properties.Dataset = LSD.Struct.Stack();
LSD.Properties.Variables = LSD.Struct.Stack();