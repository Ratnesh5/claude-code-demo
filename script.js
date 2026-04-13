const board = document.getElementById("board");
const player1 = localStorage.getItem("player1") || "Player 1";
const player2 = localStorage.getItem("player2") || "Player 2";
const turnText = document.getElementById("turnText");
let selectedSquare = null;
let game = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

const symbols = {
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  p: "♟",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
  P: "♙",
};
let selected = null;
let turn = "white";
let gameover = false;
function isWhite(piece) {
  return piece === piece.toUpperCase();
}
function onSquareClick(row, col) {
  clearHighlights();

  if (selectedSquare) {
    // try move
    if (isValidMove(selectedSquare, { row, col })) {
      movePiece(selectedSquare, { row, col });
    }
    selectedSquare = null;
    return;
  }

  let piece = board[row][col];
  if (piece) {
    selectedSquare = { row, col };
    highlightMoves(row, col);
  }
}

function highlightMoves(row, col) {
  let moves = getLegalMoves(row, col);

  // highlight selected
  getSquare(row, col).classList.add("highlight");

  moves.forEach((move) => {
    let square = getSquare(move.row, move.col);

    if (board[move.row][move.col]) {
      square.classList.add("capture");
    } else {
      square.classList.add("move");
    }
  });
}

function clearHighlights() {
  document.querySelectorAll(".cell").forEach((sq) => {
    sq.classList.remove("highlight", "move", "capture", "selected");
  });
}

//pawn
function isValidPawnMove(sr, sc, dr, dc, piece) {
  const direction = isWhite(piece) ? -1 : 1;

  if (dc === sc && dr === sr + direction && game[dr][dc] === "") {
    return true;
  }

  if (
    dc === sc &&
    dr === sr + 2 * direction &&
    ((isWhite(piece) && sr === 6) || (!isWhite(piece) && sr === 1)) &&
    game[sr + direction][sc] === "" &&
    game[dr][dc] === ""
  ) {
    return true;
  }

  if (
    Math.abs(dc - sc) === 1 &&
    dr === sr + direction &&
    game[dr][dc] !== "" &&
    isWhite(game[dr][dc]) !== isWhite(piece)
  ) {
    return true;
  }

  return false;
}
//rook
function isValidRookMove(sr, sc, dr, dc) {
  if (sr !== dr && sc !== dc) return false;

  if (sr === dr) {
    const step = dc > sc ? 1 : -1;

    for (let c = sc + step; c !== dc; c += step) {
      if (game[sr][c] !== "") return false;
    }
  } else {
    const step = dr > sr ? 1 : -1;

    for (let r = sr + step; r !== dr; r += step) {
      if (game[r][sc] !== "") return false;
    }
  }

  return true;
}

//bishop
function isValidBishopMove(sr, sc, dr, dc) {
  // must move diagonally
  if (Math.abs(dr - sr) !== Math.abs(dc - sc)) return false;

  const rowStep = dr > sr ? 1 : -1;
  const colStep = dc > sc ? 1 : -1;

  let r = sr + rowStep;
  let c = sc + colStep;

  // check path blocking
  while (r !== dr && c !== dc) {
    if (game[r][c] !== "") return false;

    r += rowStep;
    c += colStep;
  }

  return true;
}

//queen
function isValidQueenMove(sr, sc, dr, dc) {
  return isValidBishopMove(sr, sc, dr, dc) || isValidRookMove(sr, sc, dr, dc);
}

//knight
function isValidKnightMove(sr, sc, dr, dc) {
  const rowdiff = Math.abs(sr - dr);
  const coldiff = Math.abs(sc - dc);
  return (rowdiff == 1 && coldiff == 2) || (rowdiff == 2 && coldiff == 1);
}

//king
function isValidKingMove(sr, sc, dr, dc) {
  const rowdiff = Math.abs(sr - dr);
  const coldiff = Math.abs(sc - dc);
  return rowdiff <= 1 && coldiff <= 1;
}

//find king
function findKing(isWhiteKing) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = game[r][c];

      if (
        piece !== "" &&
        piece.toLowerCase() === "k" &&
        isWhite(piece) === isWhiteKing
      ) {
        return { r, c };
      }
    }
  }
  return null;
}

