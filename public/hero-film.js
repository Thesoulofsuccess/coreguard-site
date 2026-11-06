/* Coreguard hero prototype: a continuous film, not a carousel.
   One WebGL photo layer gives every rendered image real depth (a depth map drives parallax), so the camera drifts
   through the scene. A clock plays the story; visitors can pause, jump between chapters, drag the cutaway or pick a finish. */
(function boot() {
  var stage = document.getElementById('hx-stage');
  if (!stage || !window.THREE || !window.CGBlock) { return setTimeout(boot, 60); }
  if (stage._hx) return; stage._hx = 1;
  var photoEl = document.getElementById('hx-photo'), glEl = document.getElementById('hx-gl'), labelsEl = document.getElementById('hx-labels');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fins = document.getElementById('hx-finishes'), chN = document.getElementById('hx-chN'), chP = document.getElementById('hx-chP'), chT = document.getElementById('hx-chT');
  var steps = stage.querySelectorAll('.steps button'), fill = document.getElementById('hx-fill'), cards = stage.querySelectorAll('.card');

  /* ---- timeline (seconds) ---- */
  var L = 38;
  var AT = { desire: 0, craft: 7, reveal: 16, path: 26, terrace: 32 };
  var CH = [
    ['01 · Desire', 'A floor with depth, reflection and character.', 'Rendered concept · not a completed project'],
    ['02 · Craft', 'Aggregate, colour and finish, chosen for the space. Pick one.', 'Rendered concept · not a completed project'],
    ['03 · Reveal', 'Beneath the finish, the system that keeps it looking this way. Drag to turn it.', 'Illustrative build-up · subject to technical approval'],
    ['04 · Possibilities', 'Outdoors: a permeable resin-bound pathway through a landscaped garden.', 'Concept visual · not a completed project'],
    ['04 · Possibilities', 'On the building: a protected terrace that sheds water.', 'Rendered concept · not a completed project']
  ];

  /* ---- photo layer ---- */
  var THREE = window.THREE, ok = !!THREE, R, scene, cam, mat;
  try { R = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' }); if (!R.getContext()) ok = false; } catch (e) { ok = false; }
  if (!ok) { stage.classList.add('nogl'); }
  var BASE = stage.getAttribute('data-base') || './';
  var IMG = { interior: ['interior.jpg', 'd-interior.jpg'], a: ['close-a.jpg', 'd-close.jpg'], b: ['close-b.jpg', 'd-close.jpg'], c: ['close-c.jpg', 'd-close.jpg'], path: ['path.jpg', 'd-path.jpg'], terrace: ['terrace.jpg', 'd-terrace.jpg'] };
  var TEX = {}, black = null;
  if (ok) {
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2));
    photoEl.appendChild(R.domElement);
    scene = new THREE.Scene(); cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var ld = new THREE.TextureLoader();
    Object.keys(IMG).forEach(function (k) {
      var t = ld.load(BASE + IMG[k][0], function (tx) { tx._ar = tx.image.width / tx.image.height; }); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t._ar = 16 / 9;
      var d = ld.load(BASE + IMG[k][1]); d.minFilter = THREE.LinearFilter; d.generateMipmaps = false;
      TEX[k] = [t, d];
    });
    var blk = new THREE.DataTexture(new Uint8Array([15, 16, 17, 255]), 1, 1); blk.needsUpdate = true; black = [blk, blk];
    mat = new THREE.ShaderMaterial({
      uniforms: {
        tA: { value: null }, dA: { value: null }, tB: { value: null }, dB: { value: null },
        sA: { value: new THREE.Vector2(1, 1) }, sB: { value: new THREE.Vector2(1, 1) },
        oA: { value: new THREE.Vector3(0, 0, 1) }, oB: { value: new THREE.Vector3(0, 0, 1) },
        fA: { value: new THREE.Vector2(0.6, 0.3) }, fB: { value: new THREE.Vector2(0.6, 0.3) },
        mixv: { value: 0 }, wipe: { value: -1 }, sweep: { value: -1 }, gain: { value: 1 }
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'precision highp float; varying vec2 vUv;',
        'uniform sampler2D tA, dA, tB, dB; uniform vec2 sA, sB, fA, fB; uniform vec3 oA, oB; uniform float mixv, wipe, sweep, gain;',
        'vec3 look(sampler2D t, sampler2D d, vec2 s, vec3 o, vec2 f, vec2 uv){',
        '  vec2 p = (uv - 0.5) * s + 0.5; p = (p - f) / o.z + f;',
        '  float z = texture2D(d, p).r; p += o.xy * (z - 0.4);',
        '  p = clamp(p, 0.001, 0.999); return texture2D(t, p).rgb; }',
        'void main(){',
        '  vec3 a = look(tA, dA, sA, oA, fA, vUv), b = look(tB, dB, sB, oB, fB, vUv);',
        '  float m = mixv; if (wipe >= 0.0) { m = smoothstep(wipe - 0.002, wipe + 0.002, vUv.x); }',
        '  vec3 c = mix(a, b, m);',
        '  if (sweep >= 0.0) { float zA = texture2D(dA, (vUv - 0.5) * sA + 0.5).r; float band = exp(-pow((vUv.x * 0.9 - vUv.y * 0.55 - sweep) * 7.0, 2.0)); c += vec3(1.0, 0.78, 0.52) * band * smoothstep(0.55, 0.9, zA) * 0.32 * (1.0 - m); }',
        '  if (wipe >= 0.0) { float e = abs(vUv.x - wipe); c = mix(c, vec3(1.0, 0.42, 0.24), exp(-e * 900.0)); c += vec3(1.0, 0.4, 0.2) * exp(-e * 60.0) * 0.35; }',
        '  gl_FragColor = vec4(c * gain, 1.0); }'
      ].join('\n')
    });
    mat.extensions = {};
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    R.outputEncoding = THREE.LinearEncoding;
  }
  var block = null;
  try { block = THREE ? CGBlock(glEl, labelsEl, BASE) : null; } catch (e) { block = null; }
  var hasBlock = block && block.ok;

  var W = 1, H = 1;
  function size() { W = stage.clientWidth; H = stage.clientHeight; if (ok) R.setSize(W, H, false); if (hasBlock) block.resize(); }
  size(); window.addEventListener('resize', size);
  function coverScale(t) { var ar = (t && t._ar) || 16 / 9, sa = W / H; return sa > ar ? [1, ar / sa] : [sa / ar, 1]; }

  function cl(x) { return Math.max(0, Math.min(1, x)); }
  function ease(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function seg(t, a, b) { return cl((t - a) / (b - a)); }

  var clock = 0, paused = reduce, last = performance.now(), visible = true, pinned = null, rot = 0.2, rotV = 0, dragging = false, mx = 0, my = 0, pmx = 0, pmy = 0;
  window.addEventListener('pointermove', function (e) { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(stage);

  function set(A, B, m, o) {
    var u = mat.uniforms;
    u.tA.value = A[0]; u.dA.value = A[1]; u.tB.value = B[0]; u.dB.value = B[1];
    var sa = coverScale(A[0]), sb = coverScale(B[0]); u.sA.value.set(sa[0], sa[1]); u.sB.value.set(sb[0], sb[1]);
    u.mixv.value = m; u.wipe.value = o.wipe != null ? o.wipe : -1; u.sweep.value = o.sweep != null ? o.sweep : -1; u.gain.value = o.gain != null ? o.gain : 1;
    u.oA.value.set(o.ax || 0, o.ay || 0, o.az || 1); u.oB.value.set(o.bx || 0, o.by || 0, o.bz || 1);
    if (o.fa) u.fA.value.set(o.fa[0], o.fa[1]); if (o.fb) u.fB.value.set(o.fb[0], o.fb[1]);
  }
  var curCh = -1;
  function chapter(i, prog) {
    if (i !== curCh) {
      curCh = i; chN.textContent = CH[i][0]; chP.textContent = CH[i][1]; chT.textContent = CH[i][2];
      var s = Math.min(i, 3);
      steps.forEach(function (b, k) { if (k === s) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('done', k < s); });
      cards.forEach(function (c, k) { c.classList.toggle('on', k === (i <= 2 ? 0 : i === 3 ? 1 : 2)); });
    }
    fill.style.width = (prog * 100).toFixed(2) + '%';
  }

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused && visible) clock = (clock + dt) % L;
    var t = clock, amb = reduce ? 0 : now / 1000;
    pmx += (mx - pmx) * Math.min(1, dt * 2.5); pmy += (my - pmy) * Math.min(1, dt * 2.5);
    var px = pmx * 0.018 + Math.sin(amb * 0.23) * 0.006, py = -pmy * 0.012 + Math.cos(amb * 0.19) * 0.004;
    var vi = pinned != null ? pinned : (t < 10.2 ? 0 : t < 13 ? 1 : 2), vk = ['a', 'b', 'c'];
    var showBlock = 0, rev = 0, chi = 0;

    if (ok) {
      if (t < AT.craft) { /* desire: push toward the floor, light travels across it */
        var k = seg(t, 0, AT.craft), x = seg(t, AT.craft - 1.4, AT.craft);
        set(TEX.interior, TEX.a, ease(x), { ax: px + 0.02 * k, ay: py, az: 1 + 0.1 * ease(k) + 0.25 * ease(x), fa: [0.6, 0.28], bx: px, by: py, bz: 1.14 - 0.06 * x, fb: [0.55, 0.4], sweep: reduce ? -1 : -0.2 + 1.4 * seg(t, 0.8, 6.2) });
        chi = 0;
      } else if (t < AT.reveal) { /* craft: close on the finish; it transforms */
        var cA = vk[vi], prev = pinned != null ? vk[pinned] : (vi === 0 ? 'a' : vk[vi - 1]);
        var since = pinned != null ? 9 : (vi === 0 ? 9 : t - (vi === 1 ? 10.2 : 13)), m = ease(since / 1.0);
        var g = 1 - ease(seg(t, AT.reveal - 1.0, AT.reveal));
        var z = 1.08 - 0.05 * seg(t, AT.craft, AT.reveal);
        set(TEX[prev], TEX[cA], vi === 0 && pinned == null ? 1 : m, { ax: px * 1.6, ay: py * 1.6, az: z, fa: [0.55, 0.4], bx: px * 1.6, by: py * 1.6, bz: z, fb: [0.55, 0.4], gain: g });
        chi = 1;
      } else if (t < AT.path) { /* reveal */
        set(black, TEX.path, 0, { gain: 1 });
        showBlock = ease(seg(t, AT.reveal - 0.6, AT.reveal + 0.6)) * (1 - ease(seg(t, AT.path - 1.2, AT.path - 0.2)));
        rev = reduce ? 1 : seg(t, AT.reveal + 0.4, AT.reveal + 5.2);
        chi = 2;
      } else if (t < AT.terrace) { /* path: a red cut line sweeps it in */
        var w = 1 - ease(seg(t, AT.path - 0.2, AT.path + 1.4)), k2 = seg(t, AT.path, AT.terrace);
        set(black, TEX.path, 1, { wipe: w < 1 && w > 0 ? w : -1, bx: px * 1.4, by: py, bz: 1.1 - 0.08 * k2, fb: [0.45, 0.4] });
        if (!(w < 1 && w > 0)) mat.uniforms.mixv.value = w <= 0 ? 1 : 0;
        chi = 3;
      } else { /* terrace, then back to the beginning */
        var w2 = 1 - ease(seg(t, AT.terrace, AT.terrace + 1.4)), k3 = seg(t, AT.terrace, L), back = ease(seg(t, L - 1.4, L));
        if (w2 > 0) set(TEX.path, TEX.terrace, 1, { wipe: w2, ax: px * 1.4, ay: py, az: 1.02, fa: [0.45, 0.4], bx: px * 1.4, by: py, bz: 1.1 - 0.06 * k3, fb: [0.55, 0.45] });
        else set(TEX.terrace, TEX.interior, back, { ax: px * 1.4, ay: py, az: 1.1 - 0.06 * k3, fa: [0.55, 0.45], bx: px, by: py, bz: 1.0, fb: [0.6, 0.28] });
        chi = 4;
      }
      if (visible) R.render(scene, cam);
    }
    glEl.style.opacity = showBlock.toFixed(3); labelsEl.style.opacity = showBlock.toFixed(3);
    if (hasBlock && showBlock > 0.001) {
      if (!paused && !dragging && !reduce) rot += dt * 0.1 * seg(rev, 0.95, 1);
      rot += rotV; rotV *= 0.92;
      block.set({ kind: 'terrazzo', reveal: rev, rot: rot - 0.2 }); block.render();
    }
    fins.classList.toggle('show', chi === 1);
    stage.classList.toggle('compact', W < 760 && t > 5);
    chapter(chi, t / L);
    requestAnimationFrame(frame);
  }

  /* drag the cutaway */
  var lx = 0;
  glEl.addEventListener('pointerdown', function (e) { dragging = true; lx = e.clientX; glEl.setPointerCapture(e.pointerId); });
  glEl.addEventListener('pointermove', function (e) { if (!dragging) return; var d = (e.clientX - lx) / 260; lx = e.clientX; rot += d; rotV = d * 0.3; });
  ['pointerup', 'pointercancel'].forEach(function (n) { glEl.addEventListener(n, function () { dragging = false; }); });

  /* controls */
  var GO = [AT.desire, AT.craft, AT.reveal, AT.path, AT.path, AT.path + 0.01, AT.terrace + 1.5];
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (!g || !stage.contains(g) && !g.hasAttribute('data-hx')) return;
    var href = g.getAttribute('href') || ''; if (href && href.charAt(0) !== '#') return;
    var i = +g.getAttribute('data-go'); e.preventDefault();
    clock = GO[i] + (i === 3 || i === 5 ? 1.6 : 0.01);
    if (i === 2) clock = AT.reveal + 0.6;
    document.getElementById('hx-hero').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
  fins.addEventListener('click', function (e) {
    var b = e.target.closest('.fin'); if (!b) return;
    var i = 'abc'.indexOf(b.getAttribute('data-fin')); pinned = pinned === i ? null : i;
    fins.querySelectorAll('.fin').forEach(function (x, k) { x.setAttribute('aria-pressed', String(k === pinned)); });
    if (pinned != null && clock > AT.reveal - 3) clock = AT.craft + 2;
  });
  stage.addEventListener('pointerover', function (e) { var c = e.target.closest && e.target.closest('.card'); if (!c || c._hv) return; c._hv = 1; setTimeout(function () { c._hv = 0; }, 1500); var i = +c.getAttribute('data-go'); var target = i === 0 ? AT.desire + 0.01 : i === 5 ? AT.path + 1.6 : AT.terrace + 1.5; if (Math.abs(clock - target) > 3) clock = target; });
  var pb = document.getElementById('hx-pause');
  function setPaused(p) {
    paused = p; pb.setAttribute('aria-pressed', String(p)); pb.setAttribute('aria-label', p ? 'Play the film' : 'Pause the film');
    document.getElementById('hx-pauseIcon').innerHTML = p ? '<path d="M3 1.5 L12.5 7 L3 12.5 Z"></path>' : '<rect x="2" y="1" width="3.5" height="12"></rect><rect x="8.5" y="1" width="3.5" height="12"></rect>';
  }
  pb.addEventListener('click', function () { setPaused(!paused); });
  document.addEventListener('keydown', function (e) { if (e.key === 'k' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) setPaused(!paused); });
  setPaused(paused);
  window.cgFilm = { seek: function (s) { clock = s; }, pause: setPaused };
  requestAnimationFrame(frame);
})();

(function () {
  function pick(t) { var list = t.closest('[role="tablist"]'); list.querySelectorAll('[role="tab"]').forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on; }); }
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('.hx [role="tab"]'); if (t) pick(t); });
  document.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('.hx [role="tab"]'); if (!t) return;
    var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
    var all = Array.prototype.slice.call(t.closest('[role="tablist"]').querySelectorAll('[role="tab"]')), n = all[(all.indexOf(t) + d + all.length) % all.length]; pick(n); n.focus();
  });
})();
