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
        uses: ['handle', 'content'],
      
        enable: function() {
          if (!this.resizer) {
            if (this.options.resizer.crop) document.id(this.getResized()).setStyle('overflow', 'hidden');
            this.getResizer();
          } else this.resizer.attach();
        },

        disable: function() {
          if (this.resizer) this.resizer.detach();
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
      container: true,
      limit: {
        x: [0, 3000],
        y: [0, 3000]
      }
    }
  },
  
  getResizer: Macro.getter('resizer', function() {
    var resized = this.getResized();
    var element = document.id(resized)
    var resizer = new Drag(element, $extend({
      handle: document.id(this.getHandle())
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
    var width = this.element.offsetWidth - this.offset.inner.left - this.offset.inner.right;
    if (!size) size = {width: resized.toElement().width}
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
    $extend(resized.toElement(), resized.size)
  },
  
  onResizeStart: function() {
    this.transform.apply(this, arguments);
    if (!this.liquid) this.liquid = this.collect(function(child) {
      return (child.style.current.width == 'inherit') || (child.style.current.width == 'auto') || child.style.expressed.width
    }).concat(this.getResized())
  },
  
  onResizeComplete: function() {
    this.finalize.apply(this, arguments);
    delete this.liquid
  },
  
  onResize: function() {
    var now = this.resizer.value.now;
    var resized = this.getResized();
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
  },
  
  getHandle: Macro.defaults(function() {
    return this.handle;
  }),

  getResized: Macro.defaults(function() {
    return this;
  })
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
  getResized: function() {
    return this.content;
  },
  
  getScrolled: function() {
    return this.content.wrapper || this.content
  },

	getHandle: function() {
	  for (var parents = [this.content, this.footer, this], parent, i = 0 ; parent = parents[i++];) if (parent && parent.handle) return parent.handle;
	}
});