function isValidMove(sr, sc, dr, dc, piece) {
  // prevent same color capture
  if (game[dr][dc] !== "") {
    if (isWhite(game[dr][dc]) === isWhite(piece)) {
      return false;
    }
  }

  switch (piece.toLowerCase()) {
    case "p":
      return isValidPawnMove(sr, sc, dr, dc, piece);
    case "r":
      return isValidRookMove(sr, sc, dr, dc);
    case "b":
      return isValidBishopMove(sr, sc, dr, dc);
    case "q":
      return isValidQueenMove(sr, sc, dr, dc);
    case "n":
      return isValidKnightMove(sr, sc, dr, dc);
    case "k":
      return isValidKingMove(sr, sc, dr, dc);
  }

  return false;
}

function isSquareUnderAttack(r, c, byWhite) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = game[i][j];
      if (piece === "") continue;

      // only check attacking side
      if (isWhite(piece) !== byWhite) continue;

      if (isValidMove(i, j, r, c, piece)) {
        return true;
      }
    }
  }

  return false;
}

function isKingInCheck(isWhiteKing) {
  const king = findKing(isWhiteKing);
  if (!king) return false;

  return isSquareUnderAttack(king.r, king.c, !isWhiteKing);
}

function hasAnyValidMove(isWhitePlayer) {
  for (let sr = 0; sr < 8; sr++) {
    for (let sc = 0; sc < 8; sc++) {
      const piece = game[sr][sc];

      if (piece === "") continue;

      // only check player's pieces
      if (isWhite(piece) !== isWhitePlayer) continue;

      // try all destinations
      for (let dr = 0; dr < 8; dr++) {
        for (let dc = 0; dc < 8; dc++) {
          if (!isValidMove(sr, sc, dr, dc, piece)) continue;

          const target = game[dr][dc];

          // simulate move
          game[dr][dc] = piece;
          game[sr][sc] = "";

          const stillInCheck = isKingInCheck(isWhitePlayer);

          // undo move
          game[sr][sc] = piece;
          game[dr][dc] = target;

          if (!stillInCheck) {
            return true; // found a valid move
          }
        }
      }
    }
  }

  return false; // no valid moves
}

function isCheckmate(isWhitePlayer) {
  if (!isKingInCheck(isWhitePlayer)) {
    return false;
  }

  if (hasAnyValidMove(isWhitePlayer)) {
    return false;
  }

  return true;
}

function showPopup(message) {
  const popup = document.getElementById("popup");
  const text = document.getElementById("popupText");

  text.innerText = message;
  popup.classList.remove("hidden");
}

function playAgain() {
  location.reload(); // restart game with same players
}

function goHome() {
  localStorage.removeItem("player1");
  localStorage.removeItem("player2");
  window.location.href = "index.html";
}

function getLegalMoves(sr, sc) {
  const piece = game[sr][sc];
  if (piece === "") return [];

  const isWhitePiece = isWhite(piece);
  let moves = [];

  for (let dr = 0; dr < 8; dr++) {
    for (let dc = 0; dc < 8; dc++) {
      if (!isValidMove(sr, sc, dr, dc, piece)) continue;

      const target = game[dr][dc];

      // simulate move
      game[dr][dc] = piece;
      game[sr][sc] = "";

      const stillInCheck = isKingInCheck(isWhitePiece);

      // undo
      game[sr][sc] = piece;
      game[dr][dc] = target;

      if (!stillInCheck) {
        moves.push({ row: dr, col: dc });
      }
    }
  }

  return moves;
}

function showLegalMoves(row, col) {
  clearHighlights();

  const moves = getLegalMoves(row, col);

  const selectedCell = document.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
  selectedCell.classList.add("selected");

  moves.forEach((move) => {
    const sq = document.querySelector(
      `[data-row="${move.row}"][data-col="${move.col}"]`
    );

    if (game[move.row][move.col] !== "") {
      sq.classList.add("capture");
    } else {
      sq.classList.add("move");
    }
  });
}

