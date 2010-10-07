/*
---
 
script: Range.js
 
description: Range slider input
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Input
- ART.Widget.Button
- ART.Widget.Paint
- Base/Widget.Trait.Slider
- Base/Widget.Trait.Focus
- Base/Widget.Trait.Accessibility

provides: [ART.Widget.Input.Range]
 
...
*/

ART.Widget.Input.Range = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Slider,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.Accessibility
  ],
  
  name: 'input',
  
  layered: {
    shadow: ['shadow'],
    border: ['stroke'],
    background: ['fill', ['backgroundColor']],
    reflection:  ['fill', ['reflectionColor']]
  },

  shortcuts: {
    next: 'increment',
    previous: 'decrement'
  },

  layout: {
    'input-range-thumb[shape=arrow]#thumb': {}
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    this.addPseudo(this.options.mode);
  },

  onSet: function() {
    this.focus();
  },
  
  increment: function() {
    this.slider.set(this.slider.step + 10)
  },
  
  decrement: function() {
    this.slider.set(this.slider.step - 10)
  }
});

ART.Widget.Input.Range.Thumb = new Class({
  Includes: [
    ART.Widget.Button
  ],
  
  name: 'thumb'
});