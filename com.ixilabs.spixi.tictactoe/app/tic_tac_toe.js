// Global variables
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X'; // X starts first
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical
    [0, 4, 8], [2, 4, 6] // Diagonal
];

// Initialize the game
function initGame() {
    board.fill('');
    currentPlayer = 'X';
    renderBoard();
}

// Render the board
function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = board.map((cell, index) => `
        <div class="cell" onclick="makeMove(${index})">${cell}</div>
    `).join('');
}

// Make a move
function makeMove(index) {
    if (board[index] === '' && !checkWinner()) {
        board[index] = currentPlayer;
        sendMove(index); // Send the move over the network
        renderBoard();
        if (!checkWinner()) {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X'; // Switch player
        }
    }
}

// Send move data to the other player
function sendMove(index) {
    const data = { index, player: currentPlayer };
    SpixiAppSdk.sendNetworkData(JSON.stringify(data));
}

// Receive move data from the other player
SpixiAppSdk.onNetworkData = function (senderAddress, data) {
    const { index, player } = JSON.parse(data);
    board[index] = player;
    renderBoard();
    if (!checkWinner()) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X'; // Switch player
    }
};

// Check for a winner
function checkWinner() {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            alert(`Player ${board[a]} wins!`);
            initGame(); // Restart the game
            return true;
        }
    }
    if (!board.includes('')) {
        alert("It's a draw!");
        initGame(); // Restart the game
    }
    return false;
}

// Start the game on load
window.onload = initGame;
