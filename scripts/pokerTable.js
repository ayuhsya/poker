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
    logger.log('debug', '[ %s ] joined table', player.id);
}

PokerTable.prototype.buyChips = function (buyCfg) {
    this.players[buyCfg.playerId].chips = this.players[buyCfg.playerId].chips + parseFloat(buyCfg.chips);
    this.players[buyCfg.playerId].isEliminated = false;
    logger.log('debug', '[ %s ] bought [ %s ] chips', buyCfg.playerId, buyCfg.chips);
}

PokerTable.prototype.eliminatePlayerLowerPotShares = function (playerPotShare, allPotSharesByPlayer) {
    for (playerId in allPotSharesByPlayer) {
        if (allPotSharesByPlayer.hasOwnProperty(playerId) && allPotSharesByPlayer[playerId].share < playerPotShare) {
            this.players[playerId].isEliminated = true;
        }
    }
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

    logger.log('verbose', 'Starting hand [ #%s ]', this.totalHandsDealt);
    logger.log('debug', 'Hand [ %s ] initial state [ %s ]', this.totalHandsDealt, JSON.stringify(this.currentHand));
    this.currentHand.resetAndStartNextRound();
}

PokerTable.prototype.performHouseKeeping = function () {
    if (this.currentHand) {
        let playerStatesAfterHand = this.currentHand.playerStates,
            playersInFinalRound = [],
            countOfPlayersInFinalRoundNotAllIn = 0;
        for (let playerId in playerStatesAfterHand) {
            if (playerStatesAfterHand.hasOwnProperty(playerId)) {
                if (!playerStatesAfterHand[playerId].hasQuitHand) {
                    if (playerStatesAfterHand[playerId].eligibleForNextRound) {
                        countOfPlayersInFinalRoundNotAllIn++;
                    }
                    playersInFinalRound.push(playerId);
                } else {
                    // directly deduct chips in pot from players not in final hand
                    this.players[playerId].chips -= playerStatesAfterHand[playerId].chipsInPot;
                    logger.log('verbose', '[ %s ] lost [ %s ] chips [ folded ]', playerId, playerStatesAfterHand[playerId].chipsInPot)
                }
            }
        }

        logger.log('debug', 'Final pot config [ %s ]', JSON.stringify(this.currentHand.potConfig));

        // Re-Distribute chips post hand among players in final hand.
        if (playersInFinalRound.length < 2) {
            // No showdown case
            let chipsWon = this.currentHand.potConfig.totalPotValue - this.currentHand.playerStates[playersInFinalRound[0]].chipsInPot;
            this.players[playersInFinalRound[0]].chips += chipsWon;
            logger.log('verbose', '[ %s ] won full pot [ %s ] [ no showdown ]', playersInFinalRound[0], chipsWon)
        } else {
            // Showdown
            let playerHandScores = PokerHelper.scorePlayerHands(playersInFinalRound, playerStatesAfterHand, this.currentHand.communityCards);
            logger.log('debug', 'Scoring results [ %s ]', JSON.stringify(playerHandScores))
            var playersByRank = [...playersInFinalRound].sort((a, b) => {
                return playerHandScores[a].value > playerHandScores[b].value ? -1 : playerHandScores[a].value < playerHandScores[b].value ? 1 : 0;
            })

            if (this.currentHand.potConfig.potShares.size === 0) {
                // Distribution in case of no side pots, winner takes all
                let winningPlayer = playersByRank[0];
                let chipsWon = (this.currentHand.potConfig.totalPotValue - this.currentHand.playerStates[winningPlayer].chipsInPot);
                this.players[winningPlayer].chips += chipsWon;
                logger.log('verbose', '[ %s ] won full pot [ %s ] with [ %s ] #0', winningPlayer, chipsWon, playerHandScores[winningPlayer].name)
                this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                    delta: this.currentHand.totalPotValue,
                    playerId: winningPlayer
                });
            } else {
                // Distribution in case of side pots.
                let totalRemainingPotValue = this.currentHand.potConfig.totalPotValue;
                let previousPlayerShare = 0; // if multi pot wins
                for (player of playersByRank) {
                    if (this.players[player].isEliminated) {
                        // case when runner up pot share is lower than winner pot share, pot is acquired by winner and player is eliminated
                        this.players[player].chips -= this.currentHand.playerStates[player].chipsInPot;
                        logger.log('verbose', '[ %s ] lost [ %s ] chips #1 [ player eliminated since pot acquired ] ', player, this.currentHand.playerStates[player].chipsInPot)
                        this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                            delta: -1 * this.currentHand.playerStates[player].chipsInPot,
                            playerId: player
                        });
                    } else if (totalRemainingPotValue > 0 && this.currentHand.potConfig.potShares.hasOwnProperty(player)) {
                        // case when winning player was all in and there are still chips to be claimed in the pot
                        let playerPotShare = this.currentHand.potConfig.potShares[player];

                        // player wins his share of pot (playerWinnings.share = all in chip amount of this player, playerWinnings.totalPlayersInThisShare = total players in that round)
                        // subtract amount of chips taken if another player with small pot ranked above current player
                        let playerWinnings = (playerPotShare.share - previousPlayerShare) * (playerPotShare.totalPlayersInThisShare - 1);
                        this.eliminatePlayerLowerPotShares(playerPotShare.share, this.currentHand.potConfig.potShares);
                        this.players[player].chips += playerWinnings;
                        previousPlayerShare += playerPotShare.share;
                        totalRemainingPotValue -= (playerWinnings + this.currentHand.playerStates[player].chipsInPot);

                        logger.log('verbose', '[ %s ] won pot of size [ %s ] with [ %s ] [ wins own share ]', player, playerWinnings, playerHandScores[player].name)
                        this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                            delta: playerWinnings,
                            playerId: player
                        });
                    } else if (totalRemainingPotValue > 0 && previousPlayerShare === 0) {
                        // case when winning player was not all in, takes full pot
                        let playerWinnings = totalRemainingPotValue - this.currentHand.playerStates[player].chipsInPot;
                        this.players[player].chips += playerWinnings;
                        logger.log('verbose', '[ %s ] won full pot of size [ %s ] with [ %s ] [ winner not all in ]', player, playerWinnings, playerHandScores[player].name);
                        this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                            delta: totalRemainingPotValue,
                            playerId: player
                        });
                        totalRemainingPotValue = 0;
                    } else if (totalRemainingPotValue > 0) {
                        // case when runner up player was not all in, takes back his share of pot and loses acquired pot shares
                        let playerLosses = this.currentHand.playerStates[player].chipsInPot - totalRemainingPotValue;
                        this.players[player].chips -= playerLosses;
                        logger.log('verbose', '[ %s ] lost pot of size [ %s ] with [ %s ] [ loses acquired chips, takes back remaining pot ]', player, playerLosses, playerHandScores[player].name);
                        this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                            delta: -playerLosses,
                            playerId: player
                        });
                        totalRemainingPotValue = 0;
                    } else {
                        this.players[player].chips -= this.currentHand.playerStates[player].chipsInPot;
                        logger.log('verbose', '[ %s ] lost [ %s ] chips #5', player, this.currentHand.playerStates[player].chipsInPot)
                        this.eventHandler.emit('CHIP_COUNT_CHANGED', {
                            delta: -1 * this.currentHand.playerStates[player].chipsInPot,
                            playerId: player
                        });
                    }
                }
            }
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
    }
}