/**
 * The 'enhancer' for the local result widget. (The liveblog.main.js calls this, passing in the widget element, whenever it has refreshed the widgets.)
 */

'use strict';

var hostname = require('./hostname');
var template = require('./local-result-card.hbs');
var ukParties = require('uk-political-parties');


module.exports = function (widget) {
  var card = widget.querySelector('.local-result__card');
  var form = widget.querySelector('.local-result__postcode-form');
  var input = form.querySelector('input');

  form.onsubmit = function () {
    var url = (
      'http://' +
      hostname +
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

        // reassuringly show the normalised postcode
        input.value = result.postcode;


        // build data and render the result
        var whichElection = 'last'; // for testing
        var templateData = {
          name: result.seat.name,
          winner: ukParties.fullName(result.seat.elections[whichElection].winner.party),
        };

        card.innerHTML = template(templateData);
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
