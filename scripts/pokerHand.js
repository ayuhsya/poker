const e = require('express');
const PokerHelper = require('./pokerHelper');
const logger = require('./loggerFactory').getLogger();

function PokerHand(handCfg, eventHandler) {
    this.playerStates = handCfg.playerInitialStates;
    this.communityCards = handCfg.communityCards;
    this.pot = handCfg.pot;
    this.firstToAct = handCfg.actionOn;
    this.actionOn = undefined;
    this.totalPlayersInHand = handCfg.totalPlayersInHand;
    this.playerActionsRegistered = undefined;
    this.stage = -1;
    this.eventHandler = eventHandler;
}

PokerHand.prototype.resetAndStartNextRound = function () {
    this.actionOn = this.firstToAct;
    this.eventHandler.emit(PokerHelper.HandStages[++this.stage], this.stage);
    this.playerActionsRegistered = (this.stage === 0) ? 2 : 0; // sb + bb = 2 actions
}

PokerHand.prototype.notifyForNextAction = function () {
    this.actionOn = PokerHelper.toPlayerIndex(this.actionOn + 1, this.totalPlayersInHand);
    this.eventHandler.emit('ACTION_ON', this.actionOn)
}

PokerHand.prototype.logActionHistory = function (actionCfg) {
    
}

PokerHand.prototype.act = function (actionCfg) {
    var actingPlayerId = actionCfg.playerId;
    var action = actionCfg.action;
    var value = parseFloat(actionCfg.value);
    logger.log('verbose', '[ %s ]: [ %s ] [ %s ]', actingPlayerId, action, value);
    switch (action) {
        case 'BET':
        case 'CALL':
            this.playerStates[actingPlayerId].chipsInPot += value;
            this.pot += value;
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

    logger.log('debug', 'current hand state [ %s ]', JSON.stringify(this));
    if (this.isHandOver()) {
        this.eventHandler.emit('HAND_OVER');
    } else if (this.isRoundOver()) {
        logger.log('verbose', '[ %s ] round is over, starting next round', PokerHelper.HandStages[this.stage]);
        this.resetAndStartNextRound();
    } else {
        this.notifyForNextAction();
    }
}

PokerHand.prototype.isRoundOver = function () {
    var allChipsInPot = []
    if (this.playerActionsRegistered < this.totalPlayersInHand) return false;
    for (let key in this.playerStates) {
        if (this.playerStates.hasOwnProperty(key) && !this.playerStates[key].hasQuitHand) {
            allChipsInPot.push(this.playerStates[key].chipsInPot);
        }
    }
    for (let index = 1; index < allChipsInPot.length; index++) {
        if (allChipsInPot[index - 1] != allChipsInPot[index]) return false;
    }
    // Pre flop last to act is big blind.
    if (this.stage === 0 && this.actionOn != PokerHelper.toPlayerIndex(this.firstToAct + 1, this.totalPlayersInHand)) return false;

    return true;
}

PokerHand.prototype.isHandOver = function () {
    var playerCountForNextRound = 0;
    for (let key in this.playerStates) {
        if (this.playerStates.hasOwnProperty(key) && !this.playerStates[key].hasQuitHand) {
            playerCountForNextRound++;
        }
    }
    return this.isRoundOver() && (this.stage >= 3 || playerCountForNextRound < 2);
}

module.exports = {
    createPokerHand: function (handCfg, eventHandler) {
        return new PokerHand(handCfg, eventHandler);
    }
}