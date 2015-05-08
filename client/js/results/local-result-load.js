'use strict';

var ukParties = require('uk-political-parties');
var d3 = require('d3');

module.exports = function(){

  d3.selectAll('.cartogram-matrix .seat').each(function(p){
    var id = this.dataset.seatId;
    d3.select(this).on('click', function(){
      console.log(id);
      var url = '/uk/2015/api/collection/seats/by/id:' + id;
      fetch(url).then(seat_onsuccess).catch(function(){ console.log('couldn\'t find seat: ', id, url)});
    });
  });

  function seat_onsuccess(response){
    if (response.status !== 200) {
      throw response;
    }

    return response.json().then(function(json) {
      showSeat(json);
    });
  }

  function showSeat(seat) {
    var el = document.getElementById('seat-search-results-js');
    var lastParty = seat.elections.last.winner.party;
    var newParty = seat.elections.ge15.winner.party;
    var description = ( function(pNew, pOld){
      if(!pNew) return 'No result yet';
      if(pNew === pOld) return ukParties.fullName(pNew) + ' hold';
      else return ukParties.fullName(pNew) + ' gain from ' + ukParties.shortName(pOld);
    }(newParty, lastParty) );

    var parties = seat.elections.ge15.results
      .sort(function(a,b){
        return b.votes - a.votes;
      });
    //wrap up others (unless the other is the winner)
    var squashedParties = [];
    var aggregateOther = {
      party: 'other',
      votes:0,
      votes_pc:0
    };
    parties.forEach(function(d,i){
      if(d.party==='other' && !d.winner){
        aggregateOther.votes+=d.votes;
        aggregateOther.votes_pc+=d.votes_pc;
      }else{
        squashedParties.push(d);
      }
    });

    if(aggregateOther.votes_pc>0){
      aggregateOther.votes_pc = Math.round(aggregateOther.votes_pc * 100) /100;
      squashedParties.push(aggregateOther);
    }

    var resultIn = 'noresult';
    if(newParty) resultIn = 'result';

    var html = '<h2 class="article-body__subhead figure__title">'+ seat.name +'</h2>' +
      '<div class="seat-search-results__banner--' + resultIn + ' '+ukParties.className(newParty)+'-block">'+
        description +
      '</div>';

    if(newParty && seat.elections.ge15.source.type === 2){
      html += '<div class="seat-search-results__table">';
      for (var i = 0; i < squashedParties.length; i++) {
        html += '<div class="seat-search-results__row o-grid-row">'+
        '<div data-o-grid-colspan="2">' + ukParties.shortName(squashedParties[i].party) + '</div>'+
        '<div data-o-grid-colspan="7">'+
          '<div class="seat-search-results__bar ' +ukParties.className(squashedParties[i].party)+ '-block" style="width:'+squashedParties[i].votes_pc+'%"></div>' +
        '</div>'+
        '<div data-o-grid-colspan="3">' + squashedParties[i].votes_pc + '%</div>'+
        '</div>';
      }
    }else{
      html += '<div class="seat-search-results__waiting o-grid-row" data-o-grid-colspan="12">Awating full result.</div>';
    }

    //add extra info
    html += '<div class="figure__footer"><ul class="seat-search-results__detail-container">';
    if(seat.elections.ge15.winner !== undefined) html += '<li class="seat-search-results__detail seat-search-results__elected"><b>Winner:</b> <span>' + seat.elections.ge15.winner.person + ' &ndash; ' + ukParties.fullName(seat.elections.ge15.winner.party) + '</span></li>';
    if(seat.elections.ge15.turnout_pc) html += '<li class="seat-search-results__detail"><b>Turnout:</b> ' +seat.elections.ge15.turnout_pc + '% ('+change(seat.elections.ge15.turnout_pc_change)+')</li>';
    if(seat.elections.ge15.winner.majority) html += '<li class="seat-search-results__detail"><b>Majority:</b> ' +seat.elections.ge15.winner.majority_pc + '%</li>';
    html+='</ul></div>';

    html += '</div><div id="neighbouring-results-js"></div></div>';
    el.innerHTML = html;

    ///add neighbouring results
    console.dir(seat.id);
    var neighboursURL = "/uk/2015/api/lookup/neighbours/" + seat.id;
    fetch(neighboursURL).then(neighbours_onsuccess).catch(function(){ return; });
    // /api/lookup/neighbours/E14000752
  }

  function showNeighbours(data){
    var el = d3.select('#neighbouring-results-js');
    el.append('h4').attr('class','article-body__subhead figure__title').html('Nearby constituencies');

    var row = el
      .selectAll('div.neighbouring-results__row').data(data)
      .enter()
      .append('div')
        .attr({
          'class':'o-grid-row neighbouring-results__row'
        });


    row.append('div').attr({
        'data-o-grid-colspan':'1'
      })
      .call(function(parent){
          parent.append('div')
            .attr({
              'class':function(d){
                return 'neighbouring-results__old-party ' + ukParties.className(d.elections.last.winner.party) + '-block';
              }
            }).html('&nbsp;');

          parent.append('div')
            .attr({
              'class':function(d){
                return 'neighbouring-results__new-party ' + ukParties.className(d.elections.ge15.winner.party) + '-block';
              }
            }).html('&nbsp;');
          return parent;
        });

    row.append('div')
      .attr({
        'class':'neighbouring-result'
      }).html(function(d){
        return d.name;
      }).on('click', function(d){
        showSeat(d);
      });

  }

  function neighbours_onsuccess(response) {
    if (response.status !== 200) {
      throw response;
    }

    return response.json().then(function(json) {
      showNeighbours(json);
    });
  }

  function showError(err) {
    var message;
    if (err === 'location') {
      message = 'Couldn\'t get your location.';
    } else if (err === 'postcode') {
      message = 'There was a problem searching for a postcode.';
    } else if (!err) {
      message = 'Couldn\'t find the seat';
    } else {
      message = err;
    }

    var el = document.getElementById('seat-search-results-js');
    el.innerHTML = message;
  }

  function clear() {
    document.getElementById('seat-search-results-js').innerHTML = '';
  }

  function lookup_onsuccess(response) {
    if (response.status !== 200) {
      throw response;
    }

    return response.json().then(function(json) {
      showSeat(json.seat);
    });
  }

  function get_lookup_error_handler(type) {
    return function (response) {

      // TODO: give different message to this if user is offline
      // TODO: handle when reach some kind of backend API rate limit

      if (response instanceof Error || response.status === 500) {
        console.error(response);
        showError(type);
        return;
      }

      return response.json().then(function(json) {
        showError(json.error);
      }).catch(function(){
        showError(type);
      });
    };
  }

  var container = document.querySelector('.postcode-lookup');
  function startSpinning() {
    container.classList.add('loading');
  }
  function stopSpinning() {
    container.classList.remove('loading');
  }

  var locbtn = document.getElementById('use-mylocation-js');

  if ('geolocation' in navigator) {
    locbtn.addEventListener('click', function(event) {
      startSpinning();

      function failed(err) {
        stopSpinning();
        return get_lookup_error_handler('location')(err);
      }

      function geoloc_onsuccess(position) {
        document.getElementById('seat-search-js').elements.postcode.value = '';
        var points = [position.coords.longitude, position.coords.latitude].join(',');
        var url = '/uk/2015/api/lookup/point/' + points;
        fetch(url).then(lookup_onsuccess).then(stopSpinning).catch(failed);
      }

      navigator.geolocation.getCurrentPosition(geoloc_onsuccess, failed);
    });
  } else {
    locbtn.style.display = 'none';
  }


  document.getElementById('seat-search-js').addEventListener('submit', function(event) {
    event.preventDefault();
    startSpinning();

    function failed(err) {
      stopSpinning();
      return get_lookup_error_handler('postcode')(err);
    }

    var input = event.target.elements.postcode;
    var postcode = input.value.trim();

    if (!postcode) {
      input.value = '';
      clear();
      return;
    }

    //var offlineErrorMessage = 'Cannot connect to the internet to find postcode.';
    var url = '/uk/2015/api/lookup/postcode/' + postcode;

    fetch(url).then(lookup_onsuccess).then(stopSpinning).catch(failed);
  });
};

function change(n){
  if(n>0) return '+'+n;
  return n;
}
