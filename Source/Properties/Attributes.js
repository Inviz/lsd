/*
---
 
script: Attributes.js
 
description: Base object for attributes dispatch
 
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
LSD.Properties.Attributes.prototype.onChange = function(key, value, state, old, memo) {
  var ns = this._parent.document || LSD.Document.prototype;
  var attribute = ns.attributes && ns.attributes[key]
  var vdef = typeof value != 'undefined', odef = typeof old != 'undefined';
  if (attribute) {
    if (typeof attribute == 'string') {
      this._parent.set(attribute, value);
      if (odef) this._parent.unset(attribute, old);
    } else if (value && !value.Script){
      var result = attribute.call(this._parent, value, old);
      if (typeof result != 'undefined') value = result;
    }
  }
  if ((!memo || memo !== 'states') && ns.states[key])
    this._parent[state ? 'set' : 'unset'](key, true, 'attributes');
  if (this._parent.element && (key != 'type' || LSD.toLowerCase(this._parent.element.tagName) != 'input')) {  
    if (value === true) this._parent.element[key] = state;
    if (state && !value.script) this._parent.element.setAttribute(key, value === true ? key : value);
    else this._parent.element.removeAttribute(key);
  }
  if (key.substr(0, 5) == 'data-') {
    var property = key.substring(5);
    if (vdef) this._parent.variables[state ? 'set' : 'unset'](property, value);
    if (odef) this._parent.variables.unset(property, old);
  }
  if (this._parent._properties[key]) {
    if (vdef) this._parent.set(key, value);
    if (odef) this._parent.unset(key, old);
  }
  return value;
};
LSD.Properties.Attributes.prototype._global = true;
LSD.Properties.Dataset = LSD.Struct.Stack();
LSD.Properties.Variables = LSD.Struct.Stack();

LSD.Document.prototype.mix('attributes', {
  tabindex:  Number,
  width:     Number,
  height:    Number,
  readonly:  Boolean,
  disabled:  Boolean,
  hidden:    Boolean,
  open:      Boolean,
  checked:   Boolean,
  multiple:  Boolean
})