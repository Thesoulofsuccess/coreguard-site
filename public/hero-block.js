/* Coreguard hero prototype: the reveal block.
   Rendered finish on top (image), every layer beneath drawn as an architectural section in 3D.
   API: CGBlock(host, labelsEl, base) -> { set({kind, reveal, rot}), resize(), render(), ok } */
window.CGBlock = function (host, labelsEl, base) {
  var BW = 6, BD = 4, GAP = 0.24;
  var KINDS = {
    terrazzo: [['The look', 'Decorative terrazzo finish', 'top', 0.14], ['The performance', 'Body coat', 'diag', 0.14], ['The protection', 'Primer', 'amber', 0.05], ['The foundation', 'Screed', 'stipple', 0.34], ['The foundation', 'RCC slab', 'concrete', 0.75]],
    resin: [['The look', 'Resin-bound surface', 'top', 0.14], ['The performance', 'Open-graded base', 'gravel', 0.28], ['The performance', 'Sub-base water storage', 'storage', 0.55], ['The protection', 'Geotextile', 'dash', 0.05], ['The foundation', 'Sub-grade', 'earth', 0.5]],
    porcelain: [['The look', 'Porcelain stone finish', 'top', 0.1], ['The performance', 'Screed to falls', 'stipple', 0.3], ['The protection', 'Waterproof membrane', 'red', 0.08], ['The protection', 'Primer', 'amber', 0.04], ['The foundation', 'RCC slab', 'concrete', 0.75]]
  };
  var HATCH = {
    diag: ['#50555b', 'rgba(240,236,228,0.8)', function (g, n) { g.lineWidth = 1.2; for (var i = -n; i < n * 2; i += 12) { g.beginPath(); g.moveTo(i, n); g.lineTo(i + n, 0); g.stroke(); } }],
    stipple: ['#5b6066', 'rgba(240,236,228,0.8)', function (g, n) { for (var i = 0; i < 1400; i++) g.fillRect(Math.random() * n, Math.random() * n, 1.4, 1.4); }],
    concrete: ['#686d73', 'rgba(245,242,236,0.85)', function (g, n) { g.lineWidth = 1.1; for (var i = 0; i < 900; i++) g.fillRect(Math.random() * n, Math.random() * n, 1.3, 1.3); for (var k = 0; k < 60; k++) { var x = Math.random() * n, y = Math.random() * n, s = 5 + Math.random() * 5, a = Math.random() * 6.28; g.beginPath(); for (var j = 0; j < 3; j++) g.lineTo(x + Math.cos(a + j * 2.09) * s, y + Math.sin(a + j * 2.09) * s); g.closePath(); g.stroke(); } }],
    gravel: ['#4b5156', 'rgba(240,236,228,0.8)', function (g, n) { g.lineWidth = 1.1; for (var i = 0; i < 160; i++) { g.beginPath(); g.ellipse(Math.random() * n, Math.random() * n, 4 + Math.random() * 5, 3 + Math.random() * 4, Math.random() * 3, 0, 6.283); g.stroke(); } }],
    storage: ['#1f6585', 'rgba(190,232,250,0.85)', function (g, n) { g.lineWidth = 1.2; for (var i = 0; i < 90; i++) { g.beginPath(); g.ellipse(Math.random() * n, Math.random() * n, 7 + Math.random() * 8, 5 + Math.random() * 6, Math.random() * 3, 0, 6.283); g.stroke(); } }],
    dash: ['#d9d4ca', 'rgba(30,30,30,0.6)', function (g, n) { g.lineWidth = 2; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(0, n / 2); g.lineTo(n, n / 2); g.stroke(); }],
    earth: ['#6a5546', 'rgba(236,214,190,0.7)', function (g, n) { g.lineWidth = 1.1; for (var i = -n; i < n * 2; i += 16) { g.beginPath(); g.moveTo(i, n); g.lineTo(i + n, 0); g.stroke(); g.beginPath(); g.moveTo(i, 0); g.lineTo(i + n, n); g.stroke(); } }],
    amber: ['#d99a2b', null], red: ['#d63b25', null]
  };
  var api = { ok: false };
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return api; }
  if (!renderer.getContext()) return api;
  api.ok = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  scene.add(new THREE.HemisphereLight(0xfff3e4, 0x15161a, 0.6));
  var key = new THREE.DirectionalLight(0xffe2c0, 0.9); key.position.set(-4, 6, 3); scene.add(key);
  var cache = {};
  function hatch(k, rx, ry) {
    if (!cache[k]) { var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d'), H = HATCH[k]; g.fillStyle = H[0]; g.fillRect(0, 0, 256, 256); if (H[1]) { g.strokeStyle = g.fillStyle = H[1]; H[2](g, 256); } cache[k] = c; }
    var t = new THREE.CanvasTexture(cache[k]); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  var loader = new THREE.TextureLoader();
  function build(kind) {
    var g = new THREE.Group(), y = 0, layers = [];
    KINDS[kind].forEach(function (L, i) {
      var h = L[3], mats, m;
      if (L[2] === 'top') {
        var t = loader.load(base + 'surf-' + kind + '-top.jpg', function () { api.dirty = true; }); t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        var edge = new THREE.MeshStandardMaterial({ color: kind === 'resin' ? 0x8a7258 : kind === 'porcelain' ? 0xc4bdb1 : 0xdcd6cc, roughness: 0.5 });
        mats = [edge, edge, new THREE.MeshBasicMaterial({ map: t }), edge, edge, edge];
      } else {
        var S = 0.55, f = new THREE.MeshBasicMaterial({ map: hatch(L[2], BW / S, Math.max(0.12, h / S)) }), sd = new THREE.MeshBasicMaterial({ map: hatch(L[2], BD / S, Math.max(0.12, h / S)) });
        var tone = new THREE.Color(HATCH[L[2]][0]).convertSRGBToLinear().multiplyScalar(0.85), tp = new THREE.MeshBasicMaterial({ color: tone });
        mats = [sd, sd, tp, tp, f, f];
      }
      m = new THREE.Mesh(new THREE.BoxGeometry(BW, h, BD), mats);
      var e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0xf4f1ec, transparent: true, opacity: L[2] === 'top' ? 0.35 : 0.85 }));
      m.add(e); m.userData = { base: -y - h / 2, idx: i, h: h }; g.add(m); layers.push(m); y += h;
    });
    g.visible = false; scene.add(g);
    return { g: g, layers: layers, total: y };
  }
  var blocks = {}, cur = null, labels = [], v = new THREE.Vector3(), W = 1, H = 1, narrow = false;
  function labelSet(kind) {
    labelsEl.innerHTML = '';
    labels = KINDS[kind].map(function (L, i) {
      var el = document.createElement('div'); el.className = 'bl' + (i === 0 ? ' top' : '');
      el.innerHTML = '<span class="bl-dot"></span><span class="bl-t"><b></b><em></em></span>';
      el.querySelector('b').textContent = L[0]; el.querySelector('em').textContent = L[1];
      var prev = i > 0 && KINDS[kind][i - 1][0] === L[0]; if (prev) el.classList.add('cont');
      labelsEl.appendChild(el); return el;
    });
  }
  api.resize = function () {
    W = host.clientWidth || 1; H = host.clientHeight || 1; narrow = W < 760;
    renderer.setSize(W, H, false); cam.aspect = W / H; cam.fov = narrow ? 44 : 30;
    if (narrow) cam.setViewOffset(W, H, W * 0.22, H * 0.04, W, H); else cam.setViewOffset(W, H, -W * 0.19, H * 0.09, W, H);
    cam.updateProjectionMatrix(); api.dirty = true;
  };
  function ease(t) { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var st = { kind: 'terrazzo', reveal: 0, rot: 0 };
  api.set = function (o) {
    if (o.kind && o.kind !== st.kind) st.kind = o.kind;
    if (o.reveal != null) st.reveal = o.reveal; if (o.rot != null) st.rot = o.rot; api.dirty = true;
  };
  api.render = function () {
    var k = st.kind;
    if (!blocks[k]) blocks[k] = build(k);
    if (cur !== k) { Object.keys(blocks).forEach(function (n) { blocks[n].g.visible = n === k; }); cur = k; labelSet(k); }
    var B = blocks[k], r = ease(st.reveal), sep = ease((st.reveal - 0.35) / 0.65);
    B.layers.forEach(function (m) { m.position.y = m.userData.base - m.userData.idx * GAP * sep; });
    B.g.rotation.y = st.rot;
    /* camera: from just above the finish (it fills the frame) to a three-quarter view of the section */
    var p0 = new THREE.Vector3(0.6, 1.9, 2.2), l0 = new THREE.Vector3(0.1, 0, -0.2);
    var p1 = narrow ? new THREE.Vector3(7.6, 6.2, 14.6) : new THREE.Vector3(8.8, 5.8, 13.6), l1 = new THREE.Vector3(0, -0.85, 0);
    cam.position.lerpVectors(p0, p1, r); var look = l0.clone().lerp(l1, r); cam.lookAt(look);
    renderer.render(scene, cam);
    var la = Math.max(0, Math.min(1, (st.reveal - 0.62) / 0.3));
    for (var i = 0; i < labels.length; i++) {
      var m = B.layers[i]; v.set(BW / 2, m.position.y, BD / 2).applyMatrix4(B.g.matrixWorld); v.project(cam);
      var sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      labels[i].style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)';
      labels[i].style.opacity = String(Math.max(0, Math.min(1, la * 1.6 - i * 0.14)));
    }
    api.dirty = false;
  };
  api.resize();
  return api;
};
