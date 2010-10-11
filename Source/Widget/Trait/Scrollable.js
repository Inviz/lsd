/*
---
 
script: Scrollable.js
 
description: For all the scrollbars you always wanted
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Scrollbar

provides: [ART.Widget.Trait.Scrollable]
 
...
*/

ART.Widget.Trait.Scrollable = new Class({
  events: {
    scrollbar: {
      self: {
        resize: 'showScrollbars'
      }
    }
  },
  
  attach: Macro.onion(function() {
    this.addEvents(this.events.scrollbar);
  }),
  
  detach: Macro.onion(function() {
    this.removeEvents(this.events.scrollbar);
  }),
  
  showScrollbars: function(size) {
    if (!size) size = this.size;
    var scrolled = this.getScrolled ? $(this.getScrolled()) : this.element.getFirst();
    if (size.width < scrolled.scrollWidth) this.getHorizontalScrollbar().inject(this);
    else if (this.horizontal) this.horizontal.dispose();
    
    if (size.height < scrolled.scrollHeight) this.getVerticalScrollbar().inject(this);
    else if (this.vertical) this.vertical.dispose();
  },
  
  build: Macro.onion(function() {
    if (!this.wrapper) this.wrapper = new Element('div', {'class': 'wrapper'}).setStyle('position', 'relative').setStyle('overflow', 'hidden')
    this.wrapper.inject(this.element);
  }),
  
  getVerticalScrollbar: Macro.setter('vertical', function() {
    return this.buildLayout('scrollbar#vertical[mode=vertical]')
  }),
  
  getHorizontalScrollbar: Macro.setter('horizontal', function() {
    return this.buildLayout('scrollbar#horizontal[mode=horizontal]')
  }),
  
  getScrolled: Macro.defaults(function() {
    return this.getWrapper()
  })
});