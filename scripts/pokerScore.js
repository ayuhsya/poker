const loggerFactory = require("./loggerFactory").getLogger();

// https://www.kequc.com/2016/07/31/how-to-score-a-poker-hand-in-javascript#:~:text=As%20long%20as%20there%20is,best%20hand%20of%20five%20cards.

// ranks in order
var _ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function _result(cards, name, value) {
    return {
        cards: cards,
        name: name || 'nothing',
        value: value || 0
    };
}

function _sanitise(allCards) {
    // concatenate
    let cards = [].concat.apply([], allCards);

    // valid rank and suit
    cards = cards.filter((card) => {
        return !!(_ranks.indexOf(card.rank) > -1 && card.suit);
    });

    return cards;
}

function _combinationPascalIdentity(arr, n, r, index, data, i, allCombinations) {
    // Current combination is ready
    // to be printed, print it
    if (index == r) {
        let dataCopy = [...data]
        allCombinations.push(dataCopy);
        return;
    }

    // When no more elements are there
    // to put in data[]
    if (i >= n) {
        return;
    }

    // current is included, put
    // next at next location
    data[index] = arr[i];
    _combinationPascalIdentity(arr, n, r, index + 1, data, i + 1, allCombinations);

    // current is excluded, replace
    // it with next (Note that
    // i+1 is passed, but index is not changed)
    _combinationPascalIdentity(arr, n, r, index, data, i + 1, allCombinations);
}

function _combinations(cards, groups) {
    let allCombinations = [], data = [];
    _combinationPascalIdentity(cards, cards.length, groups, 0, data, 0, allCombinations)
    return allCombinations;
}

function _ranked(cards) {
    // split cards by rank
    let result = [];

    for (let card of cards) {
        let r = _ranks.indexOf(card.rank);
        result[r] = result[r] || [];
        result[r].push(card);
    }

    // condense
    result = result.filter((rank) => !!rank);

    // high to low
    result.reverse();

    // pairs and sets first
    result.sort((a, b) => {
        return a.length > b.length ? -1 : a.length < b.length ? 1 : 0;
    });

    return result;
}

function _isFlush(cards) {
    // all suits match is flush
    let suit = cards[0].suit;

    for (let card of cards) {
        if (card.suit != suit)
            return false;
    }

    return true;
}

function _isStraight(ranked) {
    // must have 5 different ranks
    if (!ranked[4])
        return false;

    // could be wheel if r0 is 'ace' and r4 is '2'
    if (ranked[0][0].rank == 'A' && ranked[1][0].rank == '5' && ranked[4][0].rank == '2') {
        // hand is 'ace' '5' '4' '3' '2'
        ranked.push(ranked.shift());
        // ace is now low
        return true;
    }

    // run of five in row is straight
    let r0 = _ranks.indexOf(ranked[0][0].rank);
    let r4 = _ranks.indexOf(ranked[4][0].rank);
    return (r0 - r4) == 4;
}

function _value(ranked, primary) {
    // primary wins the rest are kickers
    let str = '';

    for (let rank of ranked) {
        // create two digit value
        let r = _ranks.indexOf(rank[0].rank);
        let v = (r < 10 ? '0' : '') + r;
        for (let i = 0; i < rank.length; i++) {
            // append value for each card
            str += v;
        }
    }

    // to integer
    return (primary * 10000000000) + parseInt(str);
}

function _calculate(cards) {
    // determine value of hand

    let ranked = _ranked(cards);
    let isFlush = _isFlush(cards);
    let isStraight = _isStraight(ranked);

    if (isStraight && isFlush && ranked[0][0].rank == 'A')
        return _result(cards, 'royal flush', _value(ranked, 9));

    else if (isStraight && isFlush)
        return _result(cards, 'straight flush', _value(ranked, 8));

    else if (ranked[0].length == 4)
        return _result(cards, 'four of a kind', _value(ranked, 7));

    else if (ranked[0].length == 3 && ranked[1].length == 2)
        return _result(cards, 'full house', _value(ranked, 6));

    else if (isFlush)
        return _result(cards, 'flush', _value(ranked, 5));

    else if (isStraight)
        return _result(cards, 'straight', _value(ranked, 4));

    else if (ranked[0].length == 3)
        return _result(cards, 'three of a kind', _value(ranked, 3));

    else if (ranked[0].length == 2 && ranked[1].length == 2)
        return _result(cards, 'two pair', _value(ranked, 2));

    else if (ranked[0].length == 2)
        return _result(cards, 'one pair', _value(ranked, 1));

    else
        return _result(cards, 'high card', _value(ranked, 0));
}

module.exports = {
    score: function (...allCards) {
        // return the best poker hand from a set or sets of cards
        let cards = _sanitise(allCards);
        loggerFactory.log('debug', 'All cards set [ %s ]', JSON.stringify(cards));

        // start empty
        let best = _result(cards);

        // find best hand
        for (let combination of _combinations(cards, 5)) {
            // calculate value of 5 cards
            let result = _calculate(combination);
            loggerFactory.log('debug', 'Evaluation result [ %s ]', JSON.stringify(result));
            if (result.value > best.value)
                best = result;
        }

        // finish with best result
        return best;
    }
}