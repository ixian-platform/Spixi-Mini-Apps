// Global variables
let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    playersTurn: 'local',
    gameEnded: false
};

let remotePlayerAddress = '';
let playerLastSeen = 0;
let lastDataSent = 0;

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical
    [0, 4, 8], [2, 4, 6] // Diagonal
];

const winingCombinationsStyles = [
    "top", "mid", "bot",
    "colLeft", "colMid", "colRight",
    "topLeftBottomRight", "topRightBottomLeft"
];

const pingInterval = setInterval(ping, 1000);

function ping() {
    const currentTime = SpixiTools.getTimestamp();
    if (currentTime - lastDataSent < 5
        || currentTime - playerLastSeen < 5) {
        return;
    }
    lastDataSent = currentTime;

    const data = { action: "ping", fullCellCount: gameState.board.filter((x) => x != '').length };
    SpixiAppSdk.sendNetworkData(JSON.stringify(data));
}

// Initialize the game
function init() {
    SpixiAppSdk.fireOnLoad();
}

function restartGame(saveState) {
    document.getElementById("restartBtn").style.display = "none";
    document.getElementById("winLine").style.display = "none";

    gameState.board.fill('');
    gameState.gameEnded = false;
    renderBoard();
    if (saveState) {
        saveGameState();
    }
}

function removeElementsByClass(rootElement, className) {
    let elements = rootElement.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}

// Render the board
function renderBoard() {
    const boardElement = document.getElementById('board');
    removeElementsByClass(boardElement, "cell");

    const board = gameState.board;
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');

        if (board[i] == '') {
            (function (index) {
                cell.onclick = function () { makeMove(index); };
            })(i);
        } else {
            const img = document.createElement('img');
            img.src = 'img/' + board[i].toLowerCase() + '.svg';
            img.alt = board[i];
            img.classList.add('symbol');

            cell.appendChild(img);
        }

        boardElement.appendChild(cell);
    }
}

// Make a move
function makeMove(index) {
    if (remotePlayerAddress === '') {
        return;
    }

    if (gameState.gameEnded) {
        return;
    }

    if (gameState.playersTurn === 'remote') {
        return;
    }

    const board = gameState.board;
    if (board[index] === '') {
        board[index] = gameState.currentPlayer;
        switchPlayer();
        renderBoard();
        checkWinner();
        saveGameState();
        sendMove(index); // Send the move over the network
    }
}

function saveGameState() {
    if (remotePlayerAddress != '') {
        setTimeout(function () {
            SpixiAppSdk.setStorageData(remotePlayerAddress, btoa(JSON.stringify(gameState)));
        }, 0);
    }
}

function loadGameState(playerAddress) {
    setTimeout(function () {
        SpixiAppSdk.getStorageData(playerAddress);
    }, 0);
}

function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    gameState.playersTurn = gameState.playersTurn === 'local' ? 'remote' : 'local';
}

// Send move data to the other player
function sendMove(cellPosition) {
    const currentTime = SpixiTools.getTimestamp();
    lastDataSent = currentTime;

    setTimeout(function () {
        const data = { action: "move", cellPosition: cellPosition };
        SpixiAppSdk.sendNetworkData(JSON.stringify(data));
    }, 0);
}

function sendGameState() {
    const currentTime = SpixiTools.getTimestamp();
    lastDataSent = currentTime;

    setTimeout(function () {
        const data = { action: "gameState", gameState: gameState };
        SpixiAppSdk.sendNetworkData(JSON.stringify(data));
    }, 0);
}

function sendGetGameState() {
    const currentTime = SpixiTools.getTimestamp();
    lastDataSent = currentTime;

    setTimeout(function () {
        const data = { action: "getGameState" };
        SpixiAppSdk.sendNetworkData(JSON.stringify(data));
    }, 0);
}

SpixiAppSdk.onInit = function (sessionId, userAddresses) {
    remotePlayerAddress = userAddresses.split(",")[0];
    restartGame(false);
    loadGameState(remotePlayerAddress);
}

// Receive data from the other player
SpixiAppSdk.onNetworkData = function (senderAddress, data) {
    playerLastSeen = SpixiTools.getTimestamp();

    const parsedData = JSON.parse(data);
    switch (parsedData["action"]) {
        case "getGameState":
            sendGameState();
            break;
        case "gameState":
            if (parsedData["gameState"].board.filter((x) => x != '').length > gameState.board.filter((x) => x != '').length) {
                gameState = parsedData["gameState"];
                gameState.playersTurn = gameState.playersTurn === 'local' ? 'remote' : 'local';
                renderBoard();
                checkWinner();
            } else if (parsedData["gameState"].board.filter((x) => x != '').length < gameState.board.filter((x) => x != '').length) {
                if (parsedData["gameState"].board.filter((x) => x != '').length > 1
                    || !gameState.gameEnded) {
                    sendGameState();
                }
            }
            break;
        case "move":
            const cellPosition = parsedData["cellPosition"];
            if (gameState.playersTurn === 'local') {
                if (!gameState.gameEnded) {
                    sendGameState();
                }
                return;
            }
            if (gameState.board[cellPosition] === '') {
                if (!gameState.gameEnded) {
                    sendGameState();
                }
                return;
            }
            if (gameState.gameEnded) {
                return;
            }
            gameState.board[cellPosition] = gameState.currentPlayer;
            switchPlayer();
            renderBoard();
            checkWinner();
            saveGameState();
            break;
        case "ping":
            if (parsedData.fullCellCount < gameState.board.filter((x) => x != '').length) {
                if (parsedData.fullCellCount > 1 || !gameState.gameEnded) {
                    sendGameState();
                }
            }
            break;
    }
};

SpixiAppSdk.onStorageData = function (key, value) {
    if (value != 'null') {
        gameState = JSON.parse(atob(value));
        renderBoard();
        checkWinner();
    }
};

// Check for a winner
function checkWinner() {
    const board = gameState.board;
    let i = 0;
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            showWinLine(i);
            document.getElementById("restartBtn").style.display = "";
            gameState.gameEnded = true;
            return true;
        }
        i++;
    }
    if (!board.includes('')) {
        document.getElementById("restartBtn").style.display = "";
        gameState.gameEnded = true;
        return true;
    }
    return false;
}

function showWinLine(index) {
    const winLine = document.getElementById("winLine");
    winLine.style.display = "block";
    winLine.className = winingCombinationsStyles[index];
}

// Start the game on load
window.onload = init;
