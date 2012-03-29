/*
---

script: Attributes.js

description: Base object for attributes dispatch

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Properties
  - LSD.Struct
  - LSD.Stack
  - LSD.Document

provides:
  - LSD.Properties.Classes
  - LSD.Properties.Attributes
  - LSD.Properties.Dataset
  - LSD.Properties.Variables

...
*/

LSD.Properties.Attributes = LSD.Struct(LSD.attributes, 'Stack');
LSD.Properties.Attributes.prototype.onChange = function(key, value, state, old, memo) {
  var ns = this._owner.document || LSD.Document.prototype;
  var attribute = ns.attributes && ns.attributes[key]
  var vdef = typeof value != 'undefined', odef = typeof old != 'undefined';
  if (attribute) {
    if (typeof attribute == 'string') {
      this._owner.set(attribute, value);
      if (odef) this._owner.unset(attribute, old);
    } else if (value && !value.Script){
      var result = attribute.call(this._owner, value, old);
      if (typeof result != 'undefined') value = result;
    }
  }
  if ((!memo || memo !== 'states') && ns.states[key])
    this._owner[state ? 'set' : 'unset'](key, true, 'attributes');
  if (this._owner.element && (key != 'type' || LSD.toLowerCase(this._owner.element.tagName) != 'input')) {
    if (value === true) this._owner.element[key] = state;
    if (state && !value.script) this._owner.element.setAttribute(key, value === true ? key : value);
    else this._owner.element.removeAttribute(key);
  }
  if (key.substr(0, 5) == 'data-') {
    var property = key.substring(5);
    if (vdef) this._owner.variables[state ? 'set' : 'unset'](property, value, memo);
    if (odef) this._owner.variables.unset(property, old, memo);
  }
  if (this._owner.__properties[key]) {
    if (vdef) this._owner.set(key, value, memo);
    if (odef) this._owner.unset(key, old, memo);
  }
  return value;
};
LSD.Properties.Attributes.prototype._global = true;
LSD.Properties.Microdata = LSD.Struct('Stack');
LSD.Properties.Microdata.prototype.onChange = function(key, value, state, old, memo) {
}
LSD.Properties.Variables = LSD.Struct('Stack');

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