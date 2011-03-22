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
  - LSD.Module.DOM.findDocument

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
  options: {
    nodeType: 1,
    events: {
      _dom: {
        element: {
          'dispose': 'dispose'
        }
      }
    }
  },
  
  initialize: function() {
    if (!this.childNodes) this.childNodes = [];
    this.nodeType = this.options.nodeType
    this.parentNode = this.nextSibling = this.previousSibling = null;
    this.fireEvent('initialize')
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
    var classes = new FastArray;
    if (options.tag != tag) classes.push('lsd', options.tag || this.tagName);
    if (options.id) classes.push('id-' + options.id);
    classes.concat(this.classes);
    this.element.store('widget', this);
    if (Object.getLength(classes)) this.element.className = classes.join(' ');
    if (this.attributes) 
      for (var name in this.attributes) 
        if (name != 'width' && name != 'height') {
          var value = this.attributes[name];
          if (!element || element[name] != value) {
            this.element.setAttribute(name, value);
          } 
        }

    if (this.style) for (var property in this.style.element) this.element.setStyle(property, this.style.element[property]);
    this.element.fireEvent('build', [this, this.element]);
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
  
  appendChild: function(widget, adoption) {
    if (!adoption && this.canAppendChild && !this.canAppendChild(widget)) return false;
    if (widget.id) this[widget.id] = widget;
    this.childNodes.push(widget);
    widget.setParent(this);
    if (!widget.quiet && (adoption !== false) && this.toElement()) (adoption || function() {
      this.element.appendChild(document.id(widget));
    }).apply(this, arguments);
    delete widget.quiet;
    
    this.fireEvent('adopt', [widget]);
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
  
  extractDocument: function(widget) {
    var element = ('localName' in widget) ? widget : widget.element;
    var isDocument = widget.documentElement || (instanceOf(widget, LSD.Document));
    var parent = this.parentNode;
    if (isDocument  // if document
    || (parent && parent.dominjected) //already injected widget
    || (widget.ownerDocument && (widget.ownerDocument.body == widget)) //body element
    || element.offsetParent) { //element in dom (costy check)
      return (parent && parent.document) || (isDocument ? widget : LSD.Module.DOM.findDocument(widget));
    }
  },
  
  setDocument: function(document) {
    return this.walk(function(child) {
      child.ownerDocument = child.document = document;
      child.fireEvent('dominject', [child.element.parentNode, document]);
      child.dominjected = true;
    });
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
    this.quiet = quiet || (widget.documentElement && this.element && this.element.parentNode);
    if (where === false) widget.appendChild(this, false)
    else if (!inserters[where || 'bottom'](isElement ? this.toElement() : this, widget) && !quiet) return false;
    if (quiet !== true || widget.document) {
      var document = widget.document || (this.documentElement ? this : this.extractDocument(widget));
      if (document) this.setDocument(document);
    }
    this.fireEvent('inject', this.parentNode);
    return true;
  },

  onDOMInject: function(callback) {
    if (this.document) callback.call(this, document.id(this.document)) 
    else this.addEvent('dominject', callback.bind(this))
  },
  
  destroy: function() {
    this.dispose();
  },

  dispose: function(element) {
    var parent = this.parentNode;
    if (!parent) return;
    this.walk(function(node) {
      parent.dispatchEvent('nodeRemoved', node);
      node.fireEvent('dispose')
    })
    parent.childNodes.erase(this);
    if (parent.firstChild == this) delete parent.firstChild;
    if (parent.lastChild == this) delete parent.lastChild;
    this.fireEvent('dispose', parent);
    delete this.parentNode;
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
  }
});

LSD.Module.DOM.findDocument = function(target) {
  if (target.documentElement) return target;
  if (target.document) return target.document;
  if (!target.localName) return;
  var body = target.ownerDocument.body;
  var document = (target != body) && Element.retrieve(body, 'widget');
  while (!document && (target = target.parentNode)) {
    var widget = Element.retrieve(target, 'widget')
    if (widget) document = (widget instanceof LSD.Document) ? widget : widget.document;
  }
  return document;
}

Element.Events.ready = {
  onAdd: function(fn) {
    var widget = this.retrieve('widget');
    if (widget) {
      fn.call(this, widget)
    } else {
      this.addEvent('build', function(widget) {
        fn.call(this, widget);
      }.bind(this));
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