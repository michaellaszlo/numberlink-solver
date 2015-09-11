Solver = {};

Solver.readPuzzle = function (name) {
  var lines = puzzles[name],
      numRows = lines.length,
      numCols = lines[0].length,
      puzzle = new Array(numRows);
  for (var r = 0; r < numRows; ++r) {
    var row = puzzle[r] = new Array(numCols);
    for (var c = 0; c < numCols; ++c) {
      row[c] = lines[r][c];
      if (row[c] == '.') {
        row[c] = null;
      }
    }
  }
  return puzzle;
};

Solver.puzzle = Solver.readPuzzle('aiko');

Solver.message = function (line, replace) {
  line = line || '';
  if (replace) {
    Solver.messageBox.innerHTML = '';
  }
  var content = document.createElement('div');
  content.innerHTML = line;
  Solver.messageBox.appendChild(content);
  console.log(line);
};

window.onload = function () {
  var puzzle = Solver.puzzle,
      numRows = puzzle.length,
      numCols = puzzle[0].length,
      pieces = [ [0, 2], [1, 3], [0, 1], [1, 2], [2, 3], [3, 0] ],
      chars = [ '&#x2502;', '&#x2500;',
                '&#x2514;', '&#x250c;', '&#x2510;', '&#x2518;' ],
      numPieces = pieces.length,
      opposite = [ 2, 3, 0, 1 ],
      dr = [ -1, 0, 1, 0 ],
      dc = [ 0, 1, 0, -1 ],
      state = new Array(numRows),
      mark = new Array(numRows),
      colors = [],
      endpoints = {},
      finished = false,
      fillCount = 0,
      startTime;

  function display() {
    for (var r = 0; r < numRows; ++r) {
      var row = state[r].map(function (piece, c) {
        return (piece ? piece.char : (puzzle[r][c] ? puzzle[r][c] : '.'));
      });
      Solver.message(row.join(' '));
    }
  }

  function feasibleSeek(r, c, color, mustFind) {
    var piece = state[r][c],
        dirs = piece.dirs;
    for (var i = dirs.length - 1; i >= 0; --i) {
      var dir = dirs[i],
          R = r + dr[dir],
          C = c + dc[dir];
      if (R == -1 || R == numRows || C == -1 || C == numCols) {
        return false;
      }
      if (mark[R][C]) {
        continue;
      }
      var piece = state[R][C];
      if (!piece) {
        if (puzzle[R][C] !== null) {
          return puzzle[R][C] === color;
        }
        return (mustFind ? false : true); 
      }
      if (!piece.hasDir[opposite[dir]]) {
        return false;
      }
      mark[r][c] = true;
      var result = feasibleSeek(R, C, color);
      mark[r][c] = false;
      return result;
    }
  }

  function feasiblePaths(mustFind) {
    var pathCount = 0;
    for (var i = colors.length - 1; i >= 0; --i) {
      var color = colors[i];
      for (var j = endpoints[color].length - 1; j >= 0; --j) {
        var endpoint = endpoints[color][j],
            r = endpoint.r,
            c = endpoint.c,
            dir,
            count = 0;
        for (var k = 0; k < 4; ++k) {
          var R = r + dr[k],
              C = c + dc[k];
          if (R == -1 || R == numRows || C == -1 || C == numCols) {
            continue;
          }
          var other = state[R][C];
          if (other && other.hasDir[opposite[k]]) {
            dir = k;
            ++count;
          }
        }
        if (count == 0) {
          continue;
        }
        if (count > 1) {
          return false;
        }
        mark[r][c] = true;
        var feasible = feasibleSeek(r + dr[dir], c + dc[dir], color, mustFind);
        mark[r][c] = false;
        if (!feasible) {
          return false;
        }
        ++pathCount;
      }
    }
    //Solver.message('<span style="color:red;">' + pathCount + ' paths</span>');
    return (mustFind ? pathCount == 2 * colors.length : true);
  }

  function connectsToward(r, c, dir) {
    var R = r + dr[dir],
        C = c + dc[dir];
    if (R == -1 || R == numRows || C == -1 || C == numCols) {
      return false;
    }
    var other = state[R][C];
    if (!other) {
      return true;
    }
    return other.hasDir[opposite[dir]];
  }

  function seek(r, c) {
    if (finished) {
      return;
    }
    if (r == -1 || c == numCols) {
      var pos = r + c + 1;
      if (pos < numRows) {
        r = pos;
        c = 0;
      } else {
        r = numRows - 1;
        c = pos - numRows + 1;
      }
      if (c == numCols) {
        ++fillCount;
        if (fillCount % 1000 == 0) {
          var elapsed = (Date.now() - startTime) / 1000;
          Solver.message('filled ' + fillCount + ' grids in ' + elapsed + ' s');
          if (elapsed > 10) {
            finished = true;
            return;
          }
        }
        if (!feasiblePaths(true)) {
          return;
        }
        var elapsed = (Date.now() - startTime) / 1000;
        Solver.message('\nsolved in ' + elapsed + ' s\n');
        display();
        finished = true;
        return;
      }
    }
    if (puzzle[r][c] !== null) {
      seek(r - 1, c + 1);
      return;
    }
    for (var i = 0; i != numPieces; ++i) {
      var piece = pieces[i],
          a = piece.dirs[0],
          b = piece.dirs[1];
      state[r][c] = piece;
      if (!connectsToward(r, c, a) || !connectsToward(r, c, b)) {
        continue;
      }
      for (var j = 0; j != 4; ++j) {
        var R = r + dr[j],
            C = c + dc[j];
        if (R == -1 || R == numRows || C == -1 || C == numCols) {
          continue;
        }
        var other = state[R][C];
        if (other && other.hasDir[opposite[j]] && !piece.hasDir[j]) {
          break;
        }
      }
      if (j != 4) {
        continue;
      }
      if (!feasiblePaths()) {
        continue;
      }
      seek(r - 1, c + 1);
      if (finished) {
        return;
      }
    }
    state[r][c] = null;
  }

  Solver.messageBox = document.getElementById('messageBox');

  // Initialize the six possible state pieces.
  pieces = pieces.map(function (piece, ix) {
    var a = piece[0], b = piece[1],
        hasDir = {};
    hasDir[a] = hasDir[b] = true;
    return { hasDir: hasDir, dirs: [ a, b ], char: chars[ix] };
  });

  for (var r = 0; r < numRows; ++r) {
    state[r] = new Array(numCols);
    mark[r] = new Array(numCols);
    for (var c = 0; c < numCols; ++c) {
      state[r][c] = null;
      mark[r][c] = false;
      var color = puzzle[r][c];
      if (color === null) {
        continue;
      }
      if (endpoints[color] === undefined) {
        colors.push(color);
        endpoints[color] = [];
      }
      endpoints[color].push({ r: r, c: c });
    }
  }

  display();
  startTime = Date.now();
  seek(0, 0);
};
