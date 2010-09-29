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
    if (size.width < scrolled.scrollWidth) this.getHorizontalScrollbar().show();
    else if (this.horizontal) this.horizontal.hide();
    
    if (size.height < scrolled.scrollHeight) this.getVerticalScrollbar().show();
    else if (this.vertical) this.vertical.hide();
  },
  
  build: Macro.onion(function() {
    if (!this.wrapper) this.wrapper = new Element('div', {'class': 'wrapper'}).setStyle('position', 'relative').setStyle('overflow', 'hidden')
    this.wrapper.inject(this.element);
  }),
  
  getVerticalScrollbar: Macro.setter('vertical', function() {
    this.applyLayout({
      'scrollbar#vertical[mode=vertical]': {}
    });
    return this.vertical;
  }),
  
  getHorizontalScrollbar: Macro.setter('horizontal', function() {
    this.applyLayout({
      'scrollbar#horizontal[mode=horizontal]': {}
    });
    return this.horizontal;
  }),
  
  getScrolled: Macro.defaults(function() {
    return this.getWrapper()
  })
});