import { useRef, useEffect, useCallback, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ASSETS } from '@/game/assets';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, OBSTACLE_SIZE,
  PLAYER_ACCELERATION, PLAYER_MAX_SPEED, PLAYER_FRICTION,
  DASH_SPEED, DASH_DURATION, ENERGY_FILL_TIME,
  OBSTACLE_BASE_SPEED, OBSTACLE_SPEED_INCREASE,
  INITIAL_SPAWN_INTERVAL, MIN_SPAWN_INTERVAL,
  INITIAL_OBSTACLES_PER_SPAWN, MAX_OBSTACLES_PER_SPAWN,
  HITBOX_SHRINK,
} from '@/game/constants';
import type { Player, Obstacle, GameState } from '@/game/types';

const useImage = (src: string) => {
  const ref = useRef<HTMLImageElement | null>(null);
  if (!ref.current) {
    const img = new Image();
    img.src = src;
    ref.current = img;
  }
  return ref.current;
};

type TouchControls = {
  left: boolean;
  right: boolean;
  dash: boolean;
};

const DodgeGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [finalTime, setFinalTime] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const playerImg = useImage(ASSETS.player);
  const obstacleImg = useImage(ASSETS.obstacle);

  const keysRef = useRef<Set<string>>(new Set());
  const touchControlsRef = useRef<TouchControls>({ left: false, right: false, dash: false });
  const gameRef = useRef<{
    player: Player;
    obstacles: Obstacle[];
    elapsed: number;
    spawnTimer: number;
    animId: number;
    lastTime: number;
  } | null>(null);

  const setTouchPressed = useCallback((key: keyof TouchControls, pressed: boolean) => {
    touchControlsRef.current[key] = pressed;
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = {
      player: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - PLAYER_SIZE - 10,
        vx: 0,
        lastDir: 1,
        isDashing: false,
        dashTimer: 0,
        energy: 0,
      },
      obstacles: [],
      elapsed: 0,
      spawnTimer: 0,
      animId: 0,
      lastTime: 0,
    };
    keysRef.current.clear();
    touchControlsRef.current = { left: false, right: false, dash: false };
    setGameState('playing');
  }, []);

  useEffect(() => {
    const detectTouch = () => {
      setIsTouchDevice(
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    };

    detectTouch();
    window.addEventListener('resize', detectTouch);
    return () => window.removeEventListener('resize', detectTouch);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const g = gameRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    let dashWasDown = false;

    const loop = (timestamp: number) => {
      if (!g.lastTime) g.lastTime = timestamp;
      const dt = Math.min((timestamp - g.lastTime) / 1000, 0.05);
      g.lastTime = timestamp;
      g.elapsed += dt;

      const keys = keysRef.current;
      const touch = touchControlsRef.current;
      const p = g.player;

      const left = keys.has('ArrowLeft') || keys.has('KeyA') || touch.left;
      const right = keys.has('ArrowRight') || keys.has('KeyD') || touch.right;
      const dashDown = keys.has('Space') || touch.dash;

      let inputDir = 0;
      if (left) inputDir -= 1;
      if (right) inputDir += 1;
      if (inputDir !== 0) p.lastDir = inputDir;

      if (dashDown && !dashWasDown && p.energy >= 1 && !p.isDashing) {
        p.isDashing = true;
        p.dashTimer = DASH_DURATION;
        p.energy = 0;
        p.vx = p.lastDir * DASH_SPEED;
      }
      dashWasDown = dashDown;

      if (p.isDashing) {
        p.dashTimer -= dt;
        if (p.dashTimer <= 0) {
          p.isDashing = false;
        }
      }

      if (!p.isDashing) {
        if (inputDir !== 0) {
          p.vx += inputDir * PLAYER_ACCELERATION * dt;
        } else {
          p.vx -= p.vx * PLAYER_FRICTION * dt;
          if (Math.abs(p.vx) < 5) p.vx = 0;
        }
        p.vx = Math.max(-PLAYER_MAX_SPEED, Math.min(PLAYER_MAX_SPEED, p.vx));
      }

      p.x += p.vx * dt;
      p.x = Math.max(PLAYER_SIZE / 2, Math.min(CANVAS_WIDTH - PLAYER_SIZE / 2, p.x));

      if (!p.isDashing && p.energy < 1) {
        p.energy = Math.min(1, p.energy + dt / ENERGY_FILL_TIME);
      }

      const difficultyT = g.elapsed;
      const spawnInterval = Math.max(MIN_SPAWN_INTERVAL, INITIAL_SPAWN_INTERVAL - difficultyT * 0.018);
      const obstaclesPerSpawn = Math.min(
        MAX_OBSTACLES_PER_SPAWN,
        Math.floor(INITIAL_OBSTACLES_PER_SPAWN + difficultyT * 0.08)
      );

      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0) {
        g.spawnTimer = spawnInterval;
        for (let i = 0; i < obstaclesPerSpawn; i++) {
          const size = OBSTACLE_SIZE + Math.random() * 15;
          g.obstacles.push({
            x: size / 2 + Math.random() * (CANVAS_WIDTH - size),
            y: -size,
            speed: OBSTACLE_BASE_SPEED + Math.min(difficultyT * OBSTACLE_SPEED_INCREASE, 200),
            size,
          });
        }
      }

      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        g.obstacles[i].y += g.obstacles[i].speed * dt;
        if (g.obstacles[i].y > CANVAS_HEIGHT + 60) {
          g.obstacles.splice(i, 1);
        }
      }

      const pHalf = (PLAYER_SIZE * HITBOX_SHRINK) / 2;
      for (const obs of g.obstacles) {
        const oHalf = (obs.size * HITBOX_SHRINK) / 2;
        if (
          p.x - pHalf < obs.x + oHalf &&
          p.x + pHalf > obs.x - oHalf &&
          p.y - pHalf < obs.y + oHalf &&
          p.y + pHalf > obs.y - oHalf
        ) {
          setFinalTime(g.elapsed);
          setGameState('gameover');
          return;
        }
      }

      ctx.fillStyle = '#1e2a3a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#2a3b4f';
      ctx.fillRect(0, CANVAS_HEIGHT - 4, CANVAS_WIDTH, 4);

      for (const obs of g.obstacles) {
        ctx.drawImage(
          obstacleImg,
          obs.x - obs.size / 2,
          obs.y - obs.size / 2,
          obs.size,
          obs.size
        );
      }

      const pSize = PLAYER_SIZE;
      if (p.isDashing) {
        ctx.globalAlpha = 0.6;
      }
      ctx.drawImage(playerImg, p.x - pSize / 2, p.y - pSize / 2, pSize, pSize);
      ctx.globalAlpha = 1;

      if (p.isDashing) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.beginPath();
        ctx.ellipse(p.x - p.lastDir * 20, p.y, 20, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '14px "Press Start 2P", monospace';
      ctx.fillStyle = '#f5d76e';
      ctx.textAlign = 'left';
      ctx.fillText(`⏱ ${g.elapsed.toFixed(2)}s`, 12, 28);

      const barX = CANVAS_WIDTH - 160;
      const barY = 12;
      const barW = 140;
      const barH = 18;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      const fillColor = p.energy >= 1 ? '#a855f7' : '#22c55e';
      ctx.fillStyle = fillColor;
      ctx.fillRect(barX + 2, barY + 2, (barW - 4) * p.energy, barH - 4);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(p.energy >= 1 ? 'DASH READY!' : 'ENERGY', barX + barW / 2, barY + 13);

      g.animId = requestAnimationFrame(loop);
    };

    g.animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(g.animId);
  }, [gameState, playerImg, obstacleImg]);

  const handleButtonPress = useCallback((key: keyof TouchControls) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setTouchPressed(key, true);
  }, [setTouchPressed]);

  const handleButtonRelease = useCallback((key: keyof TouchControls) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setTouchPressed(key, false);
  }, [setTouchPressed]);

  return (
    <div className="min-h-screen bg-game-bg text-white select-none touch-none flex items-center justify-center px-2 py-4">
      <div className="relative flex w-full max-w-[600px] flex-col items-center gap-3">
        <div className="w-full text-center font-game text-[10px] leading-relaxed text-game-ui/80 sm:text-xs">
          {isTouchDevice ? '모바일: 좌우 이동 + DASH 버튼' : 'PC: 방향키/A·D 이동 + 스페이스 대쉬'}
        </div>

        <div className="relative w-full">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block h-auto w-full rounded-lg border-2 border-game-ui/30 shadow-2xl"
            style={{ imageRendering: 'auto', touchAction: 'none' }}
          />

          {gameState === 'menu' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="mx-4 flex flex-col items-center gap-6 rounded-2xl bg-foreground/80 p-6 backdrop-blur-sm sm:p-10">
                <h1 className="text-center font-game text-xl leading-relaxed text-game-ui sm:text-2xl">
                  💩 똥 피하기
                </h1>
                <p className="max-w-xs text-center font-game text-[10px] leading-loose text-muted-foreground">
                  {isTouchDevice ? (
                    <>
                      좌우 버튼: 이동<br />
                      DASH: 대쉬<br />
                      최대한 오래 살아남아라!
                    </>
                  ) : (
                    <>
                      방향키/A·D: 이동<br />
                      스페이스바: 대쉬<br />
                      최대한 오래 살아남아라!
                    </>
                  )}
                </p>
                <button
                  onClick={startGame}
                  className="rounded-lg bg-primary px-8 py-3 font-game text-sm text-primary-foreground transition-all active:scale-95 hover:brightness-110"
                >
                  게임 시작
                </button>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="mx-4 flex flex-col items-center gap-6 rounded-2xl bg-foreground/80 p-6 backdrop-blur-sm sm:p-10">
                <h2 className="font-game text-xl text-accent">GAME OVER</h2>
                <p className="font-game text-lg text-game-ui">{finalTime.toFixed(2)}초</p>
                <button
                  onClick={startGame}
                  className="rounded-lg bg-primary px-8 py-3 font-game text-sm text-primary-foreground transition-all active:scale-95 hover:brightness-110"
                >
                  다시 하기
                </button>
              </div>
            </div>
          )}
        </div>

        {isTouchDevice && gameState === 'playing' && (
          <div className="grid w-full grid-cols-3 gap-2">
            <button
              className="rounded-xl border border-white/15 bg-white/10 py-4 font-game text-sm active:scale-[0.98]"
              onPointerDown={handleButtonPress('left')}
              onPointerUp={handleButtonRelease('left')}
              onPointerCancel={handleButtonRelease('left')}
              onPointerLeave={handleButtonRelease('left')}
            >
              ◀ LEFT
            </button>
            <button
              className="rounded-xl border border-white/15 bg-fuchsia-500/30 py-4 font-game text-sm active:scale-[0.98]"
              onPointerDown={handleButtonPress('dash')}
              onPointerUp={handleButtonRelease('dash')}
              onPointerCancel={handleButtonRelease('dash')}
              onPointerLeave={handleButtonRelease('dash')}
            >
              DASH
            </button>
            <button
              className="rounded-xl border border-white/15 bg-white/10 py-4 font-game text-sm active:scale-[0.98]"
              onPointerDown={handleButtonPress('right')}
              onPointerUp={handleButtonRelease('right')}
              onPointerCancel={handleButtonRelease('right')}
              onPointerLeave={handleButtonRelease('right')}
            >
              RIGHT ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DodgeGame;
