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
  
  Stateful: {
    'placeholdered': ['placehold', 'unplacehold']
  },
  
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
    }
  },
  
  getPlaceholder: Macro.getter('placeholder', function(){
    return  this.attributes.placeholder;
  }),
  
  onUnplacehold: function(){
    if(this.placeholdered){
      this.applyValue('');
      this.unplacehold();
      return true;
    };
  },
  
  onPlacehold: function(){
    var value = this.getRawValue();
    if(value.match(/^\s*$/) || value == this.getPlaceholder()){
      this.applyValue(this.getPlaceholder());
      this.placehold();
      return true;
    };
  }
  
});