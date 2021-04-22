var assert = require('assert');
const pokerScore = require('../scripts/pokerScore');

describe('scoring function tests', function () {
  describe('test hand evaluation', function () {
    it('should evaluate to high card', function () {
      let cardSet = [
        { rank: '2', suit: '♥️' },
        { rank: '3', suit: '♣️' },
        { rank: 'J', suit: '♠️' },
        { rank: '7', suit: '♦️' },
        { rank: '9', suit: '♥️' },
        { rank: '10', suit: '♣️' },
        { rank: 'K', suit: '♥️' }
      ]
      let score = pokerScore.score(cardSet);
      assert.strictEqual(score.name, 'high card');
    });

    it('should evaluate to pair', function () {
      let cardSet = [
        { rank: '2', suit: '♥️' },
        { rank: 'K', suit: '♣️' },
        { rank: 'J', suit: '♠️' },
        { rank: '7', suit: '♦️' },
        { rank: '9', suit: '♥️' },
        { rank: '10', suit: '♣️' },
        { rank: 'K', suit: '♥️' }
      ]
      let score = pokerScore.score(cardSet);
      assert.strictEqual(score.name, 'one pair');
    });

    it('should evaluate to two pair', function () {
      let cardSet = [
        { rank: '2', suit: '♥️' },
        { rank: 'K', suit: '♣️' },
        { rank: '9', suit: '♠️' },
        { rank: '7', suit: '♦️' },
        { rank: '9', suit: '♥️' },
        { rank: '10', suit: '♣️' },
        { rank: 'K', suit: '♥️' }
      ]
      let score = pokerScore.score(cardSet);
      assert.strictEqual(score.name, 'two pair');
    });

    it('should evaluate to three of a kind', function () {
      let cardSet = [
        { rank: '2', suit: '♥️' },
        { rank: 'K', suit: '♣️' },
        { rank: '9', suit: '♠️' },
        { rank: '7', suit: '♦️' },
        { rank: '9', suit: '♥️' },
        { rank: '10', suit: '♣️' },
        { rank: '9', suit: '♣️' }
      ]
      let score = pokerScore.score(cardSet);
      assert.strictEqual(score.name, 'three of a kind');
    });

    it('should evaluate to straight', function () {
      let cardSet = [
        { rank: 'J', suit: '♥️' },
        { rank: 'K', suit: '♣️' },
        { rank: '9', suit: '♠️' },
        { rank: '7', suit: '♦️' },
        { rank: '9', suit: '♥️' },
        { rank: '10', suit: '♣️' },
        { rank: '8', suit: '♣️' }
      ]
      let score = pokerScore.score(cardSet);
      assert.strictEqual(score.name, 'straight');
    });

    it('should evaluate to flush', function () {
      let cardSet = [
        { rank: '2', suit: '♣️' },
        { rank: 'K', suit: '♣️' },
        { rank: '9', suit: '♠️' },
        { rank: '4', suit: '♣️' },
        { rank: '9', suit: '♥️' },
        { rank: '10', suit: '♣️' },
        { rank: '8', suit: '♣️' }
      ]
      let score = pokerScore.score(cardSet);
      assert.strictEqual(score.name, 'flush');
    });

    it('should evaluate to full house', function () {
      let cardSet = [
        { rank: '2', suit: '♣️' },
        { rank: 'K', suit: '♣️' },
        { rank: 'K', suit: '♠️' },
        { rank: '4', suit: '♣️' },
        { rank: '9', suit: '♥️' },
        { rank: '9', suit: '♣️' },
        { rank: 'K', suit: '♦️' }
      ]
      let score = pokerScore.score(cardSet);
      assert.strictEqual(score.name, 'full house');
    });

    it('should evaluate to four of a kind', function () {
      let cardSet = [
        { rank: '2', suit: '♣️' },
        { rank: 'K', suit: '♣️' },
        { rank: 'K', suit: '♠️' },
        { rank: '4', suit: '♣️' },
        { rank: 'K', suit: '♥️' },
        { rank: '9', suit: '♣️' },
        { rank: 'K', suit: '♦️' }
      ]
      let score = pokerScore.score(cardSet);
      assert.strictEqual(score.name, 'four of a kind');
    });

    it('should evaluate to straight flush', function () {
      let cardSet = [
        { rank: '2', suit: '♣️' },
        { rank: '3', suit: '♣️' },
        { rank: '9', suit: '♠️' },
        { rank: '4', suit: '♣️' },
        { rank: '9', suit: '♥️' },
        { rank: '6', suit: '♣️' },
        { rank: '5', suit: '♣️' }
      ]
      let score = pokerScore.score(cardSet);
      assert.strictEqual(score.name, 'straight flush');
    });

    it('should evaluate to royal flush', function () {
      let cardSet = [
        { rank: 'J', suit: '♣️' },
        { rank: 'Q', suit: '♣️' },
        { rank: '9', suit: '♠️' },
        { rank: 'K', suit: '♣️' },
        { rank: '9', suit: '♥️' },
        { rank: 'A', suit: '♣️' },
        { rank: '10', suit: '♣️' }
      ]
      let score = pokerScore.score(cardSet);
      assert.strictEqual(score.name, 'royal flush');
    });
  });

  describe('test hand scoring', function () {
    it('should compare high cards', function () {
      let cardSet1 = [
        { rank: '2', suit: '♥️' },
        { rank: '3', suit: '♣️' },
        { rank: 'J', suit: '♠️' },
        { rank: '7', suit: '♦️' },
        { rank: '9', suit: '♥️' },
        { rank: '10', suit: '♣️' },
        { rank: 'K', suit: '♥️' }
      ],
        cardSet2 = [
          { rank: '2', suit: '♥️' },
          { rank: '3', suit: '♣️' },
          { rank: 'J', suit: '♠️' },
          { rank: '7', suit: '♦️' },
          { rank: '9', suit: '♥️' },
          { rank: '10', suit: '♣️' },
          { rank: 'A', suit: '♥️' }
        ]
      let score1 = pokerScore.score(cardSet1),
        score2 = pokerScore.score(cardSet2);
      assert.strictEqual(true, score1.name === score2.name);
      assert.strictEqual(true, score1.value < score2.value);
    });

    it('should compare pairs', function () {
      let cardSet1 = [
        { rank: '2', suit: '♥️' },
        { rank: '3', suit: '♣️' },
        { rank: 'J', suit: '♠️' },
        { rank: '2', suit: '♦️' },
        { rank: '9', suit: '♥️' },
        { rank: '10', suit: '♣️' },
        { rank: 'K', suit: '♥️' }
      ],
        cardSet2 = [
          { rank: '2', suit: '♥️' },
          { rank: 'A', suit: '♣️' },
          { rank: 'J', suit: '♠️' },
          { rank: '7', suit: '♦️' },
          { rank: '9', suit: '♥️' },
          { rank: '10', suit: '♣️' },
          { rank: 'A', suit: '♥️' }
        ]
      let score1 = pokerScore.score(cardSet1),
        score2 = pokerScore.score(cardSet2);
      assert.strictEqual(true, score1.name === score2.name);
      assert.strictEqual(true, score1.value < score2.value);
    });

    it('should compare ace high straight with ace low straight', function () {
      let cardSet1 = [
        { rank: '2', suit: '♥️' },
        { rank: '3', suit: '♣️' },
        { rank: '4', suit: '♠️' },
        { rank: '5', suit: '♦️' },
        { rank: '9', suit: '♥️' },
        { rank: '10', suit: '♣️' },
        { rank: 'A', suit: '♥️' }
      ],
        cardSet2 = [
          { rank: '2', suit: '♥️' },
          { rank: 'A', suit: '♣️' },
          { rank: 'J', suit: '♠️' },
          { rank: '10', suit: '♦️' },
          { rank: 'Q', suit: '♥️' },
          { rank: 'K', suit: '♣️' },
          { rank: 'J', suit: '♥️' }
        ]
      let score1 = pokerScore.score(cardSet1),
        score2 = pokerScore.score(cardSet2);
      assert.strictEqual(true, score1.name === score2.name);
      assert.strictEqual(true, score1.value < score2.value);
    });
  });
});