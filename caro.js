'use strict';

const caroSize = 13;
const caroDirections = [[1, 0], [0, 1], [1, 1], [1, -1]];

function caroRun(board, index, color, dx, dy) {
  let length = 1, open = 0;
  const x = index % caroSize, y = Math.floor(index / caroSize);
  for (const sign of [-1, 1]) {
    let cx = x + dx * sign, cy = y + dy * sign;
    while (cx >= 0 && cx < caroSize && cy >= 0 && cy < caroSize) {
      const cell = board[cy * caroSize + cx];
      if (cell !== color) {
        if (!cell) open++;
        break;
      }
      length++;
      cx += dx * sign;
      cy += dy * sign;
    }
  }
  return { length, open };
}

function caroWins(board, index, color) {
  return caroDirections.some(([dx, dy]) => caroRun(board, index, color, dx, dy).length >= 5);
}

function caroMove(board) {
  const threats = [0, 3, 18, 105, 1700, 100000];
  const rate = (index, color) => caroDirections.reduce((score, [dx, dy]) => {
    const { length, open } = caroRun(board, index, color, dx, dy);
    return score + (length >= 5 ? threats[5] : open ? threats[length] * (open === 2 ? 2.4 : 1) : 0);
  }, 0);
  let best = -1, top = -Infinity;
  for (let i = 0; i < board.length; i++) {
    if (board[i]) continue;
    const x = i % caroSize, y = Math.floor(i / caroSize);
    const attack = rate(i, 2), defend = rate(i, 1);
    const score = attack >= 100000 ? 500000 + attack
      : defend >= 100000 ? 300000 + defend
      : attack * 1.12 + defend * 1.20 - .08 * (Math.abs(x - 6) + Math.abs(y - 6));
    if (score > top) {
      top = score;
      best = i;
    }
  }
  return best;
}

function playCaro(onFinish, buttonEvent) {
  const board = new Uint8Array(caroSize * caroSize);
  const cells = [];
  let finished = false;
  const caption = document.createElement('p');
  caption.className = 'caro-caption';
  caption.setAttribute('role', 'status');
  caption.textContent = 'Lượt của bạn (X). Xếp 5 quân liền nhau để thắng.';
  const grid = document.createElement('div');
  grid.className = 'caro-grid';
  grid.setAttribute('aria-label', 'Bàn caro 13 nhân 13');

  function mark(index, player) {
    board[index] = player;
    const cell = cells[index];
    const symbol = player === 1 ? 'X' : 'O';
    cell.textContent = symbol;
    cell.classList.add(player === 1 ? 'player' : 'opponent');
    cell.setAttribute('aria-label', cell.getAttribute('aria-label') + ' ' + symbol);
    cell.disabled = true;
  }
  function end(text) {
    finished = true;
    caption.textContent = text;
    cells.forEach((cell) => { cell.disabled = true; });
    onFinish();
  }
  for (let i = 0; i < board.length; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.setAttribute('aria-label', 'Hàng ' + (Math.floor(i / caroSize) + 1) + ', cột ' + (i % caroSize + 1));
    cell.addEventListener('click', () => {
      if (finished || board[i]) return;
      mark(i, 1);
      if (caroWins(board, i, 1)) { end('Bạn thắng Thích Thể Hiện!'); return; }
      const next = caroMove(board);
      if (next < 0) { end('Ván cờ hòa.'); return; }
      mark(next, 2);
      if (caroWins(board, next, 2)) { end('Thích Thể Hiện thắng ván này.'); return; }
      if (!board.includes(0)) { end('Ván cờ hòa.'); return; }
      caption.textContent = 'Thích Thể Hiện đánh O ở hàng ' + (Math.floor(next / caroSize) + 1) + ', cột ' + (next % caroSize + 1) + '. Đến lượt bạn.';
    });
    cells.push(cell);
    grid.append(cell);
  }
  const restart = document.createElement('button');
  restart.className = 'choice';
  restart.type = 'button';
  restart.textContent = 'Ván mới';
  restart.addEventListener('click', () => playCaro(onFinish, { currentTarget: restart }));
  buttonEvent.currentTarget.parentElement.replaceChildren(caption, grid, restart);
  cells[Math.floor(board.length / 2)].focus();
}
