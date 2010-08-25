/*
---
 
script: Combo.js
 
description: A selectbox with free-form input field. Or an input with autocompletion, if you please.
 
license: MIT-style license.
 
requires:
- ART.Widget.Select
- ART.Widget.Input
- Base/Widget.Trait.Input

provides: [ART.Widget.Input.Combo]
 
...
*/

ART.Widget.Input.Combo = new Class({
  Includes: [
    ART.Widget.Select,
    Widget.Trait.Input
  ],
  
  name: 'input'
});