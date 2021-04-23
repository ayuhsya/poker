const e = require('express');
const PokerHelper = require('./pokerHelper');
const logger = require('./loggerFactory').getLogger();

function PokerHand(handCfg, eventHandler) {
    this.playerStates = handCfg.playerInitialStates;
    this.communityCards = handCfg.communityCards;
    this.potConfig = handCfg.potConfig;
    this.firstToAct = handCfg.actionOn;
    this.actionOn = undefined;
    this.totalPlayersInHand = handCfg.totalPlayersInHand;
    this.playerActionsRegistered = undefined;
    this.stage = -1;
    this.eventHandler = eventHandler;
}

PokerHand.prototype.resetAndStartNextRound = function () {
    ++this.stage;
    this.actionOn = (this.stage === 0) ? PokerHelper.toPlayerIndex(this.firstToAct + 1, this.totalPlayersInHand.length) : this.firstToAct - 1;
    this.playerActionsRegistered = (this.stage === 0) ? 2 : 0; // sb + bb = 2 actions
    this.eventHandler.emit(PokerHelper.HandStages[this.stage], this.stage);
    this.determineNextState();
}

PokerHand.prototype.notifyForNextAction = function () {
    this.actionOn = PokerHelper.toPlayerIndex(this.actionOn + 1, this.totalPlayersInHand.length);
    if (!this.playerStates[this.totalPlayersInHand[this.actionOn]].eligibleForNextRound || this.playerStates[this.totalPlayersInHand[this.actionOn]].hasQuitHand) {
        this.act({
            playerId: this.totalPlayersInHand[this.actionOn],
            action: 'CHECK'
        });
    } else {
        this.eventHandler.emit('ACTION_ON', this.actionOn)
    }
}

PokerHand.prototype.logActionHistory = function (actionCfg) {

}

PokerHand.prototype.validateAction = function (actionCfg) {
    var actingPlayerId = actionCfg.playerId;
    var action = actionCfg.action;
    var value = parseFloat(actionCfg.value);

    // Safety check
    if (this.totalPlayersInHand[this.actionOn] != actingPlayerId) {
        this.eventHandler.emit('INVALID_ACTION', `[ ${actingPlayerId} ] cannot act yet.`)
        return false;
    }

    switch (action) {
        case 'BET':
            if (this.playerStates[actingPlayerId].chipsInPot + value > this.playerStates[actingPlayerId].chips) {
                this.eventHandler.emit('INVALID_ACTION', `[ ${actingPlayerId} ] does not have enough chips to perform this [ ${action} ] [ ${value} ].`)
                return false;
            }
            break;
        default:
            break;
    }
    return true;
}

PokerHand.prototype.reconfigurePot = function (actingPlayerId, value) {
    this.potConfig.totalPotValue += value;
    if (this.playerStates[actingPlayerId].chipsInPot >= this.playerStates[actingPlayerId].chips) { // Should never be >
        // all in
        let currentActivePlayersInRound = 0;
        for (key in this.playerStates) {
            // checking eligible for next round in case player has already went all in in previous rounds (multiple side pots case)
            if (this.playerStates.hasOwnProperty(key) && !this.playerStates[key].hasQuitHand && this.playerStates[key].eligibleForNextRound) {
                currentActivePlayersInRound++;
            }
        }
        this.playerStates[actingPlayerId].eligibleForNextRound = false;
        this.potConfig.potShares[actingPlayerId] = {
            share: this.playerStates[actingPlayerId].chips,
            totalPlayersInThisShare: currentActivePlayersInRound
        }
        // todo notify all in event
    }
    logger.log('debug', 'Pot has been reconfigured [ %s ]', JSON.stringify(this.potConfig));
}

PokerHand.prototype.determineNextState = function () {
    if (this.isHandOver()) {
        this.eventHandler.emit('HAND_OVER');
    } else if (this.isRoundOver()) {
        logger.log('verbose', '[ %s ] round is over, starting next round', PokerHelper.HandStages[this.stage]);
        this.resetAndStartNextRound();
    } else {
        this.notifyForNextAction();
    }
}

PokerHand.prototype.act = function (actionCfg) {
    let actingPlayerId = actionCfg.playerId;
    let action = actionCfg.action;
    let value = parseFloat(actionCfg.value);
    logger.log('verbose', 'Action [ %s ]: [ %s ] [ %s ]', actingPlayerId, action, value);
    switch (action) {
        case 'BET':
            this.playerStates[actingPlayerId].chipsInPot += value;
            this.reconfigurePot(actingPlayerId, value);
            break;
        case 'FOLD':
            this.playerStates[actingPlayerId].eligibleForNextRound = false;
            this.playerStates[actingPlayerId].hasQuitHand = true;
            break;
        case 'CHECK':
            break;
    }
    this.playerActionsRegistered++;
    this.logActionHistory(actionCfg);
    this.determineNextState();
    logger.log('debug', 'Current hand state [ %s ]', JSON.stringify(this));
}

// todo: fix logic of round end preflop: should end when non bb calls bb's raise, currently bb has to check again
PokerHand.prototype.isRoundOver = function () {
    let allChipsInPot = []
    if (this.playerActionsRegistered < this.totalPlayersInHand.length) return false;
    for (let key in this.playerStates) {
        if (this.playerStates.hasOwnProperty(key) && !this.playerStates[key].hasQuitHand) {
            allChipsInPot.push({
                chipValue: this.playerStates[key].chipsInPot,
                playerId: key
            });
        }
    }

    logger.log('debug', 'Total actions [ %s ], Total players [ %s ], Chip stats [ %s ]', this.playerActionsRegistered, this.totalPlayersInHand.length, JSON.stringify(allChipsInPot))
    for (let index = 1; index < allChipsInPot.length; index++) {
        if (allChipsInPot[index - 1].chipValue != allChipsInPot[index].chipValue && // if all players (still in hand) have not matched the pot
            !(this.potConfig.potShares.hasOwnProperty(allChipsInPot[index].playerId) ||
                this.potConfig.potShares.hasOwnProperty(allChipsInPot[index - 1].playerId))) { // or if not matched, either of them is not all in
            // then round is not yet over.
            return false;
        }
    }
    // Pre flop last to act is big blind.
    if (this.stage === 0 && this.actionOn != PokerHelper.toPlayerIndex(this.firstToAct + 1, this.totalPlayersInHand.length)) return false;

    return true;
}

PokerHand.prototype.isHandOver = function () {
    var playerCountForNextRound = 0;
    for (let key in this.playerStates) {
        if (this.playerStates.hasOwnProperty(key) && !this.playerStates[key].hasQuitHand) {
            playerCountForNextRound++;
        }
    }
    return playerCountForNextRound < 2 || (this.stage >= 3 && this.isRoundOver());
}

module.exports = {
    createPokerHand: function (handCfg, eventHandler) {
        return new PokerHand(handCfg, eventHandler);
    }
}