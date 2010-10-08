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
          if (this.options.resizer.container) this.getResized().addEvent('resize', this.checkOverflow.bind(this));
          if (this.options.resizer.crop) $(this.getResized()).setStyle('overflow', 'hidden')
        }
        this.getResizer().attach();
      },

      disable: function() {
        if (this.resizer) this.resizer.detach();
      }
    }
  },
  
  getResizer: Macro.setter('resizer', function() {
    var resized = this.getResized();
    var element = $(resized)//.setStyle('overflow', 'hidden');
    resized.addEvent('resize', function(size) {
      $extend(element, size);
    });
    element.width  = resized.getStyle('width');
    element.height = resized.getStyle('height');
    var resizer = new Drag(element, $extend({
      handle: $(this.getHandle())
    }, this.options.resizer));
    resizer.addEvents(this.events.resizer);
    resizer.addEvents({
      'start': this.onResizeStart.bind(this),
      'complete': this.onResizeComplete.bind(this),
      'cancel': this.onResizeComplete.bind(this),
      'drag': this.onResize.bind(this)
    }, true);
    return resizer;
  }),
  
  checkOverflow: function(size) {
    if (!this.resizer) return;
    if (!this.resizer.container) this.resizer.container = this.element;
    var resized = this.getResized();
    if (!size) size = {width: $(resized).width}
    var width = this.resizer.container.offsetWidth - this.offset.padding.left - this.offset.padding.right;
    var self = arguments.callee;  
    if (size.width < width) {
      if (!$chk(self.limit)) self.limit = this.resizer.options.limit.x[0];
      this.resizer.setMinX(width);
      resized.setWidth(width);
      $clear(self.delay);
      self.delay = (function() { //reset limit options in one second
        this.resizer.setMinX(self.limit + 1);
      }).delay(1000, this);
      return false;
    }
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
    if (this.resizer.value.now.y) this.getResized().setStyle('height', this.resizer.value.now.y);
    if (this.resizer.value.now.x) this.getResized().setStyle('width', this.resizer.value.now.x);
    this.checkOverflow();
    //this.refresh(true);
    //optimization: refresh only widgets that are liquid
    if (this.cache.dependent) this.cache.dependent.each(function(child) {
      child.update();
    })
    
    this.render();
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