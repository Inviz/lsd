/*
---

script: Placeholder.js

description: Placeholder for form fileds.

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Mixin


provides:
  - LSD.Mixin.Placeholder

...
*/


LSD.Mixin.Placeholder = new Class({

  options: {
    actions: {
      placeholder: {
        enable: function(){
          this.element.set('autocomplete', 'off');
          this.onPlacehold();
        },
        disable: function(){
          this.onUnplacehold();
        }
      }
    },
    events: {
      enabled: {
        element: {
          'focus': 'onUnplacehold',
          'blur': 'onPlacehold',
          'keypress': 'onUnplacehold'
        }
      }
    },
    states: Array.object('placeheld')
  },

  getPlaceholder: function(){
    return this.attributes.placeholder;
  },

  onUnplacehold: function(){
    if (this.placeheld){
      this.applyValue('');
      this.unplacehold();
      return true;
    };
  },

  onPlacehold: function(){
    var value = this.getRawValue();
    if (!value || value.match(/^\s*$/) || value == this.getPlaceholder()){
      this.applyValue(this.getPlaceholder());
      this.placehold();
      return true;
    };
  }

});

LSD.Behavior.define('[placeholder]', 'placeholder');