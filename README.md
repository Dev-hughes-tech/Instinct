# Instinct

A runnable prototype application and product blueprint for **INSTINCT by Hughes Technologies**.

## Run the app

```bash
cd app
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Prototype features

- Edit and Standalone Mixer view switching.
- Selectable track rows/lanes/strips with Inspector synchronization.
- Interactive gain/pan inspector controls for the selected track.
- Dynamic animated metering and transport clock simulation.
- Add Track action that appends synchronized rows, lanes, and strips.

## Files

- `app/index.html` — shell layout and semantic structure.
- `app/styles.css` — bright white/silver premium visual system, panel depth, and responsive layout.
- `app/app.js` — state model, rendering, interactions, and meter/transport animation.
- `MASTER_SPEC.md` — full master product specification.
