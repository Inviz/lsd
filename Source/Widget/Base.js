/*
---
 
script: Base.js
 
description: Lightweight base widget class to inherit from.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Base/Widget.Base
 
provides:
  - LSD.Widget.Base
  - LSD.Widget.create
  
...
*/

if (!LSD.Widget) LSD.Widget = {};
LSD.Widget.Base = new Class({
  Extends: Widget.Base,
  
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
        
    for (var property in this.style.element) this.element.setStyle(property, this.style.element[property]);
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
  
  addClass: function(name) {
    this.parent(name);
  },
  
  getSelector: function(){
    var parent = this.parentNode;
    var selector = (parent && parent.getSelector) ? parent.getSelector() + ' ' : '';
    selector += this.options.tag;
    if (this.options.id) selector += '#' + this.options.id;
    for (var klass in this.classes)  if (this.classes.hasOwnProperty(klass))  selector += '.' + klass;
    for (var pseudo in this.pseudos) if (this.classes.hasOwnProperty(pseudo)) selector += '.' + pseudo;
    if (this.attributes) for (var name in this.attributes) selector += '[' + name + '=' + this.attributes[name] + ']';
    return selector;
  },
  
  render: Macro.onion(function(style){
    if (!this.built) this.build();
    delete this.halted;
    this.redraws++;
    this.findStyles();
    this.renderStyles(style);
    this.childNodes.each(function(child){
      child.render();
    });
  }),

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
  }
  
});

//Basic widget initialization
LSD.Widget.count = 0;
LSD.Widget.create = function(klasses, a, b, c, d) {
  klasses = $splat(klasses);
  var base = klasses[0].indexOf ? LSD.Widget : klasses.shift();
  var klass = klasses.shift();
  var original = klass;
  if (klass.indexOf('-') > -1) { 
    var bits = klass.split('-');
    while (bits.length > 1) base = base[bits.shift().camelCase().capitalize()];
    klass = bits.join('-');
  }
  klass = klass.camelCase().capitalize();
  if (!base[klass]) {
    original = original.replace(/-(.)/g, function(whole, bit) {
      return '.' + bit.toUpperCase();
    }).capitalize();
    throw new Exception.Misconfiguration(this, 'ClassName LSD.Widget.' + original + ' was not found');
  }
  var widget = base[klass];
  if (klasses.length) {
    klasses = klasses.map(function(name) {
      return $type(name) == 'string' ? LSD.Widget.Trait[name.camelCase().capitalize()] : name;
    });
    widget = Class.include(widget, klasses)
  }
  LSD.Widget.count++;
  return new widget(a, b, c, d)
}

LSD.Widget.Module = {};
LSD.Widget.Trait = $mixin(Widget.Trait);