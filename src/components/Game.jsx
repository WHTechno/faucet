// src/components/Game.jsx
import { useEffect, useRef, useState } from 'react';
import p5 from 'p5';

export default function Game({ setScore, walletAddress }) {
  const sketchRef = useRef(null);
  const p5Instance = useRef(null);
  const [scoreHistory, setScoreHistory] = useState([]);

  useEffect(() => {
    // Load score history from localStorage on mount
    const saved = localStorage.getItem('snake_score_history');
    if (saved) setScoreHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const sketch = (p) => {
      let snake = [];
      let food;
      const tileSize = 32;
      let score = 0;
      let gameOver = false;
      let saved = false; // Flag agar skor hanya disimpan sekali

      let dx = 0;
      let dy = 0;
      let started = false;
      let shouldGrow = false;

      let imgHeadRight, imgBody, imgTail, imgFood, imgWall;

      p.preload = () => {
        imgHeadRight = p.loadImage('/assets/snake/snake_green_head_64.png');
        imgBody = p.loadImage('/assets/snake/snake_green_blob_64.png');
        imgTail = p.loadImage('/assets/snake/snake_green_xx.png');
        imgFood = p.loadImage('/assets/snake/apple_alt_64.png');
        imgWall = p.loadImage('/assets/snake/wall_block_64_0.png');
      };

      const initGame = () => {
        snake = [];
        const cols = p.floor(p.width / tileSize);
        const rows = p.floor(p.height / tileSize);
        const startX = p.floor(cols / 2);
        const startY = p.floor(rows / 2);
        snake[0] = p.createVector(startX, startY);
        dx = 0;
        dy = 0;
        food = createFood();
        score = 0;
        shouldGrow = false;
        gameOver = false;
        started = false;
        saved = false; // Reset flag saat restart game
        if (setScore) setScore(score);
      };

      const createFood = () => {
        const cols = p.floor(p.width / tileSize);
        const rows = p.floor(p.height / tileSize);
        let pos;
        do {
          pos = p.createVector(
            p.floor(p.random(1, cols - 1)),
            p.floor(p.random(1, rows - 1))
          );
        } while (snake.some(s => s.x === pos.x && s.y === pos.y));
        return pos;
      };

      // Simpan skor ke history skor di localStorage
      const saveScoreToHistory = (finalScore) => {
        if (finalScore <= 0 || !walletAddress) return;

        let current = JSON.parse(localStorage.getItem('snake_score_history')) || [];

        current.push({
          address: walletAddress,
          score: finalScore,
          date: new Date().toISOString(),
        });

        // Simpan ulang
        localStorage.setItem('snake_score_history', JSON.stringify(current));
        setScoreHistory(current);
      };

      p.setup = () => {
        p.createCanvas(1200, 400);
        p.frameRate(3);
        initGame();
      };

      p.draw = () => {
        // Background gradient ungu-hijau (manual fill rect + gradient)
        const ctx = p.drawingContext;
        const gradient = ctx.createLinearGradient(0, 0, p.width, 0);
        gradient.addColorStop(0, '#6b21a8'); // purple-700
        gradient.addColorStop(0.5, '#4c1d95'); // purple-800
        gradient.addColorStop(1, '#16a34a'); // green-600
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, p.width, p.height);

        // Draw walls
        for (let x = 0; x < p.width; x += tileSize) {
          p.image(imgWall, x, 0, tileSize, tileSize);
          p.image(imgWall, x, p.height - tileSize, tileSize, tileSize);
        }
        for (let y = 0; y < p.height; y += tileSize) {
          p.image(imgWall, 0, y, tileSize, tileSize);
          p.image(imgWall, p.width - tileSize, y, tileSize, tileSize);
        }

        if (gameOver) {
          p.fill(255, 255, 255, 220);
          p.textSize(32);
          p.textAlign(p.CENTER, p.CENTER);
          p.text('Game Over', p.width / 2, p.height / 2 - 20);
          p.textSize(20);
          p.text(`Score: ${score}`, p.width / 2, p.height / 2 + 10);
          p.textSize(16);
          p.text('Press SPACE to Restart', p.width / 2, p.height / 2 + 40);

          // Simpan skor hanya sekali
          if (!saved) {
            saveScoreToHistory(score);
            saved = true;
          }

          return;
        }

        if (!started) {
          p.fill(200, 200, 200, 180);
          p.textSize(20);
          p.textAlign(p.CENTER, p.CENTER);
          p.text('Press Arrow Key to Start', p.width / 2, p.height / 2);
          return;
        }

        // Move snake body
        for (let i = snake.length - 1; i > 0; i--) {
          snake[i] = snake[i - 1].copy();
        }

        snake[0].x += dx;
        snake[0].y += dy;

        // Check collision with wall
        if (
          snake[0].x < 1 ||
          snake[0].y < 1 ||
          snake[0].x >= p.width / tileSize - 1 ||
          snake[0].y >= p.height / tileSize - 1
        ) {
          gameOver = true;
          return;
        }

        // Check collision with self
        for (let i = 1; i < snake.length; i++) {
          if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
            gameOver = true;
            return;
          }
        }

        // Check food collision
        if (snake[0].x === food.x && snake[0].y === food.y) {
          score++;
          if (setScore) setScore(score);
          shouldGrow = true;
          food = createFood();
        }

        if (shouldGrow) {
          snake.push(snake[snake.length - 1].copy());
          shouldGrow = false;
        }

        p.image(imgFood, food.x * tileSize, food.y * tileSize, tileSize, tileSize);

        // Draw snake
        for (let i = 0; i < snake.length; i++) {
          const posX = snake[i].x * tileSize;
          const posY = snake[i].y * tileSize;

          if (i === 0) {
            p.push();
            p.translate(posX + tileSize / 2, posY + tileSize / 2);

            let angle = 0;
            if (dx === 1) angle = 0;
            else if (dx === -1) angle = p.PI;
            else if (dy === 1) angle = p.HALF_PI;
            else if (dy === -1) angle = -p.HALF_PI;

            p.rotate(angle);
            p.image(imgHeadRight, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
            p.pop();
          } else if (i === snake.length - 1) {
            p.image(imgTail, posX, posY, tileSize, tileSize);
          } else {
            p.image(imgBody, posX, posY, tileSize, tileSize);
          }
        }
      };

      p.keyPressed = () => {
        if (!started) started = true;

        if (p.keyCode === p.LEFT_ARROW && dx === 0) {
          dx = -1;
          dy = 0;
        } else if (p.keyCode === p.RIGHT_ARROW && dx === 0) {
          dx = 1;
          dy = 0;
        } else if (p.keyCode === p.UP_ARROW && dy === 0) {
          dx = 0;
          dy = -1;
        } else if (p.keyCode === p.DOWN_ARROW && dy === 0) {
          dx = 0;
          dy = 1;
        } else if (p.key === ' ') {
          initGame();
        }
      };
    };

    p5Instance.current = new p5(sketch, sketchRef.current);
    return () => {
      p5Instance.current.remove();
    };
  }, [setScore, walletAddress]);

  return (
    <div>
      <div ref={sketchRef} className="rounded-lg overflow-hidden shadow-lg border-4 border-green-600 mx-auto"></div>

      {/* History Score */}
      <div className="mt-4 p-4 bg-white bg-opacity-90 rounded shadow max-w-md mx-auto text-gray-900">
        <h3 className="text-xl font-bold mb-2 text-center">History Scores</h3>
        {scoreHistory.length === 0 && (
          <p className="text-center">No scores submitted yet.</p>
        )}
        <ol className="list-decimal list-inside space-y-1 max-h-64 overflow-auto">
          {scoreHistory.map(({ address, score, date }, idx) => (
            <li key={idx} className="flex justify-between">
              <span className="truncate max-w-[250px]" title={address}>{address}</span>
              <span>{score}</span>
              <span className="text-gray-500 text-sm ml-4 whitespace-nowrap">
                {new Date(date).toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
