/*
---
 
script: Resizable.js
 
description: Resize widget with the mouse freely
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
  - More/Drag

provides: 
  - LSD.Mixin.Resizable 
...
*/


LSD.Mixin.Resizable = new Class({
  behaviour: '[resizable][resizable!=false]',
  
  options: {
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
      },
    },
    actions: {
      resizable: {
        enable: function(handle, resizable) {
          this.handle = handle;
          this.resized = resizable || this;
          this.onStateChange('resizable', true);
          var resizer = this.resizer;
          if (resizer == this.getResizer(document.id(this.resized))) resizer.attach();
          if (handle) document.id(handle).addEvent('mousedown', this.resizer.bound.start);
          if (this.options.resizer.fit) this.fit(resizable)
        },

        disable: function(handle, content) {
          this.onStateChange('resizable', false);
          if (this.resizer) this.resizer.detach();
          if (handle) document.id(handle).removeEvent('mousedown', this.resizer.bound.start);
          delete this.resized, delete this.handle;
        },
      }
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    var options = this.options.resizer;
    var rules = (new FastArray).concat(this.getAttribute('resizable').split(/\s+/));
    options.modifiers.x = (!rules.x && rules.y) ? false : 'width';
    options.modifiers.y = (!rules.y && rules.x) ? false : 'height';
    options.fit = !!rules.fit;
  },
  
  uninitialize: function() {
    if (this.handle) this.options.actions.resizable.disable.call(this, this.handle, this.resized);
    delete this.resizer;
  },
   
  getResizer: function(resized) {
    var element = resized
    if (this.resizer) {
      if (this.resizer.element == element) return this.resizer;
      return this.resizer.element = element;
    }
    var resizer = this.resizer = new Drag(element, Object.append(this.options, this.options.resizer));
    this.fireEvent('register', ['resizer', resizer]);
    resizer.addEvents({
      'beforeStart': this.onBeforeResize.bind(this),
      'start': this.onResizeStart.bind(this),
      'complete': this.onResizeComplete.bind(this),
      'cancel': this.onResizeComplete.bind(this),
      'drag': this.onResize.bind(this)
    }, true);
    return resizer;
  },
  
  check: function(size) {
    if (!this.resizer) return;
    var width = this.element.offsetWidth - this.offset.inner.left - this.offset.inner.right;
    if (!size) size = {width: this.resized.toElement().width}
    if (size.width < width) {
      if (!$chk(this.limit)) this.limit = this.resized.getStyle('minWidth') || 1
      this.resized.setStyle('minWidth', width);
      $clear(this.delay);
      this.delay = (function() { //reset limit options in one second
        this.resized.setStyle('minWidth', this.limit);
      }).delay(1000, this); 
      size.width = width;
    }
    return size;
  },
  
  onBeforeResize: function() {
    Object.append(this.resized.toElement(), this.resized.size)
  },
  
  onResizeStart: function() {
    this.onStateChange('resized', true);
    var getLiquid = function(child, prop) {
      var value = child.style.current[prop];
      return ((value == 'inherit') || (value == 'auto') || child.style.expressed[prop]) ? value : null
    }
    if (!this.liquid) {
      this.liquid = LSD.Module.DOM.walk(this, function(child) { 
        return getLiquid(c, 'width')
      }) || []
      this.liquid.include(this.resized);
      if (this.resized != this) {
        var style = this.resized.style.liquid = {};
        var width = getLiquid(this.resized, 'width');
        if (width) style.width = width;
        var height = getLiquid(this.resized, 'height');
        if (height) style.height = height;
      }
    }
  },
  
  onResizeComplete: function() {
    if (this.resized.style.liquid) this.resized.setStyles(this.resized.style.liquid);
    this.onStateChange('resized', false);
    delete this.liquid
  },
  
  onResize: function() {
    var now = this.resizer.value.now;
    var resized = this.resized;
    if (!resized.style.dimensions) {
      resized.style.dimensions = {};
      var width = resized.style.current.width
      if (width == 'auto') resized.style.dimensions.width = 'auto';
      var height = resized.toElement().getStyle('height');
      if (height == 'auto') resized.style.dimensions.height = 'auto';
    }
    if (!now.x) now.x = resized.size.width;
    if (!now.y) now.y = resized.size.height;
    var size = this.check({width: resized.setWidth(now.x) || now.x, height: resized.setHeight(now.y) || now.y});
    resized.setStyles(size);
    if (this.liquid) {
      this.liquid.each(function(child) {
        child.update();
      })
    }
    this.refresh();
  },
  
  fit: function(content) {
    if (!content) content = this.resized;
    var element = content.getWrapper();
    var display = element.getStyle('display');
    if (display != 'inline-block') element.setStyle('display', 'inline-block');
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    element.setStyle('display', display)
    content.setHeight(height);
    content.setWidth(width);
    this.refresh({
      maxWidth: width, maxHeight: height
    });
  },
  
  getScrolled: function() {
    return this.resized.getWrapper();
  }
});