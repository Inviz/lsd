/*
---
 
script: Microdata.js
 
description: Data that comes from specially html5 formatted elements
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Object
  - Ext/Element.Item
  
provides:
  - LSD.Microdata
  
...
*/

LSD.Microdata = function(element, name) {
  this._element = element;
  this._name = name;
};

LSD.Microdata.prototype = Object.append(new LSD.Object, {
  add: function(element, property, value) {
    var group = (this._elements || (this._elements = {}))[property];
    if (!group) group = element
    else if (!group.push) group = [group]
    else if (group.push) group.push(name);
    if (value == null) value = Element.get(element, 'itemvalue');
    this.set(property, value);
    var callback = Element.retrieve(element, 'microdata:setter');
    if (!callback) Element.store(element, 'microdata:setter', (callback = function(value) {
      Element.set(element, 'itemvalue', value);      
    }))
    this.watch(property, callback, true)
  },
  remove: function(element, property, value) {
    var group = (this._elements || (this._elements = {}))[property];
    if (group.push) group.erase(element)
    else delete this._elements[property];
    if (value == null) value = Element.get(element, 'itemvalue');
    if (this.property && this.property == value) this.unset(property);
    this.unwatch(property, Element.retrieve(element, 'microdata:setter'));
  }
});

LSD.Microdata.element = function(element, widget, parent) {
  var itemprop = element.getAttribute('itemprop');
  if (itemprop) {
    var itemscope = element.getAttribute('itemscope');
    if (itemscope) {
      var scope = Element.retrieve(element, 'microdata:scope');
      if (!scope)
        Element.store(element, 'microdata:scope', (scope = new LSD.Microdata(element, itemprop)));
      if (widget) {
        if (widget.element == element) widget.itemscope = scope;
        for (var node = widget; node; node = (!parent && node.parentNode)) {
          LSD.Module.Interpolations.addInterpolator.call(node, itemprop, scope);
        if (!widget.itemPropertyExportCallback) widget.itemPropertyExportCallback = function(name, value, state) {
          if (!value.watch) widget[state ? 'addInterpolator' : 'removeInterpolator'](name, value);
        }
        if (scope && widget.itemscope && widget.itemscope == scope)
          scope.addEvent('change', widget.itemPropertyExportCallback).addEvent('beforechange', widget.itemPropertyExportCallback);
        }
      }
    }
    if (parent) parent.add(element, itemprop, scope);
  }
  return scope;
};