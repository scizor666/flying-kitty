import { AdvancedDynamicTexture, Control, TextBlock } from '@babylonjs/gui';
import { CLOUD_COUNT } from './config';
import { loadPlayerName, type ScoreEntry } from './highscores';

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

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export class Hud {
  private ui: AdvancedDynamicTexture;
  private scoreText: TextBlock;
  private timeText: TextBlock;
  private messageText: TextBlock;
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  private startOverlay = byId<HTMLDivElement>('overlay-start');
  private overOverlay = byId<HTMLDivElement>('overlay-over');
  private overTitle = byId<HTMLHeadingElement>('over-title');
  private overStats = byId<HTMLParagraphElement>('over-stats');
  private recordsBox = byId<HTMLDivElement>('records');
  private nameInput = byId<HTMLInputElement>('player-name');

  constructor(onStart: () => void) {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI('hud');

    this.scoreText = makeText('Score: 9999', 46, '#ffd83d');
    Hud.emphasize(this.scoreText);
    this.scoreText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.scoreText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scoreText.left = '24px';
    this.scoreText.top = '14px';
    this.ui.addControl(this.scoreText);

    this.timeText = makeText('10:00', 46, '#ffd83d');
    Hud.emphasize(this.timeText);
    this.timeText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.timeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.timeText.left = '-24px';
    this.timeText.top = '14px';
    this.ui.addControl(this.timeText);

    this.messageText = makeText('', 38, 'white');
    this.messageText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.messageText.top = '-60px';
    this.messageText.isVisible = false;
    this.ui.addControl(this.messageText);

    byId<HTMLSpanElement>('cloud-count').textContent = String(CLOUD_COUNT);
    this.nameInput.value = loadPlayerName();
    this.nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') onStart();
    });
    byId<HTMLButtonElement>('start-btn').addEventListener('click', onStart);
    byId<HTMLButtonElement>('replay-btn').addEventListener('click', onStart);
  }

  // bold + dark outline so the HUD stays readable over white clouds
  private static emphasize(tb: TextBlock): void {
    tb.fontWeight = 'bold';
    tb.outlineColor = '#2b3a55';
    tb.outlineWidth = 8;
  }

  getPlayerName(): string {
    return this.nameInput.value.trim().slice(0, 20) || 'Kitty';
  }

  setScore(score: number): void {
    this.scoreText.text = `Score: ${score}`;
  }

  setTime(secondsLeft: number): void {
    const s = Math.max(0, Math.ceil(secondsLeft));
    this.timeText.text = Hud.formatTime(s);
    this.timeText.color = s <= 60 ? '#ff6b6b' : '#ffd83d';
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
    this.startOverlay.classList.add('hidden');
    // drop focus so gameplay keys aren't typed into the (hidden) input
    this.nameInput.blur();
  }

  showGameOver(
    won: boolean,
    timeSpentSeconds: number,
    score: number,
    records: ScoreEntry[],
    currentRank: number
  ): void {
    this.overTitle.textContent = won
      ? 'Cloudy found! 🎉'
      : 'Cloudy got lost in the clouds forever… 😢';
    this.overStats.textContent =
      `Time spent: ${Hud.formatTime(timeSpentSeconds)}\n` + `Score: ${score}`;
    this.renderRecords(records, currentRank);
    this.overOverlay.classList.remove('hidden');
  }

  hideGameOver(): void {
    this.overOverlay.classList.add('hidden');
  }

  private renderRecords(records: ScoreEntry[], currentRank: number): void {
    this.recordsBox.replaceChildren();
    if (records.length === 0) return;
    const heading = document.createElement('h2');
    heading.textContent = '🏆 Top 10';
    this.recordsBox.appendChild(heading);
    const table = document.createElement('table');
    records.forEach((entry, i) => {
      const row = table.insertRow();
      if (i === currentRank) row.className = 'current';
      const cells: Array<[string, string]> = [
        ['rank', `${i + 1}.`],
        ['name', entry.name],
        ['score', String(entry.score)],
        ['time', Hud.formatTime(entry.timeSeconds)]
      ];
      for (const [cls, text] of cells) {
        const td = row.insertCell();
        td.className = cls;
        td.textContent = text;
      }
    });
    this.recordsBox.appendChild(table);
  }

  static formatTime(totalSeconds: number): string {
    const s = Math.max(0, Math.ceil(totalSeconds));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, '0')}`;
  }
}
