/*
---
 
script: DOM.js
 
description: Provides DOM-compliant interface to play around with other widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD
  - Core/Element.Event

provides:
  - LSD.Module.DOM

...
*/


;(function() {
  
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

LSD.Module.DOM = new Class({
  initialize: function() {
    if (!this.childNodes) this.childNodes = [];
    this.nodeType = 1;
    this.parentNode = this.nextSibling = this.previousSibling = null;
    this.parent.apply(this, arguments);
    this.nodeName = this.tagName = this.options.tag;
  },
  
  toElement: function(){
    if (!this.built) this.build();
    return this.element;
  },
  
  build: function() {
    var options = this.options, attrs = Object.append({}, options.element);
    var tag = attrs.tag || options.tag;
    delete attrs.tag;
    if (!this.element) this.element = new Element(tag, attrs);
    else var element = this.element.set(attrs);
    var classes = [];
    if (options.tag != tag) classes.push('lsd', options.tag || this.tagName);
    if (options.id) classes.push('id-' + options.id);
    this.classes.each(function(cls) { classes.push(cls) });
    this.element.store('widget', this);
    if (classes.length) this.element.className = classes.join(' ');
    if (this.attributes) 
      for (var name in this.attributes) 
        if (name != 'width' && name != 'height') {
          var value = this.attributes[name];
          if (!element || element[name] != value)
            this.element.setAttribute(name, value);
        }

    if (this.style) for (var property in this.style.element) this.element.setStyle(property, this.style.element[property]);
    this.element.fireEvent('build', [this.element, this]);
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
  
  getChildren: function() {
    return this.childNodes;
  },

  getRoot: function() {
    var widget = this;
    while (widget.parentNode) widget = widget.parentNode;
    return widget;
  },
  
  setParent: function(widget){
    if ('localName' in widget) widget = Element.get(widget, 'widget');
    this.parentNode = widget;
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
    widget.setParent(this);
    if (!widget.quiet && (adoption !== false) && this.toElement()) (adoption || function() {
      this.element.appendChild(document.id(widget));
    }).apply(this, arguments);
    delete widget.quiet;
    
    this.fireEvent('adopt', [widget, id]);
    widget.walk(function(node) {
      this.dispatchEvent('nodeInserted', node);
    }.bind(this));
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
    var doc;
    var element = ('localName' in widget) ? widget : widget.element;
    var isDocument = (widget.nodeType == 9);
    var isBody = element && element.tagName.toLowerCase() == 'body';
    if (isDocument || isBody || this.parentNode.dominjected || element.offsetParent) {
      if (!isDocument) { 
        if (widget == element && !widget.document) {
          var body = (isBody ? element : element.ownerDocument.body);
          doc = body.retrieve('widget') || new LSD.Document(body);
        } else doc = widget.document
      } else doc = widget;
      var halted = [];
      //this.render();
      this.walk(function(child) {
        //if (child.halted) halted.push(child);
        child.ownerDocument = child.document = doc;
        child.fireEvent('dominject', [element, doc]);
        child.dominjected = true;
      });
      //halted.each(function(child) {
      //  child.refresh();
      //})
    }
  },
  
  inject: function(widget, where, quiet) {
    var isElement = 'localName' in widget;
    if (isElement) {
      var instance = widget.retrieve && widget.retrieve('widget');
      if (instance) {
        widget = instance;
        isElement = false;
      }
    }
    var self = isElement ? this.toElement() : this;
    this.quiet = quiet || (widget.nodeType == 9 && this.element && this.element.parentNode);
    //console.log('inject', widget, where, self.tagName, this.options.id)
    if (!inserters[where || 'bottom'](self, widget) && !quiet) return false;
    if (quiet !== true || widget.document) this.setDocument(widget);
    this.fireEvent('inject', this.parentNode);
    return true;
  },

  onDOMInject: function(callback) {
    if (this.document) callback.call(this, document.id(this.document)) 
    else this.addEvent('dominject', callback.bind(this))
  },

  dispose: function() {
    var parent = this.parentNode;
    if (parent) {
      parent.childNodes.erase(this);
      if (parent.firstChild == this) delete parent.firstChild;
      if (parent.lastChild == this) delete parent.lastChild;
    }
    this.fireEvent('dispose', parent);
    delete this.parentNode;
    return this.parent.apply(this, arguments);
  },
  
  dispatchEvent: function(type, args){
    var node = this;
    type = type.replace(/^on([A-Z])/, function(match, letter) {
      return letter.toLowerCase();
    });
    while (node) {
      var events = node.$events;
      if (events && events[type]) events[type].each(function(fn){
        return fn[args.push ? 'apply' : 'call'](node, args);
      }, node);
      node = node.parentNode;
    }
    return this;
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

Element.Events.ready = {
  onAdd: function(fn) {
    if (this.retrieve('widget')) {
      fn.call(this, this.retrieve('widget'))
    } else {
      this.addEvent('build', fn);
    }
  }
};

Element.Events.contentready = {
  onAdd: function(fn) {
    fn.call(this, this)
    this.addEvent('update', fn)
  }
};

})();