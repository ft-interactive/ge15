'use strict';

module.exports = {
  'visit page': function (browser) {
    browser
      .url(browser.launch_url + 'uk/2015/seatmoves')
      .waitForElementVisible('#sankey-graphic .node', 3000)
      .moveToElement('#sankey-graphic', 0, 0)
      .saveScreenshot(browser.screenshotsPath + '/sankey.png')
      .end();
  }
};
