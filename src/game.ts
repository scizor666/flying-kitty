import {
  Color3,
  Color4,
  Engine,
  FreeCamera,
  HemisphericLight,
  DirectionalLight,
  HighlightLayer,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  Texture,
  Vector3
} from '@babylonjs/core';
import { Hud } from './hud';
import {
  CAMERA_DISTANCE,
  CHECK_RADIUS,
  CLOUD_COUNT,
  DEBUG,
  FIELD,
  GRID_COLS,
  GRID_ROWS,
  KITTY_SPEED,
  KITTY_Z,
  MIN_SCORE,
  SCORE_DECREMENT,
  START_SCORE,
  TOTAL_TIME_SECONDS
} from './config';

type GameState = 'start' | 'playing' | 'won' | 'lost';

interface CloudInfo {
  mesh: Mesh;
  material: StandardMaterial;
  checked: boolean;
}

const KITTY_START = new Vector3(-50, 30, KITTY_Z);

export class Game {
  private engine: Engine;
  private scene: Scene;
  private hud: Hud;
  private camera: FreeCamera;
  private highlight: HighlightLayer;

  private clouds: CloudInfo[] = [];
  private cloudByMesh = new Map<Mesh, number>();
  private winningIndex = 0;
  private highlightedIndex = -1;

  private kitty!: Mesh;
  private kittyPos = KITTY_START.clone();
  private cloudySprite!: Mesh;

  private state: GameState = 'start';
  private score = START_SCORE;
  private timeLeft = TOTAL_TIME_SECONDS;
  private elapsed = 0;
  private replayAllowedAt = 0;

  private keys = new Set<string>();
  private steering = false;
  private steerTarget: Vector3 | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
    this.scene = new Scene(this.engine);
    // Right-handed so that with the camera at +Z looking at the play field,
    // world +X maps to screen-right and the arrow keys aren't mirrored.
    this.scene.useRightHandedSystem = true;
    this.scene.clearColor = new Color4(0.49, 0.75, 0.93, 1);
    this.scene.fogMode = Scene.FOGMODE_LINEAR;
    this.scene.fogStart = 70;
    this.scene.fogEnd = 230;
    this.scene.fogColor = new Color3(0.6, 0.8, 0.95);

    this.camera = new FreeCamera(
      'camera',
      KITTY_START.add(new Vector3(0, 2, CAMERA_DISTANCE)),
      this.scene
    );
    this.camera.setTarget(KITTY_START);

    const hemi = new HemisphericLight('hemi', new Vector3(0.2, 1, 0.3), this.scene);
    hemi.intensity = 0.95;
    const sun = new DirectionalLight('sun', new Vector3(-0.4, -1, -0.5), this.scene);
    sun.intensity = 0.4;

    this.highlight = new HighlightLayer('hl', this.scene);
    this.highlight.innerGlow = false;
    this.highlight.blurHorizontalSize = 1.6;
    this.highlight.blurVerticalSize = 1.6;

    this.createBackgroundClouds();
    this.createClouds();
    this.createKitty();
    this.createCloudySprite();
    // Alpha-blended sprites corrupt the highlight stencil mask, making the
    // glow fill the cloud solid inside the sprite's quad — keep them out.
    this.highlight.addExcludedMesh(this.kitty);
    this.highlight.addExcludedMesh(this.cloudySprite);

    this.hud = new Hud(
      () => this.startGame(),
      () => this.startGame()
    );
    this.hud.setScore(this.score);
    this.hud.setTime(this.timeLeft);

    this.pickWinningCloud();
    this.wireInput();

    this.scene.onBeforeRenderObservable.add(() => {
      this.update(this.engine.getDeltaTime() / 1000);
    });
    this.engine.runRenderLoop(() => this.scene.render());
    window.addEventListener('resize', () => this.engine.resize());

