/*
---
 
script: Attributes.js
 
description: Base objects for accessories holders - pseudos, attributes, classes, dataset
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Struct.Stack

provides: 
  - LSD.Type.Pseudos
  - LSD.Type.Classes
  - LSD.Type.Attributes
  - LSD.Type.Dataset
  - LSD.Type.Variables
 
...
*/

LSD.mix('attributes', {
  tabindex: Number,
  width:    Number,
  height:   Number,
  readonly: Boolean,
  disabled: Boolean,
  hidden:   Boolean,
  checked:  Boolean,
  multiple: Boolean,
  'class': function(value) {
    value.trim().split(' ').each(this.addClass.bind(this));
  },
  style: function(value) {
    value.trim().split(/\s*;\s*/).each(function(definition) {
      this.setStyle.apply(this, definition.split(/\s*:\s*/))
    }, this);
  }
});

LSD.Type.Pseudos = LSD.Struct.Stack();
LSD.Type.Pseudos.prototype.onChange = function(name, value, state, old, memo) {
  var ns = this._parent.namespace || LSD;
  if ((!memo || memo === 'states') && ns.states[name])
    this._parent[state ? 'set' : 'unset']('states.' + name, true, 'pseudos');
}

LSD.Type.Classes = LSD.Struct.Stack();
LSD.Type.Classes.prototype.onChange = function(name, value, state, old, memo) {
  var ns = this._parent.namespace || LSD;
  if ((!memo || memo === 'states') && ns.states[name]) 
    this._parent[state ? 'set' : 'unset']('states.' + name, true, 'classes');
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
};
LSD.Type.Classes.prototype._name = '';
LSD.Type.Classes.prototype._exports = {
  className: '_name'
};
LSD.Type.Classes.prototype.contains = function(name) {
  return this[name];
};
LSD.Type.Classes.prototype.add = function(name) {
  return this.set(name, true);
};
LSD.Type.Classes.prototype.remove = function(name) {
  return this.unset(name, true);
};


LSD.Type.Attributes = LSD.Struct.Stack(LSD.attributes);
LSD.Type.Attributes.prototype.onChange = function(name, value, state, old, memo) {
  var ns = this._parent.namespace || LSD;
  if ((!memo || memo === 'states') && ns.states[name]) 
    this._parent[state ? 'set' : 'unset']('states.' + name, true, 'attributes');
  if (this._parent.element && (name != 'type' || LSD.toLowerCase(this._parent.element.tagName) != 'input')) {
    if (state) this._parent.element.setAttribute(name, value === true ? name : value);
    else this._parent.element.removeAttribute(name);
    if (value === true) this._parent.element[name] = state;
  }
  if (name.substr(0, 5) == 'data-') {
    var property = name.substring(5);
    if (typeof value != 'undefined') this.dataset[state ? 'set' : 'unset'](property, value);
    if (typeof old != 'undefined') this.dataset.unset(property, old);
  }
  return value;
};
LSD.Type.Classes.prototype._exports = {
  id: 'id'
};

LSD.Type.Dataset = LSD.Struct.Stack();
LSD.Type.Variables = LSD.Struct.Stack();