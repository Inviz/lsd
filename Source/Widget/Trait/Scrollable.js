/*
---
 
script: Scrollable.js
 
description: For all the scrollbars you always wanted
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Scrollbar

provides: [LSD.Widget.Trait.Scrollable]
 
...
*/

LSD.Widget.Trait.Scrollable = new Class({
  options: {
    events: {
      scrollbar: {
        self: {
          resize: 'showScrollbars'
        }
      }
    }
  },
  
  attach: Macro.onion(function() {
    this.addEvents(this.events.scrollbar);
    this.element.setStyle('overflow', 'hidden');
  }),
  
  detach: Macro.onion(function() {
    this.removeEvents(this.events.scrollbar);
  }),
  
  showScrollbars: function(size) {
    if (!size) size = this.size;
    console.log('showScrollbars', document.id(this.getScrolled()))
    var scrolled = document.id(this.getScrolled());
    scrolled.setStyles(size)
    if (size.width < scrolled.scrollWidth) {
      if (this.getHorizontalScrollbar().parentNode != this) this.horizontal.inject(this);
      this.horizontal.slider.set(this.horizontal.now)
    } else if (this.horizontal) this.horizontal.dispose();
    
    if (size.height < scrolled.scrollHeight) {
      if (this.getVerticalScrollbar().parentNode != this) this.vertical.inject(this);
        this.vertical.slider.set(this.vertical.now)
    } else if (this.vertical) this.vertical.dispose();
  },
  
  //build: Macro.onion(function() {
  //  if (!this.wrapper) this.wrapper = new Element('div', {'class': 'wrapper'}).setStyle('position', 'relative').setStyle('overflow', 'hidden')
  //  this.wrapper.inject(this.element);
  //}),
  
  getVerticalScrollbar: Macro.getter('vertical', function() {
    return this.buildLayout('scrollbar#vertical[mode=vertical]', null, null)
  }),
  
  getHorizontalScrollbar: Macro.getter('horizontal', function() {
    return this.buildLayout('scrollbar#horizontal[mode=horizontal]')
  }),
  
  getScrolled: Macro.defaults(function() {
    return this.getContainer()
  })
});