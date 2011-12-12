/*
---
 
script: Animation.js
 
description: Animated ways to show/hide widget
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - Core/Fx.Tween
  - Core/Fx.Transitions
 
provides: 
  - LSD.Mixin.Animation
 
...
*/

LSD.Mixin.Animation = new Class({
  
  options: {
    animation: {}
  },
  
  getAnimation: function() {
    if (!this.animation) {
      this.animation = this.getAnimatedElement().set('tween', this.options.animation).get('tween');
      if (this.options.animation.value) this.animation.set(this.options.animation.value);
    }
    return this.animation;
  },
  
  fade: function(how) {
    var opacity = this.getAnimatedElement().getStyle('opacity');
    return this.getAnimation().start('opacity', how ? [opacity, 1] : [opacity, 0]);
  },
  
  height: function(how) {
    var height = this.getAnimatedElement().offsetHeight;
    return this.getAnimation().start('height', how ? [height, this.getAnimatedElement().scrollHeight] : [height, 0]);
  },
  
  animate: function(how) {
    if (how) this.getAnimatedElement().setStyle('display', 'block');
    return this[this.attributes.animation](how).chain(function() {
      if (this.attributes.animation == 'height' && how) this.getAnimatedElement().setStyle('height', 'auto');
      if (!how) this.getAnimatedElement().setStyle('display', 'none');
      this[how ? 'show' : 'hide']();
    }.bind(this));
  },
  
  remove: function() {
    return this[this.attributes.animation](false).chain(this.dispose.bind(this));
  },
  
  dispose: function() {
    return this.getAnimatedElement().dispose()
  },
  
  getAnimatedElement: function() {
    return this.element;
  }
  
});

LSD.Behavior.define('[animation]', 'animation');