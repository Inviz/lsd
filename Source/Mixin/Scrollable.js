/*
---
 
script: Scrollable.js
 
description: For all the scrollbars you always wanted
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
  - Widgets/LSD.Widget.Scrollbar

provides: 
  - LSD.Mixin.Scrollable
 
...
*/

LSD.Mixin.Scrollable = new Class({
  behaviour: '[scrollable][scrollable!=false]',
  
  options: {
    events: {
      self: {
        resize: 'showScrollbars'
      },
      element: {
        mousewheel: 'onMousewheel'
      }
    }
  },
  
  onMousewheel: function(event) {
    var scrollbar = this.vertical || this.horizontal;
    if (scrollbar) scrollbar.track.element.fireEvent('mousewheel', event  );
  },
  
  showScrollbars: function(size) {
    if (!size) size = this.size;
    var scrolled = document.id(this.getScrolled());
    scrolled.setStyles(size)
    scrolled.setStyle('overflow', 'hidden');
    if (size.width < scrolled.scrollWidth) {
      if (this.getHorizontalScrollbar().parentNode != this) this.horizontal.inject(this);
      this.horizontal.slider.set(this.horizontal.now)
    } else if (this.horizontal) this.horizontal.dispose();
    
    if (size.height < scrolled.scrollHeight) {
      if (this.getVerticalScrollbar().parentNode != this) this.vertical.inject(this);
        this.vertical.slider.set(this.vertical.now)
    } else if (this.vertical) this.vertical.dispose();
  },
  
  getVerticalScrollbar: Macro.getter('vertical', function() {
    return this.buildLayout('scrollbar[mode=vertical]')
  }),
  
  getHorizontalScrollbar: Macro.getter('horizontal', function() {
    return this.buildLayout('scrollbar[mode=horizontal]')
  }),
  
  getScrolled: Macro.defaults(function() {
    return this.getWrapper();
  })
});