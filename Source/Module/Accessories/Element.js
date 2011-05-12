/*
---
 
script: Element.js
 
description: Attach and detach a widget to/from element
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module

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
      return {
        events: {
          'initialize': function(options, element) {
            if (element) this.attach(element);
          },
          'build': 'attach',
          'destroy': 'detach'
        }
      }
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
    if (this.options.key) this.element.store(this.options.key, this).fireEvent('attach', this);
    return this.element;
  },

  detach: function(element) {
    if (this.options.key) this.element.eliminate(this.options.key, this).fireEvent('detach', this)
    delete this.element;
  },
  
  toElement: function(){
    if (!this.built && this.build) this.build();
    return this.element;
  },
  
  build: function() {
    var options = this.options, attrs = Object.append({element: this.element}, options.element);
    if (!attrs.tag)
      attrs.tag = ((this.options.inline == null) && options.tag) || (options.inline ? 'span' : 'div'); 
    this.fireEvent('beforeBuild', attrs);
    var stop = (attrs.convert === false), tag = attrs.tag;
    delete attrs.convert, delete attrs.tag, delete attrs.element;
    if (!this.element || stop) this.element = new Element(tag, attrs);
    else var element = this.element.set(attrs);
    var classes = new FastArray;
    if (options.tag != tag) classes.push('lsd', options.tag || this.tagName);
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
  
  destroy: function() {
    this.fireEvent('beforeDestroy');
    this.element.destroy();
    return this;
  },
  
  $family: Function.from('object')
});