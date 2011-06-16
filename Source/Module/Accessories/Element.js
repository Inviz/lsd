/*
---
 
script: Element.js
 
description: Attach and detach a widget to/from element
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events

provides: 
  - LSD.Module.Element
 
...
*/

LSD.Module.Element = new Class({
  options: {
    key: 'node',
    reusable: true,
    inline: null
  },
  
  initializers: {
    element: function() {
      LSD.uid(this);
    }
  },
  
  /*
    Attaches widget to a DOM element. If a widget was
    attached to some other element, it deattaches that first
  */
  
  attach: function(element) {
    if (element) {
      if (this.element) {
        if (this.built && this.element != element) this[this.options.reusable ? 'detach' : 'destroy']();
      } else this.element = document.id(element);
    }
    if (!this.built) this.build();
    this.fireEvent('register', ['element', this.element]);
    if (this.options.key) this.element.store(this.options.key, this).fireEvent('attach', this);
    return this.element;
  },

  detach: function(element) {
    this.fireEvent('unregister', ['element', this.element]);
    if (this.options.key) this.element.eliminate(this.options.key, this).fireEvent('detach', this)
    delete this.element;
  },
  
  toElement: function(){
    if (!this.built && this.build) this.build();
    return this.element;
  },
  
  build: function() {
    var options = this.options, attrs = {element: this.element};
    this.fireEvent('beforeBuild', attrs);
    var stop = (attrs.convert === false)
    delete attrs.element, delete attrs.convert;
    var attrs = Object.merge({}, options.element, attrs);
    var tag = attrs.tag || this.getElementTag();
    delete attrs.tag;
    if (!this.element || stop) this.element = new Element(tag, attrs);
    else var element = this.element.set(attrs);
    var classes = new FastArray;
    if (this.tagName != tag) classes.push('lsd', this.tagName);
    classes.concat(this.classes);
    if (Object.getLength(classes)) this.element.className = classes.join(' ');
    if (this.attributes) 
      for (var name in this.attributes) 
        if (name != 'width' && name != 'height') {
          var value = this.attributes[name];
          if (!element || element[name] != value) this.element.setAttribute(name, value);
        }

    if (this.style) for (var property in this.style.element) this.element.setStyle(property, this.style.element[property]);
    return this.element;
  },
  
  getElementTag: function(soft) {
    var options = this.options, inline = options.inline, element = options.element;
    if (element && element.tag) return element.tag;
    if (!soft) switch (inline) {
      case null:
        return this.tagName;
      case true:
        return "span";
      case false:
        return "div"
      default:
        return inline;
    }
  },
  
  destroy: function() {
    this.fireEvent('beforeDestroy');
    this.element.destroy();
    return this;
  },
  
  $family: function() {
    return this.options.key || 'widget';
  }
});

LSD.Module.Element.events = {
  prepare: function(options, element) {
    if (element) this.attach(element);
  },
  build: function() {
    this.attach.apply(this, arguments);
  },
  destroy: function() {
    this.detach.apply(this, arguments);
  }
};

LSD.Module.Events.addEvents.call(LSD.Module.Element.prototype, LSD.Module.Element.events);