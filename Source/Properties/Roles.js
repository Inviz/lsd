LSD.Properties.Roles = LSD.Struct.Stack({
  get: function(name) {
  }
})
LSD.Roles = LSD.Properties.Roles;

LSD.Document.prototype.mix('roles', {
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
      'button.opener[onclick=open]': 'Open date picker'
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
      }
      list: {
        extends: 'menu-list'
      },
      item: {
        extends: 'li'
      },
      message: {
        extends: 'li'
      }
    },
    submit: {
      custom: {
        extends: 'button'
      },
      onclick: 'submit'
    },
    reset: {
      custom: {
        extends: 'button'
      },
      onclick: 'reset'
    },
    range: {
      custom: {
        localName: 'span',
        '::thumb': {
          
        },
        thumb: {
          extends: 'button'
        }
        slider: true
      }
    },
    hidden: {
    }
  },
  
  select: {
    collection: 'options',
    option: {
      extends: 'option'
    },
    menu: {
      extends: 'menu-context'
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
    request: 'href'
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
      extends: 'li'
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
});