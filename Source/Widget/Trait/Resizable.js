/*
---
 
script: Resizable.js
 
description: Resize widget with the mouse freely
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget.Base
  - More/Drag

provides: 
  - LSD.Widget.Trait.Resizable
  - LSD.Widget.Trait.Resizable.State
  - LSD.Widget.Trait.Resizable.Stateful
  - LSD.Widget.Trait.Resizable.Content
 
...
*/


LSD.Widget.Trait.Resizable = new Class({
  options: {
    actions: {
      resizer: {
        enable: function(handle, resizable) {
          this.handle = handle;
          this.resizable = resizable || this;
          var resizer = this.resizer;
          if (resizer == this.getResizer(document.id(this.resizable))) resizer.attach();
          if (handle) document.id(handle).addEvent('mousedown', this.resizer.bound.start);
        },

        disable: function(handle, content) {
          if (this.resizer) this.resizer.detach();
          if (handle) document.id(handle).removeEvent('mousedown', this.resizer.bound.start);
          delete this.resizable, this.handle;
        }
      }
    },
    events: {
      resizer: {}
    },
    resizer: {
      modifiers: {
        x: 'width',
        y: 'height'
      },
      snap: false,
      style: false,
      crop: false,
      handle: [],
      container: true,
      limit: {
        x: [0, 3000],
        y: [0, 3000]
      }
    }
  },
  
  getResizer: function(resized) {
    var element = resized;
    if (this.resizer) {
      if (this.resizer.element == element) return this.resizer;
      return this.resizable.element = element;
    }
    var resizer = this.resizer = new Drag(element, this.options.resizer);
    resizer.addEvents(this.events.resizer);
    resizer.addEvents({
      'beforeStart': this.onBeforeResize.bind(this),
      'start': this.onResizeStart.bind(this),
      'complete': this.onResizeComplete.bind(this),
      'cancel': this.onResizeComplete.bind(this),
      'drag': this.onResize.bind(this)
    }, true);
    return resizer;
  },
  
  checkOverflow: function(size) {
    if (!this.resizer) return;
    var width = this.element.offsetWidth - this.offset.inner.left - this.offset.inner.right;
    if (!size) size = {width: this.resizable.toElement().width}
    if (size.width < width) {
      if (!$chk(this.limit)) this.limit = this.resizable.getStyle('minWidth') || 1
      this.resizable.setStyle('minWidth', width);
      $clear(this.delay);
      this.delay = (function() { //reset limit options in one second
        this.resizable.setStyle('minWidth', this.limit);
      }).delay(1000, this); 
      size.width = width;
    }
    return size;
  },
  
  onBeforeResize: function() {
    Object.append(this.resizable.toElement(), this.resizable.size)
  },
  
  onResizeStart: function() {
    this.transform.apply(this, arguments);
    if (!this.liquid) this.liquid = this.collect(function(child) {
      return (child.style.current.width == 'inherit') || (child.style.current.width == 'auto') || child.style.expressed.width
    }).concat(this.resizable)
  },
  
  onResizeComplete: function() {
    this.finalize.apply(this, arguments);
    delete this.liquid
  },
  
  onResize: function() {
    var now = this.resizer.value.now;
    var resized = this.resizable;
    if (!resized.style.dimensions) {
      resized.style.dimensions = {};
      var width = resized.style.current.width
      if (width == 'auto') resized.style.dimensions.width = 'auto';
      var height = resized.toElement().getStyle('height');
      if (height == 'auto') resized.style.dimensions.height = 'auto';
    }
    if (!now.x) now.x = resized.size.width;
    if (!now.y) now.y = resized.size.height;
    var size = this.checkOverflow({width: resized.setWidth(now.x) || now.x, height: resized.setHeight(now.y) || now.y});
    resized.setStyles(size);
    if (this.liquid) {
      this.liquid.each(function(child) {
        child.update();
      })
    }
    this.refresh();
  }
});

LSD.Widget.Trait.Resizable.State = Class.Stateful({
  'resized': ['transform', 'finalize']
});
LSD.Widget.Trait.Resizable.Stateful = [
  LSD.Widget.Trait.Resizable.State,
  LSD.Widget.Trait.Resizable
];
Widget.Events.Ignore.push('resizer');
Widget.Attributes.Ignore.push('resizable-content', 'resizable');

//Make container resize, not the widget itself.
LSD.Widget.Trait.Resizable.Content = new Class({
  getScrolled: function() {
    return this.content.wrapper || this.content
  }
});