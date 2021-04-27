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
    this.deck = Array.from(new Array(52), (x, i) => i);

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
    logger.log('debug', '[ %s ] joined table', player.id);
}

PokerTable.prototype.buyChips = function (buyCfg) {
    if (!this.players.hasOwnProperty(buyCfg.playerId)) {
        this.eventHandler.emit('INVALID_ACTION', `[ ${buyCfg.playerId} ] cannot buy chips before joining this table.`)
    }

    this.players[buyCfg.playerId].chips = this.players[buyCfg.playerId].chips + parseFloat(buyCfg.chips);
    this.players[buyCfg.playerId].isEliminated = false;
    logger.log('debug', '[ %s ] bought [ %s ] chips', buyCfg.playerId, buyCfg.chips);
}

PokerTable.prototype.eliminatePlayerLowerPotShares = function (playerPotShare, allPotSharesByPlayer) {
    for (playerId in allPotSharesByPlayer) {
        if (allPotSharesByPlayer.hasOwnProperty(playerId) && allPotSharesByPlayer[playerId].share < playerPotShare && !allPotSharesByPlayer[playerId].isAlreadyAcquired) {
            this.players[playerId].isEliminated = true;
        }
    }
}

PokerTable.prototype.shuffleDeck = function () {
    PokerHelper.newShuffledDeck(this.deck);
}

PokerTable.prototype.dealNextHand = function () {
    this.totalHandsDealt++;
    // Deal hands
    var cardIndex = 0,
        totalPlayersInHand = this.activePlayersInOrder.length;
    let firstToAct = PokerHelper.toPlayerIndex(this.playerOnButtonIdx++ + 1, totalPlayersInHand);
    var playerDetails = {}
    for (let idx = 0; idx < totalPlayersInHand * 2; idx++) {
        var card = this.deck[cardIndex++];
        if (!playerDetails[this.activePlayersInOrder[PokerHelper.toPlayerIndex(idx + firstToAct, totalPlayersInHand)]]) {
            playerDetails[this.activePlayersInOrder[PokerHelper.toPlayerIndex(idx + firstToAct, totalPlayersInHand)]] = {
                hand: [],
                eligibleForNextRound: true
            };
        }
        playerDetails[this.activePlayersInOrder[PokerHelper.toPlayerIndex(idx + firstToAct, totalPlayersInHand)]].hand.push(card);
    }

    // Deal community cards
    var communityCards = []
    for (burns of PokerHelper.BurnFactor) {
        cardIndex = burns + ++cardIndex;
        communityCards.push(this.deck[cardIndex])
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
        potConfig: { totalPotValue: this.sb + this.bb, potShares: [] },
        actionOn: firstToAct,
        totalPlayersInHand: this.activePlayersInOrder
    }, this.eventHandler);

    logger.log('verbose', 'Starting hand [ #%s ]', this.totalHandsDealt);
    logger.log('debug', 'Hand [ %s ] initial state [ %s ]', this.totalHandsDealt, JSON.stringify(this.currentHand));
    this.currentHand.resetAndStartNextRound();
}

