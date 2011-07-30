/*
---
 
script: LSD.js
 
description: LSD namespace definition
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Core/Class
  - Core/Events
  - Core/Options
  - Core/Browser
  - Core/Object
  - Ext/Macro
  - Ext/States
  - Ext/Class.mixin
  - Ext/Object.Array
 
provides: 
  - LSD
 
...
*/

var LSD = Object.append(new Events, {
  Events: {},
  Attributes: {
    Numeric: Array.object('tabindex', 'width', 'height'),
    Boolean: Array.object('readonly', 'disabled', 'hidden', 'checked')
  },
  Styles: {},
  States: {
    Known: {
      built:    {enabler: 'build',      disabler: 'destroy',   reflect: false},
      attached: {enabler: 'attach',     disabler: 'detach',    reflect: false},
      hidden:   {enabler: 'hide',       disabler: 'show'},
      disabled: {enabler: 'disable',    disabler: 'enable'},
      active:   {enabler: 'activate',   disabler: 'deactivate'},
      focused:  {enabler: 'focus',      disabler: 'blur'},     
      selected: {enabler: 'select',     disabler: 'unselect'}, 
      checked:  {enabler: 'check',      disabler: 'uncheck',   toggler: 'toggle'},
      collapsed:{enabler: 'collapse',   disabler: 'expand',  toggler: 'toggle'},
      working:  {enabler: 'busy',       disabler: 'idle'},
      chosen:   {enabler: 'choose',     disabler: 'forget'},
      empty:    {enabler: 'empty',      disabler: 'fill',      property: 'unfilled', initial: true},
      invalid:  {enabler: 'invalidate', disabler: 'unvalidate'},
      valid:    {enabler: 'validate',   disabler: 'unvalidate'},
      editing:  {enabler: 'edit',       disabler: 'finish'},
      placeheld:{enabler: 'placehold',  disabler: 'unplacehold'},
      invoked:  {enabler: 'invoke',     disabler: 'revoke'}
    },
    Positive: {
      disabled: 'disabled',
      focused: 'focused'
    },
    Negative: {
      enabled: 'disabled',
      blured: 'focused'
    },
    Attributes: {
      disabled: 'disabled',
      hidden: 'hidden'
    }
  },
  Options: {},
  useNative: true
});

States.get = function(name) { 
  return LSD.States.Known[name];
};