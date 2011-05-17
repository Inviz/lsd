/*
---
 
script: Uploader.js
 
description: Add your widget have a real form value.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - Widgets/LSD.Widget.Button
  - Uploader/*
  - LSD.Mixin.List
  - Core/JSON
  
provides: 
  - LSD.Mixin.Uploader
 
...
*/

LSD.Mixin.Uploader = new Class({
  options: {
    actions: {
      uploader: {
        enable: function() {
          if (this.attributes.multiple) this.options.uploader.multiple = true;
          this.fireEvent('register', ['uploader', this.getUploader()]);
          var adapter = Uploader.getAdapter();
          this.getUploader().attach(this.getUploaderTarget());
          this.getStoredBlobs().each(this.addFile, this);
        },
        disable: function() {
          this.getUploader().removeEvents(this.events.uploader);
          this.getUploader().detach(this.getUploaderTarget())
          this.fireEvent('unregister', ['uploader', this.getUploader()]);
        }
      }
    },
    events: {
      uploader: {
        fileComplete: 'onFileComplete',
        fileRemove: 'onFileRemove',
        fileProgress: 'onFileProgress'
      }
    },
    layout: Array.fast('::list'),
    has: {
      one: {
        list: {
          selector: 'filelist'
        }
      }
    }
  },
  
  initializers: {
    uploader: function() {
      this.blobs = {};
    }
  },
  
  getUploader: Macro.getter('uploader', function() {
    var options = Object.append({}, this.options.uploader);
    if (!options.fileClass) options.fileClass = this.getUploaderFileClass(Uploader.getAdapter());
    var uploader = new Uploader(options);
    uploader.widget = this;
    return uploader;
  }),
  
  getUploaderTarget: function() {
    return this.element;
  },

  getUploaderFileClass: function(adapter) {
    if (!adapter) adapter = Uploader.getAdapter();
    if (adapter.indexOf) adapter = Uploader[LSD.toClassName(adapter)];
    if (!adapter.File.Widget) adapter.File.Widget = new Class({
      Includes: [adapter.File, LSD.Widget, LSD.Widget.Filelist.File]
    });
    return adapter.File.Widget;
  },
  
  onFileComplete: function(file) {
    var blob = this.processStoredBlob(file.response.text);
    if (blob && !blob.errors) {
      this.onFileSuccess(file, blob);
    } else {
      this.onFileFailure(file, blob || response);
    }
  },
  
  processValue: function(file) {
    return file.id || file.uid;
  },
  
  onFileSuccess: function(file, blob) {
    this.addBlob(file, blob);
  },
  
  onFileRemove: function(file) {
    this.removeBlob(file);
  },
  
  getBlob: function(file) {
    return this.blobs[file.id];
  },
  
  addBlob: function(file, blob) {
    this.setValue(blob);
    this.blobs[file.id] = blob;
  },
  
  removeBlob: function(file) {
    this.setValue(this.blobs[file.id], true);
    delete this.blobs[file.id];    
  },
  
  retrieveStoredBlobs: function() {
    var attrs = this.attributes;
    return attrs.file || attrs.files || attrs.blobs || blob;
  },

  processStoredBlob: function(response) {
    if (response.indexOf) response = JSON.decode(response);
    if (response && Object.getLength(response) == 1) response = response[Object.keys(response)[0]];
    return response;
  },
  
  getStoredBlobs: function() {
    var files = this.retrieveStoredBlobs();
    return files ? Array.from(JSON.decode(files)).map(this.processStoredBlob.bind(this)) : [];
  },
  
  addFile: function(blob) {
    var widget = (new (this.getUploaderFileClass()));
    widget.widget = this;
    widget.setState('complete');
    widget.build();
    widget.setBase(this.getUploader());
    widget.setFile(blob);
    this.addBlob(widget, blob);
  }
});

LSD.Widget.Filelist = new Class({
  Implements: LSD.Mixin.List,
  
  options: {
    tag: 'filelist',
    has: {
      many: {
        items: {
          selector: 'file',
          layout: 'filelist-file'
        }
      }
    }
  }
});

LSD.Widget.Filelist.File = new Class({
  options: {
    tag: 'file',
    layout: {
      '::canceller': 'Cancel',
      '::meter': true
    },
    events: {
      setBase: function() {
        this.build();
      },
      setFile: function() {
        this.write(this.name);
      },
      build: function() {
        this.inject(this.getWidget().list);
      },
      progress: function() {
        this.meter.set(this.progress.percentLoaded)
      },
      start: function() {
        this.setState('started');
      },
      complete: function() {
        this.unsetState('started');
        this.setState('complete');
      },
      stop: function() {
        this.unsetState('started');
      }
    },
    has: {
      one: {
        meter: {
          selector: 'progress'
        },
        canceller: {
          selector: 'button.cancel',
          events: {
            click: 'cancel'
          }
        }
      }
    }
  },
  
  getWidget: function() {
    return (this.widget || this.base.widget);
  },
  
  cancel: function() {
    this.stop();
    this.remove();
    this.dispose();
  }
});

LSD.Widget.Progress = new Class({
  options: {
    tag: 'progress',
    inline: null,
    pseudos: Array.fast(':valued')
  },
  
  getBar: Macro.getter('bar', function() {
    return new Element('span').inject(this.element);
  }),
  
  set: function(value) {
    this.getBar().setStyle('width', Math.round(value) + '%')
  }
});

LSD.Behavior.define(':uploading', LSD.Mixin.Uploader);