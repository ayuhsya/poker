var assert = require('assert');
const pokerDealer = require('../scripts/pokerDealer');
const pokerTable = require('../scripts/pokerTable');

describe('mocked hands test', function () {
    describe('test pot redistribution', function () {
        it(' should let main pot and side pot win', function () {
            let mockDealer = pokerDealer.initTableAndCallDealer({ maxPlayers: 6, sb: 5, bb: 10 });
            // mock shuffle
            pokerTable.pokerTable.prototype.shuffleCards = function () {
                // do nothing
            }
            // Join 3 players
            mockDealer.joinGame({ id: 'player1' });
            mockDealer.joinGame({ id: 'player2' });
            mockDealer.joinGame({ id: 'player3' });
            // Buy chips on table
            mockDealer.buyChips({ playerId: 'player1', chips: 1000 })
            mockDealer.buyChips({ playerId: 'player2', chips: 80 })
            mockDealer.buyChips({ playerId: 'player3', chips: 400 })
            // Start game
            mockDealer.doNext();
            // Mock actions from players
            mockDealer.onAction({ playerId: 'player1', action: 'BET', value: 200 });
            mockDealer.onAction({ playerId: 'player2', action: 'BET', value: 75 });
            mockDealer.onAction({ playerId: 'player3', action: 'BET', value: 390 });
            mockDealer.onAction({ playerId: 'player1', action: 'FOLD' });
            mockDealer.doNext();

            console.log(mockDealer.table.players)

            assert.strictEqual(800, mockDealer.table.players['player1'].chips);
            assert.strictEqual(240, mockDealer.table.players['player2'].chips);
            assert.strictEqual(440, mockDealer.table.players['player3'].chips);
        });

        it('should let player1 win', function () {
            let mockDealer = pokerDealer.initTableAndCallDealer({ maxPlayers: 6, sb: 5, bb: 10 });
            // mock shuffle
            pokerTable.pokerTable.prototype.shuffleCards = function () {
                this.deck = [
                    // player1,   player2,    player3
                    13 * 0 + 2, 13 * 1 + 3, 13 * 2 + 4,
                    13 * 0 + 7, 13 * 3 + 11, 13 * 2 + 10,
                    13 * 0 + 2,
                    13 * 1 + 2, 13 * 2 + 2, 13 * 3 + 2, // flop
                    13 * 0 + 2,
                    13 * 1 + 6, // turn
                    13 * 0 + 2,
                    13 * 3 + 6 // river
                ]
            }
            // Join 3 players
            mockDealer.joinGame({ id: 'player1' });
            mockDealer.joinGame({ id: 'player2' });
            mockDealer.joinGame({ id: 'player3' });
            // Buy chips on table
            mockDealer.buyChips({ playerId: 'player1', chips: 1000 })
            mockDealer.buyChips({ playerId: 'player2', chips: 80 })
            mockDealer.buyChips({ playerId: 'player3', chips: 400 })
            // Start game
            mockDealer.doNext();
            // Mock actions from players
            mockDealer.onAction({ playerId: 'player1', action: 'BET', value: 200 });
            mockDealer.onAction({ playerId: 'player2', action: 'BET', value: 75 });
            mockDealer.onAction({ playerId: 'player3', action: 'BET', value: 390 });
            mockDealer.doNext();
            // flop
            // river
            console.log(mockDealer.table);
        });
    });
});