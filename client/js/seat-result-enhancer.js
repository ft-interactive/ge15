/**
 * The 'enhancer' for the local result widget.
 *
 * To use: put the "seat result" component HTML on the page, select the
 * `.seat-result.figure` element, and pass it into this function.
 */

'use strict';

var hostname = require('./hostname');
// var template = require('./seat-result-card.hbs');
// var ukParties = require('uk-political-parties');


module.exports = function (figureElement) {
  var card = figureElement.querySelector('.seat-result__card');
  var form = figureElement.querySelector('.seat-result__postcode-form');
  var input = form.querySelector('input');

  form.onsubmit = function () {
    var url = (
      'http://' + hostname +
      '/uk/2015/api/lookup/postcode/' +
      encodeURIComponent(input.value.trim())
    );

    fetch(url)
      .then(function (response) {
        return response.text();
      })
      .then(function (result) {
        result = JSON.parse(result);

        console.log('API result', result);

        if (result.error) throw result;

        // do a second hop to find the seat
        var secondURL = (
          'http://' + hostname +
          '/uk/2015/live-figures/seat-result-fragment/' +
          encodeURIComponent(result.seat.id)
        );

        console.log('requesting', secondURL);

        return fetch(secondURL).then(function (response) {
          return response.text();
        }).then(function (fragment) {
          card.innerHTML = fragment;
        });
      })
      .catch(function (err) {
        if (err.error) {
          card.innerHTML = '<p class="error">' + err.error + '</p>';
        }
        else {
          card.innerHTML = '<p class="error">Service unavailable.</p>';
        }
      });

    return false;
  };
};
