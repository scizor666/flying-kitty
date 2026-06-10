import {
  AdvancedDynamicTexture,
  Button,
  Control,
  Rectangle,
  StackPanel,
  TextBlock
} from '@babylonjs/gui';

const FONT = 'Trebuchet MS, Comic Sans MS, sans-serif';

function makeText(text: string, sizePx: number, color: string): TextBlock {
  const tb = new TextBlock('', text);
  tb.color = color;
  tb.fontSize = sizePx;
  tb.fontFamily = FONT;
  tb.resizeToFit = true;
  tb.shadowColor = 'rgba(0,0,0,0.5)';
  tb.shadowBlur = 4;
  tb.shadowOffsetY = 2;
  return tb;
}

export class Hud {
  private ui: AdvancedDynamicTexture;
  private scoreText: TextBlock;
  private timeText: TextBlock;
  private messageText: TextBlock;
  private messageTimer: ReturnType<typeof setTimeout> | null = null;
  private startPanel: Rectangle;
  private overPanel: Rectangle;
  private overTitle: TextBlock;
  private overStats: TextBlock;

  constructor(onStart: () => void, onReplay: () => void) {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI('hud');

    this.scoreText = makeText('Score: 9999', 30, 'white');
    this.scoreText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.scoreText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scoreText.left = '20px';
    this.scoreText.top = '14px';
    this.ui.addControl(this.scoreText);

    this.timeText = makeText('10:00', 30, 'white');
    this.timeText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.timeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.timeText.left = '-20px';
    this.timeText.top = '14px';
    this.ui.addControl(this.timeText);

    this.messageText = makeText('', 38, 'white');
    this.messageText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.messageText.top = '-60px';
    this.messageText.isVisible = false;
    this.ui.addControl(this.messageText);

    this.startPanel = this.makeOverlay();
    const startStack = new StackPanel();
    startStack.spacing = 18;
    this.startPanel.addControl(startStack);
    startStack.addControl(makeText('Flying Kitty: Find Cloudy! ☁️', 52, '#ffe066'));
    startStack.addControl(
      makeText('Cloudy is hiding behind one of 40 clouds.', 26, 'white')
    );
    startStack.addControl(
      makeText('Fly with arrow keys / WASD (or drag on a tablet).', 26, 'white')
    );
    startStack.addControl(
      makeText('Get close to a cloud, then press SPACE or tap it to peek!', 26, 'white')
    );
    startStack.addControl(makeText('Press SPACE to Start', 40, '#ffe066'));
    startStack.addControl(this.makeButton('start-btn', '▶  Start', onStart));
    this.ui.addControl(this.startPanel);

    this.overPanel = this.makeOverlay();
    this.overPanel.isVisible = false;
    const overStack = new StackPanel();
    overStack.spacing = 20;
    this.overPanel.addControl(overStack);
    this.overTitle = makeText('', 52, '#ffe066');
    this.overStats = makeText('', 30, 'white');
    this.overStats.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    overStack.addControl(this.overTitle);
    overStack.addControl(this.overStats);
    overStack.addControl(this.makeButton('replay-btn', '↻  Play Again', onReplay));
    this.ui.addControl(this.overPanel);
  }

  private makeOverlay(): Rectangle {
    const panel = new Rectangle();
    panel.width = 1;
    panel.height = 1;
    panel.background = 'rgba(20, 40, 70, 0.55)';
    panel.thickness = 0;
    panel.isPointerBlocker = true;
    return panel;
  }

  private makeButton(name: string, label: string, onClick: () => void): Button {
    const btn = Button.CreateSimpleButton(name, label);
    btn.width = '260px';
    btn.height = '64px';
    btn.color = 'white';
    btn.fontSize = 28;
    btn.fontFamily = FONT;
    btn.background = '#ff7eb6';
    btn.cornerRadius = 16;
    btn.thickness = 0;
    btn.onPointerUpObservable.add(onClick);
    return btn;
  }

  setScore(score: number): void {
    this.scoreText.text = `Score: ${score}`;
  }

  setTime(secondsLeft: number): void {
    this.timeText.text = Hud.formatTime(secondsLeft);
  }

  showMessage(text: string, color = 'white'): void {
    this.messageText.text = text;
    this.messageText.color = color;
    this.messageText.isVisible = true;
    if (this.messageTimer !== null) clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => {
      this.messageText.isVisible = false;
    }, 2000);
  }

  hideStart(): void {
    this.startPanel.isVisible = false;
  }

  showGameOver(won: boolean, timeSpentSeconds: number, score: number): void {
    this.overTitle.text = won ? 'Cloudy found! 🎉' : 'Cloudy got lost in the clouds forever… 😢';
    this.overStats.text =
      `Time spent: ${Hud.formatTime(timeSpentSeconds)}\n` + `Score: ${score}`;
    this.overPanel.isVisible = true;
  }

  hideGameOver(): void {
    this.overPanel.isVisible = false;
  }

  static formatTime(totalSeconds: number): string {
    const s = Math.max(0, Math.ceil(totalSeconds));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, '0')}`;
  }
}
