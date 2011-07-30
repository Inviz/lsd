/*
---
 
script: Focus.js
 
description: A mixin to make widget take focus like a regular input (even in Safari)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
  - QFocuser/QFocuser
 
provides:
  - LSD.Mixin.Focusable
  - LSD.Mixin.Focusable.Propagation
 
...
*/
  
LSD.Mixin.Focusable = new Class({
  options: {
    pseudos: Array.object('activatable'),
    actions: {
      focusable: {
        target: false,
        enable: function(target) {
          if (target.attributes.tabindex == -1) return;
          if (!this.isNativelyFocusable()) target.getFocuser();
          target.addEvents(LSD.Mixin.Focusable.events);
        },
        
        disable: function(target) {
          if (target.focused) target.blur();
          if (target.focuser) target.focuser.destroy();
          if (target.attributes.tabindex == -1) return;
          target.removeEvents(LSD.Mixin.Focusable.events);
          //target.setAttribute('tabindex', target.tabindex);
        }
      }
    },
    states: Array.object('focused')
  },
  
  getFocuser: function() {
    if (!this.focuser) this.focuser = new QFocuser(this.toElement(), {
      onWidgetFocus: this.onFocus.bind(this),
      onWidgetBlur: this.onBlur.bind(this),
      tabIndex: this.attributes.tabindex
    });
    return this.focuser;
  },
  
  focus: function(element) {
    if (element !== false) {
      if (this.focuser) this.focuser.focus(element.localName ? element : this.element);
      else this.element.focus();
      this.document.activeElement = this;
    }
    LSD.Mixin.Focusable.Propagation.focus(this);
  },
  
  blur: function(propagated) {
    if (!this.focuser) this.element.blur();
    if (!propagated) LSD.Mixin.Focusable.Propagation.blur.delay(10, this, this);
  },
  
  onFocus: function() {
    this.focus(false);
    this.document.activeElement = this;
  },
  
  onBlur: function() {
    this.blurring = true;
    !function() {
      if (this.blurring === false) return;
      delete this.blurring;
      var active = this.document.activeElement;
      if (active == this) delete this.document.activeElement;
      while (active && (active = active.parentNode)) if (active == this) return;
      this.blur();
    }.delay(20, this);
  },
  
  getKeyListener: function() {
    return this.getFocuser().getKeyListener()
  },
  
  isNativelyFocusable: function() {
    return this.getElementTag() == 'input';
  }
});

LSD.Mixin.Focusable.events = {
  mousedown: 'focus'
};

LSD.Mixin.Focusable.Propagation = {
  focus: function(parent) {
    while (parent = parent.parentNode) if (parent.focus) {
      parent.focus(false);
      if (parent.blurring) parent.blurring = false;
    }
  },
  
  blur: function(parent) {
    var active = parent.document.activeElement;
    var hierarchy = [];
    if (active) {
      for (var widget = active; widget.parentNode && hierarchy.push(widget); widget = widget.parentNode);
    }
    while (parent = parent.parentNode) {
      if (active && hierarchy.contains(parent)) break;
      if (parent.blur) parent.blur(true);
    }
  }
};

LSD.Behavior.define('[tabindex][tabindex!=-1], :focusable', LSD.Mixin.Focusable);