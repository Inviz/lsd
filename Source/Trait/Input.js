/*
---
 
script: Input.js
 
description: Make it easy to use regular native input for the widget
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Trait
  - LSD.Mixin.Focusable

provides: 
  - LSD.Trait.Input
  
...
*/

LSD.Trait.Input = new Class({
  options: {
    input: {}
  },
  
  constructors: {
    input: function() {
      return {
        events: {
          self: {
            build: function() {
              this.getInput().inject(this.element);
            },
            focus: function() {
              this.document.activeElement = this;
              if (LSD.Mixin.Focusable) LSD.Mixin.Focusable.Propagation.focus(this);
            },
            blur: function() {
                if (this.document.activeElement == this) delete this.document.activeElement;
             //   if (LSD.Mixin.Focusable) LSD.Mixin.Focusable.Propagation.blur.delay(10, this, this);
            }
          },
          input: {
            focus: 'onFocus',
            blur: 'onBlur'
          }
        }
      }
    }
  },
  
  onFocus: function() {
    this.document.activeElement = this;
    this.focus();
  },
  
  onBlur: function() {
    this.blurring = true;
    !function() {
      if (this.blurring === false) return;
      delete this.blurring;
      var active = this.document.activeElement;
      if (active == this) delete this.document.activeElement;
      while (active && (active = active.parentNode)) if (active == this) return;
      this.blur();
    }.delay(20, this);
  },
  
  getInput: Macro.getter('input', function() {
    var input = new Element('input', Object.append({'type': 'text'}, this.options.input));
    this.properties.set('input', input)
    return input;
  }),
  
  getValueInput: function() {
    return this.input;
  }
});