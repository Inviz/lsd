/*
---
 
script: Toolbar.js
 
description: Menu widget to be used as a drop down
 
license: MIT-style license.
 
requires:
- ART.Widget.Menu
- ART.Widget.Button
- Base/Widget.Trait.Focus
- Base/Widget.Trait.List

provides: [ART.Widget.Menu.Toolbar]
 
...
*/
ART.Widget.Menu.Toolbar = new Class({
  Includes: [
    ART.Widget.Menu,
    Widget.Trait.Focus,
    Widget.Trait.List,
    Widget.Trait.Accessibility
  ],
  
  attributes: {
    type: 'toolbar'
  }
});