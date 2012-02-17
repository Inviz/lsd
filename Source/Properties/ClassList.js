/*
---
 
script: ClassList.js
 
description: Base objects for accessories holders - attributes, classes, dataset
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - LSD.Struct.Stack

provides: 
  - LSD.Properties.ClassList
 
...
*/

LSD.Properties.ClassList = LSD.Struct.Stack({
  _name: '.className'
});
LSD.Properties.ClassList.prototype.onChange = function(name, value, state, old, memo) {
  if (name == '_name') return value || old;
  var ns = this._parent.document || LSD.Document.prototype;
  if ((!memo || memo !== 'states') && ns.states[name]) 
    this._parent[state ? 'set' : 'unset'](name, true, 'classes');
  var index = (' ' + this._name + ' ').indexOf(' ' + name + ' ');
  if (state && value && index == -1) this.set('_name', this._name.length ? this._name + ' ' + name : name);
  if (!state && index > -1) this.set('_name', this._name.substring(0, index - 1) + this._name.substring(name.length));
  var element = this._parent.element;
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
