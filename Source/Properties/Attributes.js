/*
---

script: Attributes.js

description: Base object for attributes dispatch

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Properties
  - LSD.Struct
  - LSD.Journal
  - LSD.Document

provides:
  - LSD.Properties.Attributes
  - LSD.Properties.Dataset
  - LSD.Properties.Variables

...
*/

LSD.Properties.Attributes = LSD.Struct(LSD.attributes, 'Journal');
LSD.Properties.Attributes.prototype.__cast = function(key, value, old, meta) {
  var owner = this._owner
  var ns = owner.document || LSD.Document.prototype;
  var attributes = ns.attributes;
  var attribute = attributes && attributes[key];
  if (attribute)
    if (typeof attribute == 'string') {
      owner.mix(attribute, value, old, meta);
    } else if (value){
      var result = attribute.call(owner, value, old);
      if (typeof result != 'undefined')
        value = result;
    }
  if (owner.element && (key != 'type' || owner.localName != 'input'))
    if ((owner.element[key] = value !== undefined))
      owner.element.setAttribute(key, value === true ? key : value);
    else
      owner.element.removeAttribute(key);
  if (((!meta || meta !== 'states') && ns.states[key]) || owner._properties[key])
    owner.set(key, value, old, 'attributes');
  if (key.substr(0, 5) == 'data-') {
    if (value === undefined) debugger
    owner.mix('variables.' + key.substring(5), value, old, meta);
  }
  if (owner.matches) {
    if (value != null)
      owner.matches.add('attributes', key, value);
    if (old != null) 
      owner.matches.remove('attributes', key, old);
  }
  return value;
};
LSD.Properties.Variables = LSD.Struct('Journal');

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