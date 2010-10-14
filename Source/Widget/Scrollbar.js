/*
---
 
script: Scrollbar.js
 
description: Scrollbars for everything
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Paint
- ART.Widget.Section
- ART.Widget.Button
- Base/Widget.Trait.Slider

provides: [ART.Widget.Scrollbar]
 
...
*/

ART.Widget.Scrollbar = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Slider,
    ART.Widget.Trait.Aware
  ],
  
  name: 'scrollbar',
  
  position: 'absolute',
  
  layout: {
    'scrollbar-track#track': {
      'scrollbar-thumb#thumb': {},
    },
    'scrollbar-button#decrementor': {},
    'scrollbar-button#incrementor': {}
  },
  
  layered: {
    stroke: ['stroke'],
    background: ['fill', ['backgroundColor']],
    reflection:  ['fill', ['reflectionColor']]
  },
  
  options: {
    slider: {
      wheel: true
    }
  },
  
  events: {
    incrementor: {
      click: 'increment'
    },
    decrementor: {
      click: 'decrement'
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    this.setState(this.options.mode);
  },
  
  adaptSize: function(size, old){
    if (!size || $chk(size.height)) size = this.parentNode.size;
    var isVertical = (this.options.mode == 'vertical');
    var other = isVertical ? 'horizontal' : 'vertical';
    var prop = isVertical ? 'height' : 'width';
    var Prop = prop.capitalize();
    var setter = 'set' + Prop;
    var getter = 'getClient' + Prop;
    var value = size[prop];
    if (isNaN(value) || !value) return;
    var invert = this.parentNode[other];
    var scrolled = this.getScrolled();
    $(scrolled).setStyle(prop, size[prop])
    var ratio = size[prop] / $(scrolled)['scroll' + Prop]
    var delta = (!invert || !invert.parentNode ? 0 : invert.getStyle(prop));
    this[setter](size[prop] - delta);
    var offset = 0;
    if (isVertical) {
      offset += this.track.offset.padding.top + this.track.offset.padding.bottom
    } else {
      offset += this.track.offset.padding.left + this.track.offset.padding.right
    }
    var track = size[prop] - this.incrementor[getter]() - this.decrementor[getter]() - delta - ((this.style.current.strokeWidth || 0) * 2) - offset * 2
    this.track[setter](track);
    this.track.thumb[setter](Math.ceil(track * ratio))
    this.refresh(true);
    this.parent.apply(this, arguments);
  },
  
  inject: function(widget) {
    var result = this.parent.apply(this, arguments);
    this.adaptSize(widget.size, { });
    this.actions.slider.enable.call(this);
    return result
  },
  
  onSet: function(value) {
    var prop = (this.options.mode == 'vertical') ? 'height' : 'width';
    var direction = (this.options.mode == 'vertical') ? 'top' : 'left';
    var element = $(this.getScrolled());
    var result = (value / 100) * (element['scroll' + prop.capitalize()] - element['offset' + prop.capitalize()]);
    element['scroll' + direction.capitalize()] = result;
    this.now = value;
  },
  
  getScrolled: Macro.setter('scrolled', function() {
    var parent = this;
    while ((parent = parent.parentNode) && !parent.getScrolled);
    return parent.getScrolled ? parent.getScrolled() : this.parentNode.element;
  }),
  
  getTrack: function() {
    return $(this.track)
  },
  
  getTrackThumb: function() {
    return $(this.track.thumb);
  }
})

ART.Widget.Scrollbar.Track = new Class({
  Extends: ART.Widget.Section,
  
  layered: {
    innerShadow:  ['inner-shadow']
  },
  
  name: 'track',
  
  position: 'absolute'
});

ART.Widget.Scrollbar.Thumb = new Class({
  Extends: ART.Widget.Button,
  
  name: 'thumb'
});

ART.Widget.Scrollbar.Button = new Class({
  Extends: ART.Widget.Button,
  
  position: 'absolute'
});