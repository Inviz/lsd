/*
---
 
script: Checkbox.js
 
description: Two-state command (can be on and off)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD
 
provides: [LSD.Command.Checkbox]
 
...
*/

LSD.Command.Checkbox = new Class({
  States: {
    checked: ['check', 'uncheck'],
    options: {
      events: {
        command: {
          'check': 'check',
          'uncheck': 'uncheck'
        }
      }
    }
  }
})