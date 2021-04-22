const pokerScore = require("./pokerScore");

function riffleShuffle(deck) {
    const cutDeckVariant = deck.length / 2 + Math.floor(Math.random() * 9) - 4;
    const leftHalf = deck.splice(0, cutDeckVariant);
    let leftCount = leftHalf.length;
    let rightCount = deck.length - Math.floor(Math.random() * 4);
    while (leftCount > 0) {
        const takeAmount = Math.floor(Math.random() * 4);
        deck.splice(rightCount, 0, ...leftHalf.splice(leftCount, takeAmount));
        leftCount -= takeAmount;
        rightCount = rightCount - Math.floor(Math.random() * 4) + takeAmount;
    }
    deck.splice(rightCount, 0, ...leftHalf);
}

module.exports = {
    DeckContants: {
        suites: ['♠️', '♥️', '♣️', '♦️'],
        cardValues: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    },

    BurnFactor: [1, 0, 0, 1, 1],

    HandStages: ['Pre Flop', 'Flop', 'Turn', 'River'],

    HandRanks: {
        'RoyalFlush': 1, 'StraightFlush': 2, 'FourOfAKind': 3,
        'FullHouse': 4, 'Flush': 5, 'Straight': 6,
        'ThreeOfAKind': 7, 'TwoPair': 8, 'Pair': 9,
        'HighCard': 10
    },

    newShuffledDeck: function (shuffleTimes) {
        let deck = Array.from(new Array(52), (x, i) => i);
        for (i = 0; i < shuffleTimes; i++)
            riffleShuffle(deck);
        return deck;
    },

    toHumarReadableCard: function (cardIndex) {
        return this.DeckContants.suites[parseInt(cardIndex / 13)] + ' ' + this.DeckContants.cardValues[parseInt(cardIndex % 13)];
    },

    toPlayerIndex: function (index, playerCount) {
        return parseInt(index % playerCount);
    },

    determineWinningHand: function (playersInHand, playerStates) {
        return 'some1sId';
    },

    isPlayerEligibleForNextHand: function (player) {
        return true;
    }
}