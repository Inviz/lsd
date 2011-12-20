/*
---
 
script: Microdata.js
 
description: Data that comes from specially html5 formatted elements
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layout
  - LSD.Script/LSD.Object
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

LSD.Microdata.prototype = Object.append(new LSD.Object.Stack, {
  add: function(element, property, value) {
    var group = (this._elements || (this._elements = {}))[property];
    if (!group) {
      group = this._elements[property] = element
    } else if (!group.push) {
      if (group == element) return false;
      else group = this._elements[property] = [group, element]
    } else if (group.push) {
      if (group.indexOf(element) > -1) return false;
      else group.push(element);
    }
    if (value == null) value = Element.get(element, 'itemvalue');
    this.set(property, value);
    if (element.getAttribute('itemscope') == null) {
      var callback = Element.retrieve(element, 'microdata:setter');
      if (!callback) Element.store(element, 'microdata:setter', (callback = function(value) {
        //Element.set(element, 'itemvalue', value);      
      }))
    }
    this.watch(property, callback, true)
  },
  remove: function(element, property, value) {
    var group = (this._elements || (this._elements = {}))[property];
    if (group) {
      if (group.push) {
        var index = group.indexOf(element);
        if (index > -1) group.splice(index, 1);
        else return false;
      } else {
        if (group == element) delete this._elements[property];
        else return false;
      }
    } else return false;
    if (group && group.push) group.erase(element);
    if (value == null) value = Element.get(element, 'itemvalue');
    this.unset(property, value);
    var setter = Element.retrieve(element, 'microdata:setter');
    if (setter) this.unwatch(property, setter);
  }
});

LSD.Microdata.extract = function(element, widget, parent, itemprop) {
  if (itemprop == null) itemprop = element.getAttribute('itemprop');
  if (itemprop) {
    var itemscope = element.getAttribute('itemscope');
    if (itemscope != null) {
      var scope = Element.retrieve(element, 'microdata:scope');
      if (!scope)
        Element.store(element, 'microdata:scope', (scope = new LSD.Microdata(element, itemprop)));
      if (widget) {
        if (widget.element == element) widget.itemscope = scope;
        var obj = {};
        obj[itemprop] = scope;
        for (var node = widget; node; node = (!parent && node.parentNode))
          node.variables.merge(obj, true);
        if (!widget.itemPropertyExportCallback) widget.itemPropertyExportCallback = function(name, value, state, old) {
          if (state && (!value.watch || value.lsd)) widget.variables.set(name, value);
          if (!state || old != null) widget.variables.unset(name, state ? old : value);
        }
        if (scope && widget.itemscope && widget.itemscope == scope)
          scope.addEvent('change', widget.itemPropertyExportCallback)
      }
    }
    if (parent === true) parent = LSD.Microdata.getScope(element.parentNode);
    if(parent) parent.add(element, itemprop, scope);
  }
  return scope;
};

LSD.Microdata.unload = function(element, widget, parent, itemprop) {
  if (itemprop == null) itemprop = element.getAttribute('itemprop');
  if (itemprop) {
    var scope = Element.retrieve(element, 'microdata:scope');
    if (parent === true) parent = LSD.Microdata.getScope(element.parentNode);
    if (parent) parent.remove(element, itemprop, scope);
  };
  return scope;
};

LSD.Microdata.getScope = function(element) {
  for (var node = element; node; node = node.parentNode) {
    var scope = node.uid && Element.retrieve(node, 'microdata:scope');
    if (scope) return scope;
  }
};