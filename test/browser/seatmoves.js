'use strict';

module.exports = {
  'visit page': function (browser) {
    browser
      .url(browser.launch_url + 'uk/2015/seatmoves')
      .waitForElementVisible('#slope-graphic .node', 5000)
      .moveToElement('#slope-graphic')
      .saveScreenshot(browser.screenshots.path + 'sankey.png')
      .end();
  }
};
