const PokerDealer = require('./pokerDealer');

const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on("close", function () {
    console.log("\ngame over");
    process.exit(0);
});

const commandMatcher = /^!([a-z]*)\s?/gm;
const paramMatcher = /-([A-Za-z]*=[A-Za-z0-9]*)/gm;

function extract(payload, matcher) {
    groups = []
    let m;
    while ((m = matcher.exec(payload)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === matcher.lastIndex) {
            matcher.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            if (groupIndex != 0)
                groups.push(match)
        });
    }
    return groups;
}

function toKeyValuePairs(groups) {
    params = {}
    for (group in groups) {
        params[groups[group].split('=')[0]] = groups[group].split('=')[1]
    }
    return params;
}

var localTable;
function processCommand(payload) {
    if (!payload.cmd) return;

    let response;
    switch (payload.cmd) {
        case 'createtable':
            localTable = PokerDealer.initTableAndCallDealer(payload.params);
            localTable.registerEventHandlers();
            break;
        case 'join':
            localTable.joinGame(payload.params);
            break;
        case 'buy':
            localTable.buyChips(payload.params);
            break;
        case 'start':
            localTable.doNext();
            break;
        case 'act':
            localTable.onAction(payload.params);
            break;
        case 'quit':
            rl.close();
        default:
            response = 'undefined command';
            break;
    }
}

var commands = [
    '!createtable -maxPlayers=6 -sb=25 -bb=50',
    '!join -id=player1',
    '!join -id=player2',
    '!join -id=player3',
    '!join -id=player4',
    '!join -id=player5',
    '!buy -playerId=player1 -chips=50',
    '!buy -playerId=player2 -chips=100',
    '!buy -playerId=player3 -chips=150',
    '!buy -playerId=player4 -chips=1000',
    '!buy -playerId=player5 -chips=2000',
    '!start'
]

var play = function () {
    rl.question(" > ", function (input) {
        processCommand({
            cmd: extract(input, commandMatcher)[0],
            params: toKeyValuePairs(extract(input, paramMatcher)),
            raw: input
        });
        play();
    });
}

module.exports = {
    playInAdminMode: function () {
        for (command of commands) {
            processCommand({
                cmd: extract(command, commandMatcher)[0],
                params: toKeyValuePairs(extract(command, paramMatcher)),
                raw: command
            });
        }
        play();
    }
}