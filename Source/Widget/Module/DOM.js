/*
---
 
script: DOM.js
 
description: Provides DOM-compliant interface to play around with other widgets
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base

provides: [ART.Widget.Module.DOM]
 
...
*/


(function() {
  
var inserters = {

  before: function(context, element){
    var parent = element.parentNode;
    if (parent) return parent.insertBefore(context, element);
  },

  after: function(context, element){
    var parent = element.parentNode;
    if (parent) return parent.insertBefore(context, element.nextSibling);
  },

  bottom: function(context, element){
    return element.appendChild(context);
  },

  top: function(context, element){
    return element.insertBefore(context, element.firstChild);
  }

};


ART.Widget.Module.DOM = new Class({
  initialize: function() {
    this.childNodes = [];
    this.nodeType = 1;
    this.parentNode = this.nextSibling = this.previousSibling = null;
    this.parent.apply(this, arguments);
    this.nodeName = this.name;
  },
  
  getElementsByTagName: function(tagName) {
    var found = [];
    var all = tagName == "*";
    for (var i = 0, child; child = this.childNodes[i]; i++) {
      if (all || tagName == child.nodeName) found.push(child);
      found.push.apply(found, child.getElementsByTagName(tagName))
    }
    return found;
  },
  
  getElements: function(selector) {
    return Slick.search(this, selector)
  },
  
  getElement: function(selector) {
    return Slick.find(this, selector)
  },
  
  getAttributeNode: function(attribute) {
    return {
      nodeName: attribute,
      nodeValue: this.getAttribute(attribute)
    }
  },
  
  getChildren: function() {
    return this.childNodes;
  },

  getRoot: function() {
    var widget = this;
    while (widget.parentNode) widget = widget.parentNode;
    return widget;
  },
  
  getHierarchy: function() {
    var widgets = [this];
    var widget = this;
    while (widget.parentNode) {
      widget = widget.parentNode;
      widgets.unshift(widget)
    }
    return widgets;
  },
  
  setParent: function(widget){
    this.parent.apply(this, arguments);
    var siblings = widget.childNodes;
    var length = siblings.length;
    if (length == 1) widget.firstChild = this;
    widget.lastChild = this;
    var previous = siblings[siblings.length - 2];
    if (previous) {
      previous.nextSibling = this;
      this.previousSibling = previous;
    }
  },
  
  appendChild: function(widget, adoption) {
    if (this.canAppendChild && !this.canAppendChild(widget)) return false;
    if (widget.options.id) {
      if (this[widget.options.id]) this[widget.options.id].dispose();
      this[widget.options.id] = widget;
    }
    this.childNodes.push(widget);
    if (this.nodeType != 9) widget.setParent(this);
    (adoption || function() {
      $(this).appendChild($(widget));
    }).apply(this, arguments);
    
    this.fireEvent('adopt', [widget, widget.options.id])

    var parent = widget;
    while (parent = parent.parentNode) parent.fireEvent('hello', widget);
    return true;
  },
  
  insertBefore: function(insertion, element) {
    return this.appendChild(insertion, function(parent) {
      $(insertion).inject($(element), 'before')
    });
  },
  
  grab: function(el, where){
    inserters[where || 'bottom'](document.id(el, true), this);
    return this;
  },
  
  setDocument: function(widget) {
    var element = $(widget)
    var isDocument = (widget.nodeType == 9)
    var document = isDocument ? widget : element.ownerDocument.body.retrieve('widget');
    if (isDocument || element.offsetParent) {
      var postponed = false
      this.render();
      this.walk(function(child) {
        if (child.postponed) {
          postponed = true;
          child.update();
        }
        child.document = document;
        child.fireEvent('dominject', element);
        child.dominjected = true;
      });
      if (postponed && !this.dirty) this.dirty = true;
      this.render();
    }
  },
  
  inject: function(widget, where, quiet) {
    inserters[where || 'bottom'](Element.type(widget) ? $(this) : this, widget);
    var element = $(widget);
    this.fireEvent('inject', arguments);
    if (quiet !== true) this.setDocument(widget);
  },
  
  dispose: function() {
    var parent = this.parentNode;
    if (parent) {
      parent.childNodes.erase(this);
      if (parent.firstChild == this) delete parent.firstChild;
      if (parent.lastChild == this) delete parent.lastChild;
      delete this.parentNode;
    } 
    return this.parent.apply(this, arguments);
  },
  
  walk: function(callback) {
    callback(this);
    this.childNodes.each(function(child) {
      child.walk(callback)
    });
  },
  
  collect: function(callback) {
    var result = [];
    this.walk(function(child) {
      if (!callback || callback(child)) result.push(child);
    });
    return result;
  },

  match: function(selector) {
    return ART.Sheet.match(selector, this.getHierarchy())
  }
});

Widget.Attributes.Ignore.push('shy');

})();