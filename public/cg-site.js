/* Coreguard site script: header state, reveal-on-scroll, enquiry + brochure forms. */
(function () {
  var raf = 0, io = null, seen = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
  function frame() {
    raf = 0;
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    var hdr = document.getElementById('cg-hdr');
    if (hdr) { hdr.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : '0'); hdr.classList.toggle('sc', y > 8); }
  }
  function req() { if (!raf) raf = requestAnimationFrame(frame); }
  function bind() {
    if (!('IntersectionObserver' in window)) { document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); }); return; }
    if (!io) io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: 0.12 });
    document.querySelectorAll('.rv:not(.in)').forEach(function (el) { if (seen && seen.has(el)) return; if (seen) seen.add(el); io.observe(el); });
  }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  var tm = 0, hashed = false;
  function tohash() { if (hashed || !location.hash || location.hash.length < 2) return; var el = null; try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {} if (el) { hashed = true; el.scrollIntoView(); } }
  new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(function () { bind(); req(); tohash(); }, 60); }).observe(document.documentElement, { childList: true, subtree: true });
})();

(function () {
  /* Optional: paste a form endpoint (e.g. Web3Forms or Formspree) to also receive every enquiry by email. */
  var CG_ENDPOINT = '';
  function field(f, n) { return f.querySelector('[name="' + n + '"]'); }
  function mark(el, bad) { if (!el) return; if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
  function say(msg, text, link, cls) {
    if (!msg) return;
    msg.className = cls;
    msg.textContent = text;
    if (link) { var a = document.createElement('a'); a.href = link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = ' Open WhatsApp'; msg.appendChild(a); }
  }
  function normphone(v) {
    var d = (v || '').replace(/\D/g, '');
    if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    else if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : '';
  }
  function emailok(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function post(data) { if (!CG_ENDPOINT) return; try { fetch(CG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }).catch(function () {}); } catch (e) {} }
  function openwa(to, text) { var url = 'https://wa.me/' + to + '?text=' + encodeURIComponent(text); var w = null; try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch (err) { w = null; } return { url: url, ok: !!w }; }
  document.addEventListener('input', function (e) { if (e.target && e.target.closest && e.target.closest('.cg-enq, #cg-gate-form')) mark(e.target, false); });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f || !(f.classList.contains('cg-enq') || f.id === 'cg-gate-form')) return;
    e.preventDefault();
    var gate = f.id === 'cg-gate-form';
    var msg = f.querySelector('.msg, .gmsg'), base = gate ? 'gmsg mono' : 'msg mono';
    var problems = [], first = null;
    var nm = field(f, 'Name'), ph = field(f, 'Phone'), em = field(f, 'Email'), cs = field(f, 'consent');
    var nameok = nm && nm.value.trim().length >= 2; mark(nm, !nameok); if (!nameok) { problems.push('your name'); first = first || nm; }
    var phone = normphone(ph && ph.value); mark(ph, !phone); if (!phone) { problems.push('a valid 10-digit mobile number'); first = first || ph; }
    if (em) {
      var ev = em.value.trim(), need = gate || em.hasAttribute('data-required');
      var good = ev ? emailok(ev) : !need;
      mark(em, !good); if (!good) { problems.push(need ? 'a valid email' : 'a valid email, or leave it blank'); first = first || em; }
    }
    if (problems.length) { say(msg, 'Please add ' + problems.join(', ') + '.', null, base); if (first) first.focus(); return; }
    if (!cs || !cs.checked) { say(msg, 'Please confirm we may contact you.', null, base); if (cs) cs.focus(); return; }
    var forsel = field(f, 'For'), route = f.getAttribute('data-route') === 'true' && forsel && forsel.value && forsel.value !== 'A home';
    var to = (route && f.getAttribute('data-wa2')) || f.getAttribute('data-wa') || '919819330556', data = {}, lines = [];
    Array.prototype.forEach.call(f.elements, function (el) {
      if (!el.name || el.type === 'checkbox' || !el.value || !el.value.trim()) return;
      var v = el.name === 'Phone' ? '+91 ' + phone : el.value.trim();
      data[el.name] = v; lines.push(el.name + ': ' + v);
    });
    if (gate) {
      data.Source = 'Company profile download'; post(data);
      var a = document.createElement('a'); a.href = './Coreguard-Company-Profile.pdf'; a.download = 'Coreguard-Company-Profile.pdf'; document.body.appendChild(a); a.click(); a.remove();
      var g = openwa(to, 'New Coreguard lead\nSource: Company profile download\n' + lines.join('\n'));
      say(msg, 'Your download has started. Press send in WhatsApp so we know it reached you.', g.ok ? null : g.url, base + ' ok');
      return;
    }
    data.Source = 'Website enquiry'; post(data);
    var r = openwa(to, 'New Coreguard enquiry\n' + lines.join('\n'));
    if (r.ok) say(msg, 'WhatsApp is opening with your enquiry. Press send there to deliver it.', r.url, base + ' ok');
    else say(msg, 'Your browser blocked WhatsApp from opening.', r.url, base);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var x = document.getElementById('cg-gate-x'); if (x) x.click(); } });
})();
