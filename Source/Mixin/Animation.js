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
    return this.getAnimation().start('opacity', how == 'in' ? 1 : 0);
  },
  
  height: function(how) {
    return this.getAnimation().start('height', how == 'in' ? (this.getAnimatedElement().scrollHeight - this.getAnimatedElement().offsetHeight) : 0);
  },
  
  animate: function(how) {
    return this[this.attributes.animation](how);
  },
  
  remove: function() {
    return this[this.attributes.animation]('out').chain(this.dispose.bind(this));
  },
  
  dispose: function() {
    return this.getAnimatedElement().dispose()
  },
  
  getAnimatedElement: function() {
    return this.element;
  }
  
});

LSD.Behavior.define('[animation]', 'animation');