    if (DEBUG) {
      (window as unknown as Record<string, unknown>).cloudyGame = this;
    }
  }

  // ---------- scene construction ----------

  private createCloudBlob(name: string, pickable: boolean): Mesh {
    const parts: Mesh[] = [];
    const count = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const radius = 1.7 + Math.random() * 1.5;
      const sphere = MeshBuilder.CreateSphere(
        `${name}-p${i}`,
        { diameter: radius * 2, segments: 12 },
        this.scene
      );
      sphere.position.set(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 1.8,
        (Math.random() - 0.5) * 2
      );
      parts.push(sphere);
    }
    const blob = Mesh.MergeMeshes(parts, true, true);
    if (!blob) throw new Error('cloud merge failed');
    blob.name = name;
    blob.scaling.y = 0.72;
    blob.isPickable = pickable;
    return blob;
  }

  private createBackgroundClouds(): void {
    const mat = new StandardMaterial('bg-cloud-mat', this.scene);
    mat.diffuseColor = new Color3(1, 1, 1);
    mat.emissiveColor = new Color3(0.25, 0.27, 0.3);
    mat.specularColor = Color3.Black();
    mat.alpha = 0.9;
    for (let i = 0; i < 22; i++) {
      const blob = this.createCloudBlob(`bg-cloud-${i}`, false);
      blob.material = mat;
      const scale = 1.5 + Math.random() * 2.5;
      blob.scaling.scaleInPlace(scale);
      blob.scaling.y *= 0.72;
      blob.position.set(
        FIELD.minX - 40 + Math.random() * (FIELD.maxX - FIELD.minX + 80),
        Math.random() * 70,
        -60 - Math.random() * 110
      );
    }
  }

  private createClouds(): void {
    const spanX = FIELD.maxX - FIELD.minX;
    const cellX = (spanX - 12) / (GRID_COLS - 1);
    const cellY = 46 / (GRID_ROWS - 1);
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const mesh = this.createCloudBlob(`cloud-${i}`, true);
      const material = new StandardMaterial(`cloud-mat-${i}`, this.scene);
      mesh.material = material;
      mesh.position.set(
        FIELD.minX + 6 + col * cellX + (Math.random() - 0.5) * 6,
        7 + row * cellY + (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 10
      );
      const scale = 0.85 + Math.random() * 0.35;
      mesh.scaling.scaleInPlace(scale);
      const info: CloudInfo = { mesh, material, checked: false };
      this.setCloudLook(info, false);
      this.clouds.push(info);
      this.cloudByMesh.set(mesh, i);
    }
  }

  private setCloudLook(cloud: CloudInfo, checked: boolean): void {
    if (checked) {
      cloud.material.diffuseColor = new Color3(0.55, 0.55, 0.6);
      cloud.material.emissiveColor = new Color3(0.24, 0.24, 0.28);
      cloud.material.alpha = 0.9;
    } else {
      cloud.material.diffuseColor = new Color3(1, 1, 1);
      cloud.material.emissiveColor = new Color3(0.5, 0.51, 0.55);
      cloud.material.alpha = 1;
    }
    cloud.material.specularColor = Color3.Black();
    cloud.checked = checked;
  }

  private makeSpriteMaterial(name: string, url: string): StandardMaterial {
    const mat = new StandardMaterial(name, this.scene);
    const tex = new Texture(url, this.scene);
    tex.hasAlpha = true;
    mat.emissiveTexture = tex;
    mat.opacityTexture = tex;
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    return mat;
  }

  private createKitty(): void {
    this.kitty = MeshBuilder.CreatePlane(
      'kitty',
      { width: 7.4, height: 5.5 },
      this.scene
    );
    this.kitty.material = this.makeSpriteMaterial('kitty-mat', 'assets/flying-kitty.png');
    this.kitty.isPickable = false;
    this.kitty.position.copyFrom(this.kittyPos);
  }

  private createCloudySprite(): void {
    this.cloudySprite = MeshBuilder.CreatePlane(
      'cloudy',
      { width: 4.2, height: 9 },
      this.scene
    );
    this.cloudySprite.material = this.makeSpriteMaterial('cloudy-mat', 'assets/cloudy.png');
    this.cloudySprite.isPickable = false;
    this.cloudySprite.setEnabled(false);
  }

  // ---------- game flow ----------

  private pickWinningCloud(): void {
    if (DEBUG && this.winningIndex >= 0 && this.clouds[this.winningIndex]) {
      const old = this.clouds[this.winningIndex].mesh;
      old.renderOutline = false;
    }
    this.winningIndex = Math.floor(Math.random() * CLOUD_COUNT);
    if (DEBUG) {
      const mesh = this.clouds[this.winningIndex].mesh;
      mesh.renderOutline = true;
      mesh.outlineColor = Color3.Red();
      mesh.outlineWidth = 0.12;
    }
  }

  private startGame(): void {
    if (this.state === 'playing') return;
    if (performance.now() < this.replayAllowedAt) return;
    this.hud.hideStart();
    this.hud.hideGameOver();

    this.score = START_SCORE;
    this.timeLeft = TOTAL_TIME_SECONDS;
    this.elapsed = 0;
    this.kittyPos = KITTY_START.clone();
    this.steerTarget = null;
    this.steering = false;
    this.cloudySprite.setEnabled(false);
    for (const cloud of this.clouds) {
      this.setCloudLook(cloud, false);
      cloud.mesh.visibility = 1;
    }
    this.pickWinningCloud();
    this.hud.setScore(this.score);
    this.hud.setTime(this.timeLeft);
    this.state = 'playing';
  }

  private checkCloud(index: number): void {
    if (this.state !== 'playing') return;
    const cloud = this.clouds[index];
    if (index === this.winningIndex) {
      this.win(cloud);
    } else {
      this.score = Math.max(MIN_SCORE, this.score - SCORE_DECREMENT);
      this.hud.setScore(this.score);
      this.setCloudLook(cloud, true);
      this.hud.showMessage('No Cloudy here.');
    }
  }

  private win(cloud: CloudInfo): void {
    this.state = 'won';
    cloud.mesh.visibility = 0.3;
    this.cloudySprite.position.copyFrom(cloud.mesh.position);
    this.cloudySprite.position.z += 5;
    this.cloudySprite.setEnabled(true);
    this.hud.showMessage('Cloudy found!', '#ffe066');
    this.replayAllowedAt = performance.now() + 1500;
    setTimeout(() => {
      this.hud.showGameOver(true, this.elapsed, this.score);
    }, 1500);
  }

  private lose(): void {
    this.state = 'lost';
    this.replayAllowedAt = performance.now() + 800;
    this.hud.setTime(0);
    this.hud.showGameOver(false, TOTAL_TIME_SECONDS, this.score);
  }

  // ---------- input ----------

  private wireInput(): void {
    const GAME_KEYS = new Set([
      'Space',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown'
    ]);
    // Listen on window (not the canvas) so SPACE works on the start screen
    // before the canvas has ever been focused.
    window.addEventListener('keydown', (event) => {
      if (GAME_KEYS.has(event.code)) event.preventDefault();
      this.keys.add(event.code);
      if (event.code === 'Space' && !event.repeat) {
        if (this.state === 'playing') {
          if (this.highlightedIndex >= 0) this.checkCloud(this.highlightedIndex);
        } else {
          this.startGame();
        }
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });

    this.scene.onPointerObservable.add((pi) => {
      if (this.state !== 'playing') return;
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        const picked = pi.pickInfo?.pickedMesh;
        if (picked && this.cloudByMesh.has(picked as Mesh)) {
          const index = this.cloudByMesh.get(picked as Mesh)!;
          if (this.distanceToCloud(index) <= CHECK_RADIUS) {
            this.checkCloud(index);
            return;
          }
        }
        this.steering = true;
        this.updateSteerTarget();
      } else if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (this.steering) this.updateSteerTarget();
      } else if (pi.type === PointerEventTypes.POINTERUP) {
        this.steering = false;
        this.steerTarget = null;
      }
    });
  }

  private updateSteerTarget(): void {
    const ray = this.scene.createPickingRay(
      this.scene.pointerX,
      this.scene.pointerY,
      null,
      this.camera
    );
    if (Math.abs(ray.direction.z) < 1e-6) return;
    const t = (KITTY_Z - ray.origin.z) / ray.direction.z;
    if (t <= 0) return;
    this.steerTarget = ray.origin.add(ray.direction.scale(t));
  }

  private distanceToCloud(index: number): number {
    const p = this.clouds[index].mesh.position;
    const dx = p.x - this.kittyPos.x;
    const dy = p.y - this.kittyPos.y;
    return Math.hypot(dx, dy);
  }

  // ---------- per-frame update ----------

  private update(dt: number): void {
    if (this.state === 'playing') {
      this.timeLeft -= dt;
      this.elapsed += dt;
      this.hud.setTime(this.timeLeft);
      if (this.timeLeft <= 0) {
        this.lose();
        return;
      }
      this.moveKitty(dt);
      this.updateProximityHighlight();
    }

    const bob = Math.sin(performance.now() / 350) * 0.35;
    this.kitty.position.set(this.kittyPos.x, this.kittyPos.y + bob, this.kittyPos.z);

    const camTarget = new Vector3(
      this.kittyPos.x,
      this.kittyPos.y + 2,
      this.kittyPos.z + CAMERA_DISTANCE
    );
    Vector3.LerpToRef(this.camera.position, camTarget, Math.min(1, dt * 4), this.camera.position);
    this.camera.setTarget(new Vector3(this.kittyPos.x, this.kittyPos.y, 0));
  }

  private moveKitty(dt: number): void {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) dx -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) dx += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) dy += 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) dy -= 1;

    if (dx === 0 && dy === 0 && this.steerTarget) {
      dx = this.steerTarget.x - this.kittyPos.x;
      dy = this.steerTarget.y - this.kittyPos.y;
      if (Math.hypot(dx, dy) < 1) {
        dx = 0;
        dy = 0;
      }
    }

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      this.kittyPos.x += (dx / len) * KITTY_SPEED * dt;
      this.kittyPos.y += (dy / len) * KITTY_SPEED * dt;
      this.kittyPos.x = Math.min(FIELD.maxX, Math.max(FIELD.minX, this.kittyPos.x));
      this.kittyPos.y = Math.min(FIELD.maxY, Math.max(FIELD.minY, this.kittyPos.y));
      if (dx < -0.01) this.kitty.scaling.x = -1;
      else if (dx > 0.01) this.kitty.scaling.x = 1;
      this.kitty.rotation.z = (dy / len) * 0.12 * Math.sign(this.kitty.scaling.x);
    } else {
      this.kitty.rotation.z = 0;
    }
  }

  private updateProximityHighlight(): void {
    let nearest = -1;
    let nearestDist = Infinity;
    for (let i = 0; i < this.clouds.length; i++) {
      const d = this.distanceToCloud(i);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    const next = nearestDist <= CHECK_RADIUS ? nearest : -1;
    if (next === this.highlightedIndex) return;
    if (this.highlightedIndex >= 0) {
      this.highlight.removeMesh(this.clouds[this.highlightedIndex].mesh);
    }
    if (next >= 0) {
      this.highlight.addMesh(this.clouds[next].mesh, new Color3(1, 0.9, 0.3));
    }
    this.highlightedIndex = next;
  }
}