function renderBoard() {
  board.innerHTML = "";
  turnText.innerText =
    turn === "white" ? player1 + "'s Turn ♔" : player2 + "'s Turn ♚";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      cell.dataset.row = row;
      cell.dataset.col = col;

      if ((row + col) % 2 === 0) {
        cell.classList.add("white");
      } else {
        cell.classList.add("black");
      }
      if (selected && selected.row === row && selected.col === col) {
        cell.style.border = "3px solid red";
      }
      const piece = game[row][col];
      if (piece !== "") {
        cell.innerText = symbols[piece];
      }

      cell.addEventListener("click", function () {
        if (gameover) {
          return;
        }
        const piece = game[row][col];
        if (selected === null) {
          if (piece !== "") {
            if (
              (turn === "white" && isWhite(piece)) ||
              (turn === "black" && !isWhite(piece))
            ){
              selected = { row, col };
              showLegalMoves(row,col);}
            else {
              console.log("Not your turn!!");
            }
          }
        } else {
          const sr = selected.row;
          const sc = selected.col;

          if (sr === row && sc === col) {
            selected = null;
            clearHighlights();
            return;
          }
          const target = game[row][col];
          if (target !== "") {
            if (isWhite(target) === isWhite(game[sr][sc])) {
                selected = { row, col };
                showLegalMoves(row, col);                  return;
              }
            }
          const legalMoves = getLegalMoves(sr, sc);
          const isAllowed = legalMoves.some(
            (m) => m.row === row && m.col === col
          );

          if (!isAllowed) {
            selected = null;
            clearHighlights();
            return;
          }

          const movingpiece = game[sr][sc];
          const targetpiece = game[row][col];
          //pawn
          if (movingpiece.toLowerCase() === "p") {
            if (!isValidPawnMove(sr, sc, row, col, movingpiece)) {
              selected = null;
              return;
            }
          }
          //rook
          if (movingpiece.toLowerCase() == "r") {
            if (!isValidRookMove(sr, sc, row, col)) {
              selected = null;
              return;
            }
          }
          //bishop
          if (movingpiece.toLowerCase() == "b") {
            if (!isValidBishopMove(sr, sc, row, col)) {
              selected = null;
              return;
            }
          }
          //queen
          if (movingpiece.toLowerCase() == "q") {
            if (!isValidQueenMove(sr, sc, row, col)) {
              selected = null;
              return;
            }
          }
          //knight
          if (movingpiece.toLowerCase() == "n") {
            if (!isValidKnightMove(sr, sc, row, col)) {
              selected = null;
              return;
            }
          }
          //king
          if (movingpiece.toLowerCase() == "k") {
            if (!isValidKingMove(sr, sc, row, col)) {
              selected = null;
              return;
            }
          }
          game[row][col] = movingpiece;
          game[sr][sc] = "";

          if (isKingInCheck(isWhite(movingpiece))) {
            game[sr][sc] = movingpiece;
            game[row][col] = targetpiece;
            selected = null;
            alert("Invalid Move, King in check!!");
            return;
          }

          selected = null;
            
            if (movingpiece.toLowerCase() === 'p' && (row === 0 || row === 7)) {
              window.pendingPromotion = { row, col, movingpiece };
              document.getElementById("promotionPopup").classList.remove("hidden");
              clearHighlights();
              renderBoard();
              return;
            }

            finalizeMove(movingpiece);
          }
        });

        board.appendChild(cell);
      }
    }
}

function finalizeMove(movingpiece) {
  const opponentIsWhite = !isWhite(movingpiece);

  if (isCheckmate(opponentIsWhite)) {
    renderBoard();
    const winner = isWhite(movingpiece) ? player1 : player2;
    showPopup("CHECKMATE 🔥\n" + winner + " wins!");
    gameover = true;
    return;
  } else if (isKingInCheck(opponentIsWhite)) {
    alert("CHECK ⚠️");
  }
  turn = turn === "white" ? "black" : "white";
  clearHighlights();
  renderBoard();
}

function promotePiece(pieceType) {
  const { row, col, movingpiece } = window.pendingPromotion;
  const isWhitePiece = isWhite(movingpiece);
  game[row][col] = isWhitePiece ? pieceType.toUpperCase() : pieceType.toLowerCase();
  
  document.getElementById("promotionPopup").classList.add("hidden");
  window.pendingPromotion = null;
  
  finalizeMove(game[row][col]);
}

renderBoard();
