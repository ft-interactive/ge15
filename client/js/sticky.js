/* global Headroom */

'use strict';

require('headroom.js');

var el;
var headroom;
var scrollPosition;

function enable() {
  headroom = new Headroom(el, {
    offset: 205,
    tolerance: 5,
    classes: {
      initial: 'o-header--initial',
      pinned: 'o-header--pinned',
      unpinned: 'o-header--unpinned'
    },
    onPin: function() {
      el.isPinned = true;
    },
    onUnpin: function() {
      el.isPinned = false;
    }
  });
  el.isPinned = true;
  headroom.init();
}

function pinHeader () {
  el.classList.remove('o-header--unpinned');
  el.classList.add('o-header--pinned');
}

function unpinHeader () {
  el.classList.add('o-header--unpinned');
  el.classList.remove('o-header--pinned');
}

function disable() {
  if (headroom) {
    headroom.destroy();
    headroom = undefined;
  }
}

function onOpenPanel(event) {
  var d = event.detail;
  if (d.isDefaultPanel) {
    el.classList.remove('o-header--initial');
    enable();
  } else {
    disable();
  }
  // TODO: remove this and uses a class of some sort.
  if (d.panel === 'menu') {
    el.classList.add('o-header--initial');
  }

  if (d.panel) {
    scrollPosition = window.scrollY;
    window.scrollTo(0, 0);
  }
}

function onClosePanel(event) {
  el.classList.remove('o-header--initial');
  enable();
  if (scrollPosition) {
    window.scrollTo(0, scrollPosition);
    scrollPosition = undefined;
  }
}

function init(options) {
  options = options || {};
  el = options.el;
  if (!el) {
    return;
  }
  enable();
  el.addEventListener('oHeader.openPanel', onOpenPanel);
  el.addEventListener('oHeader.closePanel', onClosePanel);
}

module.exports = {
  enable: enable,
  disable: disable,
  pinHeader: pinHeader,
  unpinHeader: unpinHeader,
  init: init
};
