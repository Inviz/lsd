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
  behaviour: '[placeholder]',
  
  options: {
    actions: {
      placeholder: {
        enable: function(){
          this.element.set('autocomplete', 'off');
          this.onPlacehold();
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
    states: {
      placeheld: {
        enabler: 'placehold',
        disabler: 'unplacehold'
      }
    }
  },
  
  getPlaceholder: Macro.getter('placeholder', function(){
    return this.attributes.placeholder;
  }),
  
  onUnplacehold: function(){
    if(this.placeheld){
      this.applyValue('');
      this.unplacehold();
      return true;
    };
  },
  
  onPlacehold: function(){
    var value = this.getRawValue();
    if(!value || value.match(/^\s*$/) || value == this.getPlaceholder()){
      this.applyValue(this.getPlaceholder());
      this.placehold();
      return true;
    };
  }
  
});