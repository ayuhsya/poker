var assert = require('assert');
const pokerDealer = require('../scripts/pokerDealer');
const pokerTable = require('../scripts/pokerTable');

describe('mocked hands test', function () {
    describe('test pot redistribution', function () {
        it('should distribute when player2 win and player1 folds', function () {
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

            assert.strictEqual(800, mockDealer.table.players['player1'].chips);
            assert.strictEqual(240, mockDealer.table.players['player2'].chips);
            assert.strictEqual(440, mockDealer.table.players['player3'].chips);
        });

        it('should distribute when player2 win and player1 calls', function () {
            let mockDealer = pokerDealer.initTableAndCallDealer({ maxPlayers: 6, sb: 5, bb: 10 });

            // mock shuffle
            mockDealer.table.deck = [
                // player2,   player3,    player1
                13 * 0 + 2, 13 * 1 + 3, 13 * 2 + 4,
                13 * 0 + 7, 13 * 3 + 11, 13 * 2 + 10,
                13 * 0 + 2,
                13 * 1 + 2, 13 * 2 + 2, 13 * 3 + 2, // flop
                13 * 0 + 2,
                13 * 1 + 6, // turn
                13 * 2 + 9,
                13 * 3 + 6 // river
            ]

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

            mockDealer.onAction({ playerId: 'player1', action: 'BET', value: 200 });

            mockDealer.doNext();
            // flop
            // river
            assert.strictEqual(600, mockDealer.table.players['player1'].chips);
            assert.strictEqual(240, mockDealer.table.players['player2'].chips);
            assert.strictEqual(640, mockDealer.table.players['player3'].chips);
        });

        it('should distribute when player1 win and others all in', function () {
            let mockDealer = pokerDealer.initTableAndCallDealer({ maxPlayers: 6, sb: 5, bb: 10 });

            // mock shuffle
            mockDealer.table.deck = [
                // player2,   player3,    player1
                13 * 1 + 3, 13 * 2 + 4, 13 * 0 + 2,
                13 * 3 + 11, 13 * 2 + 10, 13 * 0 + 7,
                13 * 0 + 2,
                13 * 1 + 2, 13 * 2 + 2, 13 * 3 + 2, // flop
                13 * 0 + 2,
                13 * 1 + 6, // turn
                13 * 2 + 9,
                13 * 3 + 6 // river
            ]

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

            mockDealer.onAction({ playerId: 'player1', action: 'BET', value: 200 });

            mockDealer.doNext();
            // flop
            // river
            assert.strictEqual(1480, mockDealer.table.players['player1'].chips);
            assert.strictEqual(0, mockDealer.table.players['player2'].chips);
            assert.strictEqual(0, mockDealer.table.players['player3'].chips);
        });

        it('should distribute when player3 win and player1 called', function () {
            let mockDealer = pokerDealer.initTableAndCallDealer({ maxPlayers: 6, sb: 5, bb: 10 });

            // mock shuffle
            mockDealer.table.deck = [
                // player2,   player3,    player1
                13 * 1 + 3, 13 * 0 + 2, 13 * 2 + 4,
                13 * 3 + 11, 13 * 0 + 7, 13 * 2 + 10,
                13 * 0 + 2,
                13 * 1 + 2, 13 * 2 + 2, 13 * 3 + 2, // flop
                13 * 0 + 2,
                13 * 1 + 6, // turn
                13 * 2 + 9,
                13 * 3 + 6 // river
            ]

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

            mockDealer.onAction({ playerId: 'player1', action: 'BET', value: 200 });

            mockDealer.doNext();
            // flop
            // river
            assert.strictEqual(600, mockDealer.table.players['player1'].chips);
            assert.strictEqual(0, mockDealer.table.players['player2'].chips);
            assert.strictEqual(880, mockDealer.table.players['player3'].chips);
        });

        it('should distribute when player3 win and player1 folds', function () {
            let mockDealer = pokerDealer.initTableAndCallDealer({ maxPlayers: 6, sb: 5, bb: 10 });

            // mock shuffle
            mockDealer.table.deck = [
                // player2,   player3,    player1
                13 * 1 + 3, 13 * 0 + 2, 13 * 2 + 4,
                13 * 3 + 11, 13 * 0 + 7, 13 * 2 + 10,
                13 * 0 + 2,
                13 * 1 + 2, 13 * 2 + 2, 13 * 3 + 2, // flop
                13 * 0 + 2,
                13 * 1 + 6, // turn
                13 * 2 + 9,
                13 * 3 + 6 // river
            ]

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

            mockDealer.onAction({ playerId: 'player1', action: 'FOLD'});

            mockDealer.doNext();
            // flop
            // river
            assert.strictEqual(800, mockDealer.table.players['player1'].chips);
            assert.strictEqual(0, mockDealer.table.players['player2'].chips);
            assert.strictEqual(680, mockDealer.table.players['player3'].chips);
        });
    });
});