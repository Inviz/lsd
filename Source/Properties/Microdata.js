/*
---

script: Microdata.js

description: DOM-embedded typed data objects 

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Properties
  - LSD.Struct

provides:
  - LSD.Properties.Microdata

...
*/

LSD.Properties.Microdata = LSD.Struct('Data');
LSD.Properties.Microdata.prototype.__cast = function(key, value, old, meta) {
  var vdef = typeof value != 'undefined', odef = typeof old != 'undefined';
  if (meta !== 'microdata' && meta !== 'textContent') {
    if (!this._elements) return;
    var element = this._elements[key];
    if (element == null) return;
    var storage = this._values;
    if (!storage) storage = this._values = {};
    if (odef && old !== storage[key]) odef = old = undefined;
    if (typeof storage[key] == 'undefined' ? !vdef || value === element.nodeValue : !odef) return;
    if (vdef) storage[key] = value;
    else delete storage[key];
    element.set('nodeValue', value, old, 'microdata');
  }
}
LSD.Properties.Microdata.prototype.___hash = function(key, value, old, meta) {
  if (this._nonenumerable[key])
    return;
  if (value && value.lsd) {
    var storage = this._elements || (this._elements = {});
    var group = storage[key];
    if (group != null && group != old) {
      if (group.push) group.push(value);
      else group = [group, value];
    } else storage[key] = value;
    value._watch('nodeValue', [this, key]);
  }
  if (old && old.lsd) {
    var storage = this._elements;
    var group = storage[key];
    old._unwatch('nodeValue', [this, key]);
    if (group == old) {
      delete storage[key];
    } else if (group.push) {
      var index = group.indexOf(old);
      if (index > -1) group.splice(index, 1);
    }
  }
  if (storage)
    return true;
}
LSD.Properties.Microdata.prototype._shared = true;
LSD.Properties.Microdata.prototype._owning = false;
LSD.Properties.Microdata.prototype._trigger = 'lsd';
LSD.Properties.Microdata.prototype._nonenumerable = LSD.Struct.implement(LSD.Properties.Microdata.prototype._nonenumerable, {
  _values: true,
  _elements: true
})