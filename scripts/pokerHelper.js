const PokerScore = require("./pokerScore");

var DeckContants = {
    suites: ['♠️', '♥️', '♣️', '♦️'],
    cardValues: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
}

function getCardSuit(cardIndex) {
    return DeckContants.suites[parseInt(cardIndex / 13)];
}

function getCardRank(cardIndex) {
    return DeckContants.cardValues[parseInt(cardIndex % 13)];
}

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

function createCardSetForPlayer(playerId, playerStates, communityCards) {
    let playerHand = playerStates[playerId].hand;
    let rawCardSet = [].concat.apply(playerHand, communityCards) // cards are numbers
    let cardSetWithProps = []
    for (let card of rawCardSet) {
        cardSetWithProps.push({
            rank: getCardRank(card),
            suit: getCardSuit(card)
        })
    }
    return cardSetWithProps;
}

module.exports = {
    BurnFactor: [1, 0, 0, 1, 1],

    HandStages: ['Pre Flop', 'Flop', 'Turn', 'River'],

    newShuffledDeck: function (shuffleTimes) {
        let deck = Array.from(new Array(52), (x, i) => i);
        for (i = 0; i < shuffleTimes; i++)
            riffleShuffle(deck);
        return deck;
    },

    toHumarReadableCard: function (cardIndex) {
        return getCardSuit(cardIndex) + ' ' + getCardRank(cardIndex);
    },

    toPlayerIndex: function (index, playerCount) {
        return parseInt(index % playerCount);
    },

    scorePlayerHands: function (playersInHand, playerStates, communityCards) {
        var scores = {}
        if (playersInHand.length < 2) {
            scores[playersInHand[0]] = {
                value: 1000
            }
        } else {
            for (player of playersInHand) {
                let cardSet = createCardSetForPlayer(player, playerStates, communityCards);
                scores[player] = PokerScore.score(cardSet);
            }
        }

        return scores;
    },

    isPlayerEligibleForNextHand: function (player) {
        return true;
    }
}