/*
---
 
script: DOM.js
 
description: Provides DOM-compliant interface to play around with other widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Widget.Base

provides:
  - LSD.Widget.Module.DOM
 
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


LSD.Widget.Module.DOM = new Class({
  initialize: function() {
    this.childNodes = [];
    this.nodeType = 1;
    this.parentNode = this.nextSibling = this.previousSibling = null;
    this.parent.apply(this, arguments);
    this.nodeName = this.options.tag;
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
  
  contains: function(element) {
    while (element = element.parentNode) if (element == this) return true;
    return false;
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
    this.fireEvent('setParent', [widget, widget.document])
    var siblings = widget.childNodes;
    var length = siblings.length;
    if (length == 1) widget.firstChild = this;
    widget.lastChild = this;
    var previous = siblings[length - 2];
    if (previous) {
      previous.nextSibling = this;
      this.previousSibling = previous;
    }
  },
  
  /*
    
    %header
      %section#top
      %button
      %button
      %section Title
    
    var header = LSD.document.getElement('header');
    header.top     //=> section#top
    header.buttons //=> [button, button]
    header.section //=> section 
    
    When widget is appended as child the semantic to that widget
    is set. The name of the link is determined by these rules:
    
    - If widget has id, use id
    - Use tag name
      - If the link is not taken, write tag name link
      - If the link is taken, append widget to a pluralized array link
        - When pluralized link is added, original link is not removed
  */
  
  appendChild: function(widget, adoption) {
    if (!adoption && this.canAppendChild && !this.canAppendChild(widget)) return false;
    var options = widget.options, id = options.id, tag = options.tag, tags = tag + 's', kind = widget.attributes['kind']
    widget.identifier = id || tag;
    if (id) {
      if (this[id]) this[id].dispose();
      this[id] = widget;
    } else if (!this[tag]) this[tag] = widget;
    else if (!this[tags]) this[tags] = [widget];
    else if (typeof this[tags] == 'array') this[tags].push(widget);
    else if (!this['_' + tags]) this['_' + tags] = [widget];
    else this['_' + tags].push(widget);
        
    this.childNodes.push(widget);
    if (this.nodeType != 9) widget.setParent(this);
    (adoption || function() {
      this.toElement().appendChild(document.id(widget));
    }).apply(this, arguments);
    
    this.fireEvent('adopt', [widget, id])
    this[this.dispatchEvent ? "dispatchEvent" : "fireEvent"]('nodeInserted', widget);
    return true;
  },
  
  insertBefore: function(insertion, element) {
    return this.appendChild(insertion, function() {
      document.id(insertion).inject(document.id(element), 'before')
    });
  },
  
  grab: function(el, where){
    inserters[where || 'bottom'](document.id(el, true), this);
    return this;
  },
  
  setDocument: function(widget) {
    var element = document.id(widget);
    var doc;
    var isDocument = (widget.nodeType == 9);
    var isBody = element.get('tag') == 'body';
    if (isDocument || isBody || element.offsetParent) {
      if (!isDocument) {
        var body = (isBody ? element : element.ownerDocument.body);
        doc = body.retrieve('widget') || new LSD.Document(body);
      } else doc = widget;
      var halted = [];
      this.render();
      this.walk(function(child) {
        if (child.halted) halted.push(child);
        child.ownerDocument = child.document = doc;
        child.fireEvent('dominject', element);
        child.dominjected = true;
      });
      halted.each(function(child) {
        child.refresh();
      })
    }
  },
  
  inject: function(widget, where, quiet) {
    var isElement = 'tagName' in widget;
    if (isElement) {
      var instance = widget.retrieve('widget');
      if (instance) {
        widget = instance;
        isElement = false;
      }
    }
    var self = isElement ? this.toElement() : this;
    if (!inserters[where || 'bottom'](self, widget) && !quiet) return false;
    this.fireEvent('inject', arguments);
    if (quiet !== true) this.setDocument(widget);
    return true;
  },
  
  dispose: function() {
    var parent = this.parentNode;
    if (parent) {
      parent.childNodes.erase(this);
      if (parent.firstChild == this) delete parent.firstChild;
      if (parent.lastChild == this) delete parent.lastChild;
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
  
  compareDocumentPosition: function(node) {
    var context =  (Element.type(node)) ? this.toElement() : this;
		if (node) do {
			if (node === context) return true;
		} while ((node = node.parentNode));
		return false;
	}
});

})();