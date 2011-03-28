/*
---
 
script: Touchable.js
 
description: A mousedown event that lasts even when you move your mouse over. 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
  - Mobile/Mouse
  - Mobile/Click
  - Mobile/Touch

 
provides:   
  - LSD.Mixin.Touchable
 
...
*/


LSD.Mixin.Touchable = new Class({
  behaviour: ':touchable',
  
  Stateful: {
    'active': ['activate', 'deactivate']
  },
  
  options: {
    events: {
      enabled: {
        element: {
          'touchstart': 'activate',
          'touchend': 'deactivate',
          'touchcancel': 'deactivate'
        }
      }
    }
  }
});