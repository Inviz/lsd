/*
---

script: Animation.js

description: Animated ways to show/hide widget

license: Public domain (http://unlicense.org).

requires:
  - LSD.Mixin
  - Core/Fx.Tween

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

  fade: function(how){
    return this.getAnimation().start('opacity', how == 'in' ? 1 : 0);
  },

  slide: function(how){
    this.getAnimatedElement().store('style:overflow', this.getAnimatedElement().getStyle('overflow'));
    this.getAnimatedElement().setStyle('overflow', 'hidden');
    return this.getAnimation().start('height', how == 'in' ? this.getAnimatedElement().scrollHeight - this.getAnimatedElement().offsetHeight : 0);
  },

  show: function() {
    var parent = this.parent;
    this.getAnimatedElement().setStyle('display', this.getAnimatedElement().retrieve('style:display') || 'inherit');
    this[this.attributes.animation]('in').chain(function(){
      this.getAnimatedElement().setStyle('overflow', this.getAnimatedElement().retrieve('style:overflow') || 'inherit');
      LSD.Widget.prototype.show.apply(this, arguments);
    }.bind(this));
  },

  hide: function(how) {
    var parent = this;
    this[this.attributes.animation]('out').chain(function(){
      this.getAnimatedElement().setStyle('overflow', this.getAnimatedElement().retrieve('style:overflow') || 'inherit');
      this.getAnimatedElement().store('style:display', this.getAnimatedElement().getStyle('display'));
      this.getAnimatedElement().setStyle('display', 'none');
      LSD.Widget.prototype.hide.apply(this, arguments);
    }.bind(this));
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