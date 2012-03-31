/*
---

script: ClassList.js

description: Base objects for accessories holders - attributes, classes, dataset

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Properties
  - LSD.Struct

provides:
  - LSD.Properties.ClassList

...
*/

LSD.Properties.ClassList = LSD.Struct({
  _name: '.className'
}, 'Journal');
LSD.Properties.ClassList.prototype.onChange = function(name, value, old, memo) {
  if (name == '_name') return value || old;
  var ns = this._owner.document || LSD.Document.prototype;
  if ((!memo || memo !== 'states') && ns.states[name])
    this._owner.mix(name, true, 'classes', old);
  var index = (' ' + this._name + ' ').indexOf(' ' + name + ' ');
  if (value && index == -1) this.set('_name', this._name.length ? this._name + ' ' + name : name);
  else if (old && index > -1) this.set('_name', this._name.substring(0, index - 1) + this._name.substring(name.length));
  var element = this._owner.element;
  if (element) element.className = this._name
  return value || old;
};
LSD.Properties.ClassList.prototype._name = '';
LSD.Properties.ClassList.prototype.contains =function(name) {
  return this[name];
};
LSD.Properties.ClassList.prototype.add = function(name) {
  return this.set(name, true);
};
LSD.Properties.ClassList.prototype.remove = function(name) {
  return this.unset(name, true);
};
