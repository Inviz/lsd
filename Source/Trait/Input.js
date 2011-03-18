/*
---
 
script: Input.js
 
description: Make it easy to use regular native input for the widget
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin.Focus

provides: 
  - LSD.Trait.Input
  
...
*/

LSD.Trait.Input = new Class({
  options: {
    input: {},
    events: {
      input: {
        element:  {
          mousedown: function(e) {
            e.stopPropagation()
          }
        },
        self: {
          attach: function() {
            this.getInput().addEvents({
              blur: this.onBlur.bind(this),
              focus: this.onFocus.bind(this)
            }).addEvents(this.events.input);
          },
          build: function() {
            this.getInput().inject(this.element);
          },
          focus: function() {
            this.document.activeElement = this;
            if (LSD.Mixin.Focus) LSD.Mixin.Focus.Propagation.focus(this);
          },
          blur: function() {
              if (this.document.activeElement == this) delete this.document.activeElement;
           //   if (LSD.Mixin.Focus) LSD.Mixin.Focus.Propagation.blur.delay(10, this, this);
          },
          resize: 'setInputSize'
        }
      }
    }
  },
  
  stopMousedown: function(e) {
    e.stopPropagation()
  },
  
  onFocus: function() {
    this.document.activeElement = this;
    this.focus();
  },
  
  getInput: Macro.getter('input', function() {
    return new Element('input', $extend({'type': 'text'}, this.options.input));
  }),
  
  setInputSize: function(size) {
    var height = size.height - this.input.getStyle('padding-top').toInt() - this.input.getStyle('padding-bottom').toInt();
    if (this.input.style.height != height + 'px') this.input.setStyle('height', height);
    if (this.input.style.lineHeight != height + 'px') this.input.setStyle('line-height', height);
    var width = this.size.width - this.input.getStyle('padding-left').toInt() - this.input.getStyle('padding-right').toInt();
    if (this.style.current.glyph) {
      var glyph = this.layers.glyph.measure().width + (this.style.current.glyphRight || 0) + (this.style.current.glyphLeft || 0);
      width -= glyph;
      this.input.setStyle('margin-left', glyph);
    }
    if (this.canceller) width -= this.canceller.getLayoutWidth();
    if (this.glyph) width -= this.glyph.getLayoutWidth();
    this.input.setStyle('width', width);
  },
  
  getObservedElement: function() {
    return this.getInput();
  },
  
  empty: function() {
    this.input.set('value', '')
  }
});