/*
---
 
script: Base.js
 
description: Lightweight base widget class to inherit from.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Core/Options
  - Core/Events
 
provides:
  - LSD.Base
...
*/

LSD.Base = new Class({
  
  Implements: [Options, Events],
  
  initialize: function() {
  },
  
  toElement: function(){
    this.build();
    return this.element;
  },
  
  attach: function() {
    this.toElement().store('widget', this);
    return true;
  },
  
  detach: function() {
    this.toElement().eliminate('widget', this);
    return true;
  },
  
  setState: function(state) {
    if (LSD.States.Attributes[state]) {
      this.setAttribute(state, true)
    } else {
      this.addClass('is-' + state);
    }
    this.addPseudo(state);
  },
  
  unsetState: function(state) {
    if (LSD.States.Attributes[state]) {
      this.removeAttribute(state)
    } else {
      this.removeClass('is-' + state);
    }
    this.removePseudo(state);
  },

  dispose: function() {
    var parent = this.parentNode;
    this.element.dispose();
    delete this.parentNode;
    this.fireEvent('dispose', parent);
  },
  
  setParent: function(widget) {
    this.parentNode = widget;
    this.document = widget.document;
  },
  
  setDocument: function(widget) {
    var element = document.id(widget)
    var isDocument = (widget.nodeType == 9)
    if (isDocument || element.offsetParent) {
      var document = isDocument ? widget : element.ownerDocument.body.retrieve('widget');
      this.document = document;
      this.fireEvent('dominject', element);
      this.dominjected = true;
    }
  },
  
  inject: function(widget) {
    if (this.parentNode) this.dispose();
    this.toElement().inject(widget);
    this.setDocument(widget);
    this.setParent(widget);
    this.fireEvent('inject', arguments);
  },
  
  destroy: function() {
    if (this.parentNode) this.dispose();
    this.detach();
    if (this.element) this.element.destroy();
  },

  onDOMInject: function(callback) {
    if (this.document) callback.call(this, document.id(this.document)) 
    else this.addEvent('dominject', callback.bind(this))
  },
  
  onChange: function() {
    this.fireEvent('change', arguments)
    return true;
  },
  
  build: Macro.onion(function() {
    var attrs = $unlink(this.options.element);
    var tag = attrs.tag;
    delete attrs.tag;
    var classes = ['lsd'];
    if (this.options.tag != tag) classes.push(this.options.tag);
    classes.push(this.classes.join(' '));
    if (this.options.id) classes.push('id-' + this.options.id);
    this.element = new Element(tag, attrs).addClass(classes.join(' '));
    
    if (this.attributes) 
      for (var name in this.attributes) 
        if (name != 'width' && name != 'height') this.element.setAttribute(name, this.attributes[name]);
        
    if (this.style) for (var property in this.style.element) this.element.setStyle(property, this.style.element[property]);
    this.redraws = 0;
    this.attach()
  }),
  
  onStateChange: function(state, value, args) {
    var args = Array.from(arguments);
    args.splice(1, 2); //state + args
    this[value ? 'setState' : 'unsetState'].apply(this, args);
    if (this.redraws > 0) this.refresh(true);
    return true;
  },
  
  getSelector: function(){
    var parent = this.parentNode;
    var selector = (parent && parent.getSelector) ? parent.getSelector() + ' ' : '';
    selector += this.options.tag;
    if (this.options.id) selector += '#' + this.options.id;
    for (var klass in this.classes)  if (this.classes.hasOwnProperty(klass))  selector += '.' + klass;
    for (var pseudo in this.pseudos) if (this.pseudos.hasOwnProperty(pseudo)) selector += ':' + pseudo;
    if (this.attributes) for (var name in this.attributes) selector += '[' + name + '=' + this.attributes[name] + ']';
    return selector;
  },
  
  render: Macro.onion(function(){
    if (!this.built) this.build();
    delete this.halted;
    this.redraws++;
    this.repaint.apply(this, arguments);
  }),
  
  repaint: function(style) {
    this.renderStyles(style);
    this.childNodes.each(function(child){
      child.render();
    });
  },

  /*
    Halt marks widget as failed to render.
    
    Possible use cases:
    
    - Dimensions depend on child widgets that are not
      rendered yet
    - Dont let the widget render when it is not in DOM
  */ 
  halt: function() {
    if (this.halted) return false;
    this.halted = true;
    return true;
  },
  
  /*
    Update marks widget as willing to render. That
    can be followed by a call to *render* to trigger
    redrawing mechanism. Otherwise, the widget stay 
    marked and can be rendered together with ascendant 
    widget.
  */
  
  update: function(recursive) {
    if (recursive) {
      this.walk(function(widget) {
        widget.update();
      });
    }
    return this.parent.apply(this, arguments);
  },
  
  /*
    Refresh updates and renders widget (or a widget tree 
    if optional argument is true). It is a reliable way
    to have all elements redrawn, but a costly too.
    
    Should be avoided when possible to let internals 
    handle the rendering and avoid some unnecessary 
    calculations.
  */

  refresh: function(recursive) {
    this.update(recursive);
    return this.render();
  },
  
  $family: function() {
    return "object"
  },
  
  getWrapper: function() {
    return this.toElement();
  }
  
});