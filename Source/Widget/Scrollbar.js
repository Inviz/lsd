/*
---
 
script: Scrollbar.js
 
description: Scrollbars for everything
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Paint
- LSD.Widget.Section
- LSD.Widget.Button
- Base/Widget.Trait.Slider

provides: [LSD.Widget.Scrollbar]
 
...
*/

LSD.Widget.Scrollbar = new Class({
  Includes: [
    LSD.Widget.Paint,
    Widget.Trait.Slider
  ],
  
  options: {
    tag: 'scrollbar',
    layers: {
      stroke: ['stroke'],
      background: [LSD.Layer.Fill.Background],
      reflection:  [LSD.Layer.Fill.Reflection]
    },
    events: {
      incrementor: {
        click: 'increment'
      },
      decrementor: {
        click: 'decrement'
      }
    },
    layout: {
      children: {
        'scrollbar-track#track': {
          'scrollbar-thumb#thumb': {},
        },
        'scrollbar-button#decrementor': {},
        'scrollbar-button#incrementor': {}
      }
    },
    slider: {
      wheel: true
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    this.setState(this.options.mode);
  },
  
  onParentResize: function(size, old){
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
      offset += this.track.offset.inner.top + this.track.offset.inner.bottom
    } else {
      offset += this.track.offset.inner.left + this.track.offset.inner.right
    }
    var track = size[prop] - this.incrementor[getter]() - this.decrementor[getter]() - delta - ((this.style.current.strokeWidth || 0) * 2) - offset * 2
    this.track[setter](track);
    this.track.thumb[setter](Math.ceil(track * ratio))
    this.refresh(true);
    this.parent.apply(this, arguments);
  },
  
  inject: function(widget) {
    var result = this.parent.apply(this, arguments);
    this.options.actions.slider.enable.call(this);
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
  
  getScrolled: Macro.getter('scrolled', function() {
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

LSD.Widget.Scrollbar.Track = new Class({
  Extends: LSD.Widget.Section,
  
  options: {
    tag: 'track',
    layers: {
      innerShadow:  ['inner-shadow']
    }
  }
});

LSD.Widget.Scrollbar.Thumb = new Class({
  Extends: LSD.Widget.Button,
  
  options: {
    tag: 'thumb'
  }
});

LSD.Widget.Scrollbar.Button = new Class({
  Extends: LSD.Widget.Button
});