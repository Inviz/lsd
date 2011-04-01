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
  - LSD.Mixin.Focus
  - LSD.Mixin.Focus.State
  - LSD.Mixin.Focus.Propagation
 
...
*/
  
LSD.Mixin.Focus = new Class({
  behaviour: '[tabindex][tabindex!=-1]',
  
  options: {
    actions: {
      focus: {
        target: false,
        enable: function(target) {
          if (target.tabindex != null) {
            target.attributes.tabindex = target.tabindex
            if (target.focuser) target.element.set('tabindex', target.tabindex)
            delete target.tabindex;
          }
          if (target.attributes.tabindex == -1) return;
          target.getFocuser();
          target.addEvents(target.events.focus);
          target.element.addEvents(target.bindEvents({mousedown: 'retain'}));
        },
        
        disable: function(target) {
          target.blur();
          if (target.options.tabindex == -1) return;
          target.tabindex = target.options.tabindex || 0;
          target.element.set('tabindex', -1)
          target.attributes.tabindex = -1;
          target.removeEvents(target.events.focus);
          target.element.removeEvents(target.bindEvents({mousedown: 'retain'}));
        }
      }
    }
  },
  
  getFocuser: Macro.getter('focuser', function() {
    return new QFocuser(this.toElement(), {
      onWidgetFocus: this.onFocus.bind(this),
      onWidgetBlur: this.onBlur.bind(this),
      tabIndex: this.getAttribute('tabindex')
    })
  }),
  
  focus: function(element) {
    if (element !== false) {
      this.getFocuser().focus(element || this.element);
      this.document.activeElement = this;
    }
    if (this.focused) return;
    this.focused = true;
    this.fireEvent('focus', arguments);
    this.onStateChange('focused', true);
    LSD.Mixin.Focus.Propagation.focus(this);
  },
  
  blur: function(propagated) {
    if (!this.focused) return;
    this.focused = false;
    this.fireEvent('blur', arguments);
    this.onStateChange('focused', false);
    if (!propagated) LSD.Mixin.Focus.Propagation.blur.delay(10, this, this);
  },
  
  retain: function(e) {
    if (e) e.stop();
    this.focus();
  },
  
  onFocus: Macro.defaults(function() {
    this.focus(false);
    this.document.activeElement = this;
  }),
  
  onBlur: Macro.defaults(function() {
    var active = this.document.activeElement;
    if (active == this) delete this.document.activeElement;
    while (active && (active = active.parentNode)) if (active == this) return;
    this.blur();
  }),
  
  getKeyListener: function() {
    return this.getFocuser().getKeyListener()
  }
});

LSD.Mixin.Focus.Propagation = {
  focus: function(parent) {
    while (parent = parent.parentNode) if (parent.getFocuser) parent.focus(false);
  },
  
  blur: function(parent) {
    var active = parent.document.activeElement;
    var hierarchy = [];
    if (active) {
      var widget = active;
      while (widget.parentNode) hierarchy.unshift(widget = widget.parentNode);
    }
    while (parent = parent.parentNode) {
      if (active && hierarchy.contains(parent)) break;
      if (parent.options && (parent.options.tabindex != null) && parent.blur) parent.blur(true);
    }
  }
};