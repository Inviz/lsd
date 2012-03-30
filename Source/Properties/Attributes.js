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
LSD.Properties.Attributes.prototype.onChange = function(key, value, old, memo) {
  var ns = this._owner.document || LSD.Document.prototype;
  var attribute = ns.attributes && ns.attributes[key]
  var vdef = typeof value != 'undefined', odef = typeof old != 'undefined';
  if (attribute) {
    if (typeof attribute == 'string') {
      this._owner.mix(attribute, value, memo, old);
    } else if (value && !value.Script){
      var result = attribute.call(this._owner, value, old);
      if (typeof result != 'undefined') value = result;
    }
  }
  if (this._owner.element && (key != 'type' || LSD.toLowerCase(this._owner.element.tagName) != 'input')) {
    this._owner.element[key] = vdef;
    if (vdef && !value.script) this._owner.element.setAttribute(key, value === true ? key : value);
    else this._owner.element.removeAttribute(key);
  }
  if (((!memo || memo !== 'states') && ns.states[key]) || this._owner.__properties[key])
    this._owner.mix(key, value, 'attributes', old);
  if (key.substr(0, 5) == 'data-')
    this._owner.mix('variables.' + key.substring(5), value, memo, old);
  return value;
};
LSD.Properties.Attributes.prototype._global = true;
LSD.Properties.Microdata = LSD.Struct();
LSD.Properties.Microdata.prototype.onChange = function(key, value, old, memo) {
  console.log([key, value])
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