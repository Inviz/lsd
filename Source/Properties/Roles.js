/*
---
 
script: Roles.js
 
description: A library of widget presets
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Document
  - LSD.Properties

provides: 
  - LSD.Roles
 
...
*/

/*
  Roles object allows finding specific roles by a composite
  string key where key bits are separated with dashes.
*/
LSD.Properties.Roles = LSD.Roles = LSD.Struct.Stack({
  get: function(key) {
    for (var i, previous = 0, role = this, obj; i !== -1;) {
      i = key.indexOf('-', i != null ? i + 1 : i);
      bit = key.substring(previous, i > -1 ? i : undefined);
      obj = role[bit];
      if (i == null || obj == null || typeof obj !== 'object') break;
      else role = obj;
      previous = i + 1;
    }
    if (role === this) role = null;
    this[key] = role;
    return role;
  }
})
LSD.Document.prototype.set('roles', new LSD.Roles({
  input: {
    localName: 'input',
    checkbox: {
      checked: false
    },
    radio: {
      radiogroup: true
    },
    text: {
    },
    number: {
      value: Number
    },
    email: {
      
    },
    tel: {
      
    },
    search: {

    },
    date: {
      'button.opener[onclick=open]': 'Open date picker',
      'if &[open]': {
        '::dialog': {
          'button[onclick=increment]': 'Previous month',
          'button[onclick=decrement]': 'Next month',
          'table[type=calendar]': true
        }
      },
      open: false,
      date: 'today'
    },
    datetime: {
      local: {
        timezone: 'local'
      }
    },
    file: {
      files: true,
      'if files': {
        '::list': {
          collection: 'files'
        },
      }, 
      'else': {
        '::message': {
          'if &[multiple]': "Select files to upload",
          'else': "Select file to upload"
        }
      },
      list: {
        base: 'menu-list'
      },
      item: {
        role: 'li'
      },
      message: {
        role: 'li'
      }
    },
    submit: {
      custom: {
        role: 'button'
      },
      onclick: 'submit'
    },
    reset: {
      custom: {
        role: 'button'
      },
      onclick: 'reset'
    },
    range: {
      custom: {
        localName: 'span',
        '::thumb': {
          
        },
        thumb: {
          archrole: 'button'
        },
        slider: true
      }
    },
    hidden: {
    }
  },
  
  select: {
    collection: 'options',
    option: {
      role: 'option'
    },
    menu: {
      role: 'menu-context'
    }
  },
  
  textarea: {
  },
  
  progress: {
    
  },
  
  button: {
    submit: {
      onclick: 'submit'
    }
  },
  
  form: {
    request: 'action',
    elements: true
  },
  
  fieldset: {
    request: 'action',
    elements: true
  },
  
  a: {
    request: 'href',
    nodeValueAttribute: 'href'
  },
  
  link: {
    request: 'href'
  },
  
  label: {
    onclick: 'focus find(this.attributes.for)'
  },
  
  menu: {
    
    list: {
      
    },
    context: {
      
    },
    toolbar: {
      
    },
    item: {
      role: 'li'
    }
  },
  
  body: {
    dialog: {
      elements: true,
      open: false
    }
  },
  
  
  textfield:    'input[type=text]',
  checkbox:     'input[type=checkbox]',
  radio:        'input[type=radio]',
  searchfield:  'input[type=search]',
  slider:       'input[type=range]',
  scrollbar:    'input[type=range][kind=scrollbar]',
  listbox:      'menu[type=list]',
  menulist:     'menu[type=list]',
  contextmenu:  'menu[type=context]',
  toolbar:      'menu[type=toolbar]',
  lightbox:     'body[type=lightbox]',
  dialog:       'body[type=dialog]',
  listitem:     'li',
  message:      'p.message',
  container:    '.container',
  submit:       'input[type=submit]',
  calendar:     'table[type=calendar]',
  clock:        'table[type=clock]',
}));