const Events = require('events');
const PokerTable = require('./pokerTable');
const PokerHelper = require('./pokerHelper');
const e = require('express');
const logger = require('./loggerFactory').getLogger();

function PokerDealer(cfg) {
    this.eventHandler = new Events.EventEmitter();
    this.table = PokerTable.createTable(cfg, this.eventHandler);
}

PokerDealer.prototype.joinGame = function (playerCfg) {
    this.table.joinTable(playerCfg);
}

PokerDealer.prototype.buyChips = function (buyCfg) {
    this.table.buyChips(buyCfg);
}

PokerDealer.prototype.doNext = function () {
    if (this.table.performHouseKeeping()) {
        this.table.dealNextHand();
    }
}

PokerDealer.prototype.notifyPlayerForAction = function (playerOnAction) {
    logger.log('verbose', 'Action On: [ %s ]', this.table.activePlayersInOrder[playerOnAction])
}

PokerDealer.prototype.notifyError = function (message) {
    logger.log('error', '[ %s ]', message)
}

PokerDealer.prototype.notifyGameStopped = function (message) {
    logger.log('error', 'Game has been stopped at hand', message)
    this.displayTable();
}

PokerDealer.prototype.notifyChipsCounts = function (message) {
    logger.log('verbose', 'Summary: [ %s ] Wins/Loses [ %s ] chips', message.playerId, message.delta)
}

PokerDealer.prototype.displayTable = function (stage) {
    var cards = this.table.currentHand.communityCards;
    switch (stage) {
        case 1:
            logger.log('verbose', '[ %s ]: [ %s %s %s ]', PokerHelper.HandStages[stage], PokerHelper.toHumarReadableCard(cards[0]),
                PokerHelper.toHumarReadableCard(cards[1]), PokerHelper.toHumarReadableCard(cards[2]))
            break;
        case 2:
            logger.log('verbose', '[ %s ]: [ %s %s %s | %s ]', PokerHelper.HandStages[stage], PokerHelper.toHumarReadableCard(cards[0]),
                PokerHelper.toHumarReadableCard(cards[1]), PokerHelper.toHumarReadableCard(cards[2]), PokerHelper.toHumarReadableCard(cards[3]))
            break;
        case 3:
            logger.log('verbose', '[ %s ]: [ %s %s %s | %s | %s ]', PokerHelper.HandStages[stage], PokerHelper.toHumarReadableCard(cards[0]),
                PokerHelper.toHumarReadableCard(cards[1]), PokerHelper.toHumarReadableCard(cards[2]), PokerHelper.toHumarReadableCard(cards[3]),
                PokerHelper.toHumarReadableCard(cards[4]))
            break;
        case 0:
            logger.log('verbose', '[ %s ]: []', PokerHelper.HandStages[stage]);
            break;
        default:
            break;
    }
    for (let key in this.table.currentHand.playerStates) {
        if (this.table.currentHand.playerStates.hasOwnProperty(key)) {
            var player = this.table.currentHand.playerStates[key];
            logger.log('verbose', '[ %s ], Hand [ %s %s ], Chips In Pot [%s], Total Chips [ %s ]', key, PokerHelper.toHumarReadableCard(player.hand[0]),
                PokerHelper.toHumarReadableCard(player.hand[1]), player.chipsInPot, player.chips)
        }
    }
    this.notifyPlayerForAction(this.table.currentHand.actionOn);
}

PokerDealer.prototype.onAction = function (actionCfg) {
    if (this.table.currentHand.validateAction(actionCfg)) {
        this.table.currentHand.act(actionCfg);
    }
}

PokerDealer.prototype.registerEventHandlers = function () {
    // weird hack to call function's own method as event handler ¯\_(ツ)_/¯
    // https://stackoverflow.com/a/43727582
    this.eventHandler.on('HAND_OVER', ev => this.doNext(ev));
    this.eventHandler.on('ACTION_ON', ev => this.notifyPlayerForAction(ev));
    this.eventHandler.on('INVALID_ACTION', ev => this.notifyError(ev));
    this.eventHandler.on('CHIP_COUNT_CHANGED', ev => this.notifyChipsCounts(ev));
    this.eventHandler.on('GAME_STOPPED', ev => this.notifyGameStopped(ev));
    this.eventHandler.on(PokerHelper.HandStages[0], ev => this.displayTable(ev));
    this.eventHandler.on(PokerHelper.HandStages[1], ev => this.displayTable(ev));
    this.eventHandler.on(PokerHelper.HandStages[2], ev => this.displayTable(ev));
    this.eventHandler.on(PokerHelper.HandStages[3], ev => this.displayTable(ev));
}

module.exports = {
    initTableAndCallDealer: function (cfg) {
        return new PokerDealer(cfg);
    }
}