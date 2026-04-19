/* Slide controller for the "We're hiring" animated post. */

const CANVAS_W = 1080;
const CANVAS_H = 1350;

// Per-slide display time (ms) before auto-advancing.
const DURATIONS = {
  1: 5200,
  2: 5200,
  3: 5600,
  4: 6400,
  5: 6000,
};

const frame = document.getElementById("frame");
const stage = document.querySelector(".stage");
const slides = Array.from(document.querySelectorAll(".slide"));
const dotButtons = Array.from(document.querySelectorAll(".dot-btn"));
const railFill = document.getElementById("railFill");

let current = 1;
let advanceTimer = null;
let progressStart = 0;
let progressRAF = 0;

function fitStage() {
  const padding = 48;
  const availW = window.innerWidth - padding;
  const availH = window.innerHeight - padding;
  const scale = Math.min(availW / CANVAS_W, availH / CANVAS_H, 1);
  stage.style.setProperty("--scale", String(scale));
}

function setDarkMode(active) {
  frame.classList.toggle("dark-mode", active);
}

function show(n) {
  current = ((n - 1 + slides.length) % slides.length) + 1;

  slides.forEach((s) => {
    const isActive = Number(s.dataset.slide) === current;
    s.classList.toggle("is-active", isActive);
  });

  dotButtons.forEach((btn) => {
    btn.classList.toggle("is-active", Number(btn.dataset.go) === current);
  });

  // Dark mode for navy slides (1 and 5) to tint the progress rail / dots.
  setDarkMode(current === 1 || current === 5);

  // Kick off progress + auto advance.
  startProgress(DURATIONS[current] || 5000);
}

function startProgress(ms) {
  clearTimeout(advanceTimer);
  cancelAnimationFrame(progressRAF);

  progressStart = performance.now();
  const tick = (now) => {
    const elapsed = now - progressStart;
    const pct = Math.min(1, elapsed / ms);
    railFill.style.width = (pct * 100).toFixed(2) + "%";
    if (pct < 1) {
      progressRAF = requestAnimationFrame(tick);
    }
  };
  railFill.style.transitionDuration = "0ms";
  railFill.style.width = "0%";
  progressRAF = requestAnimationFrame(tick);

  advanceTimer = setTimeout(() => show(current + 1), ms);
}

function go(n) {
  show(n);
}

dotButtons.forEach((btn) => {
  btn.addEventListener("click", () => go(Number(btn.dataset.go)));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(current + 1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1); }
  else if (/^[1-5]$/.test(e.key)) { go(Number(e.key)); }
});

// Pause/resume on hover — lets viewers pause to read.
let pausedRemaining = null;
frame.addEventListener("mouseenter", () => {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    cancelAnimationFrame(progressRAF);
    const elapsed = performance.now() - progressStart;
    pausedRemaining = Math.max(0, (DURATIONS[current] || 5000) - elapsed);
  }
});
frame.addEventListener("mouseleave", () => {
  if (pausedRemaining != null) {
    const ms = pausedRemaining;
    pausedRemaining = null;
    // Continue from where we left off; compute adjusted start so progress bar lines up.
    const total = DURATIONS[current] || 5000;
    progressStart = performance.now() - (total - ms);
    const tick = (now) => {
      const elapsed = now - progressStart;
      const pct = Math.min(1, elapsed / total);
      railFill.style.width = (pct * 100).toFixed(2) + "%";
      if (pct < 1) progressRAF = requestAnimationFrame(tick);
    };
    progressRAF = requestAnimationFrame(tick);
    advanceTimer = setTimeout(() => show(current + 1), ms);
  }
});

window.addEventListener("resize", fitStage);
fitStage();
show(1);
