'use strict';

var sticky = require('./sticky');
var Delegate = require('dom-delegate');
var bodyDelegate = new Delegate();
var header;
var defaultPanel;
var delegate;
var scrollPosition;

if (typeof window !== 'undefined') {
  document.addEventListener('o.DOMContentLoaded', init);
}

function init() {
  header = document.querySelector('.o-header');
  defaultPanel = header.getAttribute('data-o-header-default-panel');
  delegate = new Delegate(header);
  delegate.on('click', '.o-header-button-js', onHeaderButtonClick);
  delegate.on('click', function(event) {
    event.stopPropagation();
  });
  bodyDelegate.on('click', togglePanel);
  sticky.enable();
}

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

function togglePanel(event) {
  event.preventDefault();
  event.stopPropagation();
  if (defaultPanel) {
    openPanel(defaultPanel);
  } else {
    closePanel();
  }
}
