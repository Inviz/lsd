/*
---
 
script: Input.js
 
description: Make it easy to use regular native input for the widget
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Trait
  - LSD.Mixin.Focus

provides: 
  - LSD.Trait.Input
  
...
*/

LSD.Trait.Input = new Class({
  options: {
    input: {},
  },
  
  initializers: {
    input: function() {
      return {
        events: {
          self: {
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
            }
          },
          input: {
            focus: 'onFocus',
            blur: 'onBlur'
          },
        }
      }
    }
  },
  
  onFocus: function() {
    this.document.activeElement = this;
    this.focus();
  },
  
  getInput: Macro.getter('input', function() {
    var input = new Element('input', Object.append({'type': 'text'}, this.options.input));
    this.fireEvent('register', ['input', input]);
    return input;
  }),
  
  getValueInput: function() {
    return this.input
  }
});