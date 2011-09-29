/*
---
 
script: Microdata.js
 
description: Data that comes from specially html5 formatted elements
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layout
  - LSD.Object
  - Ext/Element.Item
  
provides:
  - LSD.Microdata
  - LSD.Layout.Microdata
  
...
*/

/*
  Microdata is the new HTML5 concept that provides a way to enrich 
  html elements with arbitary data structures and provides various
  search engine friendly schemas.
  
  Microdata object holds properties for a single item scope. So an
  element or widget that has `itemscope` attribute creates one 
  of these objects. Nodes with `itemprop` attribute are added to
  the object and have the value extracted. When a value in an object
  is changed, it updates the corresponding node.

  Microdata values can be used in variables on all of parent widgets
  by default.
*/

LSD.Layout.Microdata = LSD.Microdata = function(element, name) {
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
    if (element.getAttribute('itemscope') == null) {
      var callback = Element.retrieve(element, 'microdata:setter');
      if (!callback) Element.store(element, 'microdata:setter', (callback = function(value) {
        Element.set(element, 'itemvalue', value);      
      }))
    }
    this.watch(property, callback, true)
  },
  remove: function(element, property, value) {
    var group = (this._elements || (this._elements = {}))[property];
    if (group.push) group.erase(element)
    else delete this._elements[property];
    if (value == null) value = Element.get(element, 'itemvalue');
    if (this.property && this.property == value) this.unset(property);
    var setter = Element.retrieve(element, 'microdata:setter');
    if (setter) this.unwatch(property, setter);
  }
});

LSD.Microdata.extract = function(element, widget, parent) {
  var itemprop = element.getAttribute('itemprop');
  if (itemprop) {
    var itemscope = element.getAttribute('itemscope');
    if (itemscope != null) {
      var scope = Element.retrieve(element, 'microdata:scope');
      if (!scope)
        Element.store(element, 'microdata:scope', (scope = new LSD.Microdata(element, itemprop)));
      if (widget) {
        if (widget.element == element) widget.itemscope = scope;
        for (var node = widget; node; node = (!parent && node.parentNode)) {
          node.variables.set(itemprop, scope);
        if (!widget.itemPropertyExportCallback) widget.itemPropertyExportCallback = function(name, value, state) {
          if (!value.watch || !value.set) widget.variables[state ? 'set' : 'unset'](name, value);
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