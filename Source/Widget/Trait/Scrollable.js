ART.Widget.Trait.Scrollable = new Class({
  build: Macro.onion(function() {
    if (!this.wrapper) this.wrapper = new Element('div', {'class': 'wrapper'}).setStyle('position', 'relative').setStyle('overflow', 'hidden')
    this.wrapper.inject(this.element);
    
    
    if (this.options.scrollable) this.addEvent('resize', function(size) {
      var scrolled = this.getScrolled ? $(this.getScrolled()) : this.element.getFirst();
      //console.error((this.options.scrollable), scrolled, size.width, scrolled.scrollWidth, this.getScrolled)
      //if (size.width < scrolled.scrollWidth) this.getHorizontalScrollbar().show();
      //else if (this.horizontal) this.horizontal.hide();
      //
      //if (size.height < scrolled.scrollHeight) this.getVerticalScrollbar().show();
      //else if (this.vertical) this.vertical.hide();
    }.bind(this))
  }),
  
  getVerticalScrollbar: Macro.setter('vertical', function() {
    this.applyLayout({
	    'scrollbar#vertical[mode=vertical]': {}
	  });
  }),
  
  getHorizontalScrollbar: Macro.setter('horizontal', function() {
    this.applyLayout({
	    'scrollbar#horizontal[mode=horizontal]': {}
	  });
  })
});