// Copyright (C) 2025 IXI Labs
// This file is part of Spixi Mini App Examples - https://github.com/ixian-platform/Spixi-Mini-Apps
//
// Spixi is free software: you can redistribute it and/or modify
// it under the terms of the MIT License as published
// by the Open Source Initiative.
//
// Spixi is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// MIT License for more details.

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
    const myTurn = gameState.playersTurn == "local" ? true : false;
    const data = { action: "ping", movesCount: gameState.board.filter((x) => x != '').length, myTurn: myTurn };
    SpixiAppSdk.sendNetworkData(JSON.stringify(data));
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
        SpixiAppSdk.setStorageData('game', remotePlayerAddress, JSON.stringify(gameState));
    }
}

async function loadGameState(playerAddress) {
    let value = await SpixiAppSdk.getStorageData('game', playerAddress);
    if (value != 'null') {
        gameState = JSON.parse(value);
        renderBoard();
        checkWinner();
    }
}

function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    gameState.playersTurn = gameState.playersTurn === 'local' ? 'remote' : 'local';
}

// Send move data to the other player
function sendMove(cellPosition) {
    const currentTime = SpixiTools.getTimestamp();
    lastDataSent = currentTime;

    const data = { action: "move", cellPosition: cellPosition };
    SpixiAppSdk.sendNetworkData(JSON.stringify(data));
}

function sendGameState(forceUpdate) {
    const currentTime = SpixiTools.getTimestamp();
    lastDataSent = currentTime;

    let data = { action: "gameState", gameState: gameState };
    if (forceUpdate) {
        data = { action: "gameState", gameState: gameState, forceUpdate: true };
    }
    SpixiAppSdk.sendNetworkData(JSON.stringify(data));
}

function sendGetGameState() {
    const currentTime = SpixiTools.getTimestamp();
    lastDataSent = currentTime;

    const data = { action: "getGameState" };
    SpixiAppSdk.sendNetworkData(JSON.stringify(data));
}

SpixiAppSdk.onInit = function (sessionId, userAddress, ...remoteAddresses) {
    remotePlayerAddress = remoteAddresses[0];
    restartGame(false);
    loadGameState(remotePlayerAddress);
};

// Receive data from the other player
SpixiAppSdk.onNetworkData = function (senderAddress, data) {
    playerLastSeen = SpixiTools.getTimestamp();

    const parsedData = JSON.parse(data);
    switch (parsedData["action"]) {
        case "getGameState":
            sendGameState();
            break;
        case "gameState":
            {
                const myMovesCount = gameState.board.filter((x) => x != '').length;
                const otherMovesCount = parsedData["gameState"].board.filter((x) => x != '').length;
                if (otherMovesCount > myMovesCount) {
                    gameState = parsedData["gameState"];
                    gameState.playersTurn = gameState.playersTurn === 'local' ? 'remote' : 'local';
                    renderBoard();
                    checkWinner();
                    saveGameState();
                } else if (otherMovesCount < myMovesCount) {
                    if (otherMovesCount > 1
                        || !gameState.gameEnded) {
                        sendGameState();
                    }
                } else // if ==
                {
                    if (parsedData["gameState"].playersTurn == gameState.playersTurn
                        && parsedData.forceUpdate) {
                        // edge case, both users made the very first move at the same time
                        gameState = parsedData["gameState"];
                        gameState.playersTurn = gameState.playersTurn === 'local' ? 'remote' : 'local';
                        renderBoard();
                        checkWinner();
                        saveGameState();
                    }
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
            {
                const myMovesCount = gameState.board.filter((x) => x != '').length;
                if (parsedData.movesCount < myMovesCount) {
                    if (parsedData.movesCount > 1 || !gameState.gameEnded) {
                        sendGameState();
                    }
                } else if (parsedData.movesCount == myMovesCount) {
                    const myTurn = gameState.playersTurn === 'local' ? true : false;
                    if (parsedData.myTurn == myTurn) {
                        // edge case, both users made the very first move at the same time
                        sendGameState(true);
                    }
                }
            }
            break;
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
window.onload = SpixiAppSdk.fireOnLoad;
