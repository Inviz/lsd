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
    actions: {
      focusable: {
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
  
  getFocuser: function() {
    if (!this.focuser) this.focuser = new QFocuser(this.toElement(), {
      onWidgetFocus: this.onFocus.bind(this),
      onWidgetBlur: this.onBlur.bind(this),
      tabIndex: this.getAttribute('tabindex')
    });
    return this.focuser;
  },
  
  focus: function(element) {
    if (element !== false) {
      this.getFocuser().focus(element || this.element);
      this.document.activeElement = this;
    }
    if (this.focused) return;
    this.focused = true;
    this.fireEvent('focus', arguments);
    this.onStateChange('focused', true);
    LSD.Mixin.Focusable.Propagation.focus(this);
  },
  
  blur: function(propagated) {
    if (!this.focused) return;
    this.focused = false;
    this.fireEvent('blur', arguments);
    this.onStateChange('focused', false);
    if (!propagated) LSD.Mixin.Focusable.Propagation.blur.delay(10, this, this);
  },
  
  retain: function(e) {
    if (e) e.preventDefault();
    this.focus();
  },
  
  onFocus: function() {
    this.focus(false);
    this.document.activeElement = this;
  },
  
  onBlur: function() {
    var active = this.document.activeElement;
    if (active == this) delete this.document.activeElement;
    while (active && (active = active.parentNode)) if (active == this) return;
    this.blur();
  },
  
  getKeyListener: function() {
    return this.getFocuser().getKeyListener()
  }
});

LSD.Mixin.Focusable.Propagation = {
  focus: function(parent) {
    while (parent = parent.parentNode) if (parent.getFocuser) parent.focus(false);
  },
  
  blur: function(parent) {
    var active = parent.document.activeElement;
    var hierarchy = [];
    if (active) {
      for (var widget = active; widget.parentNode && hierarchy.push(widget); widget = widget.parentNode);
    }
    while (parent = parent.parentNode) {
      if (active && hierarchy.contains(parent)) break;
      if (parent.options && (parent.attributes.tabindex != null) && parent.blur) parent.blur(true);
    }
  }
};

LSD.Behavior.define('[tabindex][tabindex!=-1], :focusable', LSD.Mixin.Focusable);