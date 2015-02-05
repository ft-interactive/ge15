'use strict';

var Delegate = require('dom-delegate');
var bodyDelegate = new Delegate();
var header;
var defaultPanel;
var delegate;

exports.init = function(options) {

  header = document.querySelector('.o-header');

  if (!header) {
    return;
  }

  options = options || {};

  defaultPanel = header.getAttribute('data-o-header-default-panel');
  delegate = new Delegate(header);
  delegate.on('click', '.o-header-button-js', onHeaderButtonClick);
  delegate.on('click', function(event) {
    event.stopPropagation();
  });
  bodyDelegate.on('click', onClickOutside);

  if (options.sticky) {
    require('./sticky').init({el: header});
  }

  var evt = new CustomEvent('oHeader.init', {
    detail: {
      defaultPanel: defaultPanel
    }
  });

  header.dispatchEvent(evt);
};

function openPanel(panel) {
  header.setAttribute('data-o-header-current-panel', panel);
  var isDefaultPanel = defaultPanel && defaultPanel === panel;
  var evt = new CustomEvent('oHeader.openPanel', {
    detail: {
      isDefaultPanel: isDefaultPanel,
      panel: panel
    }
  });
  header.dispatchEvent(evt);
}

function closePanel() {
  header.removeAttribute('data-o-header-current-panel');
  var evt = new CustomEvent('oHeader.closePanel');
  header.dispatchEvent(evt);
}

function onHeaderButtonClick(event) {
  event.preventDefault();
  event.stopPropagation();

  // HACK
  var targetPanel = event.target.getAttribute('data-o-header-target') ||
                    event.target.parentNode.getAttribute('data-o-header-target') ||
                    defaultPanel;

  var currentPanel = header.getAttribute('data-o-header-current-panel');
  if (currentPanel !== targetPanel && targetPanel !== defaultPanel) {
    bodyDelegate.root(document.body);
    openPanel(targetPanel);
  } else {
    bodyDelegate.root();
    if (defaultPanel) {
      openPanel(defaultPanel);
    } else {
      closePanel();
    }
  }
}

function onClickOutside(event) {
  event.preventDefault();
  event.stopPropagation();
  if (defaultPanel) {
    openPanel(defaultPanel);
  } else {
    closePanel();
  }
}
