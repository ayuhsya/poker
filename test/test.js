var assert = require('assert');
const dealer = require('../scripts/pokerDealer');

describe('poker.js Tests', function () {
  describe('Hands', function () {
    it('should shuffle and distribute', function () {
      var cfg = {
        players: [{
          id: 'player1',
          name: "player1",
          chips: 1000
        }, {
          id: 'player2',
          name: 'player2',
          chips: 2000
        }]
      }
      var hand = dealer.dealHand(cfg);
      dealer.showHandState(hand);
    });
  });
});