const PokerHand = require('./pokerHand');
const PokerHelper = require('./pokerHelper');
const logger = require('./loggerFactory').getLogger();

function PokerTable(tableCfg, eventHandler) {
    // Constant Properties
    this.maxPlayers = tableCfg.maxPlayers;
    this.sb = parseFloat(tableCfg.sb);
    this.bb = parseFloat(tableCfg.bb);
    this.eventHandler = eventHandler;

    // Session Properties
    this.playersInOrder = [];
    this.players = {};
    this.totalHandsDealt = 0;

    // Hand Properties
    this.playerOnButtonIdx = 0;
    this.activePlayersInOrder = [];

    // Hand itself
    this.currentHand = undefined;
}

PokerTable.prototype.joinTable = function (player) {
    this.playersInOrder.push(player.id);
    this.players[player.id] = {
        chips: 0,
        isActive: true,
        hand: []
    }
    logger.log('debug', '%s joined', player.id);
}

PokerTable.prototype.buyChips = function (buyCfg) {
    this.players[buyCfg.playerId].chips = this.players[buyCfg.playerId].chips + parseFloat(buyCfg.chips);
    logger.log('debug', '%s bought %s chips', buyCfg.playerId, buyCfg.chips);
}

PokerTable.prototype.dealNextHand = function () {
    this.totalHandsDealt++;
    // Deal hands
    var cardIndex = 0,
        totalPlayersInHand = this.activePlayersInOrder.length;
    let firstToAct = PokerHelper.toPlayerIndex(this.playerOnButtonIdx++ + 1, totalPlayersInHand);
    let deck = PokerHelper.newShuffledDeck(7);
    var playerDetails = {}
    for (let idx = 0; idx < totalPlayersInHand * 2; idx++) {
        var card = deck[cardIndex++];
        if (!playerDetails[this.activePlayersInOrder[PokerHelper.toPlayerIndex(idx + firstToAct, totalPlayersInHand)]]) {
            playerDetails[this.activePlayersInOrder[PokerHelper.toPlayerIndex(idx + firstToAct, totalPlayersInHand)]] = { hand: [] };
        }
        playerDetails[this.activePlayersInOrder[PokerHelper.toPlayerIndex(idx + firstToAct, totalPlayersInHand)]].hand.push(card);
    }

    // Deal community cards
    var communityCards = []
    for (burns of PokerHelper.BurnFactor) {
        cardIndex = burns + ++cardIndex;
        communityCards.push(deck[cardIndex])
    }
    // Populate chips
    for (let idx = 0; idx < totalPlayersInHand; idx++) {
        var playerId = this.activePlayersInOrder[PokerHelper.toPlayerIndex(idx + firstToAct, totalPlayersInHand)];
        playerDetails[playerId].chips = this.players[playerId].chips;

        if (idx == 0) playerDetails[playerId].chipsInPot = this.sb;
        else if (idx == 1) playerDetails[playerId].chipsInPot = this.bb;
        else playerDetails[playerId].chipsInPot = 0;
    }
    this.currentHand = PokerHand.createPokerHand({
        playerInitialStates: playerDetails,
        communityCards: communityCards,
        potConfig: { totalPotValue: this.sb + this.bb, potShares: {} },
        actionOn: firstToAct,
        totalPlayersInHand: this.activePlayersInOrder
    }, this.eventHandler);

    logger.log('verbose', 'Starting hand [ # %s ]', this.totalHandsDealt);
    this.currentHand.resetAndStartNextRound();
}

PokerTable.prototype.performHouseKeeping = function () {
    if (this.currentHand) {
        var playerStatesAfterHand = this.currentHand.playerStates;
        var playersInFinalRound = []
        for (let playerId in playerStatesAfterHand) {
            if (playerStatesAfterHand.hasOwnProperty(playerId)) {
                if (!playerStatesAfterHand[playerId].hasQuitHand) {
                    playersInFinalRound.push(playerId);
                } else {
                    this.players[playerId].chips -= playerStatesAfterHand[playerId].chipsInPot;
                }
            }
        }

        // Re-Distribute chips post hand.
        let playerHandScores = PokerHelper.scorePlayerHands(playersInFinalRound, playerStatesAfterHand, this.currentHand.communityCards);
        var playersByRank = [...playersInFinalRound].sort((a, b) => {
            return playerHandScores[a].value > playerHandScores[b].value ? -1 : playerHandScores[a].value < playerHandScores[b].value ? 1 : 0;
        })

        if (this.currentHand.potConfig.potShares.size === 0) {
            let winningPlayer = playersByRank[0];
            this.players[winningPlayer].chips += this.currentHand.totalPotValue;
            this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                delta: this.currentHand.totalPotValue,
                playerId: winningPlayer
            });
        } else {
            let totalPotValue = this.currentHand.potConfig.totalPotValue;
            for (player of playersByRank) {
                if (this.currentHand.potConfig.potShares.hasOwnProperty(player)) {
                    let playerWinnings = this.currentHand.potConfig.potShares[player];
                    this.players[player].chips += playerWinnings;
                    totalPotValue -= playerWinnings;
                    this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                        delta: playerWinnings,
                        playerId: player
                    });
                } else if (totalPotValue > 0) {
                    this.players[player].chips += totalPotValue;
                    this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                        delta: totalPotValue,
                        playerId: player
                    });
                    totalPotValue = 0;
                } else {
                    this.players[player].chips -= this.currentHand.playerStates[player].chipsInPot;
                    this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                        delta: -1 * this.currentHand.playerStates[player].chipsInPot,
                        playerId: player
                    });
                }
            }
        }
        logger.log('verbose', 'Finished hand [ #%s ]', this.totalHandsDealt);
    }
    // load active players in state for next hand
    this.currentHand = undefined;
    this.activePlayersInOrder = [];
    for (var playerId of this.playersInOrder) {
        if (PokerHelper.isPlayerEligibleForNextHand(this.players[playerId]))
            this.activePlayersInOrder.push(playerId);
    }
    logger.log('debug', 'performed house keeping', this.table)
}


module.exports = {
    createTable: function (tableCfg, eventHandler) {
        return new PokerTable(tableCfg, eventHandler);
    }
}