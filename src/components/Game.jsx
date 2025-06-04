import { useEffect, useRef } from 'react';
import p5 from 'p5';

export default function Game({ setScore }) {
  const sketchRef = useRef(null);
  const p5Instance = useRef(null);

  useEffect(() => {
    const sketch = (p) => {
      let snake = [];
      let food;
      const tileSize = 32; // ukuran tile, sesuaikan dengan gambar
      let score = 0;
      let gameOver = false;

      let dx = 0;
      let dy = 0;
      let started = false;
      let shouldGrow = false;

      // Gambar
      let imgHeadRight, imgBody, imgTail, imgFood, imgWall;

      p.preload = () => {
        // Load image sesuai path public/assets/snake/
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
        // Mulai ular di tengah area dalam dinding
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
        if (setScore) setScore(score);
      };

      const createFood = () => {
        const cols = p.floor(p.width / tileSize);
        const rows = p.floor(p.height / tileSize);
        let pos;
        do {
          // Pastikan food muncul di dalam area, bukan di dinding
          pos = p.createVector(
            p.floor(p.random(1, cols - 1)),
            p.floor(p.random(1, rows - 1))
          );
        } while (snake.some(s => s.x === pos.x && s.y === pos.y));
        return pos;
      };

      p.setup = () => {
        p.createCanvas(1200, 400);
        p.frameRate(5);
        initGame();
      };

      p.draw = () => {
        p.background(240);

        // Gambar dinding (sekitar pinggir)
        for (let x = 0; x < p.width; x += tileSize) {
          // atas
          p.image(imgWall, x, 0, tileSize, tileSize);
          // bawah
          p.image(imgWall, x, p.height - tileSize, tileSize, tileSize);
        }
        for (let y = 0; y < p.height; y += tileSize) {
          // kiri
          p.image(imgWall, 0, y, tileSize, tileSize);
          // kanan
          p.image(imgWall, p.width - tileSize, y, tileSize, tileSize);
        }

        if (gameOver) {
          p.fill(50);
          p.textSize(32);
          p.textAlign(p.CENTER, p.CENTER);
          p.text('Game Over', p.width / 2, p.height / 2 - 20);
          p.textSize(20);
          p.text(`Score: ${score}`, p.width / 2, p.height / 2 + 10);
          p.textSize(16);
          p.text('Press SPACE to Restart', p.width / 2, p.height / 2 + 40);
          return;
        }

        if (!started) {
          p.fill(70);
          p.textSize(20);
          p.textAlign(p.CENTER, p.CENTER);
          p.text('Press Arrow Key to Start', p.width / 2, p.height / 2);
          return;
        }

        // Move body
        for (let i = snake.length - 1; i > 0; i--) {
          snake[i] = snake[i - 1].copy();
        }

        // Move head
        snake[0].x += dx;
        snake[0].y += dy;

        // Check wall collision (termasuk dinding)
        if (
          snake[0].x < 1 || // karena dinding di tile 0
          snake[0].y < 1 ||
          snake[0].x >= p.width / tileSize - 1 ||
          snake[0].y >= p.height / tileSize - 1
        ) {
          gameOver = true;
          return;
        }

        // Check self collision
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

        // Draw food
        p.image(imgFood, food.x * tileSize, food.y * tileSize, tileSize, tileSize);

        // Draw snake
        for (let i = 0; i < snake.length; i++) {
          const posX = snake[i].x * tileSize;
          const posY = snake[i].y * tileSize;

          if (i === 0) {
            // Head dengan rotasi sesuai arah
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
            // Tail
            p.image(imgTail, posX, posY, tileSize, tileSize);
          } else {
            // Body
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
  }, [setScore]);

  return (
    <div>
      <div ref={sketchRef}></div>
    </div>
  );
}
