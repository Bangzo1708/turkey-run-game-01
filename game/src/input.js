// input.js — keyboard and mouse in one place. The game polls the pressed
// flags each frame; buttons on the menus are plain DOM clicks handled by
// the caller, so nothing here knows about game states.

export class Input {
  constructor(canvas) {
    this.jumpPressed = false; // edge: true only on the frame it was pressed
    this.jumpHeld = false;
    this.slideHeld = false;
    this.dashPressed = false;
    this.restartPressed = false;
    this.mutePressed = false;
    this.pausePressed = false;
    this.anyPressed = false;
    this.pointerX = 0;
    this.pointerY = 0;
    this.pointerDown = false;

    this._keys = new Set();
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this._keys.add(e.code);
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.jumpPressed = true;
        this.jumpHeld = true;
        e.preventDefault();
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.slideHeld = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX') {
        this.dashPressed = true;
      }
      if (e.code === 'KeyR') this.restartPressed = true;
      if (e.code === 'KeyM') this.mutePressed = true;
      if (e.code === 'KeyP' || e.code === 'Escape') this.pausePressed = true;
      if (e.code === 'Enter') this.anyPressed = true;
    });
    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.code);
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.jumpHeld = false;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.slideHeld = false;
    });

    // A click / tap on the canvas is a jump; the menus use real buttons.
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.pointerX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.pointerY = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.pointerDown = true;
      this.jumpPressed = true;
      this.jumpHeld = true;
      this.anyPressed = true;
    });
    window.addEventListener('pointerup', () => {
      this.pointerDown = false;
      this.jumpHeld = false;
    });
    // Keep the page from scrolling when the player hammers Space.
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    });
  }

  // Call once per frame after the game has read the edge flags.
  endFrame() {
    this.jumpPressed = false;
    this.dashPressed = false;
    this.restartPressed = false;
    this.mutePressed = false;
    this.pausePressed = false;
    this.anyPressed = false;
  }
}
