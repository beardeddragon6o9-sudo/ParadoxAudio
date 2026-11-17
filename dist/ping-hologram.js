(() => {
  const width = 816;
  const height = 600;
  const bezelRow = 573;
  const visor = { x: 363, y: 108, width: 125, height: 50, columns: 10 };
  const framesPerSecond = 24;
  const clips = {
    idle: { duration: 5.8, firstTick: 92, tiles: [1, 2, 3, 4, 5, 6, 7, 8], still: 0 },
    thinking: { duration: 1.55, firstTick: 0, firstTile: 9, tileCount: 38, still: 22 },
    responding: {
      duration: .8,
      firstTick: 1,
      firstTile: 47,
      tileCount: 18,
      still: 50,
    },
  };

  const scriptUrl = document.currentScript.src;
  function loadImage(name) {
    const image = new Image();
    image.src = new URL(name, scriptUrl);
    return image.decode().then(() => image);
  }
  const artwork = Promise.all([loadImage("ping-projection.png"), loadImage("ping-visor.png")]);

  function tileAt(clip, elapsed) {
    const tick = Math.floor((elapsed % clip.duration) * framesPerSecond) - clip.firstTick;
    if (clip.tiles) return clip.tiles[tick] ?? 0;
    return tick >= 0 && tick < clip.tileCount ? clip.firstTile + tick : 0;
  }

  class PingHologram extends HTMLElement {
    #context;
    #projection;
    #visor;
    #state = "idle";
    #started = 0;
    #lastTile = -1;
    #request = 0;
    #reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `
        :host {
          position: absolute;
          display: block;
          left: var(--ping-anchor-x);
          top: var(--ping-anchor-y);
          width: var(--ping-width);
          transform: translate(-50%, -${bezelRow / height * 100}%);
          pointer-events: none;
          z-index: 2;
        }
        :host([hidden]) { display: none; }
        canvas { display: block; width: 100%; height: auto; }
      `;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      this.#context = canvas.getContext("2d");
      shadow.append(style, canvas);
    }

    connectedCallback() {
      this.#reducedMotion.addEventListener("change", this.#syncMotion);
      artwork.then(([projection, visorAtlas]) => {
        if (!this.isConnected) return;
        this.#projection = projection;
        this.#visor = visorAtlas;
        this.#draw(clips[this.#state].still);
        this.#syncMotion();
      }).catch(() => { this.hidden = true; });
    }

    disconnectedCallback() {
      this.#reducedMotion.removeEventListener("change", this.#syncMotion);
      this.#stop();
    }

    get state() {
      return this.#state;
    }

    setState(state) {
      if (!Object.hasOwn(clips, state)) return;
      this.#state = state;
      this.#started = performance.now();
      this.#syncMotion();
      this.dispatchEvent(new CustomEvent("pingstatechange", { detail: { state } }));
    }

    #stop() {
      if (this.#request) cancelAnimationFrame(this.#request);
      this.#request = 0;
    }

    #syncMotion = () => {
      this.#stop();
      if (!this.isConnected || !this.#projection) return;

      if (this.#reducedMotion.matches) this.#draw(clips[this.#state].still);
      if (!this.#reducedMotion.matches || this.#state === "responding") {
        this.#request = requestAnimationFrame(this.#tick);
      }
    };

    #draw(tile) {
      if (tile === this.#lastTile) return;
      const { x, y, width: tileWidth, height: tileHeight, columns } = visor;
      this.#context.clearRect(0, 0, width, height);
      this.#context.drawImage(this.#projection, 0, 0);
      this.#context.drawImage(this.#visor, tile % columns * tileWidth,
        Math.floor(tile / columns) * tileHeight, tileWidth, tileHeight,
        x, y, tileWidth, tileHeight);
      this.#lastTile = tile;
    }

    #tick = (now) => {
      this.#request = 0;
      const clip = clips[this.#state];
      const elapsed = Math.max(0, (now - this.#started) / 1000);
      if (this.#state === "responding" && elapsed >= clip.duration) {
        this.setState("idle");
        return;
      }
      if (!this.#reducedMotion.matches) this.#draw(tileAt(clip, elapsed));
      this.#request = requestAnimationFrame(this.#tick);
    };
  }

  customElements.define("ping-hologram", PingHologram);
})();
