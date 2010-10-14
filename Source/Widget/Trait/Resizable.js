/*
---
 
script: Resizable.js
 
description: Resize widget with the mouse freely
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
- More/Drag

provides: [ART.Widget.Trait.Resizable, ART.Widget.Trait.Resizable.Container]
 
...
*/


ART.Widget.Trait.Resizable = new Class({
  options: {
    resizer: {
      modifiers: {
        x: 'width',
        y: 'height'
      },
      snap: false,
      style: false,
      crop: false,
      container: true,
      limit: {
        x: [0, 3000],
        y: [0, 3000]
      }
    }
  },
  
  events: {
    resizer: {}
  },
  
  cache: {},
  
  actions: {
    resizer: {
      uses: ['#handle', '#content'],
      
      enable: function() {
        if (!this.resizer) {
          if (this.options.resizer.crop) $(this.getResized()).setStyle('overflow', 'hidden');
          this.getResizer();
        } else this.resizer.attach();
      },

      disable: function() {
        if (this.resizer) this.resizer.detach();
      }
    }
  },
  
  getResizer: Macro.setter('resizer', function() {
    var resized = this.getResized();
    var element = $(resized)
    var resizer = new Drag(element, $extend({
      handle: $(this.getHandle())
    }, this.options.resizer));
    resizer.addEvents(this.events.resizer);
    resizer.addEvents({
      'beforeStart': this.onBeforeResize.bind(this),
      'start': this.onResizeStart.bind(this),
      'complete': this.onResizeComplete.bind(this),
      'cancel': this.onResizeComplete.bind(this),
      'drag': this.onResize.bind(this)
    }, true);
    return resizer;
  }),
  
  checkOverflow: function(size) {
    if (!this.resizer) return;
    var resized = this.getResized();  
    var width = $(this).offsetWidth - this.offset.padding.left - this.offset.padding.right;
    if (!size) size = {width: $(resized).width}
    if (size.width < width) {
      if (!$chk(self.limit)) self.limit = this.getResized().getStyle('minWidth') || 1
      this.getResized().setStyle('minWidth', width);
      $clear(self.delay);
      self.delay = (function() { //reset limit options in one second
        this.getResized().setStyle('minWidth', self.limit);
      }).delay(1000, this); 
      size.width = width;
    }
    return size;
  },
  
  onBeforeResize: function() {
    var resized = this.getResized();
    $extend($(resized), resized.size)
  },
  
  onResizeStart: function() {
    this.transform.apply(this, arguments);
    if (!this.cache.dependent) this.cache.dependent = this.collect(function(child) {
      return (child.style.current.width == 'inherit') || (child.style.current.width == 'auto') || child.style.expressed.width
    }).concat(this.getResized())
  },
  
  onResizeComplete: function() {
    this.finalize.apply(this, arguments);
    delete this.cache.dependent
  },
  
  onResize: function() {
    var now = this.resizer.value.now;
    var resized = this.getResized();
    if (!now.x) now.x = resized.size.width;
    if (!now.y) now.y = resized.size.height;
    var size = this.checkOverflow({width: resized.setWidth(now.x) || now.x, height: resized.setHeight(now.y) || now.y});
    resized.setStyles(size);
    if (this.cache.dependent) this.cache.dependent.each(Macro.proc('update'));
    this.refresh();
    resized.fireEvent('resize', [size, resized.size])
    resized.size = size;
  },
  
  getHandle: Macro.defaults(function() {
    return this.handle;
  }),

  getResized: Macro.defaults(function() {
    return this;
  })
});

ART.Widget.Trait.Resizable.State = Class.Stateful({
  'resized': ['transform', 'finalize']
});
ART.Widget.Trait.Resizable.Stateful = [
  ART.Widget.Trait.Resizable.State,
  ART.Widget.Trait.Resizable
];
Widget.Events.Ignore.push('resizer');

//Make container resize, not the widget itself.
ART.Widget.Trait.Resizable.Container = new Class({
  getResized: function() {
    return this.content;
  },
  
  getScrolled: function() {
    return this.content.wrapper || this.content
  }
});