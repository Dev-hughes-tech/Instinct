const tracks = [
  { id: "t1", name: "VOCAL LEAD", color: "#d9353f", gain: -3, pan: 0 },
  { id: "t2", name: "VOCAL HARM 1", color: "#e2772e", gain: -6, pan: -15 },
  { id: "t3", name: "VOCAL HARM 2", color: "#efab30", gain: -6, pan: 15 },
  { id: "t4", name: "ACOUSTIC GTR", color: "#38a85b", gain: -8, pan: -10 },
  { id: "t5", name: "PIANO", color: "#2a98bb", gain: -7, pan: 10 },
  { id: "t6", name: "PAD ATMOS", color: "#4f79dc", gain: -10, pan: 0 },
  { id: "t7", name: "BASS", color: "#3265da", gain: -8, pan: 0 },
  { id: "t8", name: "KICK", color: "#6658da", gain: -5, pan: 0 },
];

const state = {
  selectedTrackId: tracks[0].id,
};

const trackList = document.getElementById("track-list");
const lanes = document.getElementById("lanes");
const miniStrips = document.getElementById("mini-strips");
const consoleStrips = document.getElementById("console-strips");
const inspectorTrack = document.getElementById("inspector-track");
const gainInput = document.getElementById("gain");
const panInput = document.getElementById("pan");
const ruler = document.getElementById("ruler");

function renderRuler() {
  for (let i = 1; i <= 16; i += 1) {
    const tick = document.createElement("span");
    tick.textContent = i;
    ruler.append(tick);
  }
}

function buildStrip(track, compact = false) {
  const strip = document.createElement("article");
  strip.className = "strip";
  strip.tabIndex = 0;
  strip.dataset.trackId = track.id;
  strip.innerHTML = `
    <strong>${track.name.replace(" ", "<br>")}</strong>
    <input type="range" min="-40" max="12" value="${track.gain}" aria-label="${track.name} fader" />
    <div class="meter" data-meter-for="${track.id}"></div>
  `;

  strip.addEventListener("click", () => setSelectedTrack(track.id));
  strip.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedTrack(track.id);
    }
  });

  if (compact) {
    strip.querySelector("input").setAttribute("aria-label", `${track.name} mini fader`);
  }

  return strip;
}

function renderTracks() {
  trackList.innerHTML = "";
  lanes.innerHTML = "";
  miniStrips.innerHTML = "";
  consoleStrips.innerHTML = "";

  for (const track of tracks) {
    const row = document.createElement("li");
    row.className = "track-row";
    row.tabIndex = 0;
    row.dataset.trackId = track.id;
    row.innerHTML = `<span class="track-dot" style="background:${track.color}"></span><strong>${track.name}</strong><small>Main</small>`;
    row.addEventListener("click", () => setSelectedTrack(track.id));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setSelectedTrack(track.id);
      }
    });
    trackList.append(row);

    const lane = document.createElement("article");
    lane.className = "lane";
    lane.dataset.trackId = track.id;
    lane.innerHTML = `<div class="wave" style="background:linear-gradient(90deg, ${track.color}33, ${track.color}cc)"></div>`;
    lane.addEventListener("click", () => setSelectedTrack(track.id));
    lanes.append(lane);

    miniStrips.append(buildStrip(track, true));
    consoleStrips.append(buildStrip(track));
  }

  reflectSelection();
}

function setSelectedTrack(trackId) {
  state.selectedTrackId = trackId;
  reflectSelection();
}

function reflectSelection() {
  const selected = tracks.find((track) => track.id === state.selectedTrackId);
  if (!selected) return;

  inspectorTrack.textContent = `${selected.name} • Gain ${selected.gain} dB • Pan ${selected.pan}`;
  gainInput.value = selected.gain;
  panInput.value = selected.pan;

  document.querySelectorAll(".track-row, .lane, .strip").forEach((node) => {
    node.classList.toggle("selected", node.dataset.trackId === selected.id);
  });
}

function attachInspectorEvents() {
  gainInput.addEventListener("input", () => {
    const selected = tracks.find((track) => track.id === state.selectedTrackId);
    if (!selected) return;
    selected.gain = Number(gainInput.value);
    reflectSelection();

    document
      .querySelectorAll(`.strip[data-track-id="${selected.id}"] input[type="range"]`)
      .forEach((slider) => {
        slider.value = String(selected.gain);
      });
  });

  panInput.addEventListener("input", () => {
    const selected = tracks.find((track) => track.id === state.selectedTrackId);
    if (!selected) return;
    selected.pan = Number(panInput.value);
    reflectSelection();
  });
}

function attachModeEvents() {
  const modeButtons = document.querySelectorAll(".mode");

  for (const button of modeButtons) {
    button.addEventListener("click", () => {
      modeButtons.forEach((mode) => {
        mode.classList.remove("is-active");
        mode.setAttribute("aria-pressed", "false");
      });
      button.classList.add("is-active");
      button.setAttribute("aria-pressed", "true");

      document.querySelectorAll(".view").forEach((view) => view.classList.remove("is-active"));
      document.getElementById(`${button.dataset.view}-view`).classList.add("is-active");
    });
  }
}

function animateMeters() {
  setInterval(() => {
    document.querySelectorAll(".meter").forEach((meter) => {
      const level = Math.floor(Math.random() * 78) + 8;
      meter.style.setProperty("--meter-level", `${100 - level}%`);
    });
  }, 280);
}

function bindAddTrack() {
  const addTrackButton = document.getElementById("add-track-btn");
  addTrackButton.addEventListener("click", () => {
    const count = tracks.length + 1;
    const color = ["#dd4f62", "#48a8b7", "#65a75f", "#7e72de"][count % 4];
    const newTrack = {
      id: `t${count}`,
      name: `NEW TRACK ${count}`,
      color,
      gain: -8,
      pan: 0,
    };
    tracks.push(newTrack);
    state.selectedTrackId = newTrack.id;
    renderTracks();
  });
}

function startTransportClock() {
  const transportClock = document.getElementById("transport-time");
  let frame = 0;
  setInterval(() => {
    frame += 1;
    const sec = String(Math.floor(frame / 30)).padStart(2, "0");
    const ticks = String(frame % 30).padStart(2, "0");
    transportClock.textContent = `01:02:${sec}:${ticks}`;
  }, 100);
}

renderRuler();
renderTracks();
attachInspectorEvents();
attachModeEvents();
bindAddTrack();
animateMeters();
startTransportClock();
