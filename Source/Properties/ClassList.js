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
  skip: {
    '_name': true
  },
  exports: {
    className: '_name'
  }
});
LSD.Properties.ClassList.prototype.onChange = function(name, value, state, old, memo) {
  var ns = this._parent.document || LSD.Document.prototype;
  if ((!memo || memo !== 'states') && ns.states[name]) 
    this._parent[state ? 'set' : 'unset'](name, true, 'classes');
  var element = this._parent.element;
  if (element) {
    if (typeof element.classList == 'undefined') {
      if (state && value) element.classList.add(value);
      if (!state || old) element.classList.remove(state ? value : old);
    } else {
      var index = (' ' + this._name + ' ').indexOf(' ' + name + ' ');
      if (state && value && index == -1) this.set('_name', this._name + ' ' + name);
      if (!state && index > -1) this.set('_name', this._name.substring(0, index - 1) + this._name.substring(name.length));
    }
  }  
  return value;
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