PokerTable.prototype.performHouseKeeping = function () {
    if (this.currentHand) {
        let playerStatesAfterHand = this.currentHand.playerStates,
            playersInFinalRound = [], playersLosingAllChipsInPot = [];

        for (key in this.currentHand.playerStates) {
            if (this.currentHand.playerStates.hasOwnProperty(key) && !this.currentHand.playerStates[key].hasQuitHand) {
                playersInFinalRound.push(key);
            } else {
                // players who folded don't get anything back from the pot, assuming all players play optimally
                playersLosingAllChipsInPot.push(key);
            }
        }

        if (playersInFinalRound.length < 2) {
            let winner = playersInFinalRound[0];

            // case when no split pots, winner takes all
            let playerWinnings = totalRemainingPotValue - this.currentHand.playerStates[winner].chipsInPot;
            this.players[winner].chips += playerWinnings;
            logger.log('verbose', '[ %s ] won full pot of size [ %s ] with [ %s ] [ winner not all in ]', winner, playerWinnings, playerHandScores[winner].name);
            this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                delta: this.players[winner].chips,
                playerId: winner
            });
        } else {
            // Re-Distribute chips post hand among players in final hand.
            let playerHandScores = PokerHelper.scorePlayerHands(playersInFinalRound, playerStatesAfterHand, this.currentHand.communityCards);
            logger.log('debug', 'Scoring results [ %s ]', JSON.stringify(playerHandScores))
            var playersByRank = [...playersInFinalRound].sort((a, b) => {
                return playerHandScores[a].value > playerHandScores[b].value ? -1 : playerHandScores[a].value < playerHandScores[b].value ? 1 : 0;
            });

            let playersInFinalRoundByBets = [...this.currentHand.totalPlayersInHand].sort((a, b) => {
                return playerStatesAfterHand[a].chipsInPot > playerStatesAfterHand[b].chipsInPot ? 1 : playerStatesAfterHand[a].chipsInPot < playerStatesAfterHand[b].chipsInPot ? -1 : 0;
            });

            logger.log('debug', 'players in final round in order of bet [ %s ]', JSON.stringify(playersInFinalRoundByBets));

            let deltaChipCountByPlayer = {},
                lastPotSplitPoint = 0;
            for (let index = 0; index < playersInFinalRoundByBets.length; index++) {
                if (playerStatesAfterHand[playersInFinalRoundByBets[index]].chipsInPot > lastPotSplitPoint) {
                    let potSplitPoint = playerStatesAfterHand[playersInFinalRoundByBets[index]].chipsInPot;
                    let filteredContenders = playersInFinalRoundByBets.slice(index);
                    logger.log('debug', '[ %s ] at pot split point [ %s ]', JSON.stringify(filteredContenders), potSplitPoint);
                    for (let player of playersByRank) {
                        if (filteredContenders.includes(player)) {
                            if (!deltaChipCountByPlayer.hasOwnProperty(player)) {
                                deltaChipCountByPlayer[player] = 0;
                            }
                            deltaChipCountByPlayer[player] += (potSplitPoint - lastPotSplitPoint) * filteredContenders.length;
                            logger.log('debug', '[ %s ] wins this pot split', player);
                            break;
                        }
                    }
                    lastPotSplitPoint = potSplitPoint;
                }
            }

            logger.log('debug', 'players delta chip count [ %s ]', JSON.stringify(deltaChipCountByPlayer));

            for (key in deltaChipCountByPlayer) {
                if (deltaChipCountByPlayer.hasOwnProperty(key)) {
                    this.players[key].chips += (deltaChipCountByPlayer[key] - playerStatesAfterHand[key].chipsInPot);
                }
            }
        }

        for (player of playersLosingAllChipsInPot) {
            let playerLosses = playerStatesAfterHand[player].chipsInPot;
            this.players[player].chips -= playerLosses;
            logger.log('verbose', '[ %s ] lost pot of size [ %s ] [ folded / worse hand ]', player, playerLosses);
            this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                delta: -playerLosses,
                playerId: player
            });
        }

        logger.log('verbose', 'Finished hand [ #%s ]', this.totalHandsDealt);
    }
    // load active players in state for next hand
    this.currentHand = undefined;
    this.activePlayersInOrder = [];
    for (var playerId of this.playersInOrder) {
        if (this.players[playerId].chips >= this.bb && this.players[playerId].isActive) {
            this.activePlayersInOrder.push(playerId);
        }
    }
    logger.log('debug', 'Performed house keeping, table state [ %s ]', JSON.stringify(this))
    if (this.activePlayersInOrder < 2) {
        this.eventHandler.emit('GAME_STOPPED')
        return false;
    }
    return true;
}


module.exports = {
    createTable: function (tableCfg, eventHandler) {
        return new PokerTable(tableCfg, eventHandler);
    },
    pokerTable: PokerTable
}