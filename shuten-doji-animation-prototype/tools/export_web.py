"""Godot シーンと同じ重ね順・フレーム長で、ブラウザ（スマホ）用の単一 HTML を書き出す。

出力: 引数で指定したパス（省略時は build/web/index.html）
"""
import base64
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHAR_DIR = ROOT / "assets/characters/samurai_left_bottom"
BG = ROOT / "assets/scroll/scroll_background_clean.png"
FG = ROOT / "assets/scroll/scroll_foreground_oni.png"

# scenes/prototype.tscn の duration 倍率（12fps 基準）
DURATIONS = [1.44, 1.2, 1.2, 0.96, 0.72, 2.16, 1.44, 2.4]
BASE_FPS = 12.0
SAMURAI_ORIGIN = (0, 100)
SCROLL_SIZE = (2048, 914)
# 拡大表示の範囲（武者と鬼の首を含む）
ZOOM_RECT = (0, 60, 760, 680)


def data_uri(path):
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "build/web/index.html"
    frames_ms = [round(d / BASE_FPS * 1000) for d in DURATIONS]
    frame_uris = [data_uri(CHAR_DIR / f"samurai_{i:02d}.png") for i in range(1, 9)]
    frames_js = ",\n".join(f'"{u}"' for u in frame_uris)

    html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>酒伝童子絵巻 動く武者</title>
<style>
:root {{ --bg: #111; --fg: #ddd; --muted: #888; --btn: #333; }}
@media (prefers-color-scheme: light) {{
  :root:not([data-theme="dark"]) {{ --bg: #f4f1ea; --fg: #222; --muted: #666; --btn: #e2ddd2; }}
}}
:root[data-theme="light"] {{ --bg: #f4f1ea; --fg: #222; --muted: #666; --btn: #e2ddd2; }}
* {{ box-sizing: border-box; margin: 0; }}
body {{ background: var(--bg); color: var(--fg); font-family: system-ui, sans-serif;
  padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; }}
canvas {{ width: 100%; max-width: 1200px; height: auto; display: block; touch-action: manipulation; }}
.bar {{ display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: center; }}
button {{ background: var(--btn); color: var(--fg); border: 0; border-radius: 6px;
  padding: 10px 16px; font-size: 15px; }}
.info {{ color: var(--muted); font-size: 13px; text-align: center; }}
</style>
</head>
<body>
<canvas id="view"></canvas>
<div class="bar">
  <button id="play">一時停止</button>
  <button id="zoom">全体を見る</button>
  <span class="info">フレーム <span id="num">1</span>/8</span>
</div>
<p class="info">絵をタップでも再生／停止。停止すると1フレーム目（元の絵巻と同じ画素）に戻ります。</p>
<script>
const FRAMES_MS = {frames_ms};
const ORIGIN = {list(SAMURAI_ORIGIN)};
const [SW, SH] = {list(SCROLL_SIZE)};
const ZOOM = {list(ZOOM_RECT)};
const srcs = {{ bg: "{data_uri(BG)}", fg: "{data_uri(FG)}" }};
const frameSrcs = [
{frames_js}
];

const view = document.getElementById("view");
const ctx = view.getContext("2d");
const scene = document.createElement("canvas");
scene.width = SW; scene.height = SH;
const sctx = scene.getContext("2d");
const numEl = document.getElementById("num");
const playBtn = document.getElementById("play");
const zoomBtn = document.getElementById("zoom");

let zoomed = true, playing = true, frame = 0, elapsed = 0, last = null;
const load = s => new Promise((ok, ng) => {{ const i = new Image(); i.onload = () => ok(i); i.onerror = ng; i.src = s; }});

function setView() {{
  const [, , w, h] = zoomed ? ZOOM : [0, 0, SW, SH];
  view.width = w; view.height = h;
  zoomBtn.textContent = zoomed ? "全体を見る" : "拡大する";
}}

Promise.all([load(srcs.bg), load(srcs.fg), ...frameSrcs.map(load)]).then(([bg, fg, ...frames]) => {{
  function draw() {{
    sctx.clearRect(0, 0, SW, SH);
    sctx.drawImage(bg, 0, 0);
    sctx.drawImage(frames[frame], ORIGIN[0], ORIGIN[1]);
    sctx.drawImage(fg, 0, 0);
    const [x, y, w, h] = zoomed ? ZOOM : [0, 0, SW, SH];
    ctx.drawImage(scene, x, y, w, h, 0, 0, w, h);
    numEl.textContent = frame + 1;
  }}
  function tick(t) {{
    if (playing) {{
      if (last !== null) elapsed += t - last;
      last = t;
      let changed = false;
      while (elapsed >= FRAMES_MS[frame]) {{
        elapsed -= FRAMES_MS[frame];
        frame = (frame + 1) % FRAMES_MS.length;
        changed = true;
      }}
      if (changed) draw();
    }}
    requestAnimationFrame(tick);
  }}
  function toggle() {{
    playing = !playing;
    if (!playing) {{ frame = 0; draw(); }}
    elapsed = 0; last = null;
    playBtn.textContent = playing ? "一時停止" : "再生";
  }}
  playBtn.onclick = toggle;
  view.onclick = toggle;
  document.addEventListener("keydown", e => {{ if (e.code === "Space") {{ e.preventDefault(); toggle(); }} }});
  zoomBtn.onclick = () => {{ zoomed = !zoomed; setView(); draw(); }};
  setView(); draw();
  requestAnimationFrame(tick);
}});
</script>
</body>
</html>
"""
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    print(f"{out} ({out.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
