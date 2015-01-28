/* global Headroom */

'use strict';
require('headroom.js');
var primaryEl = document.querySelector('.o-header__container--primary');
var headroom;

function enable() {
  headroom = new Headroom(primaryEl, {
    "offset": 205,
    "tolerance": 5,
    "classes": {
      "initial": "o-header--initial",
      "pinned": "o-header--pinned",
      "unpinned": "o-header--unpinned"
    },
    onPin: function() {
      primaryEl.isPinned = true;
    },
      onUnpin: function() {
        primaryEl.isPinned = false;
      }
  });
  primaryEl.isPinned = true;
  headroom.init();
}

function pinHeader () {
  primaryEl.classList.remove('o-header--unpinned');
  primaryEl.classList.add('o-header--pinned');
};

function unpinHeader () {
  primaryEl.classList.add('o-header--unpinned');
  primaryEl.classList.remove('o-header--pinned'); 
};

function disable() {
  if (headroom) {
    headroom.destroy();
    headroom = undefined;
  }
}

module.exports = {
  enable: enable,
  disable: disable,
  pinHeader: pinHeader,
  unpinHeader: unpinHeader
};
