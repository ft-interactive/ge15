'use strict';

var sticky = require('./sticky');
var Delegate = require('dom-delegate');
var header = document.querySelector('.o-header');
var defaultPanel = header.getAttribute('data-o-header-default-panel');
var delegate = new Delegate(header);
var bodyDelegate = new Delegate();
var scrollPosition;

function openPanel(panel) {
  header.setAttribute('data-o-header-current-panel', panel);
  if (defaultPanel && defaultPanel === panel) {
    sticky.enable();
  } else {
    sticky.disable();
  }

  if (panel) {
    scrollPosition = window.scrollY;
    window.scrollTo(0, 0);
  }
}

function closePanel() {
  header.removeAttribute('data-o-header-current-panel');
  sticky.enable();
  if (scrollPosition) {
    window.scrollTo(0, scrollPosition);
    scrollPosition = undefined;
  }
}

delegate.on('click', '.o-header-button-js', function(event) {
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
});

delegate.on('click', function(event) {
  event.stopPropagation();
});

bodyDelegate.on('click', function(event) {
  event.preventDefault();
  event.stopPropagation();
  if (defaultPanel) {
    openPanel(defaultPanel);
  } else {
    closePanel();
  }
});

sticky.enable();
