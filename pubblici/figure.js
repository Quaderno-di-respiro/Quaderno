/* Quaderno del Respiro: figure animate degli esercizi.
   QGFig.mount(el) · QGFig.mountAll(root) · QGFig.strip(id, n) · QGFig.ids()
   Modello: figura di profilo a cinematica 2D. Il bacino (o la spalla) è la radice; il tronco è
   una curva con angolo e curvatura; gli arti sono catene a due ossa risolte con IK verso un
   bersaglio (punto, coordinate polari dalla radice, punto sulla superficie del tronco).
   Una posa è un oggetto di parametri; un'animazione è una lista di pose chiave con durata e
   indicazione. Viste a parte per piede, dita, torace di fronte, candela, testa in sezione, gambe di
   fronte e da dietro, sdraiato sul fianco. Id: E1…E31, T7, poi E32, E33, T8…T12.
   JavaScript puro, nessuna libreria, nessuna richiesta di rete. */
(function (W) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', R = Math.PI / 180;

  /* ---------- vettori ---------- */
  function dir(a) { return [Math.cos(a * R), Math.sin(a * R)]; }
  function add(p, v, k) { if (k == null) k = 1; return [p[0] + v[0] * k, p[1] + v[1] * k]; }
  function sub(p, q) { return [p[0] - q[0], p[1] - q[1]]; }
  function len(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }
  function ang(v) { return Math.atan2(v[1], v[0]) / R; }
  function rot(v, a) { var c = Math.cos(a * R), s = Math.sin(a * R); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; }
  function unit(v) { var l = len(v) || 1; return [v[0] / l, v[1] / l]; }
  function mid(p, q, t) { if (t == null) t = 0.5; return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; }
  function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function ease(u) { return 0.5 - 0.5 * Math.cos(Math.PI * u); }
  function shallow(a, b) { var r = {}, k; for (k in a) r[k] = a[k]; for (k in b) r[k] = b[k]; return r; }

  /* ---------- primitive: elementi SVG come oggetti ---------- */
  function E(t, a, k, x) { return { t: t, a: a, k: k, x: x }; }
  function ext(a, x) { if (x) for (var k in x) a[k] = x[k]; return a; }
  function L(p, q, w, c, x) {
    var a = { x1: f1(p[0]), y1: f1(p[1]), x2: f1(q[0]), y2: f1(q[1]), 'class': c || 'b' };
    if (w) a['stroke-width'] = w;
    return E('line', ext(a, x));
  }
  function PL(pts, w, c, x) {
    var a = { points: pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' '), 'class': c || 'b' };
    if (w) a['stroke-width'] = w;
    return E('polyline', ext(a, x));
  }
  function PA(d, c, x) { return E('path', ext({ d: d, 'class': c }, x)); }
  function CI(p, r, c, x) { return E('circle', ext({ cx: f1(p[0]), cy: f1(p[1]), r: f1(r), 'class': c }, x)); }
  function TX(p, s, c, anchor, x) {
    var a = { x: f1(p[0]), y: f1(p[1]), 'class': c || 't' };
    if (anchor) a['text-anchor'] = anchor;
    return E('text', ext(a, x), null, s);
  }
  function G(a, k) { return E('g', a || {}, k); }
  function op(v) { return { opacity: f1(cl(v, 0, 1) * 100) / 100 }; }
  function M(p) { return f1(p[0]) + ' ' + f1(p[1]); }
  function pth(pts, close) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + M(p); }).join(' ') + (close ? 'Z' : ''); }
  function qd(a, c, b) { return 'M' + M(a) + 'Q' + M(c) + ' ' + M(b); }
  function smooth(pts, close) { // Catmull-Rom → Bézier
    var n = pts.length, d = 'M' + M(pts[0]), last = close ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (!close) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
      d += 'C' + M([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + ' ' +
        M([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + ' ' + M(p2);
    }
    return d + (close ? 'Z' : '');
  }
  // freccia senza marker (nessun id da rendere unico nella pagina)
  function AR(p, q, kind, o, w) {
    var u = unit(sub(q, p)), n = [-u[1], u[0]];
    var tip = pth([q, add(add(q, u, -7.5), n, 4), add(add(q, u, -7.5), n, -4)], true);
    return G(o == null ? {} : op(o), [L(p, add(q, u, -5), w || 2.5, kind || 'br'), PA(tip, kind === 'gr' ? 'fgr' : 'fbr')]);
  }
  function AR2(p, q, kind, o) { var m = mid(p, q); return G(o == null ? {} : op(o), [AR(m, p, kind), AR(m, q, kind)]); }
  // freccia curva su un arco d'ellisse (centro c, raggi rx ry, da a0 ad a1 gradi): rotazioni viste di fronte
  function CAR(c, rx, ry, a0, a1, kind, o) {
    var pts = [], i, a;
    for (i = 0; i <= 8; i++) { a = (a0 + (a1 - a0) * i / 8) * R; pts.push([c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a)]); }
    var q = pts[8], u = unit(sub(q, pts[7])), n = [-u[1], u[0]];
    pts[8] = add(q, u, -5);
    return G(o == null ? {} : op(o), [PA(smooth(pts), kind || 'gr'), PA(pth([q, add(add(q, u, -7.5), n, 4), add(add(q, u, -7.5), n, -4)], true), kind === 'br' ? 'fbr' : 'fgr')]);
  }
  function cross(p, r, o) { return G(o == null ? {} : op(o), [L(add(p, [-r, -r]), add(p, [r, r]), 3), L(add(p, [-r, r]), add(p, [r, -r]), 3)]); }
  function badge(p, n, kind, o) { return G(o == null ? {} : op(o), [CI(p, 9, kind === 'gr' ? 'fgr' : 'fbr'), TX(p, String(n), 'tn')]); }
  function rrect(c, w, h, a, cls, rx) {
    return E('rect', { x: f1(c[0] - w / 2), y: f1(c[1] - h / 2), width: f1(w), height: f1(h), rx: rx == null ? Math.min(w, h) / 2 : rx, 'class': cls || 'bf', transform: 'rotate(' + f1(a) + ' ' + M(c) + ')' });
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ser(el) {
    var s = '<' + el.t, k, i;
    for (k in el.a) s += ' ' + k + '="' + esc(el.a[k]) + '"';
    if (!el.k && el.x == null) return s + '/>';
    s += '>';
    if (el.k) for (i = 0; i < el.k.length; i++) s += ser(el.k[i]);
    if (el.x != null) s += esc(el.x);
    return s + '</' + el.t + '>';
  }
  function build(el) {
    var n = document.createElementNS(NS, el.t), k, i;
    n._a = {};
    for (k in el.a) { n.setAttribute(k, el.a[k]); n._a[k] = el.a[k]; }
    if (el.k) for (i = 0; i < el.k.length; i++) n.appendChild(build(el.k[i]));
    if (el.x != null) { n.textContent = el.x; n._x = el.x; }
    return n;
  }
  function patch(n, el) { // aggiorna solo gli attributi cambiati
    var k, a = el.a, o = n._a, i, kids = el.k || [], cn = n.childNodes;
    for (k in a) if (o[k] !== a[k]) { n.setAttribute(k, a[k]); o[k] = a[k]; }
    for (k in o) if (!(k in a)) { n.removeAttribute(k); delete o[k]; }
    if (el.x != null) { if (n._x !== el.x) { n.textContent = el.x; n._x = el.x; } return; }
    var same = cn.length === kids.length;
    for (i = 0; same && i < kids.length; i++) if (cn[i].nodeName !== kids[i].t) same = false;
    if (same) { for (i = 0; i < kids.length; i++) patch(cn[i], kids[i]); return; }
    while (n.firstChild) n.removeChild(n.firstChild);
    for (i = 0; i < kids.length; i++) n.appendChild(build(kids[i]));
  }

  /* ---------- il corpo di profilo ---------- */
  // lunghezze: tronco (anca→spalla), collo (spalla→centro testa), raggio testa, coscia, gamba,
  // braccio, avambraccio, mano. Spessori del tratto come nella guida.
  var LT = 86, LN = 24, HR = 14, TH = 60, SH = 56, UA = 45, FA = 37, HA = 11;
  var WT = 18, WTH = 11, WSH = 9, WFT = 7, WUA = 8, WFA = 7, WHA = 6;
  // zone del respiro: [lato (1 davanti, -1 dietro, 0 entrambi), da, a, ampiezza]
  var REG = { pb: [1, 0.06, 0.5, 7], pc: [0, 0.4, 0.74, 3.5], pp: [1, 0.6, 0.94, 4.5], ps: [-1, 0.06, 0.52, 5.5] };

  function ik(Ro, T, L1, L2, b) {
    var v = sub(T, Ro), a0 = ang(v), d = cl(len(v), Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.01);
    var ca = cl((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
    return [add(Ro, dir(a0 + b * Math.acos(ca) / R), L1), add(Ro, dir(a0), d)];
  }

  function torso(P) {
    var m = P.m || 1, t = P.t, Pp, Sp;
    if (P.rs) { Sp = [P.x, P.y]; Pp = add(Sp, dir(t), -LT); } else { Pp = [P.x, P.y]; Sp = add(Pp, dir(t), LT); }
    var C = add(mid(Pp, Sp), rot(dir(t), 90 * m), P.cu || 0);
    var o = { P: Pp, S: Sp, C: C, m: m };
    o.B = function (s) {
      var a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c = s * s;
      return [a * Pp[0] + b * C[0] + c * Sp[0], a * Pp[1] + b * C[1] + c * Sp[1]];
    };
    o.U = function (s) { // tangente verso la spalla
      return unit([2 * (1 - s) * (C[0] - Pp[0]) + 2 * s * (Sp[0] - C[0]), 2 * (1 - s) * (C[1] - Pp[1]) + 2 * s * (Sp[1] - C[1])]);
    };
    o.N = function (s) { return rot(o.U(s), 90 * m); }; // normale verso il davanti
    o.bul = function (s, side) {
      var tot = 0;
      for (var k in REG) {
        var g = REG[k], v = P[k] || 0;
        if (!v || (g[0] !== 0 && g[0] !== side) || s < g[1] || s > g[2]) continue;
        tot += v * g[3] * Math.sin(Math.PI * (s - g[1]) / (g[2] - g[1]));
      }
      return tot;
    };
    o.pt = function (s, off, side) { // punto sulla superficie: side 1 davanti, -1 dietro
      side = side || 1;
      return add(o.B(s), o.N(s), side * (WT / 2 + o.bul(s, side) + (off || 0)));
    };
    if (P.t2 != null) { // due tratti (E33): lombare fino a metà (t, cu), poi dorsale con angolo e curvatura propri (t2, cu2)
      var Mp = add(Pp, dir(t), LT / 2), S2 = add(Mp, dir(P.t2), LT / 2);
      var C1 = add(mid(Pp, Mp), rot(dir(t), 90 * m), P.cu || 0), C2 = add(mid(Mp, S2), rot(dir(P.t2), 90 * m), P.cu2 || 0);
      o.S = S2; o.C = C2; o.M = Mp;
      o.B = function (s) { return s < 0.5 ? qB(Pp, C1, Mp, 2 * s) : qB(Mp, C2, S2, 2 * s - 1); };
      o.U = function (s) { return s < 0.5 ? qU(Pp, C1, Mp, 2 * s) : qU(Mp, C2, S2, 2 * s - 1); };
    }
    return o;
  }
  function qB(a, c, b, s) { var u = 1 - s; return [u * u * a[0] + 2 * s * u * c[0] + s * s * b[0], u * u * a[1] + 2 * s * u * c[1] + s * s * b[1]]; }
  function qU(a, c, b, s) { return unit([2 * (1 - s) * (c[0] - a[0]) + 2 * s * (b[0] - c[0]), 2 * (1 - s) * (c[1] - a[1]) + 2 * s * (b[1] - c[1])]); }
  function limbTarget(sp, root, to) {
    if (sp.p) return sp.p;
    if (sp.tor != null) return to.pt(sp.tor, sp.off || 0, sp.side || 1);
    return add(root, dir(sp.a), sp.r);
  }
  // piede: tallone → teste metatarsali → punta (dita piegabili con tb)
  function foot(A, sp, out) {
    var f = sp.f || 0, s = sp.fs || 1, n = rot(dir(f), 90 * s), u = dir(f);
    var h = add(add(A, u, -6), n, 2.5), ball = add(add(A, u, 15), n, 2.5);
    var toe = add(ball, dir(f + (sp.tb || 0) * s), 9);
    out.push(PL([h, ball, toe], WFT));
    return { heel: h, ball: ball, toe: toe, n: n, u: u };
  }
  function body(P) {
    var to = torso(P), m = to.m, J = { to: to };
    var hd = ang(sub(to.S, to.C)) + (P.nk || 0) * m;
    J.H = add(to.S, dir(hd), LN); J.hd = hd; J.face = rot(dir(hd), 90 * m);
    J.sa = to.B(0.93);
    if (P.sh) J.sa = add(J.sa, to.U(0.93), P.sh); // spalla alzata (T9)
    function leg(sp, out) {
      var r = ik(to.P, limbTarget(sp, to.P, to), TH * (sp.k1 || 1), SH * (sp.k2 || 1), sp.b || -1);
      out.push(L(to.P, r[0], WTH), L(r[0], r[1], WSH));
      return { K: r[0], A: r[1], ft: foot(r[1], sp, out) };
    }
    function arm(sp, out, halo) {
      var r = ik(J.sa, limbTarget(sp, J.sa, to), UA * (sp.k1 || 1), FA * (sp.k2 || 1), sp.b || 1);
      var w = sp.w == null ? ang(sub(r[1], r[0])) : sp.w, tip = add(r[1], dir(w), HA);
      if (halo) { // alone del colore di fondo: il braccio vicino si stacca dal tronco
        var hs = { style: 'stroke:var(--surface)' };
        out.push(L(mid(J.sa, r[0], 0.45), r[0], WUA + 5, 'b', hs), L(r[0], r[1], WFA + 5, 'b', hs), L(r[1], tip, WHA + 5, 'b', hs));
      }
      out.push(L(J.sa, r[0], WUA), L(r[0], r[1], WFA), L(r[1], tip, WHA));
      return { E: r[0], Wr: r[1], tip: tip };
    }
    var far = [], near = [], tor = [], head = [], i, j;
    if (P.lf) J.lf = leg(P.lf, far);
    if (P.af) J.af = arm(P.af, far);
    if (P.ln) J.ln = leg(P.ln, near);
    if (P.an) J.an = arm(P.an, near, 1);
    var pts = [];
    for (i = 0; i <= 8; i++) pts.push(to.B(i / 8));
    tor.push(PA(smooth(pts), 'b', { 'stroke-width': WT }));
    for (var k in REG) { // rigonfiamenti del respiro: nascosti nel tronco quando l'ampiezza è 0
      var g = REG[k], sides = g[0] ? [g[0]] : [1, -1], amp = (P[k] || 0) * g[3];
      for (j = 0; j < sides.length; j++) {
        var bp = [];
        for (i = 0; i <= 6; i++) {
          var s = g[1] + (g[2] - g[1]) * i / 6;
          bp.push(add(to.B(s), to.N(s), sides[j] * (2 + amp * Math.sin(Math.PI * i / 6))));
        }
        tor.push(PA(smooth(bp), 'b', { 'stroke-width': 14 }));
      }
    }
    head.push(CI(J.H, HR, 'b', { 'stroke-width': 5 }));
    if (P.eye != null) { // occhio aperto (punto) o chiuso (trattino)
      var ec = add(add(J.H, J.face, 6), dir(hd), 2), e = cl(P.eye, 0, 1);
      head.push(L(add(ec, J.face, -0.2 - 1.6 * e), add(ec, J.face, 0.2 + 1.6 * e), 2.6 - 0.4 * e));
    }
    J.far = far; J.near = near; J.tor = tor; J.head = head;
    return J;
  }
  // naso: tratteggi che scorrono verso il naso (inspiro) o fuori (espiro)
  function nose(J, c, out, l) {
    var p0 = add(J.H, J.face, HR + 5), u = rot(J.face, 14 * J.to.m), nn = [-u[1], u[0]];
    var d = (c.time || 0) * 12 * (c.air || 0);
    for (var i = -1; i <= 1; i += 2) {
      var a = add(p0, nn, i * 3);
      out.push(L(a, add(a, u, l || 18), 2, 'br', { 'stroke-dasharray': '3 4', 'stroke-dashoffset': f1(d), opacity: c.air ? 0.9 : 0 }));
    }
  }
  function breathArrows(J, P, keys, out) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i], g = REG[k], v = P[k] || 0, sm = (g[1] + g[2]) / 2, sides = g[0] ? [g[0]] : [1, -1];
      for (var j = 0; j < sides.length; j++) {
        var a = J.to.pt(sm, 3, sides[j]);
        out.push(AR(a, add(a, J.to.N(sm), sides[j] * (6 + 14 * cl(v, 0, 1.3))), 'br', 0.15 + cl(v, 0, 1) * 0.85));
      }
    }
  }
  function archMark(ft, v, out) { // short foot: l'arco del piede sale
    var a = add(ft.heel, ft.u, 4), b = add(ft.ball, ft.u, -1);
    out.push(PA(qd(a, add(mid(a, b), ft.n, -(4 + 6 * v)), b), 'gr', ext(op(v), { 'stroke-width': 3 })));
  }
  function pelvicMark(J, v, out) { // pavimento pelvico che sale (trattieni la pipì)
    var to = J.to, u = to.U(0), n = to.N(0), c0 = add(to.P, u, -WT / 2 - 4);
    var d = qd(add(c0, n, 9), add(c0, u, 3 + 5 * v), add(c0, n, -9));
    out.push(G(op(v), [PA(d, 'b', { 'stroke-width': 7, style: 'stroke:var(--surface)' }), PA(d, 'gr', { 'stroke-width': 3 })]));
  }
  function surfLine(p, q, w) { return L(p, q, w || 7, 'b', { style: 'stroke:var(--surface)' }); }
  function pelvicDown(J, v, o, out) { // pavimento pelvico che scende inspirando («accoglie», E6) e risale espirando
    var to = J.to, u = to.U(0), n = to.N(0), c0 = add(to.P, u, -WT / 2 - 2 - 4 * v);
    var d = qd(add(c0, n, 9), add(c0, u, 6 - 9 * v), add(c0, n, -9));
    out.push(G(op(o), [PA(d, 'b', { 'stroke-width': 7, style: 'stroke:var(--surface)' }), PA(d, 'gr', { 'stroke-width': 3 })]));
    return c0;
  }
  function vis(c) { // visibilità legata alla fase: k.vis 1, 'in' (compare), 'out' (sparisce), 'io' (compare e sparisce)
    var v = c.k && c.k.vis, u = c.u == null ? 0.5 : c.u;
    return !v ? 0 : v === 1 ? 1 : cl(Math.min(v !== 'out' ? 4 * u : 1, v !== 'in' ? 4 * (1 - u) : 1), 0, 1);
  }
  function ghostBody(P, out) { // sagoma tratteggiata di una posa: l'errore da evitare
    var J = body(resolve(P)), to = J.to, pts = [], st = { style: 'stroke-width:4' };
    for (var i = 0; i <= 8; i++) pts.push(to.B(i / 8));
    out.push(PA(smooth(pts), 'ghost', st), CI(J.H, HR, 'ghost', st));
    if (J.ln) out.push(PL([to.P, J.ln.K, J.ln.A], 0, 'ghost', st));
    if (J.an) out.push(PL([J.sa, J.an.E, J.an.Wr], 0, 'ghost', st));
    return J;
  }

  /* ---------- oggetti di scena ---------- */
  function floor(w, y, out) { out.push(L([8, y], [w - 8, y], 0, 'g')); }
  function chair(x, seat, g0, out) { // x = bordo anteriore della seduta
    out.push(G({ 'class': 'b' }, [L([x - 58, seat], [x, seat], 5), L([x - 4, seat], [x - 4, g0], 4),
      L([x - 54, seat], [x - 54, g0], 4), L([x - 58, seat], [x - 60, seat - 84], 4)]));
  }
  function bottle(to, out) { // distesa sulla schiena: fondo sul sacro, tappo verso la testa
    var base = to.pt(0.02, 0, -1), u = to.U(0.2), n = rot(to.N(0.2), 180), c = add(add(base, u, 17), n, 7);
    out.push(rrect(c, 34, 13, ang(u), 'bf', 3), rrect(add(c, u, 20), 8, 7, ang(u), 'bf', 1));
  }
  function wall(x, g0, top, o, out) {
    var k = [L([x, top], [x, g0], 3, 'b')];
    for (var y = top + 8; y < g0; y += 16) k.push(L([x, y], [x - 8, y + 8], 2, 'g'));
    out.push(G(op(o), k));
  }

  /* ---------- composizione di una figura di profilo ---------- */
  function sideFig(A) {
    return function (P, c) {
      var out = [], J = body(P);
      c.J = J;
      if (A.pre) A.pre(P, c, out, J);
      // qg-corpo segna il manichino: la «pelle» di Quiver lo nasconde e lascia oggetti, frecce e scritte
      if (J.far.length) out.push(G({ opacity: 0.4, 'class': 'qg-corpo' }, J.far));
      out.push(G({ 'class': 'b qg-corpo' }, J.tor.concat(J.head)));
      if (A.mid) A.mid(P, c, out, J);
      out.push(G({ 'class': 'qg-corpo' }, J.near));
      if (P.sf != null && J[A.sfLeg || 'ln']) archMark(J[A.sfLeg || 'ln'].ft, P.sf, out);
      if (P.pv != null) pelvicMark(J, P.pv, out);
      if (A.arrows) breathArrows(J, P, A.arrows, out);
      if (A.nose) nose(J, c, out);
      if (A.post) A.post(P, c, out, J);
      return out;
    };
  }

  /* ---------- archivio ---------- */
  var LIB = {}, ORDER = [];
  function def(A) { LIB[A.id] = A; ORDER.push(A.id); if (!A.draw) A.draw = sideFig(A); }
  function alias(id, of, aria) { LIB[id] = { alias: of, aria: aria }; ORDER.push(id); }
  function poseOf(base, o) { return shallow(base, o || {}); }

  /* ======================= A TERRA ======================= */
  var GF = 128;
  var SUP = {
    x: 174, y: GF - 9, t: 180, nk: 18,
    ln: { p: [220, GF - 6], b: -1, f: -6 }, lf: { p: [223, GF - 6], b: -1, f: -6 }, // piedi vicini: in alto la tibia è verticale, lavora il gluteo
    an: { p: [175, GF - 4], b: -1, w: 0 }, af: { p: [178, GF - 4], b: -1, w: 0 }
  };
  function supFloor(P, c, o) { floor(320, GF, o); }
  // mani sulla pancia e sul petto: gomito a terra di lato, avambraccio visto di scorcio (lunghezza fissa)
  var HB = { tor: 0.32, off: 3, b: 1, k2: 0.5, w: 0 }, HC = { tor: 0.72, off: 3, b: 1, k1: 0.41, k2: 0.5, w: 0 };
  // HC (mano sul petto, E1): anche il braccio è di scorcio, così il gomito resta a terra di lato invece di stare per aria sopra la pancia
  // respiro da supini (E1, E3, E6, E16, E22): piedi come nei tutorial T6 e T7, ginocchio a circa 90°. I piedi a un palmo
  // dal sedere di SUP servono al ponte (E19); qui non servono e portavano la coscia sopra «pancia», «perineo» e il 3
  var SUPR = poseOf(SUP, { ln: { p: [254, GF - 6], b: -1, f: -6 }, lf: { p: [257, GF - 6], b: -1, f: -6 } });

  // E1 — respiro di pancia, supino (L1: ginocchia piegate e unite, mano sul petto e sulla pancia, 3–4 s dentro, fino a 5 fuori)
  def({
    id: 'E1', v: [320, 108, 30], aria: 'Figura supina a ginocchia piegate, una mano sulla pancia e una sul petto: inspirando dal naso sale solo la pancia, espirando scende; il petto resta fermo',
    base: poseOf(SUPR, { pb: 0, an: HB, af: HC }),
    keys: [
      { d: 4, s: 'Inspira dal naso, sale la pancia', ss: 'Inspira · 4 s', n: 1, p: { pb: 1.15 } },
      { d: 5, s: 'Espira lento, la pancia scende', ss: 'Espira · 5 s', n: 1, p: { pb: 0 } }
    ],
    arrows: ['pb'], nose: 1, main: 0, pre: supFloor,
    post: function (P, c, o, J) {
      var a = J.to.pt(0.28, 26, 1);
      o.push(TX([a[0] + 12, a[1] - 2], 'pancia', 'tk'));
      o.push(TX([104, 62], 'petto fermo', 't', 'end'));
    }
  });

  // E3 — 5 + 5 più profondo
  def({
    id: 'E3', v: [320, 108, 30], aria: 'Figura supina a ginocchia piegate con una mano sulla pancia: stessi 5 secondi, ma entra più aria e la pancia si gonfia di più; il petto resta quasi fermo',
    base: poseOf(SUPR, { pb: 0, an: HB }),
    keys: [
      { d: 5, s: 'Inspira più profondo, più aria', ss: 'Inspira · 5 s', n: 1, p: { pb: 1.45, pc: 0.4, pp: 0.12 } },
      { d: 5, s: 'Espira lento', ss: 'Espira · 5 s', n: 1, p: { pb: 0, pc: 0, pp: 0 } }
    ],
    arrows: ['pb'], nose: 1, main: 0, pre: supFloor,
    post: function (P, c, o, J) { o.push(TX([160, 46], 'più aria, lavora la pancia', 'tk', 'middle')); }
  });

  // cupole: diaframma e pavimento pelvico disegnati sul tronco (con alone del colore di fondo)
  function domes(J, P, out, num) {
    var to = J.to, dd = P.dd || 0;
    var s1 = 0.66 - 0.1 * dd, c1 = to.B(s1), u1 = to.U(s1), n1 = to.N(s1);
    var a1 = add(c1, n1, 10), b1 = add(c1, n1, -10), q1 = add(c1, u1, 13 - 7 * dd);
    var s2 = 0.06, c2 = add(to.B(s2), to.U(0), -3 - 6 * dd), u2 = to.U(0), n2 = to.N(0);
    var a2 = add(c2, n2, 10), b2 = add(c2, n2, -10), q2 = add(c2, u2, 9 - 9 * dd);
    out.push(G({}, [PA(qd(a1, q1, b1), 'b', { 'stroke-width': 7, style: 'stroke:var(--surface)' }), PA(qd(a1, q1, b1), 'br', { 'stroke-width': 3 }),
      PA(qd(a2, q2, b2), 'b', { 'stroke-width': 7, style: 'stroke:var(--surface)' }), PA(qd(a2, q2, b2), 'br', { 'stroke-width': 3 })]));
    if (num) { out.push(badge(add(c1, n1, 30), 1, 'br'), badge(add(c2, n2, 30), 2, 'br')); }
    return { d1: add(c1, n1, 30), d2: add(c2, n2, 30) };
  }

  // E6 — pavimento pelvico col respiro (L1: il diaframma scende e il pelvico accoglie come un materasso)
  def({
    id: 'E6', v: [320, 108, 30], aria: 'Figura supina a ginocchia piegate con il diaframma e il pavimento pelvico segnati: inspirando il diaframma scende e il pelvico si allarga verso il basso come un materasso; espirando risalgono insieme, da soli',
    base: poseOf(SUPR, { pb: 0, dd: 0 }),
    keys: [
      { d: 5, s: 'Inspira: diaframma e pelvico scendono', ss: 'Inspira · scendono', n: 1, p: { pb: 0.8, pc: 0.5, dd: 1 } },
      { d: 5, s: 'Espira: risalgono da soli', ss: 'Espira · risalgono', n: 1, p: { pb: 0, pc: 0, dd: 0 } }
    ],
    nose: 1, main: 0, pre: supFloor,
    post: function (P, c, o, J) {
      domes(J, P, o, true);
      o.push(badge([30, 44], 1, 'br'), TX([43, 48], 'diaframma', 'tk'), badge([128, 44], 2, 'br'), TX([141, 48], 'pelvico, come un materasso', 'tk'));
    }
  });

  // E16 — tre diaframmi
  def({
    id: 'E16', v: [320, 108, 30], aria: 'Figura supina a ginocchia piegate con tre cupole: 1 diaframma, 2 pavimento pelvico, 3 arco del piede. Inspira col cilindro e le due cupole scendono; espirando attivi lo short foot e l\'arco del piede sale',
    base: poseOf(SUPR, { pb: 0, pc: 0, dd: 0, sf: 0 }),
    keys: [
      { d: 5, s: 'Inspira col cilindro: coste, fianchi, pancia', ss: 'Inspira · cilindro', n: 1, p: { pb: 0.85, pc: 0.8, dd: 1, sf: 0 } },
      { d: 5, s: 'Espira e attiva lo short foot', ss: 'Espira · short foot', n: 1, p: { pb: 0, pc: 0, dd: 0, sf: 1 } }
    ],
    nose: 1, main: 1, pre: supFloor,
    post: function (P, c, o, J) {
      domes(J, P, o, true);
      var f = J.ln.ft;
      o.push(badge(add(mid(f.heel, f.ball), [0, -24]), 3, 'gr', 0.35 + 0.65 * P.sf));
    }
  });

  // E22 — perineo senza aiutanti (il respiro non si ferma)
  def({
    id: 'E22', v: [320, 108, 30], aria: 'Figura supina a ginocchia piegate: contrai il perineo come per trattenere la pipì mentre il respiro continua, senza muovere glutei, cosce e pancia; poi rilascia',
    base: poseOf(SUPR, { pb: 0, pv: 0 }),
    keys: [
      { d: 2, s: 'Inspira', n: 1, p: { pb: 0.45 } },
      { d: 3, s: 'Contrai: trattieni la pipì, continua a inspirare', ss: 'Contrai, respira', p: { pb: 1, pv: 1 }, k: 'gr' },
      { d: 2.5, s: 'Rilascia, senza fermare il respiro', ss: 'Rilascia', p: { pb: 0.55, pv: 0 }, air: -1 },
      { d: 2.5, s: 'Espira', n: 1, p: { pb: 0 } }
    ],
    nose: 1, arrows: ['pb'], main: 1, pre: supFloor,
    post: function (P, c, o, J) {
      o.push(TX([160, 46], 'glutei, cosce e pancia fermi', 't', 'middle'));
      o.push(TX([191, 122], 'perineo', 'tk', 'start', op(0.35 + 0.65 * P.pv))); // fra coscia e tibia, vicino all'arco
    }
  });

  // E19 — ponte glutei: radice alla spalla, spalle e testa restano a terra.
  // Piedi a un palmo dal sedere: con l'angolo tra tibia e femore aperto lavorerebbero prima i femorali.
  var BR0 = { rs: 1, x: 88, y: GF - 9, t: 180, nk: 18, pb: 0, pc: 0,
    ln: { p: [220, GF - 6], b: -1, f: -6 }, lf: { p: [223, GF - 6], b: -1, f: -6 }, // piedi vicini: in alto la tibia è verticale, lavora il gluteo
    an: { p: [139, 86], b: 1, w: -90 }, af: { p: [142, 86], b: 1, w: -90 } };
  def({
    id: 'E19', v: [320, 128, 30], aria: 'Ponte glutei di profilo, piedi a un palmo dal sedere, gomiti a terra e avambracci in alto: a terra inspiri e gonfi il cilindro, poi espirando spingi i gomiti nel pavimento e sali col bacino finché spalle, bacino e ginocchia sono in linea; in alto la tibia è quasi verticale e le ginocchia vanno appena avanti; la schiena non tira',
    base: BR0,
    keys: [
      { d: 2.5, s: 'Inspira, gonfia il cilindro', ss: 'Inspira', n: 1, p: { pb: 0.8, pc: 0.7 } },
      { d: 2.5, s: 'Espira e sali: ginocchia avanti', ss: 'Espira e sali', p: { t: 158, nk: 40, pb: 0.15, pc: 0.15 } },
      { d: 2, s: 'Tieni, bacino fermo', ss: 'Tieni', p: {} },
      { d: 2.5, s: 'Scendi piano', ss: 'Scendi', p: { t: 180, nk: 18, pb: 0, pc: 0 } }
    ],
    arrows: ['pb'], main: 2, pre: supFloor,
    post: function (P, c, o, J) {
      var up = cl((180 - P.t) / 22, 0, 1), k = J.ln.K;
      o.push(AR(add(k, [10, -6]), add(k, [34, -2]), 'gr', up));
      o.push(TX(add(k, [-8, -16]), 'ginocchia avanti', 'tk', 'end', op(up)));
      // «gomiti giù» = spingili nel pavimento: freccia sotto il gomito (sopra spariva dentro l'avambraccio) e scritta esplicita
      var e = J.an.E;
      o.push(AR([e[0], GF + 3], [e[0], GF + 14], 'gr', 0.3 + 0.7 * up));
      o.push(TX([e[0], GF + 27], 'i gomiti spingono a terra', 't', 'middle'));
    }
  });

  // E25 — propedeutiche alla camminata, dead bug a catena crociata
  var DB_UP = { a: -47, r: 82, b: -1, f: 10 }, DB_DN = { a: 2.2, r: 80, b: -1, f: -6 };
  // braccio giù come nel tutorial T10 (1:10–1:26): gomito a terra e avambraccio in alto, pugno chiuso (come nel ponte), ed è il gomito
  // che spinge; prima spingeva col palmo il braccio teso lungo il fianco. Braccio su: dritto verso il soffitto
  var DA_UP = { a: -88, r: 81, b: 1, w: -88 }, DA_DN = { a: -36.3, r: 55.8, b: 1, w: -90 };
  def({
    id: 'E25', v: [320, 132, 26], aria: 'Figura supina a ginocchia piegate, gomiti a terra e avambracci in alto: tronco fermo, un ginocchio sale insieme al braccio opposto mentre il piede e il gomito degli altri due arti, anche loro opposti, spingono a terra; poi l\'altro lato',
    base: poseOf(SUP, { pb: 0, pc: 0, ln: DB_DN, lf: DB_DN, an: DA_DN, af: DA_DN }),
    keys: [
      { d: 2.5, s: 'Inspira, gonfia il cilindro', ss: 'Inspira', n: 1, p: { pb: 0.7, pc: 0.7 } },
      { d: 2.5, s: 'Sale il ginocchio, sale il braccio opposto', ss: 'Ginocchio e braccio opposto su', p: { ln: DB_UP, af: DA_UP } },
      { d: 2.5, s: 'Torna giù espirando', ss: 'Giù, espira', p: { ln: DB_DN, af: DA_DN, pb: 0, pc: 0 } },
      { d: 2.5, s: 'Inspira', n: 1, p: { pb: 0.7, pc: 0.7 } },
      { d: 2.5, s: 'Ora l\'altro lato', ss: 'Altro lato', p: { lf: DB_UP, an: DA_UP } },
      { d: 2.5, s: 'Torna giù espirando', p: { lf: DB_DN, an: DA_DN, pb: 0, pc: 0 } }
    ],
    strip: [1, 4], main: 1, pre: supFloor,
    post: function (P, c, o, J) {
      var nUp = cl((2.2 - P.ln.a) / 49, 0, 1), fUp = cl((2.2 - P.lf.a) / 49, 0, 1);
      // spinge a terra: il piede della gamba che resta giù e la mano del braccio che resta giù
      var fa = J.lf.ft.ball, na = J.ln.ft.ball;
      o.push(AR(add(fa, [-4, -26]), add(fa, [-4, -9]), 'gr', nUp));
      o.push(AR(add(na, [-4, -26]), add(na, [-4, -9]), 'gr', fUp));
      var ex = (fUp > nUp ? J.af : J.an).E[0]; // il gomito che resta giù spinge nel pavimento
      o.push(AR([ex, GF + 3], [ex, GF + 14], 'gr', Math.max(nUp, fUp)));
      o.push(TX([190, GF + 27], 'gomito e piede opposti spingono', 't', 'middle', op(Math.max(nUp, fUp))));
      o.push(TX([214, 42], 'tronco fermo, arti in movimento', 't', 'middle')); // era a y 26, fuori dal riquadro
    }
  });

  // ---- prono ----
  var PRO = {
    m: -1, x: 166, y: GF - 9, t: 180, nk: -37,
    ln: { a: 1.6, r: 116, b: 1, f: 6, fs: -1 }, lf: { a: 0.8, r: 116, b: 1, f: 0, fs: -1 },
    an: { p: [68, GF - 6], b: -1, k1: 0.42, w: 180 }, af: { p: [71, GF - 6], b: -1, k1: 0.42, w: 180 }
  };
  // E7 — coccodrillo (fronte sulle mani, l'aria va nella bassa schiena, scapole ferme). Seconda parte (L1): «stessa
  // cosa» del supino, coste basse e schiena e poi il pelvico che accoglie; un filo di pancia preme sul pavimento
  var E7IN = 'Inspira: coste basse e schiena, poi il pelvico accoglie';
  def({
    id: 'E7', v: [320, 106, 50], aria: 'Figura a pancia in giù con la fronte sulle mani: inspirando si gonfiano la bassa schiena e le coste dietro, espirando la schiena si ritrae; le scapole restano ferme. Poi, come da supini: l\'aria riempie coste basse e schiena e arriva al pavimento pelvico, che scende e accoglie, mentre la pancia preme appena sul pavimento; espirando tutto risale da solo',
    base: poseOf(PRO, { ps: 0, pd: 0, pf: 0 }),
    keys: [
      { d: 5, s: 'Inspira, si gonfia la bassa schiena', ss: 'Inspira · 5 s', n: 1, p: { ps: 1.15 } },
      { d: 5, s: 'Espira, la schiena si ritrae', ss: 'Espira · 5 s', n: 1, p: { ps: 0 } },
      { d: 2.5, s: E7IN, ss: 'Inspira · coste basse e schiena', n: 1, p: { ps: 1.15 }, vis: 'in' },
      { d: 2.5, s: E7IN, ss: 'Poi il pelvico accoglie', n: 1, p: { pd: 1, pf: 1 }, air: 1, vis: 1 },
      { d: 5, s: 'Espira: tutto risale da solo', ss: 'Espira · risale da solo', n: 1, p: { ps: 0, pd: 0, pf: 0 }, vis: 'out' }
    ],
    arrows: ['ps'], main: 0, strip: [0, 3, 4], pre: supFloor,
    post: function (P, c, o, J) {
      var a = J.to.pt(0.35, 24, -1), v2 = vis(c), x = J.to.B(0.28)[0];
      o.push(TX([a[0] + 16, a[1] - 2], 'bassa schiena', 'tk'));
      o.push(TX([96, 66], 'scapole ferme', 't', 'middle'));
      var p = pelvicDown(J, P.pd, v2, o);
      o.push(TX(add(p, [8, -14]), 'pelvico', 'tk', 'start', op(v2)));
      o.push(AR([x - 9, GF + 3], [x - 9, GF + 13], 'br', P.pf), AR([x + 9, GF + 3], [x + 9, GF + 13], 'br', P.pf));
      o.push(TX([x, GF + 25], 'la pancia preme appena', 't', 'middle', op(v2)));
    }
  });

  // E30 — estensione dell'anca da prono, due dita sul bacino
  var E30N = { p: [166, GF - 4], b: -1, w: 8 };
  def({
    id: 'E30', v: [320, 88, 50], aria: 'Figura a pancia in giù con la fronte a terra e due dita sotto l\'osso del bacino: la gamba tesa sale poco, ginocchio compreso, senza staccare il bacino dalle dita; tieni respirando, poi scendi',
    base: poseOf(PRO, { nk: -18, ps: 0, an: E30N, af: { p: [169, GF - 4], b: -1, w: 8 } }),
    keys: [
      { d: 2.5, s: 'Bacino sulle dita, coda tra le gambe', ss: 'Bacino sulle dita', p: {}, k: 'gr' },
      { d: 2.5, s: 'Sali con la gamba tesa, poco', ss: 'Sali, gamba tesa', p: { ln: { a: -13, r: 116, b: 1, f: -6, fs: -1 } } },
      { d: 5, s: 'Tieni e inspira: senti il gluteo', ss: 'Tieni · inspira', n: 1, p: { ps: 1 } },
      { d: 5, s: 'Tieni ed espira (3–5 respiri)', ss: 'Tieni · espira', n: 1, p: { ps: 0 } },
      { d: 2.5, s: 'Scendi', p: { ln: PRO.ln } }
    ],
    arrows: ['ps'], main: 2, strip: [0, 2, 4], pre: supFloor,
    post: function (P, c, o, J) {
      var h = J.to.P;
      o.push(L(h, add(h, dir(-30), 92), 0, 'ghost'));
      o.push(TX(add(h, [84, -36]), 'max 30°', 't'));
      o.push(CI([J.an.tip[0] - 4, GF - 3], 3.5, 'fgr'));
      o.push(TX([16, 66], 'dita sotto il bacino:', 't'), TX([16, 80], 'non si staccano', 't'));
    }
  });

  // ---- quadrupedia ----
  var GQ = 140;
  var QL = { a: 133, r: 82, b: -1, f: 182 }, QA = { a: 86, r: 78, b: 1, w: 0 };
  var QUAD = { x: 104, y: GQ - 66, t: -10.5, nk: 14, pb: 0, pc: 0, ln: QL, lf: QL, an: QA, af: QA };
  var QL_UP = { a: 178, r: 116, b: -1, f: 178 }, QA_UP = { a: -4, r: 82, b: 1, w: -4 };
  // E26 — bird dog con bottiglietta
  def({
    id: 'E26', v: [320, 150], aria: 'Figura a quattro zampe con una bottiglietta distesa sulla schiena: allunga un braccio in avanti e la gamba opposta indietro senza far cadere la bottiglia, poi cambia lato',
    base: QUAD,
    keys: [
      { d: 2.5, s: 'Inspira, allarga i fianchi', ss: 'Inspira', n: 1, p: { pc: 0.9, pb: 0.4 } },
      { d: 2.5, s: 'Allunga braccio e gamba opposti', ss: 'Allunga', p: { ln: QL_UP, af: QA_UP } },
      { d: 2, s: 'Tieni: la bottiglia non si muove', ss: 'Tieni, schiena ferma', p: {} },
      { d: 2.5, s: 'Torna giù espirando', ss: 'Torna, espira', p: { ln: QL, af: QA, pc: 0, pb: 0 } },
      { d: 2.5, s: 'Inspira', n: 1, p: { pc: 0.9, pb: 0.4 } },
      { d: 2.5, s: 'Ora l\'altro lato', ss: 'Altro lato', p: { lf: QL_UP, an: QA_UP } },
      { d: 2, s: 'Tieni', p: {} },
      { d: 2.5, s: 'Torna giù espirando', p: { lf: QL, an: QA, pc: 0, pb: 0 } }
    ],
    strip: [0, 2, 6], main: 2,
    pre: function (P, c, o) { floor(320, GQ, o); },
    post: function (P, c, o, J) { bottle(J.to, o); }
  });

  // E27 — gattonamento con la bottiglia, sul posto: il pavimento scorre sotto
  // fase φ: 0 mano vicina e ginocchio lontano avanti; 1 gli altri due avanti. Chi è in appoggio scivola indietro.
  function crawl(nh, fh, nk, fk) { // spostamenti [x, sollevamento] di mano vicina, mano lontana, ginocchio vicino, ginocchio lontano
    return {
      an: { p: [188 + nh[0], GQ - 3 - nh[1]], b: 1, w: 0 }, af: { p: [188 + fh[0], GQ - 3 - fh[1]], b: 1, w: 0 },
      ln: { p: [48 + nk[0], GQ - 4.5 - nk[1]], b: -1, f: 182 }, lf: { p: [48 + fk[0], GQ - 4.5 - fk[1]], b: -1, f: 182 }
    };
  }
  var CR0 = crawl([12, 0], [-12, 0], [-12, 0], [12, 0]), CR2 = crawl([-12, 0], [12, 0], [12, 0], [-12, 0]);
  def({
    id: 'E27', v: [320, 150], aria: 'Figura che gattona sulle ginocchia con una bottiglia sulla schiena: mano e ginocchio opposti si muovono insieme, la schiena resta ferma e la bottiglia non cade',
    base: shallow(QUAD, CR0),
    keys: [
      { d: 0.8, s: 'Mano e ginocchio opposti, insieme', ss: 'Mano e ginocchio opposti', p: crawl([0, 0], [0, 9], [0, 7], [0, 0]), e: 'l' },
      { d: 0.8, s: 'Mano e ginocchio opposti, insieme', p: CR2, e: 'l' },
      { d: 0.8, s: 'Ora gli altri due, insieme', ss: 'Gli altri due', p: crawl([0, 9], [0, 0], [0, 0], [0, 7]), e: 'l' },
      { d: 0.8, s: 'Ora gli altri due, insieme', p: CR0, e: 'l' }
    ],
    main: 1, strip: [0, 2],
    pre: function (P, c, o) {
      floor(320, GQ, o);
      var sh = ((c.time || 0) * 15) % 44;
      for (var x = 0; x < 352; x += 44) o.push(L([x - sh + 6, GQ + 7], [x - sh + 20, GQ + 7], 0, 'g'));
    },
    post: function (P, c, o, J) { bottle(J.to, o); }
  });

  /* ======================= IN PIEDI ======================= */
  var GS = 270;
  var STD = {
    x: 104, y: GS - 121.5, t: -90, nk: 6, pb: 0, pc: 0, ps: 0,
    ln: { p: [106, GS - 6], b: -1, f: 0 }, lf: { p: [103, GS - 6], b: -1, f: 0 },
    an: { a: 84, r: 80, b: 1 }, af: { a: 82, r: 80, b: 1 }
  };
  function stdFloor(P, c, o) { floor(c.w || 230, GS, o); }

  // E11 — il minuto in piedi
  def({
    id: 'E11', v: [230, 290], aria: 'Figura in piedi di profilo con le ginocchia morbide e gli occhi chiusi: respira di pancia e ascolta dove cade il peso, fra tallone, centro e avampiede',
    // ginocchia «appena piegate» (L2 0:21:54): ~15° (con y GS-119 erano 26°, un quarto di squat che accende le cosce).
    // Il corpo non oscilla più col respiro e il pallino non sceglie una risposta: «va bene tutto» (L2 0:24:35),
    // l'ascolto non è un movimento da fare. I tre punti restano uguali, con la domanda.
    base: poseOf(STD, { y: GS - 121, eye: 1 }),
    keys: [
      { d: 5, s: 'Inspira di pancia, occhi chiusi', ss: 'Inspira di pancia', n: 1, p: { pb: 1 } },
      { d: 5, s: 'Espira: dove cade il peso?', ss: 'Espira, ascolta il peso', n: 1, p: { pb: 0 } },
      { d: 5, s: 'Inspira', n: 1, p: { pb: 1 } },
      { d: 5, s: 'Espira: tallone, centro o avampiede?', n: 1, p: { pb: 0 } }
    ],
    arrows: ['pb'], nose: 1, main: 0, strip: [0, 1], pre: stdFloor,
    post: function (P, c, o, J) {
      var a = [106, GS + 11];
      [-18, 0, 18].forEach(function (dx) { o.push(CI([a[0] + dx, a[1]], 5, 'fgr', op(0.55))); });
      o.push(TX([80, GS + 15], 'peso?', 't', 'end'));
      o.push(TX([136, GS - 70], 'ginocchia', 't'), TX([136, GS - 56], 'morbide', 't'));
    }
  });

  // E21 — equilibrio su una gamba
  var KNEE_UP = { a: 45, r: 79, b: -1, f: 24 };
  def({
    id: 'E21', v: [230, 290], aria: 'Figura in piedi di profilo che solleva un ginocchio all\'altezza dell\'anca e resta in equilibrio su una gamba, prima a occhi aperti e poi chiusi',
    // si alza la gamba lontana (come T7): in primo piano resta il piede d'appoggio, quello che «lavora per tenerti»
    base: poseOf(STD, { eye: 0, lf: { a: 89, r: 116, b: -1, f: 0 } }),
    keys: [
      { d: 2, s: 'Alza il ginocchio', ss: 'Alza il ginocchio', p: { lf: KNEE_UP } },
      { d: 3, s: 'Tieni, occhi aperti', ss: 'Occhi aperti', p: {} },
      { d: 3, s: 'Tieni, occhi chiusi', ss: 'Occhi chiusi', p: { eye: 1 } },
      { d: 2, s: 'Giù, poi l\'altra gamba', ss: 'Giù, cambia gamba', p: { lf: { a: 89, r: 116, b: -1, f: 0 }, eye: 0 } }
    ],
    main: 1, strip: [1, 2, 3], pre: stdFloor,
    post: function (P, c, o) { o.push(TX([150, 36], 'un minuto', 't'), TX([150, 50], 'per gamba', 't')); }
  });

  // E28 — squat tecnico
  var SQ = { x: 80, y: GS - 67, t: -50, nk: -26, an: { a: -4, r: 80, b: 1 }, af: { a: -2, r: 80, b: 1 } };
  def({
    id: 'E28', v: [230, 290], aria: 'Squat di profilo: scendi inspirando e gonfiando il cilindro; in basso fermati, short foot e trattieni la pipì; poi espira e sali',
    base: poseOf(STD, { sf: 0, pv: 0 }),
    keys: [
      { d: 3.5, s: 'Scendi inspirando, gonfia il cilindro', ss: 'Scendi, inspira', p: shallow(SQ, { pb: 0.9, pc: 0.9, ps: 0.6 }) },
      { d: 1.5, s: 'Fermo: short foot, trattieni la pipì', ss: 'Short foot, pipì', p: { sf: 1, pv: 1 }, k: 'gr' },
      { d: 3, s: 'Espira e sali', ss: 'Espira e sali', p: shallow(STD, { sf: 1, pv: 1 }), air: -1 },
      { d: 1.2, s: 'In piedi, rilascia', ss: 'Rilascia', p: { sf: 0, pv: 0 } }
    ],
    arrows: ['pb'], main: 1, strip: [3, 0, 1, 2], pre: stdFloor
  });

  // E29 — stacco rumeno al muro e col bastone
  function armAt(a, r) { return function (P) { return add(torso(P).B(0.93), dir(a), r); }; }
  function onStick(s, off) { return function (P) { return torso(P).pt(s, off, -1); }; }
  // «mezzo rumeno col sedere un po' più alto del solito», «non scendere così tanto perché mi stai flettendo la
  // colonna» (L4 0:38:27): busto a ~55° dalla verticale, non orizzontale (prima 84°, anca flessa 116° a ginocchia
  // quasi tese: per un principiante la lombare si flette prima). Tibie verticali, ginocchia ~22°, mani poco sopra
  // le ginocchia. Il muro è più vicino (un passetto avanti): il sedere lo tocca a questa profondità.
  var RDL = { x: 79, y: GS - 115, t: -35, nk: -12 };
  var RDL_S = { x: 80, y: GS - 115, t: -36, nk: 18 };
  var HANG = { an: { p: armAt(96, 80), b: 1 }, af: { p: armAt(94, 80), b: 1 } };
  var TOSHIN = { an: { p: armAt(92, 80), b: 1 }, af: { p: armAt(90, 80), b: 1 } };
  var HOLD = { an: { p: onStick(0.24, 5), b: 1, w: -90 }, af: { p: onStick(1.06, 5), b: 1, w: -90 } };
  def({
    id: 'E29', v: [250, 290], aria: 'Stacco rumeno di profilo: prima col sedere verso un muro vicino, le anche vanno indietro finché il sedere tocca il muro, a schiena dritta e ginocchia un po\' piegate, con le mani poco sopra le ginocchia; poi con un bastone appoggiato a sacro, dorso e nuca. Si sale espirando e parte per prima l\'anca',
    base: shallow(poseOf(STD, { x: 106, wl: 1, st: 0, sf: 0, pv: 0, ln: { p: [108, GS - 6], b: -1, f: 0 }, lf: { p: [105, GS - 6], b: -1, f: 0 } }), HANG),
    keys: [
      { d: 2, s: 'Inspira, gonfia il cilindro', ss: 'Inspira', n: 1, p: { pb: 0.7, pc: 0.8 } },
      { d: 3, s: 'Anche indietro verso il muro', ss: 'Anche indietro', p: shallow(RDL, TOSHIN), k: 'gr' },
      { d: 1.2, s: 'Short foot, trattieni la pipì', ss: 'Short foot, pipì', p: { sf: 1, pv: 1 }, k: 'gr' },
      { d: 3, s: 'Espira e sali: parte l\'anca', ss: 'Espira e sali', p: shallow({ x: 106, y: GS - 121.5, t: -90, nk: 6, pb: 0, pc: 0, sf: 0, pv: 0 }, HANG), air: -1 },
      { d: 2.5, s: 'Col bastone: sacro, dorso e nuca', ss: 'Bastone: sacro, dorso, nuca', p: shallow({ wl: 0, st: 1, nk: 18, pb: 0.6, pc: 0.7 }, HOLD) },
      { d: 3, s: 'Scendi senza staccarti dal bastone', ss: 'Scendi col bastone', p: shallow(RDL_S, HOLD), k: 'gr' },
      { d: 1.2, s: 'Short foot, trattieni la pipì', p: { sf: 1, pv: 1 }, k: 'gr' },
      { d: 3, s: 'Espira e sali: parte l\'anca', p: shallow({ x: 106, y: GS - 121.5, t: -90, nk: 18, pb: 0, pc: 0, sf: 0, pv: 0 }, HOLD), air: -1 }
    ],
    main: 1, strip: [0, 1, 4, 5],
    pre: function (P, c, o) { floor(250, GS, o); wall(69, GS, 120, P.wl, o); },
    mid: function (P, c, o, J) {
      if (P.st > 0.01) {
        var to = J.to, a = to.pt(-0.04, 4, -1), b = to.pt(1.62, 4, -1);
        var g = []; var u = unit(sub(b, a)), l = len(sub(b, a)), cc = mid(a, b);
        g.push(rrect(cc, l, 8, ang(u), 'bf', 4));
        o.push(G(op(P.st), g));
      }
    },
    post: function (P, c, o, J) {
      if (P.wl > 0.5) o.push(TX([69, 112], 'muro', 't', 'middle', op((P.wl - 0.5) * 2)));
    }
  });

  // E24 — stacco su una gamba col respiro
  def({
    id: 'E24', v: [270, 290], aria: 'Stacco su una gamba di profilo: prendi aria e gonfia il cilindro, attiva short foot e pelvico, poi scendi muovendo insieme anca e colonna mentre l\'altra gamba va indietro; sali espirando',
    // «stacco gamba semi tesa a gamba singola» (W 20/10): ginocchio d'appoggio ~18° (prima ~30°), busto a ~55° dalla
    // verticale, gamba libera quasi in linea col busto, baricentro sopra il piede d'appoggio. Prima la gamba libera usciva dal riquadro a
    // sinistra: la figura è spostata a destra e scende meno (il busto orizzontale è il punto d'arrivo, non l'inizio)
    base: poseOf(STD, { x: 122, sf: 0, pv: 0, ln: { p: [124, GS - 6], b: -1, f: 0 }, lf: { a: 90, r: 115, b: -1, f: 0 } }),
    keys: [
      { d: 2.5, s: 'Inspira, gonfia il cilindro', ss: 'Inspira', n: 1, p: { pb: 0.8, pc: 0.9, ps: 0.5 } },
      { d: 1.5, s: 'Short foot e pelvico', ss: 'Short foot, pelvico', p: { sf: 1, pv: 1 }, k: 'gr' },
      { d: 3, s: 'Scendi: anca e colonna insieme', ss: 'Scendi', p: { x: 100, y: GS - 118, t: -35, nk: -8, lf: { a: 138, r: 115, b: -1, f: 48 }, an: { a: 92, r: 80, b: 1 }, af: { a: 90, r: 80, b: 1 } }, k: 'gr' },
      { d: 3, s: 'Espira e sali', ss: 'Espira e sali', p: { x: 122, y: GS - 121.5, t: -90, nk: 6, pb: 0, pc: 0, ps: 0, lf: { a: 90, r: 115, b: -1, f: 0 }, an: STD.an, af: STD.af }, air: -1 },
      { d: 1, s: 'Rilascia', p: { sf: 0, pv: 0 } }
    ],
    main: 2, strip: [0, 2, 3], pre: function (P, c, o) { floor(270, GS, o); },
  });

  // E17 — il naso nella corsa: corsa lenta sul posto (il pavimento scorre), si respira solo dal naso
  function runK(nl, fl, na, fa, pb, x) {
    return { ln: nl, lf: fl, an: { a: na, r: 52, b: 1 }, af: { a: fa, r: 52, b: 1 }, pb: pb };
  }
  var RF = { a: 70, r: 110, b: -1, f: -8 }, RM = { a: 90, r: 104, b: -1, f: 0 }, RB = { a: 122, r: 92, b: -1, f: 38, tb: -30 }, RS = { a: 116, r: 62, b: -1, f: 24 };
  // Prima: 4 pose da 0,7 s = un passo per inspirazione e uno per espirazione (1:1), mentre il testo diceva «due passi»:
  // a velocità vera sarebbe un respiro ogni due appoggi, impossibile col naso. Ora tre appoggi per inspirazione e tre
  // per espirazione (pose da 0,35 s, 4,2 s il ciclo). Il rapporto non è del coach: il testo non dà numeri.
  var RUN = [[RF, RB, 112, 66], [RM, RS, 90, 90], [RB, RF, 66, 112], [RS, RM, 90, 90]], RUNK = [];
  for (var ri = 0; ri < 12; ri++) {
    var rq = RUN[ri % 4], inh = ri < 6;
    RUNK.push(shallow({ d: 0.35, s: inh ? 'Corsa lenta: inspira dal naso' : 'Espira dal naso', p: runK(rq[0], rq[1], rq[2], rq[3], 0.1 * (inh ? ri + 1 : 11 - ri)), e: 'l', air: inh ? 1 : -1 },
      ri === 0 ? { ss: 'Inspira dal naso' } : ri === 6 ? { ss: 'Espira dal naso' } : {}));
  }
  def({
    id: 'E17', v: [260, 290], aria: 'Figura che corre piano di profilo respirando solo dal naso: inspira ed espira con calma, per più passi. Per riuscirci bisogna rallentare; la bocca resta il turbo per il massimo',
    base: { x: 118, y: GS - 109.5, t: -84, nk: -2, ln: RS, lf: RM, an: { a: 90, r: 52, b: 1 }, af: { a: 90, r: 52, b: 1 }, pb: 0 },
    keys: RUNK,
    nose: 1, main: 0, strip: [0, 6],
    pre: function (P, c, o) {
      floor(260, GS, o);
      var sh = ((c.time || 0) * 107) % 40; // il pavimento scorre alla velocità del piede d'appoggio (prima 66: il piede scivolava)
      for (var x = 0; x < 300; x += 40) o.push(L([x - sh + 6, GS + 7], [x - sh + 20, GS + 7], 0, 'g'));
    },
    post: function (P, c, o) { o.push(TX([12, 40], 'piano, solo naso:', 't'), TX([12, 54], 'la bocca è il turbo', 't')); }
  });

  // E20 — come stare seduti
  var SEAT = GS - 52;
  def({
    id: 'E20', v: [260, 290], aria: 'Figura seduta di profilo sul bordo della sedia, senza appoggiare la schiena, sugli ischi e coi piedi a terra: respira gonfiando fianchi e schiena',
    base: { x: 128, y: SEAT - 12, t: -90, nk: 6, pc: 0, ps: 0,
      ln: { p: [192, GS - 6], b: -1, f: 0 }, lf: { p: [189, GS - 6], b: -1, f: 0 },
      an: { p: [174, SEAT - 26], b: 1, w: 0 }, af: { p: [170, SEAT - 26], b: 1, w: 0 } },
    keys: [
      { d: 5, s: 'Inspira: si gonfiano fianchi e schiena', ss: 'Inspira · fianchi e schiena', n: 1, p: { pc: 1, ps: 1 } },
      { d: 5, s: 'Espira', ss: 'Espira', n: 1, p: { pc: 0, ps: 0 } }
    ],
    arrows: ['ps'], nose: 1, main: 0,
    pre: function (P, c, o) { floor(260, GS, o); chair(150, SEAT, GS, o); },
    post: function (P, c, o, J) {
      o.push(CI([J.to.P[0], SEAT - 3], 5, 'fgr'));
      o.push(L([80, SEAT + 2], [J.to.P[0] - 7, SEAT - 2], 1.5, 'gr'));
      o.push(TX([76, SEAT + 6], 'ischi', 'tk', 'end'));
      o.push(TX([12, 104], 'niente', 't'), TX([12, 118], 'schienale', 't'));
    }
  });

  // E31 — inclinazione indietro in ginocchio col respiro alto (L4 1:57:51–2:00:24). Rifatta come un reverse Nordic
  // (correzione del 31/10, fotogramma 02-00-00): la versione di prima inarcava la lombare. Ora il ginocchio fa da perno ed è l'unica
  // articolazione che si piega: coscia, bacino e busto restano in linea (anca estesa, glutei stretti, niente seduta sui
  // talloni) e ruotano indietro come un blocco solo; il quadricipite frena e riporta su. Prima coste chiuse e ombelico
  // dentro (lombare neutra), poi un'apertura piccola, solo del dorso, e 5 respiri lunghi in alto.
  // kb = gradi d'inclinazione all'indietro (pochi), ex = gradi d'apertura del dorso
  var GK = 230;
  var KN = { p: [56, GK - 15], b: -1, f: 96, tb: 82 };
  var K31 = [56 + Math.sqrt(SH * SH - 90.25), GK - 5.5]; // ginocchio a terra, a una tibia dalla caviglia di KN: resta fermo
  var HN31 = { tor: 0.1, off: 1, side: -1, b: 1 }; // mani dietro, sul bacino (02-00-00), gomiti indietro
  function lean31(P) { // l'anca gira attorno al ginocchio a una coscia di distanza; busto in linea con la coscia
    var a = -90 - P.kb, h = add(K31, dir(a), TH);
    return shallow(P, { x: h[0], y: h[1], t: a, t2: a - P.ex });
  }
  var G31 = add(K31, dir(-130), TH);
  var GH31 = { x: G31[0], y: G31[1], t: -100, cu: 14, nk: -16, ln: KN, an: HN31 }; // l'errore: seduto verso i talloni, lombare piegata
  var A31 = {
    id: 'E31', v: [230, 245], aria: 'Figura in ginocchio di profilo, dita dei piedi puntate, mani dietro sul bacino: stringe i glutei, chiude le coste e porta l\'ombelico in dentro, poi si inclina indietro di pochi gradi piegando solo il ginocchio, con coscia, bacino e busto in linea, mentre il quadricipite frena; apre appena il petto, fa 5 respiri lunghi solo in alto e torna su piano. Da evitare: piegare la schiena indietro o sedersi verso i talloni',
    base: { kb: 0, ex: 0, nk: 3, cu: 1, cu2: -3, pp: 0, cz: 0, ln: KN, lf: shallow(KN, { p: [53, GK - 15] }), an: HN31, af: HN31 },
    keys: [
      { d: 2, s: 'In ginocchio, dita puntate: stringi i glutei, bacino avanti', ss: 'In ginocchio, glutei stretti', p: {}, k: 'gr' },
      { d: 2, s: 'Chiudi le coste, ombelico dentro', ss: 'Coste chiuse, ombelico dentro', p: { cz: 1 }, k: 'gr' },
      { d: 3, s: 'Indietro piano: si piega solo il ginocchio', ss: 'Indietro: si piega solo il ginocchio', p: { kb: 22 }, k: 'gr', qd: 'frena' },
      { d: 2, s: 'Apri un poco il petto, solo in alto', ss: 'Apri il petto, solo il dorso', p: { ex: 7 }, k: 'gr', qd: 'tiene' },
      { d: 5, s: '5 respiri lunghi, solo in alto: inspira', ss: '5 respiri lunghi, in alto', n: 1, p: { pp: 1.2 }, qd: 'tiene' },
      { d: 5, s: '5 respiri lunghi, solo in alto: espira', n: 1, p: { pp: 0 }, qd: 'tiene' },
      { d: 2.5, s: 'Torna su piano: il quadricipite riporta su', ss: 'Torna su piano', p: { kb: 0, ex: 0, cz: 0 }, k: 'gr', qd: 'riporta su' },
      { d: 2, s: 'Non così: schiena piegata, seduto verso i talloni', ss: 'Non così', p: {}, k: 'no', vis: 'io' }
    ],
    arrows: ['pp'], nose: 1, main: 4, strip: [1, 2, 4, 7],
    pre: function (P, c, o) { floor(230, GK, o); o.push(E('rect', { x: 64, y: GK - 4, width: 62, height: 4, rx: 2, 'class': 'mat' })); }, // un asciugamano sotto le ginocchia
    post: function (P, c, o, J) {
      var to = J.to, z = P.cz, dn = cl(P.kb / 22, 0, 1), K = J.ln.K, u = unit(sub(to.P, K)), n = rot(u, 90), i, pts = [];
      o.push(L(add(K, u, 10), add(K, u, 170), 0, 'ghost', op(dn))); // coscia e busto sulla stessa linea
      var a1 = ang(sub(J.ln.A, K)), a2 = ang(u);
      for (i = 0; i <= 8; i++) pts.push(add(K, dir(a2 + (a1 - a2) * i / 8), 17));
      o.push(PA(smooth(pts), 'gr', { 'stroke-width': 3 })); // l'angolo del ginocchio, l'unico che cambia
      var q0 = add(add(K, u, 14), n, 9), q1 = add(add(K, u, 47), n, 9), qv = c.k.qd ? 1 : dn;
      o.push(G(op(qv), [L(q0, q1, 8, 'b', { style: 'stroke:var(--surface)' }), L(q0, q1, 4, 'gr')])); // il quadricipite, davanti alla coscia
      var b = to.pt(0.28, 22, 1), q = to.pt(0.28, 6, 1), r = to.pt(0.5, 20, 1), s = to.pt(0.5, 6, 1); // coste basse: il petto sopra respira
      o.push(AR(b, q, 'gr', z), AR(r, s, 'gr', z));
      o.push(TX(add(b, [6, 4]), 'ombelico', 't', 'start', op(z)), TX(add(b, [6, 18]), 'dentro', 't', 'start', op(z)), TX(add(r, [6, 2]), 'coste chiuse', 't', 'start', op(z)));
      var v = vis(c);
      o.push(TX([116, 22], 'coscia e busto in linea', 'tk', 'middle', op((0.4 + 0.6 * dn) * (1 - v))));
      o.push(TX([124, 178], 'il quadricipite', 't', 'start', op(qv)), TX([124, 192], c.k.qd || 'frena', 'tk', 'start', op(qv)));
      o.push(TX([124, 212], 'si piega solo', 't', 'start', op(0.45 + 0.55 * dn)), TX([124, 226], 'il ginocchio', 't', 'start', op(0.45 + 0.55 * dn)));
      if (v) { // la sagoma dell'errore, con la scritta sopra di lei (in alto a sinistra)
        var g = [], Jg = ghostBody(GH31, g);
        o.push(G(op(v), g), cross(Jg.to.pt(0.24, 13, -1), 6, v));
        o.push(TX([8, 20], 'non così:', 'tk', 'start', op(v)), TX([8, 34], 'schiena piegata, seduto', 't', 'start', op(v)), TX([8, 48], 'verso i talloni', 't', 'start', op(v)));
      }
    }
  };
  A31.draw = (function (side) { return function (P, c) { return side(lean31(P), c); }; })(sideFig(A31));
  def(A31);

  /* ======================= VISTE A PARTE ======================= */

  // E2 — candela: la fiamma si piega col respiro senza spegnersi
  def({
    id: 'E2', v: [240, 140], aria: 'Testa di profilo davanti a una candela accesa: si inspira 5 secondi e si espira 5 secondi dal naso, così piano che la fiamma si piega ma non si spegne',
    base: { br: 0 },
    keys: [
      { d: 5, s: 'Inspira dal naso, piano', ss: 'Inspira · 5 s', n: 1, p: { br: 1 } },
      { d: 5, s: 'Espira: la fiamma si piega, non si spegne', ss: 'Espira · 5 s', n: 1, p: { br: 0 } }
    ],
    main: 1,
    draw: function (P, c) {
      var o = [], u = c.u == null ? 0.5 : c.u, air = c.air || 0;
      var bend = (air > 0 ? -0.35 : air < 0 ? 1 : 0) * Math.sin(Math.PI * u) + 0.06 * Math.sin((c.time || 0) * 9);
      o.push(CI([58, 64], 26, 'b', { 'stroke-width': 5 }));
      o.push(PA('M82 54 L94 66 L83 70', 'b', { 'stroke-width': 4 }));
      o.push(PA('M70 82 Q76 86 82 84', 'b', { 'stroke-width': 2.5 }));
      var d = (c.time || 0) * 14 * air;
      [[98, 66, 152, 58], [98, 72, 152, 70]].forEach(function (q) {
        o.push(PA('M' + q[0] + ' ' + q[1] + ' C' + (q[0] + 20) + ' ' + (q[1] - 4) + ' ' + (q[2] - 22) + ' ' + q[3] + ' ' + q[2] + ' ' + q[3], 'br', { 'stroke-dasharray': '4 5', 'stroke-dashoffset': f1(d), opacity: air ? 0.9 : 0.25 }));
      });
      o.push(E('rect', { x: 164, y: 82, width: 24, height: 46, rx: 3, 'class': 'bf' }));
      o.push(L([176, 82], [176, 74], 2, 'b'));
      var tip = [176 + 15 * bend, 46 + 5 * Math.abs(bend)];
      o.push(PA('M176 74 C170 66 ' + f1(tip[0] - 5) + ' ' + f1(tip[1] + 12) + ' ' + M(tip) + ' C' + f1(tip[0] + 6) + ' ' + f1(tip[1] + 12) + ' 184 66 176 74 Z', 'fgr'));
      o.push(TX([120, 22], '5 s + 5 s, solo naso', 't', 'middle'));
      o.push(TX([120, 138], 'la fiamma si muove, non si spegne', 't', 'middle'));
      return o;
    }
  });

  // torace di fronte: coste, pancia, petto (E4, E5) — mani sulle coste fluttuanti
  function frontTorso(P, c, o, opt) {
    var pc = P.pc || 0, pb = P.pb || 0, pp = P.pp || 0, cx = 120;
    var side = function (s) { // punti del contorno da un lato (s = -1 sinistra, 1 destra)
      return [[cx + s * 16, 60], [cx + s * 40, 66 - pp], [cx + s * (43 + pp), 86], [cx + s * (42 + 6 * pc), 110],
        [cx + s * (38 + 3 * pc + 2 * pb), 132], [cx + s * (37 + pb), 152], [cx + s * 30, 168]];
    };
    var L1 = side(-1), R1 = side(1).reverse();
    o.push(PA(smooth(L1.concat([[cx, 172]]).concat(R1), true), 'b', { 'stroke-width': 5 }));
    o.push(CI([cx, 34], 18, 'b', { 'stroke-width': 5 }));
    o.push(L([cx - 14, 172], [cx - 18, 226], 9, 'b'), L([cx + 14, 172], [cx + 18, 226], 9, 'b'));
    // coste
    for (var i = 0; i < 3; i++) {
      var y = 84 + i * 12;
      [-1, 1].forEach(function (s) {
        o.push(PA('M' + (cx + s * 4) + ' ' + y + ' C' + (cx + s * 18) + ' ' + (y - 2) + ' ' + f1(cx + s * (30 + 4 * pc)) + ' ' + (y + 4) + ' ' + f1(cx + s * (35 + 6 * pc)) + ' ' + (y + 16), 'b', { 'stroke-width': 2 }));
      });
    }
    // braccia: mani sulle coste fluttuanti, gomiti in fuori
    [-1, 1].forEach(function (s) {
      var sh = [cx + s * 38, 70], hand = [cx + s * (42 + 6 * pc), 118];
      var r = ik(sh, hand, 40, 36, s > 0 ? -1 : 1);
      o.push(PL([sh, r[0], r[1]], 7, 'b'));
      o.push(L(r[1], add(r[1], [-s * 9, 5]), 6, 'b'));
    });
    // indicazioni
    o.push(AR([cx - 46 - 6 * pc, 134], [cx - 58 - 14 * pc, 134], 'br', 0.2 + 0.8 * pc), AR([cx + 46 + 6 * pc, 134], [cx + 58 + 14 * pc, 134], 'br', 0.2 + 0.8 * pc));
    o.push(E('ellipse', { cx: cx, cy: 142, rx: f1(10 + 14 * pb), ry: f1(5 + 8 * pb), 'class': 'br dash', opacity: f1(0.2 + 0.8 * cl(pb, 0, 1)) }));
    o.push(AR([cx, 80], [cx, 72 - 12 * pp], 'br', 0.15 + 0.85 * pp));
    var act = opt.act || 0;
    o.push(badge([cx - 26, 100], 1, 'br', act === 1 ? 1 : 0.35), badge([cx, 142], 2, 'br', act === 2 ? 1 : 0.35), badge([cx + 20, 68], 3, 'br', act === 3 ? 1 : 0.35));
    o.push(TX([214, 60], 'spalle', 't', 'middle'), TX([214, 74], 'ferme', 't', 'middle'));
  }
  def({
    id: 'E4', v: [240, 230], aria: 'Busto visto di fronte con le mani sulle coste fluttuanti: inspirando 1 le coste si aprono di lato, 2 si gonfiano pancia e schiena, 3 per ultimo il petto; espirando si svuota al contrario. Le spalle non salgono',
    base: { pc: 0, pb: 0, pp: 0, act: 0 },
    keys: [
      { d: 1.7, s: 'Inspira: 1 le coste di lato', ss: '1 coste di lato', g: 'in', n: 1, p: { pc: 1, act: 1 } },
      { d: 1.6, s: 'Inspira: 2 pancia e schiena', ss: '2 pancia e schiena', g: 'in', n: 1, p: { pb: 1, act: 2 } },
      { d: 1.7, s: 'Inspira: 3 il petto, per ultimo', ss: '3 petto per ultimo', g: 'in', n: 1, p: { pp: 1, act: 3 } },
      { d: 1.7, s: 'Espira: petto', ss: 'Espira: petto, pancia, coste', g: 'out', n: 1, p: { pp: 0, act: 3 } },
      { d: 1.6, s: 'Espira: pancia', g: 'out', n: 1, p: { pb: 0, act: 2 } },
      { d: 1.7, s: 'Espira: coste', g: 'out', n: 1, p: { pc: 0, act: 1 } }
    ],
    main: 2, strip: [0, 1, 2, 3],
    draw: function (P, c) { var o = []; frontTorso(P, c, o, { act: Math.round(P.act) }); return o; }
  });
  alias('E5', 'E4', 'Busto visto di fronte: inspirando si aprono le coste, poi pancia e schiena, poi il petto; espirando si svuota al contrario, petto, pancia, coste');

  // E8 — coste in apnea
  def({
    id: 'E8', v: [280, 180], aria: 'Gabbia toracica vista di fronte: si prende aria, si trattiene il fiato e si aprono e chiudono solo le coste di lato, poi si espira',
    base: { pc: 0, hold: 0 },
    keys: [
      { d: 2.5, s: 'Inspira', n: 1, p: { pc: 0.3, hold: 0 } },
      { d: 1, s: 'Trattieni il fiato', ss: 'Apnea', p: { hold: 1 }, air: 0, k: 'no' },
      { d: 1.5, s: 'In apnea: apri le coste', ss: 'Apri le coste', p: { pc: 1.2 }, air: 0, k: 'gr' },
      { d: 1.5, s: 'In apnea: chiudi', ss: 'Chiudi', p: { pc: 0.1 }, air: 0, k: 'gr' },
      { d: 1.5, s: 'In apnea: apri le coste', p: { pc: 1.2 }, air: 0, k: 'gr' },
      { d: 1.5, s: 'In apnea: chiudi', p: { pc: 0.1 }, air: 0, k: 'gr' },
      { d: 3, s: 'Espira', n: 1, p: { pc: 0, hold: 0 }, air: -1 }
    ],
    main: 2, strip: [1, 2, 3],
    draw: function (P, c) {
      var o = [], pc = P.pc || 0, k = [L([140, 26], [140, 100], 5)];
      for (var i = 0; i < 5; i++) {
        var y = 32 + i * 16, sp = pc * (4 + i * 1.2);
        k.push(PA('M136 ' + y + ' C116 ' + (y - 2) + ' ' + f1(92 - sp * 0.6) + ' ' + (y + 6) + ' ' + f1(82 - sp) + ' ' + (y + 26), 'b', { 'stroke-width': 4 }));
        k.push(PA('M144 ' + y + ' C164 ' + (y - 2) + ' ' + f1(188 + sp * 0.6) + ' ' + (y + 6) + ' ' + f1(198 + sp) + ' ' + (y + 26), 'b', { 'stroke-width': 4 }));
      }
      o.push(G({ 'class': 'b' }, k));
      var mv = P.hold > 0.5 ? 1 : 0.25;
      o.push(AR2([66 - 8 * pc, 86], [34 - 8 * pc, 86], 'br', mv), AR2([214 + 8 * pc, 86], [246 + 8 * pc, 86], 'br', mv));
      o.push(TX([140, 152], P.hold > 0.5 ? 'in apnea' : 'respiro dal naso', 'tk', 'middle'));
      o.push(TX([140, 168], 'apri e chiudi solo le coste', 't', 'middle'));
      return o;
    }
  });

  // sdraiato sul fianco: proiezione di un piccolo modello 3D (X lungo la colonna, Y in su, Z in avanti)
  function rot3(p, o, ax, a) { // rotazione di p attorno all'asse (o, ax) di a gradi (Rodrigues)
    var v = [p[0] - o[0], p[1] - o[1], p[2] - o[2]], l = Math.sqrt(ax[0] * ax[0] + ax[1] * ax[1] + ax[2] * ax[2]);
    var k = [ax[0] / l, ax[1] / l, ax[2] / l], c = Math.cos(a * R), s = Math.sin(a * R);
    var cr = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
    var dt = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
    return [0, 1, 2].map(function (i) { return o[i] + v[i] * c + cr[i] * s + k[i] * dt * (1 - c); });
  }
  // E9, E10: vista dall'alto come nella guida (cosce in su nel disegno); il fianco spinge la mano verso chi guarda
  function sideTop(P, o, dita) {
    var pc = P.pc || 0, Y0 = 128, Xp = 172, pel = [Xp, Y0], shd = [Xp - LT, Y0], head = [Xp - LT - 27, Y0 - 2];
    o.push(E('rect', { x: 16, y: 20, width: 268, height: 156, rx: 12, 'class': 'mat' }));
    o.push(E('rect', { x: f1(head[0] - 26), y: f1(head[1] - 19), width: 46, height: 38, rx: 9, 'class': 'bf' }));
    var knee = [Xp + 2, Y0 - 60], ank = [Xp + 58, Y0 - 61], toe = [Xp + 60, Y0 - 82];
    o.push(G({ opacity: 0.4 }, [PL([add(pel, [3, 4]), add(knee, [5, 3]), add(ank, [4, 3]), add(toe, [4, 3])], WTH, 'b')]));
    var w = 20 + 3 * pc; // il tronco visto dall'alto si allarga appena (pancia e schiena)
    o.push(G({ 'class': 'b' }, [L(pel, shd, w), CI(head, HR + 1, 'b', { 'stroke-width': 5 })]));
    o.push(G({ 'class': 'b' }, [L(pel, knee, WTH), L(knee, ank, WSH), L(ank, toe, WFT)]));
    var sa = add(shd, [6, -2]), hand = [Xp - LT * (dita ? 0.5 : 0.4), Y0 - 2];
    var r = ik(sa, hand, UA, FA, -1), tip = dita ? add(r[1], [9, 2]) : add(r[1], [12, 1]);
    var halo = { style: 'stroke:var(--surface)' };
    o.push(G({ 'class': 'b' }, [L(mid(sa, r[0], 0.4), r[0], WUA + 5, 'b', halo), L(r[0], r[1], WFA + 5, 'b', halo), L(r[1], tip, WHA + 5, 'b', halo),
      L(sa, r[0], WUA), L(r[0], r[1], WFA)].concat(dita ? [L(r[1], tip, 3.5), L(add(r[1], [0, -3]), add(tip, [0, -3]), 3.5)] : [L(r[1], tip, WHA)])));
    var cc = add(r[1], [6, 1]);
    o.push(CI(cc, 9 + 6 * pc, 'br dash', op(0.25 + 0.75 * pc)), CI(cc, 18 + 10 * pc, 'br dash', op(0.75 * pc)));
    o.push(TX([Xp - 18, Y0 - 34], '90°', 'tk', 'end'), TX([Xp + 12, Y0 - 44], '90°', 'tk'));
    return { hand: r[1] };
  }
  var LAT = [
    { d: 5, s: 'Inspira dal naso: il fianco spinge la mano', ss: 'Inspira · 5 s', n: 1, p: { pc: 1 } },
    { d: 5, s: 'Espira', ss: 'Espira · 5 s', n: 1, p: { pc: 0 } }
  ];
  def({
    id: 'E9', v: [300, 190], aria: 'Vista dall\'alto: figura sdraiata sul fianco con anche e ginocchia a 90 gradi, testa sul cuscino, mano sul fianco di sopra; inspirando lento dal naso il fianco si gonfia e spinge la mano',
    base: { pc: 0 }, keys: LAT, main: 0,
    draw: function (P) {
      var o = []; sideTop(P, o, 0);
      o.push(TX([28, 42], 'schiena neutra', 't'), TX([60, 172], 'il fianco spinge la mano', 'tk'));
      return o;
    }
  });
  def({
    id: 'E10', v: [300, 190], aria: 'Vista dall\'alto: figura sdraiata sul fianco con due dita premute sotto le coste; inspirando il fianco spinge via le dita',
    base: { pc: 0 }, keys: [
      { d: 5, s: 'Inspira: il fianco spinge via le dita', ss: 'Inspira · 5 s', n: 1, p: { pc: 1 } },
      { d: 5, s: 'Espira, memorizza la sensazione', ss: 'Espira · 5 s', n: 1, p: { pc: 0 } }
    ], main: 0,
    draw: function (P) {
      var o = []; sideTop(P, o, 1);
      o.push(TX([28, 42], 'schiena neutra', 't'), TX([60, 172], 'due dita sotto le coste', 'tk'));
      return o;
    }
  });
  // E23 — extrarotazioni (conchiglia): vista da davanti e dall'alto, perché si veda il ginocchio che si apre
  var CF = Math.cos(35 * R), SF = Math.sin(35 * R);
  function pj(p) { return [p[0], 108 - p[1] * CF + p[2] * SF]; }
  def({
    id: 'E23', v: [300, 170], aria: 'Figura sdraiata sul fianco vista da davanti e un po\' dall\'alto, anche e ginocchia a 90 gradi: inspira e gonfia il fianco, poi apri il ginocchio di sopra tenendo i piedi uniti, scendi ed espira',
    base: { pc: 0, cl: 0 },
    keys: [
      { d: 2.5, s: 'Inspira, gonfia il fianco', ss: 'Inspira', n: 1, p: { pc: 1 } },
      { d: 2, s: 'Sali: apri il ginocchio, piedi uniti', ss: 'Sali, apri il ginocchio', p: { cl: 1 }, k: 'gr' },
      { d: 2, s: 'Scendi', p: { cl: 0 }, k: 'gr' },
      { d: 2.5, s: 'Espira', n: 1, p: { pc: 0 } }
    ],
    main: 1, strip: [0, 1, 3],
    draw: function (P) {
      var o = [], Xp = 170, pc = P.pc || 0;
      o.push(PA(pth([pj([14, 0, -24]), pj([290, 0, -24]), pj([290, 0, 92]), pj([14, 0, 92])], true), 'mat'));
      var pel = pj([Xp, 18, 0]), shd = pj([Xp - LT, 18, 0]), head = pj([Xp - LT - 28, 18, 0]);
      o.push(E('rect', { x: f1(head[0] - 24), y: f1(pj([0, 3, 0])[1] - 5), width: 46, height: 14, rx: 7, 'class': 'bf' }));
      var hb = [Xp, 9, 0], ht = [Xp, 27, 0], kb = [Xp + 2, 6, 58], ab = [Xp + 58, 6, 58], at = [Xp + 58, 17, 57];
      var ax = [at[0] - ht[0], at[1] - ht[1], at[2] - ht[2]], kt = rot3([Xp + 2, 18, 56], ht, ax, 50 * P.cl);
      if (kt[1] < 18) kt = rot3([Xp + 2, 18, 56], ht, ax, -50 * P.cl);
      o.push(G({ opacity: 0.45 }, [L(pj(hb), pj(kb), WTH), L(pj(kb), pj(ab), WSH), L(pj(ab), pj([ab[0] + 2, ab[1], ab[2] + 20]), WFT)]));
      var top = [];
      for (var i = 0; i <= 6; i++) { var s = 0.12 + 0.5 * i / 6; top.push([pel[0] - LT * s, pel[1] - 2 - 6 * pc * Math.sin(Math.PI * i / 6)]); }
      o.push(G({ 'class': 'b' }, [L(pel, shd, 20), PA(smooth(top), 'b', { 'stroke-width': 14 }), CI(head, HR, 'b', { 'stroke-width': 5 })]));
      o.push(G({ 'class': 'b' }, [L(pj(ht), pj(kt), WTH), L(pj(kt), pj(at), WSH), L(pj(at), pj([at[0] + 2, at[1], at[2] + 20]), WFT)]));
      var sa = pj([Xp - LT + 8, 32, 0]), hand = [pel[0] - LT * 0.3, pel[1] - 12 - 6 * pc * Math.sin(Math.PI * 0.36)];
      var r = ik(sa, hand, UA, FA, 1), halo = { style: 'stroke:var(--surface)' };
      o.push(G({ 'class': 'b' }, [L(r[0], r[1], WFA + 5, 'b', halo), L(sa, r[0], WUA), L(r[0], r[1], WFA), L(r[1], add(r[1], [12, 2]), WHA)]));
      o.push(AR(add(pj(kt), [-6, -14]), add(pj(kt), [-6, -32]), 'gr', P.cl));
      o.push(AR(add(pel, [-LT * 0.48, -26]), add(pel, [-LT * 0.48, -40 - 8 * pc]), 'br', 0.15 + 0.85 * pc));
      o.push(TX([150, 22], 'senti il gluteo, non la coscia', 'tk', 'middle'));
      o.push(TX([262, 92], 'piedi uniti', 't', 'middle'));
      return o;
    }
  });

  // pianta del piede (E12)
  var SOLE = 'M100 250 C76 250 66 230 68 205 C70 185 82 170 80 150 C78 130 64 118 62 98 C60 70 76 52 100 52 C124 52 140 68 140 92 C140 120 132 140 130 165 C128 190 132 205 130 222 C128 240 118 250 100 250 Z';
  def({
    id: 'E12', v: [260, 270], aria: 'Pianta del piede sinistro vista da sotto: si accendono uno alla volta i tre punti d\'appoggio, base dell\'alluce, base del mignolo e tallone, poi tutti e tre con i tre archi',
    base: { a: 0, b: 0, c: 0, t: 0 },
    keys: [
      { d: 2, s: 'Senti la base dell\'alluce', ss: 'Base dell\'alluce', p: { a: 1 }, k: 'gr' },
      { d: 2, s: 'Senti la base del mignolo', ss: 'Base del mignolo', p: { a: 0.3, b: 1 }, k: 'gr' },
      { d: 2, s: 'Senti il tallone', ss: 'Tallone', p: { b: 0.3, c: 1 }, k: 'gr' },
      { d: 3, s: 'Tutti e tre, sempre: i tre archi', ss: 'Tutti e tre', p: { a: 1, b: 1, c: 1, t: 1 }, k: 'gr' },
      { d: 1, s: 'Tutti e tre, sempre: i tre archi', p: { a: 0, b: 0, c: 0, t: 0 }, k: 'gr' }
    ],
    main: 3, strip: [0, 1, 2, 3],
    draw: function (P) {
      var o = [], g = [];
      g.push(PA(SOLE, 'bf'));
      [[74, 38, 13], [98, 31, 8], [115, 33, 7], [129, 40, 6], [140, 51, 5]].forEach(function (t) { g.push(CI([t[0], t[1]], t[2], 'bf')); });
      g.push(PA('M82 96 L128 108 L100 224 Z', 'gr dash', op(0.15 + 0.85 * P.t)));
      [[82, 96, P.a], [128, 108, P.b], [100, 224, P.c]].forEach(function (q) { g.push(CI([q[0], q[1]], 5 + 4 * q[2], 'fgr', op(0.3 + 0.7 * q[2]))); });
      o.push(G({ transform: 'translate(30 0)' }, g));
      o.push(TX([84, 86], 'base alluce', 'tk', 'end', op(0.4 + 0.6 * P.a)), TX([176, 112], 'base mignolo', 'tk', 'start', op(0.4 + 0.6 * P.b)), TX([168, 234], 'tallone', 'tk', 'start', op(0.4 + 0.6 * P.c)));
      // «trasverso» sta sopra le linee tratteggiate: un alone del colore della pianta lo stacca
      o.push(G(op(P.t), [TX([104, 160], 'mediale', 't', 'end'), TX([168, 168], 'laterale', 't'), TX([136, 128], 'trasverso', 't', 'middle', { style: 'paint-order:stroke;stroke:var(--surface-2);stroke-width:4px;stroke-linejoin:round' })]));
      return o;
    }
  });

  // E13 — il gioco delle dita (dita viste di fronte)
  function toes(P) {
    var o = [L([40, 130], [280, 130], 0, 'g')], X = [[54, 34, 46], [92, 22, 34], [118, 20, 31], [142, 19, 28], [164, 16, 24]];
    var g = [];
    X.forEach(function (t, i) {
      var up = P['t' + (i + 1)] || 0, h = t[2], y = 129 - h - up * 20, x = t[0] + 40;
      g.push(E('rect', { x: x, y: f1(y + (i === 0 ? (P.p1 || 0) * 3 : 0)), width: t[1], height: f1(h - (i === 0 ? (P.p1 || 0) * 3 : 0)), rx: f1(t[1] * 0.42), 'class': 'bf' }));
    });
    o.push(G({}, g));
    o.push(AR([111, 56], [111, 86 + 3 * (P.p1 || 0)], 'gr', P.p1 || 0));
    return o;
  }
  def({
    id: 'E13', v: [320, 150], aria: 'Le dita del piede viste di fronte: schiaccia l\'alluce, sollevalo, alluce giù e le altre su, poi alzale una alla volta',
    base: { p1: 0, t1: 0, t2: 0, t3: 0, t4: 0, t5: 0 },
    keys: [
      { d: 2, s: 'Schiaccia l\'alluce, forte', ss: 'Alluce giù, forte', p: { p1: 1 }, k: 'gr' },
      { d: 2, s: 'Solleva l\'alluce', ss: 'Alluce su', p: { p1: 0, t1: 1 }, k: 'gr' },
      { d: 2, s: 'Alluce giù, le altre su', ss: 'Alluce giù, le altre su', p: { t1: 0, p1: 0.6, t2: 1, t3: 1, t4: 1, t5: 1 }, k: 'gr' },
      { d: 1, s: 'Una alla volta', p: { p1: 0, t3: 0, t4: 0, t5: 0, t2: 1 }, k: 'gr' },
      { d: 0.8, s: 'Una alla volta', p: { t2: 0, t3: 1 }, k: 'gr' },
      { d: 0.8, s: 'Una alla volta', p: { t3: 0, t4: 1 }, k: 'gr' },
      { d: 0.8, s: 'Una alla volta', p: { t4: 0, t5: 1 }, k: 'gr' },
      { d: 1.2, s: 'Rilassa', p: { t5: 0 }, k: 'no' }
    ],
    main: 2, strip: [0, 1, 2, 4],
    draw: function (P) { return [G({ transform: 'translate(-99 -84.5) scale(1.65)' }, toes(P)), TX([160, 146], 'ogni dito per conto suo', 't', 'middle')]; }
  });

  // E14 — l'elica del piede (piede destro visto dall'alto)
  def({
    id: 'E14', v: [300, 280], aria: 'Piede destro visto dall\'alto, seduti: le dita restano incollate a terra mentre il tallone si solleva appena e va dentro e fuori come un timone; quando il tallone va dentro il ginocchio va fuori. Poi piccoli cerchi',
    base: { hr: 0, cw: 0, ca: 0 },
    keys: [
      { d: 2, s: 'Tallone dentro, ginocchio fuori', ss: 'Tallone dentro', p: { hr: 16 }, k: 'gr' },
      { d: 2, s: 'Tallone fuori', ss: 'Tallone fuori', p: { hr: -16 }, k: 'gr' },
      { d: 1, s: 'Piccoli cerchi col tallone', ss: 'Piccoli cerchi', p: { hr: 0, cw: 1, ca: 0 }, k: 'gr' },
      { d: 4, s: 'Piccoli cerchi col tallone', p: { ca: 360 }, e: 'l', k: 'gr' },
      { d: 1, s: 'Piccoli cerchi col tallone', p: { cw: 0, ca: 360 }, k: 'gr' }
    ],
    main: 0, strip: [0, 1, 3],
    draw: function (P) {
      var o = [], a = P.hr * (1 - P.cw) + P.cw * 13 * Math.cos(P.ca * R), sh = P.cw * 7 * Math.sin(P.ca * R);
      var rt = 'rotate(' + f1(a) + ' 150 146) translate(0 ' + f1(sh) + ')';
      o.push(E('ellipse', { cx: 150, cy: 196, rx: 32, ry: 46, 'class': 'ghost', transform: 'rotate(-16 150 146)' }));
      o.push(E('ellipse', { cx: 150, cy: 196, rx: 32, ry: 46, 'class': 'ghost', transform: 'rotate(16 150 146)' }));
      o.push(E('ellipse', { cx: 150, cy: 196, rx: 32, ry: 46, 'class': 'bf', transform: rt }));
      o.push(PA('M108 146 C100 120 98 90 108 68 C118 48 182 44 194 68 C204 92 200 122 192 146 Z', 'bf'));
      [[116, 44, 13], [140, 35, 8], [158, 34, 7.5], [175, 39, 6.5], [189, 49, 5.5]].forEach(function (t) { o.push(CI([t[0], t[1]], t[2], 'bf'), CI([t[0], t[1]], t[2] * 0.3, 'fgr')); });
      o.push(TX([208, 28], 'dita incollate', 'tk'));
      o.push(PA('M106 252 Q150 274 194 252', 'br', { opacity: 0.6 }));
      o.push(TX([98, 252], 'dentro', 'tk', 'end', op(0.4 + 0.6 * cl(a / 16, 0, 1))), TX([202, 252], 'fuori', 'tk', 'start', op(0.4 + 0.6 * cl(-a / 16, 0, 1))));
      var kn = cl(a / 16, -1, 1);
      o.push(AR([246, 120], [246 + 26 * kn, 120], 'gr', Math.abs(kn)));
      o.push(TX([246, 104], 'ginocchio', 't', 'middle'));
      return o;
    }
  });

  // piede di profilo ingrandito: arco, lunghezza, dita (E15)
  function sideFoot(P, ox, oy, sc) {
    var ar = P.ar || 0, tl = P.tl || 0, s = function (x, y) { return f1(ox + x * sc) + ' ' + f1(oy + y * sc); };
    var fx = 90 - 6 * ar, tx = 132 - 6 * ar;
    var d = 'M' + s(20, 128) + ' L' + s(44, 128) + ' C' + s(56, 118 - 12 * ar) + ' ' + s(fx - 12, 118 - 12 * ar) + ' ' + s(fx, 128) +
      ' L' + s(tx - 30, 128) + ' C' + s(tx - 14, 128 - 14 * tl) + ' ' + s(tx - 4, 128 - 22 * tl) + ' ' + s(tx, 126 - 24 * tl) +
      ' C' + s(tx + 12, 118 - 24 * tl) + ' ' + s(tx + 6, 112 - 18 * tl) + ' ' + s(tx - 2, 112 - 14 * tl) +
      ' L' + s(98 - 4 * ar, 92 - 5 * ar) + ' C' + s(82, 82 - 5 * ar) + ' ' + s(72, 68) + ' ' + s(68, 46) + ' L' + s(66, 14) + ' L' + s(42, 14) + ' L' + s(42, 66) + ' C' + s(38, 86) + ' ' + s(16, 98) + ' ' + s(20, 128) + ' Z';
    return PA(d, 'bf');
  }
  def({
    id: 'E15', v: [300, 170], aria: 'Piede di profilo ingrandito: come per acchiappare il pavimento l\'arco sale e il piede si accorcia, mentre le dita restano lunghe e premono a terra; si tiene e poi si rilascia',
    base: { ar: 0, tl: 0 },
    keys: [
      { d: 1.5, s: 'Piede morbido', p: {}, k: 'no' },
      { d: 2, s: 'Acchiappa il pavimento: l\'arco sale', ss: 'L\'arco sale', p: { ar: 1 }, k: 'gr' },
      { d: 3, s: 'Tieni, dita lunghe (30–50 s)', ss: 'Tieni 30–50 s', p: {}, k: 'gr' },
      { d: 2, s: 'Rilascia', p: { ar: 0 }, k: 'no' }
    ],
    main: 2, strip: [0, 2],
    draw: function (P) {
      var o = [L([20, 146], [280, 146], 0, 'g')];
      o.push(sideFoot(P, 40, 18, 1));
      var ar = P.ar;
      o.push(AR([102 - 6 * ar, 164], [102 - 6 * ar, 140 - 10 * ar], 'gr', 0.2 + 0.8 * ar)); // ocra: è movimento, non respiro
      o.push(AR([196, 128], [182 - 6 * ar, 128], 'gr', ar));
      o.push(TX([226, 104], 'dita lunghe', 't', 'middle'), TX([226, 118], 'che premono', 't', 'middle'));
      o.push(CI([72, 146], 4, 'fgr'), CI([130 - 6 * ar, 146], 4, 'fgr'));
      o.push(TX([172, 34], 'l\'arco sale,', 'tk'), TX([172, 50], 'il piede si accorcia', 'tk'));
      return o;
    }
  });

  // E18 — tibiale posteriore, gambe viste da dietro
  def({
    id: 'E18', v: [260, 230], aria: 'Gambe viste da dietro a gambe tese: si sale sulle punte e si torcono i talloni verso l\'interno tenendo a terra base dell\'alluce e del mignolo; le ginocchia restano ferme',
    base: { rs: 0, tw: 0 },
    keys: [
      { d: 1.5, s: 'Piedi allineati, gambe tese', ss: 'Gambe tese', p: {}, k: 'no' },
      { d: 2, s: 'Sali sulle punte', ss: 'Sali', p: { rs: 1 }, k: 'gr' },
      { d: 2, s: 'Torci: talloni in dentro', ss: 'Torci i talloni', p: { tw: 1 }, k: 'gr' },
      { d: 1.5, s: 'Tieni, ginocchia ferme', ss: 'Tieni', p: {}, k: 'gr' },
      { d: 2.5, s: 'Scendi piano', ss: 'Scendi', p: { rs: 0, tw: 0 }, k: 'gr' }
    ],
    main: 3, strip: [0, 1, 3],
    draw: function (P) {
      var o = [L([20, 204], [240, 204], 0, 'g')], up = 12 * P.rs, tw = 7 * P.tw;
      o.push(CI([110, 186], 10, 'ghost'), CI([150, 186], 10, 'ghost'));
      [-1, 1].forEach(function (s) {
        var hip = [130 + s * 40, 10 - up], knee = [130 + s * 32, 124 - up], heel = [130 + s * (20 - tw), 182 - up - 4 * P.rs];
        o.push(G({ 'class': 'b' }, [L(hip, knee, 22), L(knee, add(heel, [0, -10]), 12)]));
        o.push(CI(heel, 10, 'bf'));
        o.push(E('rect', { x: 130 + s * 30 - 18, y: 194, width: 36, height: 10, rx: 5, 'class': 'bf' }));
        o.push(CI([130 + s * 30 - 12, 199], 3.5, 'fgr'), CI([130 + s * 30 + 12, 199], 3.5, 'fgr'));
        o.push(AR(add(heel, [s * 18, 4]), add(heel, [s * 6, 10]), 'gr', P.tw)); // frecce ocra: movimento (il verde è il respiro)
      });
      o.push(AR([130, 120], [130, 92], 'gr', P.rs));
      o.push(TX([62, 96], 'sali', 'tk', 'end', op(0.4 + 0.6 * P.rs)), TX([198, 96], 'torci', 'tk', 'start', op(0.4 + 0.6 * P.tw)), TX([198, 110], 'il tallone', 't', 'start', op(0.4 + 0.6 * P.tw)));
      o.push(TX([130, 222], 'base alluce e mignolo a terra', 'tk', 'middle'));
      return o;
    }
  });

  // T7 — test del piede d'appoggio: gamba lontana sollevata, lente sul piede vicino
  def({
    id: 'T7', v: [300, 290], aria: 'Test di profilo: in piedi a gambe tese si solleva un ginocchio in modo naturale e si guarda il piede d\'appoggio. Se le dita si alzano o il tallone crolla dentro, l\'appoggio è instabile (per il coach il gluteo non lavora); con lo short foot si è più stabili',
    base: poseOf(STD, { x: 92, ln: { p: [94, GS - 6], b: -1, f: 0 }, lf: { a: 89, r: 116, b: -1, f: 0 }, tl: 0, ar: 0 }),
    keys: [
      { d: 2, s: 'In piedi, gambe tese', ss: 'Gambe tese', p: {}, k: 'no' },
      { d: 2, s: 'Alza un ginocchio, in modo naturale', ss: 'Alza il ginocchio', p: { lf: KNEE_UP }, k: 'gr' },
      { d: 2.5, s: 'Guarda il piede: le dita si alzano?', ss: 'Le dita si alzano?', p: { tl: 1 }, k: 'gr' },
      { d: 2.5, s: 'Con lo short foot sei più stabile', ss: 'Short foot', p: { tl: 0, ar: 1 }, k: 'gr' },
      { d: 2, s: 'Giù, poi l\'altro lato', ss: 'Altro lato', p: { lf: { a: 89, r: 116, b: -1, f: 0 }, ar: 0 }, k: 'no' }
    ],
    main: 2, strip: [1, 2, 3], pre: function (P, c, o) { floor(300, GS, o); },
    post: function (P, c, o, J) {
      var f = J.ln.ft.ball;
      o.push(CI([226, 214], 52, 'b', { 'stroke-width': 2, style: 'stroke:var(--line-strong)' }));
      o.push(L(add(f, [16, -4]), [178, 226], 0, 'ghost'));
      o.push(sideFoot(P, 168, 182, 0.42));
      // la lente mostra ciò che si vede (le dita che si alzano: il piede cerca stabilità); «gluteo spento» è la lettura
      // del coach (L4 0:11:38), da spiegare nel testo, non una diagnosi da scrivere sul disegno
      o.push(TX([226, 150], P.tl > 0.5 ? 'dita su: piede instabile' : P.ar > 0.5 ? 'arco su, dita giù' : 'piede d\'appoggio', 't', 'middle'));
    }
  });

  /* ======================= LEZIONI 1, 2 E 4: E32, E33, T8–T12 (in coda negli id) ======================= */
  // Dove il respiro non è indicato, la fase di riposo ha il pallino grigio e dice «respira libero dal naso».

  // E32 — ginocchia fuori, piede fermo: gambe di fronte (come E18, dal davanti) e lente sul piede sinistro dall'alto (E14)
  var FFT = [[108, 146], [100, 120], [98, 90], [108, 68], [118, 48], [182, 44], [194, 68], [204, 92], [200, 122], [192, 146]];
  var TOE = [[116, 44, 13], [140, 35, 8], [158, 34, 7.5], [175, 39, 6.5], [189, 49, 5.5]];
  function heelPts(T, a) { // tallone di E14 (ellisse ruotata di a attorno a 150,146), trasformato da T
    var p = [];
    for (var i = 0; i < 16; i++) { var q = i * 22.5 * R; p.push(T(add([150, 146], rot([32 * Math.cos(q), 50 + 46 * Math.sin(q)], a)))); }
    return smooth(p, true);
  }
  def({
    id: 'E32', q: 1, v: [300, 220], aria: 'Gambe viste di fronte, in piedi e scalzi, con una lente sul piede sinistro visto dall\'alto: senza spostare i piedi le ginocchia ruotano verso l\'esterno, la caviglia caduta in dentro si raddrizza, l\'arco del piede sale da solo e la base dell\'alluce resta a terra; poi si rilascia piano',
    base: { ko: 0, ak: 0, sf: 0, hr: 0, al: 0 },
    keys: [
      { d: 2, s: 'Ruota le ginocchia verso l\'esterno', ss: 'Ginocchia verso l\'esterno', p: { ko: 1 }, k: 'gr' },
      { d: 2, s: 'L\'arco sale da solo', p: { ak: 1, sf: 1, hr: 1 }, k: 'gr' },
      { d: 2, s: 'Tieni: alluce a terra', p: { al: 1 }, k: 'gr' },
      { d: 2, s: 'Rilascia piano, respira libero dal naso', ss: 'Rilascia piano', p: { ko: 0, ak: 0, sf: 0, hr: 0, al: 0 }, k: 'no' }
    ],
    main: 2, strip: [0, 1, 2],
    draw: function (P) {
      var o = [L([14, 206], [164, 206], 0, 'g')], cx = 88, Lc = [232, 110], k = 0.46, rf;
      [-1, 1].forEach(function (s) { // s = 1: gamba a destra di chi guarda (la sinistra della figura)
        var H = [cx + s * 36, 12], K0 = [cx + s * 27, 112], K = [cx + s * (27 + 3 * P.ko), 112];
        var A0 = [cx + s * 15, 184], A = [cx + s * (15 + 6 * P.ak), 184], fx = cx + s * 24;
        o.push(G(op(P.ak), [L(K0, A0, 0, 'ghost')]));
        o.push(G({ 'class': 'b' }, [L(H, K, 22), L(K, A, 12)]));
        o.push(PA(pth([add(A, [-7, -1]), [fx - 17, 205], [fx + 17, 205], add(A, [7, -1])], true), 'bf'));
        [[12, 4.6], [4.5, 3.4], [-1.5, 3.1], [-7, 2.8], [-12, 2.5]].forEach(function (t) { o.push(CI([fx - s * t[0], 205 - t[1]], t[1], 'bf')); });
        o.push(CI(add(K, [s * 5 * P.ko, 0]), 7.5, 'bf'));
        o.push(CAR(add(K, [s * 2 * P.ko, 5]), 17, 8, s > 0 ? 160 : 20, s > 0 ? 20 : 160, 'gr', P.ko));
        if (s > 0) rf = [fx + 16, 198];
      });
      var T = function (p) { return [Lc[0] - (p[0] - 150) * k, Lc[1] + (p[1] - 143) * k]; }, a = 7 * P.hr;
      o.push(L(rf, add(Lc, dir(150), 60), 0, 'ghost'), CI(Lc, 60, 'b', { 'stroke-width': 2, style: 'stroke:var(--line-strong)' }));
      o.push(PA(heelPts(T, 0), 'ghost', op(P.hr)), PA(heelPts(T, a), 'bf'));
      var f = FFT.map(T);
      o.push(PA('M' + M(f[0]) + 'C' + M(f[1]) + ' ' + M(f[2]) + ' ' + M(f[3]) + 'C' + M(f[4]) + ' ' + M(f[5]) + ' ' + M(f[6]) + 'C' + M(f[7]) + ' ' + M(f[8]) + ' ' + M(f[9]) + 'Z', 'bf'));
      TOE.forEach(function (t) { o.push(CI(T(t), t[2] * k, 'bf')); });
      o.push(PA(qd(T([103, 112]), T([130, 156]), T([121, 204])), 'gr', ext(op(P.sf), { 'stroke-width': 3 })));
      o.push(CI(T([114, 76]), 3.2 + 2.3 * P.al, 'fgr'), CI(T([188, 84]), 3.2, 'fgr'), CI(T(add([150, 146], rot([0, 58], a))), 3.2, 'fgr'));
      o.push(TX([232, 24], 'ginocchia fuori,', 'tk', 'middle'), TX([232, 39], 'piedi fermi', 'tk', 'middle'));
      o.push(TX([232, 192], P.al > 0.5 ? 'alluce a terra' : P.sf > 0.5 ? 'l\'arco sale da solo' : 'il piede, dall\'alto', P.sf > 0.5 ? 'tk' : 't', 'middle'));
      return o;
    }
  });

  // E33 — apri il petto, lombare ferma: seduto come E20, tronco in due tratti (lombare e dorsale) con due pallini
  var E33B = { x: 128, y: SEAT - 12, t: -90, cu: 2, t2: -72, cu2: -9, nk: -16, wr: 0,
    ln: { p: [192, GS - 6], b: -1, f: 0 }, lf: { p: [189, GS - 6], b: -1, f: 0 },
    an: { a: 96, r: 78, b: 1 }, af: { p: [170, SEAT - 26], b: 1, w: 0 } };
  var E33OPEN = { t2: -93, cu2: -2, nk: 0 }, E33SHUT = { t: -90, cu: 2, t2: -72, cu2: -9, nk: -16 };
  var A33 = {
    id: 'E33', q: 1, v: [260, 290], aria: 'Figura seduta di profilo sul bordo della sedia, tronco diviso in lombare e petto: apre il petto senza muovere la bassa schiena; non deve inarcare la lombare al posto del petto. A petto chiuso il braccio alzato si ferma inclinato in avanti, a petto aperto arriva verticale',
    base: E33B,
    keys: [
      { d: 3, s: 'Apri il petto, la lombare non si muove', ss: 'Apri il petto, lombare ferma', p: E33OPEN, k: 'gr' },
      { d: 2, s: 'Non così: inarchi la bassa schiena', ss: 'Non così: inarchi la lombare', p: { t: -98, cu: 11, t2: -76, cu2: -9, nk: -8, wr: 1 }, k: 'gr' },
      { d: 2.5, s: 'Petto chiuso: alza il braccio', ss: 'Petto chiuso: il braccio resta avanti', p: shallow(E33SHUT, { wr: 0, nk: -30, an: { a: -32, r: 81, b: 1 } }), k: 'gr' },
      { d: 2.5, s: 'Petto aperto: alza il braccio', ss: 'Petto aperto: il braccio sale dritto', p: shallow(E33OPEN, { an: { a: -88, r: 81, b: 1 } }), k: 'gr' },
      { d: 1.5, s: 'Giù il braccio, respira libero dal naso', ss: 'Giù il braccio', p: shallow(E33SHUT, { an: E33B.an }), k: 'no' }
    ],
    main: 0, strip: [0, 1, 2, 3],
    pre: function (P, c, o) { floor(260, GS, o); chair(150, SEAT, GS, o); },
    post: function (P, c, o, J) {
      var to = J.to, lo = to.pt(0.24, 0, -1), pe = to.pt(0.8, 0, 1);
      o.push(CI(lo, 5.5, P.wr > 0.5 ? 'fgr' : 'fbr'), CI(pe, 5.5, 'fgr'));
      o.push(TX([84, lo[1] + 4], 'lombare', 'tk', 'end'), TX(add(pe, [10, -6]), 'petto', 'tk'));
    }
  };
  A33.draw = (function (side) { // nell'errore la figura diventa grigia, con una croce sulla lombare
    return function (P, c) {
      var o = side(P, c);
      return P.wr > 0.5 ? [G({ style: 'color:var(--line-strong)' }, o), cross(c.J.to.pt(0.22, 14, -1), 6)] : o;
    };
  })(sideFig(A33));
  def(A33);

  // T8 (L1) — lingua al palato a bocca aperta: la testa di E2 ingrandita, bocca in sezione, mandibola che ruota
  var H8 = [92, 96], R8 = 54, JP8 = add(H8, dir(128), 49);
  // punti della lingua: [a riposo (nella mandibola), su, il punto «su» sta nel cranio (1) o nella mandibola (0)]
  var TG = [[[-14, 44], [-14, 44], 0], [[-18, 26], [-18, 24], 0], [[-2, 18], [-2, 20], 1], [[20, 20], [14, 12], 1],
    [[36, 27], [29, 8], 1], [[30, 34], [33, 17], 1], [[8, 42], [12, 40], 0]];
  def({
    id: 'T8', q: 1, v: [260, 192], aria: 'Testa di profilo con la bocca in sezione: si apre bene la bocca, poi la punta della lingua sale a toccare il palato tenendo la bocca aperta, mentre sotto la lingua il frenulo si tende; la bocca non va richiusa. Poi la lingua scende e la bocca si chiude',
    base: { jo: 0, tu: 0, gh: 0 },
    keys: [
      { d: 1.5, s: 'Apri bene la bocca', p: { jo: 1 }, k: 'gr' },
      { d: 2, s: 'Lingua su, al palato', p: { tu: 1 }, k: 'gr' },
      { d: 2, s: 'Non chiudere la bocca', ss: 'Tieni, non chiudere la bocca', p: { gh: 1 }, k: 'gr' },
      { d: 1.5, s: 'Rilascia, respira libero dal naso', ss: 'Rilascia', p: { jo: 0, tu: 0, gh: 0 }, k: 'no' }
    ],
    main: 2, strip: [0, 1, 2],
    draw: function (P) {
      var o = [], a = 27 * P.jo;
      function h(v) { return add(H8, v); }
      function jr(p, b) { return add(JP8, rot(sub(p, JP8), b)); }
      var U = add(H8, dir(30), R8), Pj = add(H8, dir(128), R8), Lj = add(H8, dir(36), R8), Mc = add(H8, dir(33), R8 - 8);
      function jaw(b) { return 'M' + M(jr(Pj, b)) + 'A' + R8 + ' ' + R8 + ' 0 0 0 ' + M(jr(Lj, b)); }
      // l'errore: la mandibola che risale (fantasma)
      var gv = cl(2 * P.gh - 1, 0, 1), gc = jr(add(H8, dir(70), R8), a * 0.2);
      o.push(PA(jaw(a * 0.2), 'ghost', op(gv)), cross(add(gc, [16, 14]), 5, gv), TX(add(gc, [28, 19]), 'non chiudere', 't', 'start', op(gv)));
      var tg = TG.map(function (q) { return mix(jr(h(q[0]), a), q[2] ? h(q[1]) : jr(h(q[1]), a), P.tu); });
      o.push(PA(smooth(tg, true), 'bf', { style: 'fill:var(--ground-soft)' }));
      o.push(L(mid(tg[5], tg[6], 0.3), jr(h([22, 42]), a), 0, 'gr', ext(op(P.tu), { 'stroke-width': 3 })));
      o.push(PA('M' + M(U) + 'L' + M(h([40, 14])) + 'Q' + M(h([12, -14])) + ' ' + M(h([-16, 16])) + 'Q' + M(h([-24, 24])) + ' ' + M(h([-22, 42])), 'b', { 'stroke-width': 4 }));
      o.push(G({ 'class': 'b' }, [PA('M' + M(U) + 'A' + R8 + ' ' + R8 + ' 0 1 0 ' + M(Pj), 'b', { 'stroke-width': 5 }), L(U, Mc, 4),
        PA('M' + M(h([50, -21])) + 'L' + M(h([75, 4])) + 'L' + M(h([52, 12.5])), 'b', { 'stroke-width': 4 }),
        PA(jaw(a), 'b', { 'stroke-width': 5 }), L(jr(Lj, a), jr(Mc, a), 4)]));
      o.push(TX(h([12, -10]), 'palato', 't', 'middle'), TX(h([70, 42]), 'lingua', 'tk'), TX(h([70, 58]), 'frenulo', 'tk', 'start', op(P.tu)));
      o.push(TX([130, 186], 'lingua e diaframma: come un elastico', 't', 'middle'));
      return o;
    }
  });

  // T9 (L2-N1) — test della spinta: respiro basso contro respiro alto. Nessun compagno disegnato: la spinta è una
  // freccia ocra all'altezza del petto (punto scelto da noi); sotto il piede il pallino del peso, come in E11
  function onHeel(ax, f) { // il piede ruota sul tallone e l'avampiede si stacca: bersaglio della caviglia
    var u = dir(f), n = rot(u, 90);
    return { p: sub([ax - 6, GS - 3.5], add(add([0, 0], u, -6), n, 2.5)), b: -1, f: f };
  }
  // spalla alzata: la figura cade indietro come un blocco sul tallone (tibia verticale, avampiede su, baricentro
  // dietro il tallone). Prima scendeva il bacino e le ginocchia avanzavano a 26°: un accosciarsi, non una caduta
  var T9IN = 'Inspira, giù il diaframma', T9UP = 'Respiro alto: il peso va ai talloni';
  def({
    id: 'T9', q: 1, v: [240, 290], aria: 'Test di profilo, in piedi: dopo un respiro basso che abbassa il diaframma, una spinta all\'altezza del petto non sposta la figura e il peso resta al centro del piede. Con una spalla alzata la stessa spinta fa staccare il piede e perdere l\'equilibrio; respirando alto, nel petto, la figura arretra e il peso va sui talloni',
    base: poseOf(STD, { y: GS - 121, pp: 0, pu: 0, sh: 0, wt: 0 }), // ginocchia morbide ~15° (con GS-119 erano 26°)
    keys: [
      { d: 1, s: T9IN, n: 1, p: { pb: 0.25, pc: 0.2, ps: 0.1 }, air: 1, lab: 'peso al centro', quiet: 1 },
      { d: 4, s: T9IN, ss: 'Inspira, giù il diaframma', n: 1, p: { pb: 1, pc: 0.8, ps: 0.4 }, air: 1, lab: 'peso al centro' },
      { d: 2, s: 'Spinta: resti radicato', p: { pu: 1 }, k: 'gr', air: 0, lab: 'radicato' },
      { d: 2.5, s: 'Spalla alzata: il piede si stacca', ss: 'Spalla alzata: il piede si stacca', p: { sh: 7, x: 94, y: GS - 122.5, t: -97, wt: -1.5, pb: 0.4, pc: 0.3, ps: 0.2,
        ln: onHeel(106, -16), lf: onHeel(103, -16), an: { a: 60, r: 80, b: 1 }, af: { a: 56, r: 80, b: 1 } }, k: 'gr', air: 0, lab: 'il piede si stacca' },
      { d: 0.6, s: T9UP, ss: 'Respiro alto: peso ai talloni', p: { pp: 1.1, pb: 0, pc: 0, ps: 0, sh: 5, x: 101, y: GS - 121, t: -93, wt: -0.6, ln: STD.ln, lf: STD.lf, an: STD.an, af: STD.af }, air: 1, lab: 'peso sui talloni' },
      { d: 0.6, s: T9UP, p: { pp: 0.45, wt: -0.8 }, air: -1, lab: 'peso sui talloni' },
      { d: 0.6, s: T9UP, p: { pp: 1.2, wt: -0.9 }, air: 1, lab: 'peso sui talloni' },
      { d: 0.7, s: T9UP, p: { pp: 0.5, wt: -1 }, air: -1, lab: 'peso sui talloni' }
    ],
    arrows: ['pb', 'pp'], nose: 1, main: 2, strip: [1, 2, 3, 6], pre: function (P, c, o) { floor(240, GS, o); },
    post: function (P, c, o, J) {
      var q = c.k.quiet ? 0 : 1, pu = P.pu * q, sv = cl(P.sh / 7, 0, 1) * q;
      var tip = J.to.pt(0.55, 5 + 10 * (1 - P.pu), 1), tail = add(tip, [40, 0]), sa = J.sa;
      o.push(AR(tail, tip, 'gr', pu), TX(add(tail, [-14, -10]), 'spinta', 't', 'middle', op(pu)));
      o.push(AR(add(sa, [-17, 8]), add(sa, [-17, -12]), 'gr', sv), TX(add(sa, [-24, -4]), 'spalla su', 't', 'end', op(sv)));
      [-1, 0, 1].forEach(function (k) { o.push(CI([110 + 12 * k, GS + 11], 4.5, 'fgr', op(0.3))); });
      o.push(CI([110 + 12 * P.wt, GS + 11], 6.5, 'fgr'), TX([134, GS + 15], c.k.lab || '', 't'));
    }
  });

  // T10 (L2-N2) — il dito sotto l'arco: piede di profilo, lato interno, come E15
  def({
    id: 'T10', q: 1, v: [300, 198], aria: 'Piede di profilo visto dal lato interno, in carico: sotto l\'arco passa più o meno un dito. Né l\'arco schiacciato né quello altissimo vanno bene. Poi il piede si muove a pezzi: prima si alzano le dita, poi si flette la pianta',
    base: { ar: 0, tl: 0, fi: 0, ex: 0 },
    keys: [
      { d: 2, s: 'Piede in carico, respira libero dal naso', ss: 'Piede in carico', p: {}, k: 'no', lab: 'l\'arco interno' },
      { d: 2.5, s: 'Ci passa un dito', p: { fi: 1 }, k: 'gr', lab: 'ci passa un dito' },
      { d: 2.5, s: 'Gli estremi no', p: { fi: 0, ex: 1 }, k: 'no', lab: 'l\'arco interno' },
      { d: 1.5, s: 'Il piede si muove a pezzi', ss: 'Si muove a pezzi: le dita', p: { ex: 0, tl: 1 }, k: 'gr', lab: 'le dita si alzano' },
      { d: 1.5, s: 'Il piede si muove a pezzi', ss: 'poi la pianta', p: { tl: 0, ar: 1 }, k: 'gr', lab: 'la pianta si flette' }
    ],
    main: 1, strip: [1, 2, 3, 4],
    draw: function (P, c) {
      var o = [], FY = 168, tip = 10 + 88 * P.fi, g = [];
      o.push(L([12, FY], [178, FY], 0, 'g'), sideFoot(P, 24, 40, 1));
      o.push(G(op(cl(P.fi * 3, 0, 1)), [rrect([tip - 32, FY - 4.2], 64, 8.4, 0, 'bf', 4.2), L([tip - 9, FY - 6.2], [tip - 4, FY - 6.2], 2)]));
      [[-0.85, 0, 'schiacciato'], [2.3, 96, 'altissimo']].forEach(function (e) { // le due sagome estreme, barrate
        var el = sideFoot({ ar: e[0], tl: 0 }, 184, e[1], 0.6);
        el.a['class'] = 'ghost'; el.a.style = 'stroke-dasharray:3 3';
        g.push(L([190, e[1] + 76.8], [282, e[1] + 76.8], 0, 'g'), el, cross([206, e[1] + 88], 5), TX([218, e[1] + 92], e[2], 't'));
      });
      o.push(G(op(P.ex), g));
      o.push(TX([96, FY + 18], c.k.lab, 'tk', 'middle'));
      return o;
    }
  });

  // T11 (L2-N3) — gambe in dentro e in fuori: il tallone visto da dietro, come E18
  def({
    id: 'T11', q: 1, v: [260, 232], aria: 'Gambe viste da dietro, in piedi e rilassati: ruotando le gambe in dentro le ginocchia vanno verso il centro, l\'arco crolla e tallone e tendine d\'Achille fanno una C verso l\'interno; ruotandole in fuori la C si gira verso l\'esterno e il piede si arma',
    base: { ro: 0 },
    keys: [
      { d: 2, s: 'In piedi, rilassato: respira libero dal naso', ss: 'In piedi, rilassato', p: {}, k: 'no' },
      { d: 2.5, s: 'Gambe in dentro: l\'arco crolla', ss: 'Gambe in dentro: l\'arco crolla', p: { ro: -1 }, k: 'gr' },
      { d: 1.5, s: 'Torna neutro', p: { ro: 0 }, k: 'no' },
      { d: 2.5, s: 'Gambe in fuori: il tallone si arma', ss: 'Gambe in fuori: il tallone si arma', p: { ro: 1 }, k: 'gr' },
      { d: 1.5, s: 'Torna neutro', p: { ro: 0 }, k: 'no' }
    ],
    main: 1, strip: [0, 1, 3],
    draw: function (P) {
      var o = [L([20, 206], [240, 206], 0, 'g')], ro = P.ro, rin = cl(-ro, 0, 1), rout = cl(ro, 0, 1);
      [-1, 1].forEach(function (s) {
        var hip = [130 + s * 40, 10], knee = [130 + s * (32 + 8 * ro), 122], ank = [130 + s * (21 + 6 * ro), 170], hb = [130 + s * (21 - 4 * ro), 199];
        var hc = mid(ank, hb, 0.6), d = smooth([mid(knee, ank, 0.45), ank, hb]), dx = s * (ro < 0 ? -1 : 1);
        o.push(E('rect', { x: 130 + s * 28 - 18, y: 194, width: 36, height: 11, rx: 5, 'class': 'bf' }));
        o.push(G({ 'class': 'b' }, [L(hip, knee, 22), L(knee, ank, 12)]));
        o.push(E('ellipse', { cx: f1(hc[0]), cy: f1(hc[1]), rx: 13, ry: 9.5, transform: 'rotate(' + f1(ang(sub(hb, ank))) + ' ' + M(hc) + ')', 'class': 'bf' }));
        o.push(PA(d, 'b', { 'stroke-width': 7, style: 'stroke:var(--surface)' }), PA(d, 'gr', { 'stroke-width': 3 }));
        o.push(CAR(mid(knee, ank, 0.3), 16, 6, dx > 0 ? 160 : 20, dx > 0 ? 20 : 160, 'gr', Math.abs(ro)));
      });
      o.push(TX([6, 92], 'in dentro:', 'tk', 'start', op(0.35 + 0.65 * rin)), TX([6, 106], 'l\'arco crolla', 't', 'start', op(0.35 + 0.65 * rin)));
      o.push(TX([202, 92], 'in fuori:', 'tk', 'start', op(0.35 + 0.65 * rout)), TX([202, 106], 'si arma', 't', 'start', op(0.35 + 0.65 * rout)));
      o.push(TX([130, 225], 'talloni visti da dietro: guarda la C', 'tk', 'middle'));
      return o;
    }
  });

  // T12 (L2-N4) — la prova dello stacco di profilo: spingono le anche o tira la schiena?
  function onThigh(k, dx) { return function (P) { return add(mid([P.x, P.y], P.ln.p, k), [dx, 0]); }; }
  // «gambe tese» (L2 1:43:18): in piedi ginocchia ~15° (con GS-120 erano 21°)
  var T12UP = { x: 104, y: GS - 121, t: -90, cu: 0, nk: 4, an: { p: onThigh(0.42, 14), b: 1 }, af: { p: onThigh(0.42, 11), b: 1 } };
  var T12G = [], T12J = ghostBody(poseOf(STD, { x: 88, y: GS - 119, t: -80, cu: 10, nk: -8, an: { p: onThigh(0.36, 13), b: 1 } }), T12G);
  T12G.push(cross(T12J.to.pt(0.22, 16, -1), 6), TX(add(T12J.to.pt(0.22, 26, -1), [0, 22]), 'non così', 't', 'end'));
  def({
    id: 'T12', q: 1, v: [250, 290], aria: 'Prova dello stacco di profilo a gambe quasi tese, mani davanti alle cosce come su un bilanciere immaginario: le anche vanno indietro e il busto scende a schiena dritta fino a 45 gradi; poi si sale spingendo con le anche e coi piedi a terra, bacino e busto insieme. Da evitare: inarcare la bassa schiena e raddrizzare il busto prima delle anche',
    base: poseOf(STD, shallow(T12UP, { pu: 0 })),
    keys: [
      { d: 3, s: 'Anche indietro, petto aperto', p: { x: 84, y: GS - 118, t: -45, nk: -8, an: { p: onThigh(0.3, 12), b: 1 }, af: { p: onThigh(0.3, 9), b: 1 } }, k: 'gr' },
      { d: 1, s: 'Fermo a 45°', p: {}, k: 'gr' },
      { d: 3, s: 'Spingi con le anche e sali', p: shallow(T12UP, { pu: 1 }), k: 'gr' },
      { d: 2, s: 'Non tirare con la schiena. Respiro: vedi E28', ss: 'Non tirare con la schiena', p: { pu: 0 }, k: 'no', vis: 'io' }
    ],
    main: 1, strip: [0, 2, 3],
    pre: function (P, c, o) { floor(250, GS, o); o.push(G(op(vis(c)), T12G)); },
    post: function (P, c, o, J) {
      var h = J.to.P, w = mid(J.an.Wr, J.an.tip), a0 = add(h, [20, 14]), a1 = add(a0, dir(-45), 92), ft = J.ln.A, pu = P.pu * (1 - vis(c));
      o.push(L(a0, a1, 0, 'ghost'), TX(add(a1, [5, -2]), '45°', 'tk'));
      o.push(CI(w, 15, 'ghost'), CI(w, 3, 'b', { 'stroke-width': 3 }));
      o.push(AR([ft[0] + 20, GS - 6], [ft[0] + 20, GS - 46], 'gr', pu), AR(add(h, [-40, 0]), add(h, [-15, 0]), 'gr', pu));
      o.push(TX(add(h, [-28, -12]), 'anche', 't', 'middle', op(pu)), TX([ft[0] + 28, GS - 22], 'piedi a terra', 't', 'start', op(pu)));
    }
  });

  /* ======================= LEZIONE 6 — BLOCCO A: mobilità in piedi (E34–E42) ======================= */
  (function () {
    // N1–N9 di esercizi-L6a.md. Respiro non dato dal coach: movimento ocra, riposo grigio «respira libero dal naso».
    // cy sulla posa chiave: giri legati alla fase (cerchi, otto), che non tornano indietro al giro del ciclo.
    var RL = 'respira libero dal naso', SURF = { style: 'stroke:var(--surface)' }, OCRA = { style: 'stroke:var(--ground)' };
    var FILL = { style: 'fill:currentColor', 'stroke-width': 0 }, LENS = { 'stroke-width': 2, style: 'stroke:var(--line-strong)' };
    var W4 = { style: 'stroke-width:4' }, W3 = { 'stroke-width': 3 }, W2 = { style: 'stroke-width:2' };
    function cy(c) { return c.k.cy ? 2 * Math.PI * c.k.cy * (c.u == null ? 0.5 : c.u) : 0; }
    function env(c) { return c.k.cy ? cl(Math.min(c.u, 1 - c.u) * 8, 0, 1) : 0; }
    function ell(p, rx, ry, cls, x) { return E('ellipse', ext({ cx: f1(p[0]), cy: f1(p[1]), rx: f1(rx), ry: f1(ry), 'class': cls || 'bf' }, x)); }
    function K(d, s, p, x) { return shallow({ d: d, s: s, p: p || {}, k: 'gr' }, x); } // posa chiave: ocra se non detto
    function track(p, r, o) { o.push(CI(p, r, 'gr dash', { style: 'stroke-width:1.5' })); }

    // il bacino come un catino d'acqua (N1, 0:09:05), accanto alla figura: a > 0 si rovescia avanti (antiversione)
    function bowl(p, a, q, o) {
      var T = function (x, y) { return add(p, rot([x, y], a)); }, s = a > 0 ? 1 : -1;
      o.push(L(q, add(p, [20, 2]), 0, 'ghost'), L(add(p, [-13, 0]), add(p, [13, 0]), 0, 'water'),
        PA('M' + M(T(-18, -7)) + 'Q' + M(T(-18, 12)) + ' ' + M(T(0, 12)) + 'Q' + M(T(18, 12)) + ' ' + M(T(18, -7)), 'gr', W3),
        CI(add(T(s * 19, -5), [s * 3, 9]), 2.5, 'fbr', op((Math.abs(a) - 7) / 5)), TX(add(p, [0, -18]), 'il catino', 't', 'middle'));
    }

    // E34 (N1) — in piedi, allineato: dall'errore alla posizione di partenza, poi il respiro
    var A34 = {
      id: 'E34', q: 1, v: [230, 290], aria: 'Figura in piedi di profilo che si allinea. Dall\'errore (spalle tirate indietro, sedere in fuori, ginocchia tese, mento in fuori) apre il petto a spalle rilassate, porta il bacino neutro, sblocca le ginocchia, mento dentro, testa su e sacro giù; poi respira dal naso col peso su tre punti del piede',
      base: poseOf(STD, { y: GS - 121.9, t: -97, cu: 9, t2: -101, cu2: 4, nk: 16, pa: 13, wr: 1, ar: 0, wd: 0, an: { a: 102, r: 80, b: 1 }, af: { a: 100, r: 80, b: 1 } }),
      keys: [
        K(2, 'Non così: spalle indietro, sedere in fuori, ginocchia tese', 0, { ss: 'Non così', k: 'no', air: 0 }),
        K(2.5, 'Apri il petto, spalle rilassate', { t2: -90, cu2: 3, wr: 0, an: STD.an, af: STD.af }, { air: 0 }),
        K(2, 'Bacino neutro, un filo di retro', { t: -90, cu: 1, pa: -3 }, { air: 0 }),
        // «leggermente flesse» (L6 0:07:13): ~15°. Con GS-119 erano 26°, e a 26° le cosce non possono restare morbide
        K(1.5, 'Ginocchia morbide', { y: GS - 121 }, { air: 0 }),
        K(2.5, 'Mento dentro, testa su, sacro giù', { nk: 3, ar: 1 }, { ss: 'Mento dentro, testa su', air: 0 }),
        { d: 5, s: 'Diaframmi allineati: inspira dal naso', ss: 'Allineato: respira', n: 1, p: { pb: 1, pc: 0.6, ar: 0.3, wd: 1 }, air: 1 },
        { d: 5, s: 'Espira dal naso', n: 1, p: { pb: 0, pc: 0 }, air: -1 }
      ],
      arrows: ['pb'], nose: 1, main: 5, strip: [0, 2, 4, 5], pre: stdFloor,
      post: function (P, c, o, J) {
        var h = J.H, s = J.to.pt(0.03, 5, -1), ar = P.ar, wd = P.wd, kn = op((P.y - GS + 121.9) / 0.9);
        o.push(AR(add(h, [0, -18]), add(h, [0, -38]), 'gr', ar), AR(s, add(s, [0, 26]), 'gr', ar));
        o.push(TX(add(h, [10, -24]), 'testa su', 't', 'start', op(ar)), TX(add(s, [-8, 24]), 'sacro giù', 't', 'end', op(ar)));
        bowl([44, 96], P.pa, J.to.pt(0.04, 2, -1), o);
        // i tre punti sono tallone, base dell'alluce e base del mignolo: di profilo le ultime due stanno quasi una sull'altra,
        // sotto l'avampiede. Prima il pallino di mezzo cadeva sotto l'arco, che non deve portare peso
        [[101, 0], [119, 0], [124, -3]].forEach(function (d) { o.push(CI([d[0], GS + 11 + d[1]], 4.5, 'fgr', op(0.25 + 0.75 * wd))); });
        o.push(TX([133, GS + 15], 'peso su tre punti', 't', 'start', op(wd)), TX([140, GS - 70], 'ginocchia', 't', 'start', kn), TX([140, GS - 56], 'morbide', 't', 'start', kn));
      }
    };
    A34.draw = (function (side) { // nell'errore la figura diventa grigia, con una croce sulla lombare (come E33)
      return function (P, c) {
        var o = side(P, c);
        return P.wr > 0.5 ? [G({ style: 'color:var(--line-strong)' }, o), cross(c.J.to.pt(0.3, 16, -1), 6)] : o;
      };
    })(sideFig(A34));
    def(A34);

    // E41 (N8) — retro e antiversione in piedi: si muove il bacino (il catino), il busto resta fermo
    var RETRO = { cu: -4, pa: -12, rv: 1, av: 0 }, ANTE = { cu: 10, pa: 13, rv: 0, av: 1 };
    def({
      id: 'E41', q: 1, v: [230, 290], aria: 'Figura in piedi di profilo, mani sui fianchi: si muove solo il bacino, come un catino d\'acqua. Retroversione: pube su, sacro giù. Antiversione: sedere in fuori. Il busto resta fermo',
      // ginocchia morbide ~15° (con GS-119 erano 26°), come E34
      base: poseOf(STD, { y: GS - 121, cu: 1, t2: -90, cu2: 0, pa: 0, rv: 0, av: 0, an: { tor: 0.06, off: -9, b: 1, w: 70 }, af: { tor: 0.06, off: -9, b: 1, w: 70 } }),
      keys: [
        K(2, 'Retro: pube su, sacro giù', RETRO, { ss: 'Retroversione' }),
        K(2, 'Antero: sedere in fuori', ANTE, { ss: 'Antiversione' }),
        K(2, 'Retro: pube su, sacro giù', RETRO),
        K(2, 'Antero: sedere in fuori', ANTE),
        K(1.5, 'Torna neutro, ' + RL, { cu: 1, pa: 0, av: 0 }, { ss: 'Neutro', k: 'no' })
      ],
      main: 0, strip: [0, 1, 4], pre: stdFloor,
      post: function (P, c, o, J) {
        var p = J.to.P, f = add(p, [16, 12]), s = add(p, [-15, -18]), b = add(p, [-14, 8]), pe = J.to.pt(0.8, 0, 1);
        o.push(AR(f, add(f, [0, -22]), 'gr', P.rv), TX(add(f, [8, -4]), 'pube su', 't', 'start', op(P.rv)));
        o.push(AR(s, add(s, [0, 22]), 'gr', P.rv), TX(add(s, [-8, 18]), 'sacro giù', 't', 'end', op(P.rv)));
        o.push(AR(b, add(b, [-24, 0]), 'gr', P.av), TX(add(b, [-30, 18]), 'sedere', 't', 'end', op(P.av)), TX(add(b, [-30, 32]), 'in fuori', 't', 'end', op(P.av)));
        bowl([44, 96], P.pa, J.to.pt(0.04, 2, -1), o);
        o.push(CI(pe, 5.5, 'fbr'), TX(add(pe, [12, -4]), 'busto', 'tk'), TX(add(pe, [12, 10]), 'fermo', 'tk'));
      }
    });

    // corpo di fronte (back: da dietro): bacino px, pr; torace tx, tr; gamba destra di chi guarda alzata di scorcio (lk)
    function fb(P, o, back, hips) {
      var pr = P.pr || 0, Pc = [120 + (P.px || 0), GS - 119 + Math.abs(pr) * 0.25], tr = P.tr || 0, lk = P.lk || 0, lo = [], hi = [];
      function T(q) { return add(Pc, rot(q, pr)); }
      var Tc = add(add(Pc, rot([0, -62], tr)), [P.tx || 0, 0]);
      function U(q) { return add(Tc, rot(q, tr)); }
      var J = { T: T, U: U };
      [-1, 1].forEach(function (s) {
        var h = T([s * 15, 0]), a = [120 + s * 13, GS - 7], k = mid(h, a, 0.52), l = s > 0 ? lk : 0;
        if (l) { var k2 = add(add(h, [3, 16]), P.k8 || [0, 0]); k = mix(k, k2, l); a = mix(a, add(k2, dir(90 - (P.wa || 0)), 54), l); }
        var g = [L(h, k, 12), L(k, a, 10), ell([a[0] + s * 3 * (1 - l), a[1] + 3 + 3 * l], 9 - 3 * l, 4.5 + 3.5 * l)];
        if (l > 0.3) hi = [L(h, k, 18, 'b', SURF), L(k, a, 15, 'b', SURF)].concat(g, [CI(k, 8, 'bf')]); else lo = lo.concat(g);
        J['k' + s] = k;
      });
      var sh = [U([-29, -20]), U([29, -20])], Nb = U([0, -26]), Hc = add(Nb, rot([0, -22], tr * 0.5));
      var tp = [T([-17, 12]), T([-20, -4]), mid(T([-18, -16]), U([-21, 18])), U([-23, 0]), sh[0], U([-12, -27]), U([12, -27]), sh[1], U([23, 0]), mid(T([18, -16]), U([21, 18])), T([20, -4]), T([17, 12])];
      o.push(G({}, lo), L(Nb, Hc, 9), PA(smooth(tp, true), 'bf'), rrect(T([0, 5]), 42, 20, pr, 'bf', 8));
      if (back) o.push(L(T([0, 7]), T([0, 15]), 2));
      o.push(G({}, hi));
      [-1, 1].forEach(function (s) {
        var a0 = sh[(s + 1) / 2], r = ik(a0, hips ? T([s * 23, -8]) : add(a0, [s * 9, 79]), 45, 37, -s);
        o.push(PL([a0, r[0], r[1]], 7), L(r[1], add(r[1], hips ? [-s * 4, 7] : [s, 10]), 6));
      });
      o.push(ell(Hc, 12.5, 15, 'bf', W4));
      if (!back) o.push(CI(add(Hc, [-5, -2]), 1.7, 'b', FILL), CI(add(Hc, [5, -2]), 1.7, 'b', FILL), L(add(Hc, [-4, 7]), add(Hc, [4, 7]), 2));
      return J;
    }
    // riquadro dall'alto: bacino (pv, pieno) e torace (th, contorno); la testa col naso dice dov'è avanti
    function topIn(c0, th, pv, o, up) {
      var y = up ? -1 : 1, hc = add(c0, th);
      o.push(CI(c0, 50, 'b', LENS), ell(add(c0, pv), 22, 12), ell(hc, 31, 13, 'b', { style: 'stroke-width:3' }), CI(add(hc, [-36, 0]), 6, 'bf'), CI(add(hc, [36, 0]), 6, 'bf'),
        CI(hc, 9, 'bf'), PA(pth([add(hc, [-4, y * 8]), add(hc, [4, y * 8]), add(hc, [0, y * 14])], true), 'bf'),
        TX(add(c0, [0, y * 38 + 4]), 'avanti', 't', 'middle'), TX(add(c0, [0, -58]), 'dall\'alto', 't', 'middle'));
    }

    // E39 (N6) — lo sterno di lato e in cerchio, bacino fermo: di fronte, col riquadro dall'alto (avanti verso chi guarda)
    var STE = 'Sterno di lato, il bacino resta fermo';
    def({
      id: 'E39', q: 1, v: [300, 290], aria: 'Figura in piedi vista di fronte, con un riquadro dall\'alto: lo sterno va a destra e a sinistra, poi disegna un cerchio orizzontale nei due versi; il bacino resta fermo e non segue il torace',
      base: { tx: 0 },
      keys: [
        K(1.5, STE, { tx: -12 }, { ss: 'Sterno di lato' }),
        K(2, STE, { tx: 12 }),
        K(1.2, STE, { tx: 0 }),
        K(4, 'Cerchio: indietro, destra, avanti, sinistra', 0, { ss: 'Cerchio orizzontale', cy: 1 }),
        K(4, 'Ora nell\'altro verso', 0, { cy: -1 }),
        K(2, 'Il bacino non segue. Respira libero dal naso', 0, { ss: 'Il bacino non segue', k: 'no', vis: 'io' })
      ],
      main: 3, strip: [0, 1, 3, 5],
      draw: function (P, c) {
        var o = [], a = cy(c), e = env(c), x = P.tx - 12 * e * Math.sin(a), z = -12 * e * Math.cos(a), g = vis(c);
        floor(300, GS, o);
        var J = fb({ tx: x }, o), st = J.U([0, -4]), pv = J.T([0, 4]);
        o.push(G(op(g), [rrect(J.T([13, 5]), 42, 20, 0, 'ghost', 8), cross(J.T([40, -12]), 5)]));
        o.push(CI(st, 5, 'fgr'), CI(pv, 5, 'fbr'), TX([72, st[1] + 4], 'sterno', 'tk', 'end'), TX([98, 196], 'bacino', 'tk', 'end'), TX([98, 210], 'fermo', 'tk', 'end'));
        topIn([246, 124], [x * 0.8, z * 0.8], [0, 0], o, 0);
        if (c.k.cy) track([246, 124], 9.6, o);
        o.push(G(op(g), [ell([254, 124], 22, 12, 'ghost'), cross([272, 106], 4)]));
        return o;
      }
    });

    // E40 (N7) — il bacino di lato, l'hula-hoop, la danza del ventre: da dietro (sinistra = sinistra), riquadro dall'alto
    var DAN = 'Danza del ventre: piega una gamba, l\'anca opposta sale';
    def({
      id: 'E40', q: 1, v: [300, 298], aria: 'Figura in piedi vista da dietro, mani sui fianchi, con un riquadro dall\'alto: il bacino va tutto a sinistra e il busto compensa, poi disegna un cerchio ampio come con l\'hula-hoop nei due versi, col peso su tutte e due le gambe; infine la danza del ventre: piegando una gamba l\'anca opposta sale',
      base: { px: 0, tr: 0, pr: 0 },
      keys: [
        K(2, 'Bacino tutto a sinistra, il busto compensa', { px: -14, tr: 11 }, { ss: 'Bacino a sinistra' }),
        K(4, 'Cerchio ampio, come l\'hula-hoop', 0, { ss: 'Cerchio, come l\'hula-hoop', cy: 1 }),
        K(4, 'Ora nell\'altro verso', 0, { cy: -1 }),
        K(1.5, DAN, { px: 0, tr: 6, pr: -12 }, { ss: 'Danza del ventre' }),
        K(1.5, DAN, { tr: -6, pr: 12 }),
        K(1.2, 'Torna al centro, ' + RL, { pr: 0, tr: 0 }, { ss: 'Al centro', k: 'no' })
      ],
      main: 1, strip: [0, 1, 3, 4],
      draw: function (P, c) {
        var o = [], a = cy(c), q = c.k.cy, px = q ? -14 * Math.cos(a) : P.px, tr = q ? 11 * Math.cos(a) : P.tr, dz = q ? -14 * Math.sin(a) : 0;
        floor(300, GS, o);
        var J = fb({ px: px, tr: tr, pr: P.pr }, o, 1, 1), s = P.pr < 0 ? 1 : -1, h = J.T([s * 15, 0]);
        o.push(AR(add(h, [s * 34, 10]), add(h, [s * 34, -12]), 'gr', Math.abs(P.pr) / 12), TX(add(h, [s * 34, 24]), 'sale', 't', 'middle', op(Math.abs(P.pr) / 12)));
        o.push(CI([107, GS + 9], 4.5, 'fgr'), CI([133, GS + 9], 4.5, 'fgr'), TX([120, GS + 23], 'peso su tutte e due', 't', 'middle'));
        topIn([246, 124], [(px + 62 * Math.sin(tr * R)) * 0.8, 0], [px * 0.8, dz * 0.8], o, 1);
        track([246, 124], 11.2, o);
        // «sento il femore che gratta» (L6 0:27:53) è un'immagine: scritta sul disegno spinge a cercare un attrito o un
        // pizzico all'inguine, che è il segnale di fermarsi. Resta la qualità del movimento
        o.push(TX([246, 196], 'ampio e fluido,', 't', 'middle'), TX([246, 210], 'nessun pizzico', 't', 'middle'), TX([246, 224], 'all\'inguine', 't', 'middle'));
        return o;
      }
    });

    // E42 (N9) — anca su una gamba: tergicristallo e otto di fronte (gamba alzata di scorcio), piega e stendi di profilo
    // indietro: la gamba si ferma a ~20° (prima 30°, cioè sul limite): a gamba tesa e bacino fermo l'anca di un
    // principiante estende 10–20°; i 30° del coach sono il tetto, la linea tratteggiata. Oltre, si inarca la lombare
    var K90 = { a: 45, r: 79, b: -1, f: 24 }, KB30 = { a: 110, r: 115, b: -1, f: 8 }, KST = { a: 89, r: 116, b: -1, f: 0 };
    var TGC = 'Tergicristallo: il ginocchio fermo, sale il piede', OT = 'L\'otto col ginocchio', T8 = [];
    for (var i8 = 0; i8 < 16; i8++) T8.push([12 * Math.sin(i8 * 45 * R), -15 * Math.sin(i8 * 22.5 * R)]);
    var S42 = sideFig({ pre: stdFloor, post: function (P, c, o, J) {
      var h = J.to.P, lo = J.to.pt(0.25, 0, -1), b = cl((P.ln.a - 95) / 15, 0, 1);
      o.push(G(op(b), [L(h, add(h, dir(120), 116), 0, 'ghost'), TX([12, 206], 'max 30°', 'tk')]));
      o.push(TX(add(J.ln.K, [6, -12]), '90°', 'tk', 'start', op((89 - P.ln.a) / 44)));
      o.push(CI(lo, 5.5, 'fbr'), TX(add(lo, [-10, 0]), 'schiena', 'tk', 'end'), TX(add(lo, [-10, 14]), 'ferma', 'tk', 'end'));
    } });
    function F42(P, c) {
      var o = [], a = cy(c), k8 = c.k.cy ? [12 * Math.sin(2 * a), -15 * Math.sin(a)] : [0, 0];
      floor(240, GS, o);
      var J = fb(shallow(P, { k8: k8 }), o), kn = J.k1, pv = J.T([0, 4]);
      if (c.k.t8) o.push(PA(smooth(T8.map(function (q) { return add(sub(kn, k8), q); }), true), 'gr dash', ext(op(c.k.cy ? 1 : c.u), W2)));
      var lg = c.k.gk ? ['ginocchio', kn] : c.k.t8 ? ['schiena', pv] : 0; // legenda in alto a destra: il pallino verde è il punto fermo
      if (lg) o.push(CI(lg[1], 5, 'fbr'), CI([170, 24], 5, 'fbr'), TX([180, 28], lg[0], 'tk'), TX([180, 42], c.k.gk ? 'fermo' : 'ferma', 'tk'));
      return o;
    }
    def({
      id: 'E42', q: 1, v: [240, 290], aria: 'In equilibrio su una gamba. Di fronte, ginocchio alzato e fermo: la gamba sotto oscilla come un tergicristallo. Di profilo: il ginocchio sale a 90 gradi e la gamba va indietro al massimo di 30, la schiena ferma. Di nuovo di fronte: il ginocchio disegna un otto; poi si cambia gamba',
      base: poseOf(STD, { ln: KST, lk: 0, wa: 0, px: 0 }),
      keys: [
        K(1.2, TGC, { lk: 1, px: -5 }, { ss: 'Tergicristallo', gk: 1 }),
        K(1.5, TGC, { wa: 34 }, { gk: 1 }),
        K(1.5, TGC, { wa: -18 }, { gk: 1 }),
        K(1.5, TGC, { wa: 34 }, { gk: 1 }),
        K(1.5, TGC, { wa: 0, lk: 0, px: 0 }, { gk: 1 }),
        K(2, 'Piega e stendi: ginocchio su, a 90°', { ln: K90 }, { ss: 'Ginocchio su, 90°', vw: 's' }),
        K(2.5, 'Gamba indietro, la schiena non si muove (max 30°)', { ln: KB30 }, { ss: 'Indietro, max 30°', vw: 's' }),
        K(1.5, 'Giù: si muove l\'anca, non la schiena', { ln: KST }, { ss: 'Schiena ferma', vw: 's' }),
        K(1.2, OT, { lk: 1, px: -5 }, { t8: 1 }),
        K(4, OT, 0, { t8: 1, cy: 1 }),
        K(1.5, 'Giù, cambia gamba: ' + RL, { lk: 0, px: 0 }, { ss: 'Cambia gamba', k: 'no' })
      ],
      main: 1, strip: [1, 2, 6, 9],
      draw: function (P, c) { return c.k.vw === 's' ? S42(P, c) : F42(P, c); }
    });

    // E35 (N2) — occhi in cerchio, testa ferma: viso di fronte ingrandito
    def({
      id: 'E35', q: 1, v: [240, 170], aria: 'Viso visto di fronte, ingrandito, con la testa ferma: gli occhi vanno al limite dello sguardo e disegnano tre cerchi grandi in un verso, poi tre nell\'altro, e tornano al centro',
      base: { er: 0 },
      keys: [
        K(1, 'Testa ferma: lo sguardo al limite', { er: 1 }, { ss: 'Sguardo al limite' }),
        K(6, 'Tre cerchi in un verso', 0, { cy: 3 }),
        K(6, 'Tre cerchi nell\'altro', 0, { cy: -3 }),
        K(1.5, 'Al centro, ' + RL, { er: 0 }, { ss: 'Al centro', k: 'no' })
      ],
      main: 1, strip: [0, 1, 2],
      draw: function (P, c) {
        var o = [], a = cy(c), n = c.k.cy;
        o.push(L([98, 140], [96, 170], 3), L([142, 140], [144, 170], 3), ell([120, 84], 56, 68, 'bf', W4));
        [98, 142].forEach(function (x) {
          o.push(PA('M' + (x - 17) + ' 80Q' + x + ' 60 ' + (x + 17) + ' 80Q' + x + ' 100 ' + (x - 17) + ' 80Z', 'b', { 'stroke-width': 3, style: 'fill:var(--surface)' }),
            ell([x, 80], 10, 5, 'gr dash', ext(op(0.2 + 0.6 * P.er), { style: 'stroke-width:1.5' })), CI([x + 10 * P.er * Math.sin(a), 80 - 5 * P.er * Math.cos(a)], 5, 'b', FILL));
        });
        o.push(PA('M82 58Q98 51 112 57', 'b', W3), PA('M128 57Q142 51 158 58', 'b', W3),
          PL([[120, 86], [113, 108], [122, 110]], 3), PA('M104 128Q120 135 136 128', 'b', W3));
        if (n) o.push(CAR([142, 80], 30, 24, n > 0 ? -60 : 60, n > 0 ? 60 : -60, 'gr'), TX([206, 150], 'giro ' + Math.min(3, Math.floor(c.u * 3) + 1) + ' di 3', 't', 'middle'));
        o.push(CI([200, 24], 6, 'fbr'), TX([200, 46], 'testa', 'tk', 'middle'), TX([200, 60], 'ferma', 'tk', 'middle'));
        return o;
      }
    });

    // busto ingrandito di fronte: la testa gira (hy) dietro agli occhi (ey) o trasla (hx); so sposta la spalla destra
    function bustF(P, o, so) {
      var hy = (P.hy || 0) * 60, H = [120 + (P.hx || 0), 64], sp = add([174, 140], so || [0, 0]);
      function fx(e, r) { return H[0] + r * Math.sin((hy + e) * R); }
      o.push(PA(pth([[108, 132], [H[0] - 10, H[1] + 18], [H[0] + 10, H[1] + 18], [132, 132]]), 'bf'), PA(smooth([[52, 220], [54, 162], [66, 140], [100, 126], [140, 126], sp, [186, 162], [188, 220]]), 'bf'),
        L([66, 164], [64, 220], 3), L(add(sp, [0, 24]), [176, 220], 3), ell(H, 22, 27, 'bf', W4));
      [-22, 22].forEach(function (e) {
        var k = Math.cos((hy + e) * R), x = fx(e, 21);
        if (k > 0.1) o.push(ell([x, H[1] - 3], 4.6 * k, 2.6, 'b', { style: 'stroke-width:2;fill:var(--surface)' }), CI([x + 2.4 * (P.ey || 0) * k, H[1] - 3], 1.9, 'b', FILL));
      });
      var nx = fx(0, 22), sy = Math.sin(hy * R);
      o.push(PL([[nx, H[1] - 1], [nx + 3 * sy - 1, H[1] + 9], [nx + 3, H[1] + 10]], 2.5), L([fx(-14, 18), H[1] + 17], [fx(14, 18), H[1] + 17], 2.5));
      return sp;
    }
    // busto e testa ingranditi, di profilo verso destra: mento avanti (ht), testa su o giù (hp), collo che si flette (nf),
    // petto che si apre (co); so sposta la spalla
    function bustS(P, o, so) {
      var co = P.co || 0, hp = -(P.hp || 0), B = [116, 136], T = add(add(B, rot([0, -32], P.nf || 0)), [P.ht || 0, 0]), H = add(T, rot([4, -18], hp));
      var sh = add([112, 152], so || [0, 0]), n = unit(rot(sub(T, B), 90));
      function f(q) { return add(H, rot(q, hp)); }
      o.push(PA(smooth([[84, 220], [86, 178], [94, 150], [108, 138], [128, 140], [146 + 4 * co, 156 - 5 * co], [154 + 3 * co, 188], [154, 220]]), 'bf'),
        PA(pth([add(B, n, -10), add(T, n, -9), add(T, n, 9), add(B, n, 10)]), 'bf'), CI(H, 22, 'bf', W4), PL([f([20, -4]), f([28, 6]), f([20, 8])], 3), CI(f([10, -7]), 2.2, 'b', FILL),
        PA(qd(f([20, 14]), f([18, 24]), f([4, 22])), 'b', W3), PA(qd(f([-6, -6]), f([-12, 0]), f([-6, 6])), 'b', W3),
        rrect(add(sh, [-1.5, 27]), 70, 16, 93, 'bf', 8));
      return { H: H, sh: sh };
    }

    // E36 (N3) — il collo nei tre piani: il no e Totò di fronte, il sì di profilo
    var NO = 'Il no: prima gli occhi, poi la testa', SI = 'Il sì: mento avanti, poi guarda su', GIU = 'Mento dentro, allunga la nuca, poi giù', TOTO = 'Totò: la testa trasla di lato, non si inclina';
    function F36(P, c) {
      var o = [], hy = P.hy * 60, ct = [34, 52], dn = 90 - hy, g = dn - 35 * P.ey, gh = [217, 70];
      bustF(P, o);
      o.push(CI(ct, 15, 'bf'), PA(pth([add(ct, dir(dn), 22), add(ct, dir(dn - 28), 14), add(ct, dir(dn + 28), 14)], true), 'bf'),
        L(add(ct, dir(g), 26), add(ct, dir(g), 44), 0, 'gr dash'), TX([34, 24], 'dall\'alto', 't', 'middle'));
      o.push(G(op(P.gt), [AR2([94, 26], [146, 26], 'gr'), L([206, 98], add(gh, rot([0, 12], 22)), 8, 'ghost'), ell(gh, 10, 13, 'ghost', { transform: 'rotate(22 ' + M(gh) + ')' }),
        cross([230, 48], 5), TX([236, 116], 'non inclinare', 't', 'end')]));
      return o;
    }
    function S36(P, c) { // freccia «mento avanti» piena a ht 8 (era 13): sfuma mentre la testa sale e torna sopra le spalle
      var o = [], H = bustS(P, o).H, fw = cl(P.ht / 8, 0, 1), bk = cl(-P.ht / 6, 0, 1);
      o.push(AR([H[0] + 22, H[1] + 34], [H[0] + 42, H[1] + 34], 'gr', fw), AR([H[0] + 48, H[1] + 22], [H[0] + 32, H[1] + 22], 'gr', bk), AR([H[0] - 32, H[1] + 8], [H[0] - 32, H[1] - 16], 'gr', bk));
      o.push(TX([166, 154], 'si apre', 't', 'start', op(P.co)), TX([166, 168], 'il petto', 't', 'start', op(P.co)));
      return o;
    }
    def({
      id: 'E36', q: 1, v: [240, 220], aria: 'Il collo nei tre piani. Di fronte, il no: prima gli occhi guardano di lato, poi la testa li segue; un riquadro la mostra dall\'alto. Di profilo, il sì: mento avanti e poi su, il petto si apre; mento dentro, nuca lunga e poi giù. Di fronte, Totò: la testa trasla di lato senza inclinarsi',
      base: { hy: 0, ey: 0, ht: 0, hp: 0, nf: 0, co: 0, hx: 0, gt: 0 },
      keys: [
        K(0.8, NO, { ey: -1 }, { ss: 'Il no: prima gli occhi' }),
        K(1.4, NO, { hy: -1, ey: 0 }),
        K(0.8, NO, { ey: 1 }),
        K(2, NO, { hy: 1, ey: 0 }),
        K(1.2, NO, { hy: 0 }),
        // biomeccanica: «leggermente avanti con il mento» (0:12:18), non 13; salendo la testa torna sopra le spalle
        // («Avanti e poi vado su. Bam! E li accompagna indietro», 0:12:53): col collo inclinato avanti e la testa
        // estesa sopra la figura insegnava il mento che sporge, cioè la compressione alta che il coach vuole evitare
        K(1.5, SI, { ht: 8 }, { ss: 'Il sì: mento avanti, poi su', vw: 's' }),
        K(2, SI, { hp: 34, co: 1, ht: 3, nf: -5 }, { vw: 's' }),
        K(1.5, 'Torna al centro', { ht: 0, hp: 0, co: 0, nf: 0 }, { vw: 's' }),
        K(1.5, GIU, { ht: -6, hp: -6 }, { ss: 'Mento dentro, poi giù', vw: 's' }),
        K(2, GIU, { hp: -38, nf: 14 }, { vw: 's' }),
        K(1.5, 'Torna al centro', { ht: 0, hp: 0, nf: 0 }, { vw: 's' }),
        K(1.2, TOTO, { hx: -15, gt: 1 }, { ss: 'Totò: trasla, non inclinare' }),
        K(1.5, TOTO, { hx: 15 }),
        K(1.5, TOTO, { hx: -15 }),
        K(1.2, 'Al centro, ' + RL, { hx: 0, gt: 0 }, { ss: 'Al centro', k: 'no' })
      ],
      main: 6, strip: [1, 6, 9, 12],
      draw: function (P, c) { return c.k.vw === 's' ? S36(P, c) : F36(P, c); }
    });

    // E37 (N4) — le spalle nei tre piani: cerchi ampi di profilo, il pennarello di fronte, la clavicola dall'alto
    function E37(P, c) {
      var o = [], a = cy(c), v = c.k.vw, s, z;
      if (v === 's') { // da giù: avanti, su, indietro, giù (lo stesso giro di «su, indietro, giù, avanti»)
        s = bustS(P, o, [9 * Math.sin(a), 9 * Math.cos(a) - 9]).sh; track([112, 143], 9, o);
        o.push(CI(s, 5.5, 'fgr'), TX([40, 128], 'la spalla:', 't', 'middle'), TX([40, 142], 'cerchi ampi', 't', 'middle'));
      } else if (v === 'f') { // da giù: dentro, su, fuori, giù
        s = bustF(P, o, [-6 * Math.sin(a), 6 * Math.cos(a) - 6]); track([174, 134], 6, o);
        o.push(CI(s, 5, 'fgr'), TX([198, 100], 'il pennarello', 't', 'middle'), TX([198, 114], 'sulla spalla', 't', 'middle'));
      } else { // dall'alto, avanti verso chi guarda: da dentro, avanti, fuori, indietro
        z = add([174, 124], [6 - 6 * Math.cos(a), 6 * Math.sin(a)]);
        o.push(ell([120, 124], 72, 30), L([120, 142], [66, 126], 6), L([120, 142], z, 6, 'b', OCRA), CI([66, 126], 11, 'bf'), CI(z, 11, 'bf'),
          CI([120, 116], 19, 'bf', W4), PA(pth([[113, 133], [127, 133], [120, 142]], true), 'bf'));
        track([180, 124], 6, o);
        o.push(TX([120, 70], 'dall\'alto', 't', 'middle'), TX([120, 172], 'avanti', 't', 'middle'), TX([120, 204], 'la clavicola si chiude e si apre', 'tk', 'middle'));
      }
      return o;
    }
    def({
      id: 'E37', q: 1, v: [240, 220], aria: 'Le spalle nei tre piani. Di profilo, cerchi ampi: su, indietro, giù, avanti, nei due versi. Di fronte, un piccolo cerchio come con un pennarello sulla spalla. Dall\'alto: avanti, fuori, indietro, dentro, la clavicola si chiude e si apre',
      base: {},
      keys: [
        K(3.6, 'Cerchi ampi: su, indietro, giù, avanti', 0, { ss: 'Cerchi ampi', vw: 's', cy: 3 }),
        K(3.6, 'Tre giri nell\'altro verso', 0, { vw: 's', cy: -3 }),
        K(3, 'Il pennarello: un cerchio davanti a te', 0, { ss: 'Il pennarello', vw: 'f', cy: 1 }),
        K(3, 'Avanti, fuori, indietro, dentro', 0, { vw: 't', cy: 1 }),
        K(1.2, 'Rilassa, ' + RL, 0, { ss: 'Rilassa', k: 'no', vw: 't' })
      ],
      main: 0, strip: [0, 2, 3],
      draw: E37
    });

    // E38 (N5) — polso e dita: avambraccio fermo, la mano vista di tre quarti e un po' dall'alto (piccolo modello 3D)
    var AZ = -25 * R, EL = 35 * R, TR8 = null;
    function pj3(p) { return [120 + p[0] * Math.cos(AZ) + p[2] * Math.sin(AZ), 128 - p[1] * Math.cos(EL) + (p[2] * Math.cos(AZ) - p[0] * Math.sin(AZ)) * Math.sin(EL)]; }
    function v3(p, q, k) { return [p[0] + q[0] * k, p[1] + q[1] * k, p[2] + q[2] * k]; }
    function hand3(dev, fl, fi) { // palmo verso chi guarda, dita in su; dev inclina di lato, fl flette (+) o estende (−), fi chiude il pugno
      var d = dev * R, f = fl * R, O = [0, 0, 0], a1 = [Math.sin(d), Math.cos(d), 0], s = [Math.cos(d), -Math.sin(d), 0], cc = 80 * fi * R;
      var a = v3(v3(O, a1, Math.cos(f)), [0, 0, 1], Math.sin(f)), n = v3([0, 0, Math.cos(f)], a1, -Math.sin(f)), K = v3(O, a, 34);
      var r = { palm: [v3(O, s, -13), v3(K, s, -15), v3(K, s, 15), v3(O, s, 13)].map(pj3), f: [] };
      [[-11, 19, -13], [-3.7, 24, -4], [3.7, 25, 4], [11, 21, 12]].forEach(function (q, i) {
        var b = v3(v3(O, a, i % 3 ? 36 : 34), s, q[0] * (1 - 0.15 * fi)), sp = q[2] * (1 - fi) * R, d0 = v3(v3(O, a, Math.cos(sp)), s, Math.sin(sp));
        var p1 = v3(b, v3(v3(O, d0, Math.cos(cc)), n, Math.sin(cc)), q[1] * 0.55), p2 = v3(p1, v3(v3(O, d0, Math.cos(2 * cc)), n, Math.sin(2 * cc)), q[1] * 0.45);
        r.f.push([b, p1, p2].map(pj3));
      });
      var tb = v3(v3(O, a, 6), s, -13), td = mix(v3(v3(v3(O, a, 0.55), s, -0.8), n, 0.25), v3(v3(v3(O, a, 0.6), s, -0.15), n, 0.75), fi), t1 = v3(tb, td, 15);
      r.t = [tb, t1, v3(t1, mix(td, s, fi), 12)].map(pj3);
      return r;
    }
    def({
      id: 'E38', q: 1, v: [240, 178, 36], aria: 'Avambraccio e mano di tre quarti, gomito fermo: a dita aperte il polso disegna un otto; poi un pugno forte che gira; poi si aprono le dita e dopo il polso, che si estende: lavorano gli estensori',
      base: { fi: 0, ex: 0 },
      keys: [
        K(4, 'Dita aperte: disegna un otto col polso', 0, { ss: 'Un otto col polso', m: 8, cy: 1 }),
        K(1, 'Pugno forte', { fi: 1 }),
        K(2, 'Gira il pugno', 0, { m: 'o', cy: 1 }),
        K(1.2, 'Apri le dita, poi il polso', { fi: 0 }),
        K(1.3, 'Apri le dita, poi il polso', { ex: 1 }),
        K(1.5, 'Rilascia, ' + RL, { ex: 0 }, { ss: 'Rilascia', k: 'no' })
      ],
      main: 0, strip: [0, 1, 4],
      draw: function (P, c) {
        var o = [], a = cy(c), m = c.k.m, i;
        var dev = m === 8 ? 22 * Math.sin(a) : m === 'o' ? 15 * Math.sin(a) : 0, fl = (m === 8 ? 26 * Math.sin(2 * a) : m === 'o' ? 18 * (1 - Math.cos(a)) : 0) - 62 * P.ex;
        var h = hand3(dev, fl, P.fi), x = P.fi > 0.55 ? OCRA : {};
        if (!TR8) { TR8 = []; for (i = 0; i < 24; i++) TR8.push(hand3(22 * Math.sin(i * 15 * R), 26 * Math.sin(i * 30 * R), 0).f[2][2]); }
        if (m === 8) o.push(PA(smooth(TR8, true), 'gr dash', W2));
        o.push(L([120, 204], [120, 128], 21, 'b', SURF), L([120, 204], [120, 128], 16), PA(pth(h.palm, true), 'bf', x));
        h.f.concat([h.t]).forEach(function (f) { o.push(PL(f, 10.5, 'b', SURF), PL(f, 6.5, 'b', x)); });
        o.push(CI([120, 192], 6, 'fbr'), TX([134, 196], 'gomito fermo', 'tk'));
        o.push(AR([150, 184], [150, 150], 'gr', P.ex), TX([158, 172], 'estensori', 't', 'start', op(P.ex)));
        return o;
      }
    });
  })();
  /* ======================= FINE BLOCCO A ======================= */

  /* ======================= LEZIONE 6 — BLOCCO B: piedi col peso, collo contro gravità, plank, polsi in quadrupedia ======================= */
  (function () {
    // E43, E44, T13, E45–E49 (L6, mobilità). Respiro libero: fasi di movimento ocra, riposo grigio «respira libero dal
    // naso»; verde dove il coach dà il respiro (T13, E46). Le ripetizioni sono oscillazioni sulla frazione di fase c.u.
    var FREE = 'respira libero dal naso';
    function wave(c, n) { // n andate e ritorni dal centro al centro; la striscia (time 0, u 0.5) mostra l'estremo k.sx
      if (!c.time && c.u === 0.5) return c.k.sx == null ? 1 : c.k.sx;
      return Math.sin(2 * Math.PI * n * c.u);
    }
    function pulse(c, n) { return (1 - Math.cos(2 * Math.PI * n * c.u)) / 2; } // n volte su e giù, 1 a metà della fase
    function rep(c, n) { return Math.min(n, Math.floor(c.u * n) + 1) + ' / ' + n; }
    function lensC(p, r, o) { o.push(CI(p, r, 'b', { 'stroke-width': 2, style: 'stroke:var(--line-strong)' })); }
    function greyIf(on, o) { return on ? [G({ style: 'color:var(--line-strong)' }, o)] : o; }
    function under(x, v, o) { o.push(AR([x, GF + 3], [x, GF + 14], 'gr', v)); } // spinge nel pavimento

    // E43 (N10), da vedere: le due caviglie insieme di lato, ginocchia tese. Gambe di fronte (E32), lente sulla caviglia sinistra
    var TOE43 = [[12, 4.6], [4.5, 3.4], [-1.5, 3.1], [-7, 2.8], [-12, 2.5]];
    function foot43(s, sw, T, sc) { // piede di fronte inclinato su un bordo; T trasforma (lente)
      var fx = 88 + s * 24, A0 = [88 + s * 15, 184], a = 14 * sw, pv = [fx + (sw >= 0 ? 17 : -17), 205], k = [];
      var F = function (p) { return T(add(pv, rot(sub(p, pv), a))); };
      k.push(PA(pth([F(add(A0, [-7, -1])), F([fx - 17, 205]), F([fx + 17, 205]), F(add(A0, [7, -1]))], true), 'bf'));
      TOE43.forEach(function (t) { k.push(CI(F([fx - s * t[0], 205 - t[1]]), t[1] * sc, 'bf')); });
      return { A: F(A0), k: k };
    }
    def({
      id: 'E43', q: 1, v: [300, 222], aria: 'Gambe viste di fronte, in piedi, con una lente sulla caviglia: ginocchia tese e rotule che guardano avanti, le caviglie col peso sopra si piegano di lato, su un bordo del piede e poi sull\'altro, senza ruotare il femore. Da evitare: girare la rotula invece di muovere la caviglia. Il peso si aumenta piano piano, giorno dopo giorno',
      base: { sw: 0, kr: 0, gh: 0 },
      keys: [
        { d: 2, s: 'Piega la caviglia di lato, col peso sopra', ss: 'Caviglia di lato, col peso', p: { sw: 1 }, k: 'gr' },
        { d: 3, s: 'Dall\'altra parte', p: { sw: -1 }, k: 'gr' },
        { d: 1.5, s: 'Torna al centro, ' + FREE, ss: 'Torna al centro', p: { sw: 0 }, k: 'no' },
        { d: 2, s: 'Non così: la rotula gira', p: { sw: 0.8, kr: 1, gh: 1 }, k: 'gr' },
        { d: 1.5, s: 'Torna al centro', p: { sw: 0, kr: 0, gh: 0 }, k: 'no' }
      ],
      main: 0, strip: [0, 1, 3],
      draw: function (P) {
        var o = [], g = [], cx = 88, Lc = [232, 112], k = 2.1, F0 = [cx + 24, 190], kc = 6 * P.kr, er = P.gh > 0.5, kn = [], up;
        var T2 = function (p) { return [Lc[0] + (p[0] - F0[0]) * k, Lc[1] + (p[1] - F0[1]) * k]; };
        g.push(L([14, 206], [164, 206], 0, 'g'));
        [-1, 1].forEach(function (s) {
          var f = foot43(s, P.sw, function (p) { return p; }, 1), H = [cx + s * 36 + 10 * P.sw, 12], K = add(mid(H, f.A, 0.58), [s * 3, 0]);
          g.push(G({ 'class': 'b' }, [L(H, K, 22), L(K, f.A, 12)]));
          g = g.concat(f.k);
          g.push(CI(add(K, [kc, 0]), 7.5, 'bf'), CI(add(K, [kc, 0]), 2.8, er ? 'fgr' : 'fbr'));
          kn.push(K);
          if (s > 0) up = unit(sub(K, f.A));
        });
        var fl = foot43(1, P.sw, T2, k), Ar = fl.A, yf = T2([0, 205])[1];
        g.push(L([cx + 40, 198], add(Lc, dir(150), 60), 0, 'ghost'));
        lensC(Lc, 60, g);
        var dd = sub(Ar, Lc), du = dd[0] * up[0] + dd[1] * up[1], ls = -du + Math.sqrt(du * du - dd[0] * dd[0] - dd[1] * dd[1] + 55 * 55);
        g.push(L([Lc[0] - 50, yf], [Lc[0] + 50, yf], 0, 'g'), L(Ar, add(Ar, up, ls), 19, 'b', { style: 'stroke-linecap:butt' }));
        g = g.concat(fl.k);
        g.push(AR(add(Ar, [34, -42]), add(Ar, [34, -12]), 'gr', 0.3 + 0.7 * Math.abs(P.sw)), TX(add(Ar, [40, -24]), 'peso', 't'));
        o = greyIf(er, g);
        kn.forEach(function (K) { o.push(CAR(add(K, [kc * 0.4, 5]), 17, 8, 160, 20, 'gr', P.kr)); });
        o.push(cross(add(kn[1], [26, -18]), 6, P.kr));
        o.push(TX([232, 24], er ? 'non così:' : 'rotule avanti,', 'tk', 'middle'), TX([232, 39], er ? 'la rotula gira' : 'il femore non ruota', 'tk', 'middle'));
        o.push(TX([232, 192], P.sw > 0.35 ? 'sul bordo esterno' : P.sw < -0.35 ? 'sul bordo interno' : 'la caviglia, di fronte', 't', 'middle'));
        o.push(TX([232, 208], 'più peso coi giorni', 't', 'middle'));
        return o;
      }
    });

    // E44 (N11), da vedere: dita piegate sotto e tallone alto (00-40-50). Piede di profilo che ruota sul dorso delle dita;
    // i cerchi sono un anello attorno alla tibia col pallino che gira
    var FT44 = [[132, -6], [134, 40], [131, 62], [123, 76], [126, 90], [141, 99], [167, 119], [183, 133], [184, 141], [178, 146],
      [188, 150], [204, 150], [213, 143], [213, 131], [204, 119], [172, 77], [166, 44], [166, -6]];
    var PV44 = [196, 150], RG44 = [150, 56];
    def({
      id: 'E44', q: 1, v: [300, 174], aria: 'Piede di profilo ingrandito, con le dita piegate sotto e il tallone alto: si porta un po\' di peso sopra le dita per creare pressione, non per allungare, mentre l\'altro piede a terra regge il resto; poi la caviglia disegna piccoli cerchi restando in equilibrio, e si rilascia. Il carico si aumenta nel tempo',
      base: { wt: 0 },
      keys: [
        { d: 2, s: 'Dita piegate sotto: porta il peso sopra', ss: 'Peso sulle dita', p: { wt: 1 }, k: 'gr' },
        { d: 4, s: 'Piccoli cerchi, sempre in equilibrio', ss: 'Piccoli cerchi', p: {}, k: 'gr', os: 1 },
        { d: 1.5, s: 'Rilascia, ' + FREE, ss: 'Rilascia', p: { wt: 0 }, k: 'no' }
      ],
      main: 0, strip: [0, 1, 2],
      draw: function (P, c) {
        var o = [], u = c.u, cw = c.k.os ? cl(Math.min(5 * u, 5 * (1 - u)), 0, 1) : 0, ph = 4 * Math.PI * u;
        var a0 = 4 * P.wt, a = a0 + 7 * cw * Math.cos(ph), T = function (p) { return add(PV44, rot(sub(p, PV44), a)); };
        var rg = add(PV44, rot(sub(RG44, PV44), a0));
        o.push(L([20, 150], [280, 150], 0, 'g'));
        o.push(PA(smooth(FT44.map(T), true), 'bf'), PA(qd(T([209, 126]), T([195, 130]), T([184, 141])), 'b', { 'stroke-width': 2 }));
        o.push(E('ellipse', { cx: f1(rg[0]), cy: f1(rg[1]), rx: 24, ry: 7, 'class': 'ghost', opacity: f1(cw) }));
        o.push(CI(add(rg, [17 * Math.cos(ph), 7 * Math.sin(ph)]), 4.5, 'fgr', op(cw)), TX([118, 44], 'piccoli cerchi', 't', 'end', op(cw)));
        // in 00-40-50 l'altro piede è piatto a terra: regge lui quasi tutto il peso, sulle dita ne va solo una parte
        o.push(AR([196, 4], [196, 40], 'gr', 0.25 + 0.75 * P.wt), TX([204, 24], 'un po\' di peso', 't'));
        o.push(TX([12, 118], 'l\'altro piede', 't'), TX([12, 132], 'regge il resto', 't'));
        o.push(TX([222, 136], 'dita piegate', 'tk'), TX([222, 150], 'sotto', 'tk'), TX([114, 86], 'tallone alto', 't', 'end'));
        o.push(TX([150, 168], 'pressione sulle dita, non allungamento', 't', 'middle'));
        return o;
      }
    });

    // supino, braccia incrociate sul petto (T13, E45, E46): mano su un punto del petto, che segue il tronco
    function onChest(s, off) { return function (P) { return torso(P).pt(s, off, 1); }; }
    var AXN = { p: onChest(0.88, 6), b: 1, k1: 0.91, k2: 0.91, w: 200 }, AXF = { p: onChest(0.84, 9), b: 1, k1: 0.91, k2: 0.86, w: 200 };
    var SUPX = poseOf(SUP, { pb: 0, pc: 0, eye: 0, an: AXN, af: AXF });

    // T13 (N12) — test del collo: testa su 10 secondi
    def({
      id: 'T13', q: 1, v: [320, 112, 30], aria: 'Test di profilo, supini a ginocchia piegate e braccia incrociate sul petto: con la lingua sul palato si solleva la testa di pochi centimetri e la si tiene su 10 secondi respirando dal naso, poi la si poggia e ci si chiede se ci sono stati fatica, fastidio o dolore. Se il collo fa male dopo pochi secondi, è debole',
      base: poseOf(SUPX, { tg: 0 }),
      keys: [
        { d: 1.5, s: 'Lingua sul palato', p: { tg: 1 }, k: 'gr' },
        { d: 1.5, s: 'Testa su, pochi centimetri', ss: 'Testa su', p: { nk: 36 }, k: 'gr' },
        { d: 2.5, s: 'Tieni 10 secondi e respira', ss: 'Tieni 10 s, respira dal naso', n: 1, p: { pb: 0.8, pc: 0.4 } },
        { d: 2.5, s: 'Tieni 10 secondi e respira', n: 1, p: { pb: 0, pc: 0 } },
        { d: 2.5, s: 'Tieni 10 secondi e respira', n: 1, p: { pb: 0.8, pc: 0.4 } },
        { d: 2.5, s: 'Tieni 10 secondi e respira', n: 1, p: { pb: 0, pc: 0 } },
        { d: 1.5, s: 'Poggia la testa', ss: 'Poggia', p: { nk: 18, tg: 0 }, k: 'gr' },
        { d: 2.5, s: 'Fatica? Fastidio? Dolore?', ss: 'Fatica, fastidio, dolore?', p: {}, k: 'no', vis: 'io' }
      ],
      arrows: ['pb'], nose: 1, main: 2, strip: [1, 2, 7], pre: supFloor,
      post: function (P, c, o, J) {
        var v = vis(c);
        o.push(TX([62, 56], 'lingua sul palato', P.tg > 0.5 ? 'tk' : 't', 'middle'));
        o.push(TX([214, 46], 'dolore dopo pochi secondi:', 't', 'middle', op(v)), TX([214, 60], 'il collo è debole', 't', 'middle', op(v)));
      }
    });

    // E45 (N13) — collo contro gravità. Di profilo il sì e l'avanti-indietro; il no e Totò nella lente (la testa dall'alto)
    var X45 = 60, NK45 = 40;
    function head45(hc, rad, th, al, o) { // viso su una sfera girata di th (no) e piegata di al (sì)
      function pr(lo, la, rr) {
        var x = Math.sin(lo * R) * Math.cos(la * R), y = Math.sin(la * R), z = Math.cos(lo * R) * Math.cos(la * R);
        var y1 = y * Math.cos(al * R) + z * Math.sin(al * R), z1 = z * Math.cos(al * R) - y * Math.sin(al * R);
        var x2 = x * Math.cos(th * R) + z1 * Math.sin(th * R), z2 = z1 * Math.cos(th * R) - x * Math.sin(th * R);
        return { p: [hc[0] + rr * rad * x2, hc[1] - rr * rad * y1], z: z2 };
      }
      var ears = [pr(-90, 0, 0.98), pr(90, 0, 0.98)];
      ears.forEach(function (e) { if (e.z < 0) o.push(CI(e.p, 5, 'bf')); });
      o.push(CI(hc, rad, 'bf'));
      ears.forEach(function (e) { if (e.z >= 0) o.push(CI(e.p, 5, 'bf')); });
      [-30, 30].forEach(function (lo) { var q = pr(lo, 14, 1); if (q.z > 0.2) o.push(CI(q.p, 2.4, 'b', { style: 'fill:currentColor', 'stroke-width': 0 })); });
      var nb = pr(0, -4, 1), nt = pr(0, -10, 1.28), m0 = pr(-16, -40, 1), m1 = pr(16, -40, 1);
      if (nb.z > 0) o.push(L(nb.p, nt.p, 3.5));
      if (m0.z > 0 && m1.z > 0) o.push(L(m0.p, m1.p, 2.5));
    }
    var A45 = {
      id: 'E45', q: 1, v: [360, 150], aria: 'Figura supina a ginocchia piegate e braccia incrociate sul petto, con la testa sollevata per tutto l\'esercizio, bocca chiusa e lingua sul palato; accanto, la testa vista dall\'alto. Cinque no girando a destra e a sinistra, cinque avanti e indietro, cinque sì (mento avanti e sguardo su, poi mento dentro e sguardo giù), cinque Totò traslando la testa a sinistra e a destra; poi si poggia la testa',
      base: poseOf(SUPX, { hu: 0, x: SUP.x + X45, ln: { p: [254 + X45, GF - 6], b: -1, f: -6 }, lf: { p: [257 + X45, GF - 6], b: -1, f: -6 } }),
      keys: [
        { d: 1.5, s: 'Lingua sul palato, su la testa', ss: 'Su la testa', p: { nk: NK45, hu: 1 }, k: 'gr' },
        { d: 6, s: '5 no: gira a destra e a sinistra', ss: '5 no', p: {}, k: 'gr', os: 'no' },
        { d: 6, s: '5 avanti e indietro', p: {}, k: 'gr', os: 'pg' },
        { d: 7, s: '5 sì: guarda su, poi schiaccia il mento', ss: '5 sì', p: {}, k: 'gr', os: 'si', sx: -1 },
        { d: 6, s: '5 Totò: trasla a sinistra e a destra', ss: '5 Totò', p: {}, k: 'gr', os: 'tt' },
        { d: 1.5, s: 'Poggia la testa', ss: 'Poggia', p: { nk: 18, hu: 0 }, k: 'no' }
      ],
      main: 0, strip: [1, 2, 3, 4],
      pre: function (P, c, o, J) {
        floor(360, GF, o);
        if (c.k.os !== 'pg') return; // avanti e indietro: la testa trasla lungo il viso
        var v = J.face, d = 6 * wave(c, 5), a;
        J.H = add(J.H, v, d);
        J.head.forEach(function (e) { a = e.a; ['', 1, 2].forEach(function (i) { if (a['x' + i] != null) { a['x' + i] = f1(a['x' + i] + v[0] * d); a['y' + i] = f1(a['y' + i] + v[1] * d); } }); if (a.cx != null) { a.cx = f1(a.cx + v[0] * d); a.cy = f1(a.cy + v[1] * d); } });
      },
      post: function (P, c, o, J) {
        var os = c.k.os, up = P.hu, b = add(J.H, J.face, -HR - 1);
        o.push(CI(b, 4, 'fgr', op(up)), TX([b[0] + 4, GF + 16], 'testa sempre su, non appoggiare', 't', 'middle', op(up)));
        if (os === 'pg') o.push(AR2(add(J.H, J.face, HR + 6), add(J.H, J.face, HR + 24), 'gr'));
        if (os === 'si') o.push(CAR(J.H, HR + 9, HR + 9, -150, -40, 'gr'));
        o.push(TX([350, 24], 'naso, bocca chiusa,', 't', 'end'), TX([350, 38], 'lingua sul palato', 't', 'end'));
      }
    };
    A45.draw = (function (side) {
      return function (P, c) {
        var os = c.k.os, w = os ? wave(c, 5) : 0, Q = os === 'si' ? shallow(P, { nk: P.nk - 10 * w }) : P;
        var o = side(Q, c), Lc = [54, 68], tt = os === 'tt' ? 9 * w : 0, hc = [Lc[0] + tt, 58], g = [];
        g.push(L(add(c.J.H, [-14, -4]), add(Lc, dir(20), 46), 0, 'ghost'));
        lensC(Lc, 46, g);
        g.push(PA('M24 104Q28 88 46 86L62 86Q80 88 84 104', 'b', { 'stroke-width': 4 }));
        g.push(L([48, 87], [hc[0] - 6, hc[1] + 17], 4), L([60, 87], [hc[0] + 6, hc[1] + 17], 4));
        head45(hc, 20 * (1 + (os === 'pg' ? 0.06 * w : 0)), os === 'no' ? 40 * w : 0, os === 'si' ? 20 * w : 0, g);
        var v = os ? Math.cos(2 * Math.PI * 5 * c.u) : 0;
        if (os === 'no') g.push(CAR([hc[0], 29], 16, 5, v >= 0 ? 200 : 340, v >= 0 ? 340 : 200, 'gr'));
        if (os === 'tt') g.push(AR2([Lc[0] - 22, 31], [Lc[0] + 22, 31], 'gr'));
        if (os === 'si') g.push(AR2([88, 46], [88, 70], 'gr'));
        o.push(G({}, g), TX([54, 14], 'la testa vista dall\'alto', 't', 'middle'));
        if (os) o.push(TX([112, 30], rep(c, 5), 'tk'));
        return o;
      };
    })(sideFig(A45));
    def(A45);

    // E46 (N14) — ponte di testa, poi coi gomiti. Tronco in due tratti: lombare a terra, dorsale su; testa giù, in estensione
    var UP46 = { t2: 191, cu2: 3, nk: -13 }, DN46 = { t2: 180, cu2: 0, nk: 18 };
    // gomito di lato al tronco: braccio di scorcio (k1); avambraccio in su, pugno chiuso
    var EL46 = { an: { p: [127, 87], b: 1, k1: 0.75, k2: 1, w: 270 }, af: { p: [130, 87], b: 1, k1: 0.75, k2: 1, w: 270 } };
    var HOLD46 = 'Tieni e respira col cilindro';
    def({
      id: 'E46', q: 1, v: [320, 132, 24], aria: 'Figura supina a ginocchia piegate e braccia incrociate: la testa e il bacino spingono sul pavimento e le spalle si staccano di poco; si tiene respirando col cilindro e si molla. Poi coi gomiti a terra e gli avambracci in su, pugni chiusi: spingono testa e gomiti, le spalle si staccano e le scapole lavorano; si tiene respirando e si molla',
      base: poseOf(SUPX, { t2: 180, cu2: 0 }),
      keys: [
        { d: 2, s: 'Testa e bacino spingono: le spalle si staccano', ss: 'Testa e bacino spingono', p: UP46, k: 'gr' },
        { d: 2.5, s: HOLD46, ss: 'Tieni, respira a cilindro', n: 1, p: { pb: 0.7, pc: 0.8 } },
        { d: 2.5, s: HOLD46, n: 1, p: { pb: 0, pc: 0 } },
        { d: 2, s: 'Molla, poi gomiti a terra', ss: 'Molla, gomiti a terra', p: shallow(DN46, EL46), k: 'no' },
        { d: 2, s: 'Gomiti e testa spingono: su le spalle', ss: 'Coi gomiti: su le spalle', p: UP46, k: 'gr' },
        { d: 2.5, s: 'Tieni, scapole attive: respira col cilindro', ss: 'Tieni, scapole attive', n: 1, p: { pb: 0.7, pc: 0.8 } },
        { d: 2.5, s: 'Tieni, scapole attive: respira col cilindro', n: 1, p: { pb: 0, pc: 0 } },
        { d: 2, s: 'Molla', p: shallow(DN46, { an: AXN, af: AXF }), k: 'no' }
      ],
      arrows: ['pb'], nose: 1, main: 1, strip: [1, 3, 5], pre: supFloor,
      post: function (P, c, o, J) {
        var up = cl((P.t2 - 180) / 11, 0, 1), el = cl((P.an.w - 200) / 70, 0, 1), to = J.to;
        under(J.H[0], up, o); under(to.P[0] - 4, up, o); under(J.an.E[0], up * el, o);
        o.push(TX([J.H[0], GF + 26], 'testa', 't', 'middle', op(up)), TX([to.P[0] - 10, GF + 26], 'bacino', 't', 'start', op(up)));
        o.push(TX([J.an.E[0] + 10, GF + 26], 'gomiti', 't', 'end', op(up * el)));
        var sc = [to.pt(0.7, -1, -1), to.pt(0.8, -1, -1), to.pt(0.9, -1, -1)];
        o.push(PA(smooth(sc), 'gr', ext(op(up * el), { 'stroke-width': 4 })));
      }
    });

    // E47 (N15 = M1) — plank di testa. In ginocchio sugli avambracci, testa a terra, poi via le mani: appoggi testa e
    // ginocchia. Il ginocchio resta in K47 e il bacino gli gira attorno
    var K47 = [220, 123];
    function hip47(a) { var p = add(K47, dir(a), TH); return { x: p[0], y: p[1] }; }
    var LG47 = { ln: { p: [276, 122], b: 1, f: 0 }, lf: { p: [279, 122], b: 1, f: 0 } };
    var HD47 = { an: { p: [154, 124], b: -1, w: 180 }, af: { p: [157, 124], b: -1, w: 180 } };
    var BACK47 = { an: { p: function (P) { return torso(P).pt(0.14, 4, -1); }, b: -1, w: 0 }, af: { p: function (P) { return torso(P).pt(0.1, 4, -1); }, b: -1, w: 0 } };
    var PL0 = shallow(hip47(-60), { m: -1, t: 170, cu: 0, nk: 30, pb: 0 }), PL1 = shallow(hip47(-80), { t: 158.1, cu: -2, nk: 23 });
    def({
      id: 'E47', q: 1, v: [320, 158], aria: 'Figura in ginocchio di profilo, esercizio facoltativo e avanzato: dagli avambracci a terra si punta la testa sul pavimento con la parte alta della fronte, poi si tolgono le mani e la schiena si arrotonda; il peso sta solo su testa e ginocchia. Si tiene pochi secondi, poi mani a terra e giù',
      base: shallow(shallow(PL0, LG47), HD47),
      keys: [
        { d: 2, s: 'Punta la testa: in alto sulla fronte', ss: 'Punta la testa', p: PL1, k: 'gr' },
        { d: 2, s: 'Spingi con la testa: via le mani', ss: 'Via le mani', p: shallow({ cu: -12, nk: 7.5 }, BACK47), k: 'gr' },
        { d: 3, s: 'Tieni: appoggi solo testa e ginocchia', ss: 'Tieni: testa e ginocchia', p: {}, k: 'gr' },
        { d: 2, s: 'Mani a terra, torna giù', ss: 'Mani a terra, giù', p: shallow(PL0, HD47), k: 'gr' },
        { d: 1.5, s: 'Riposa, ' + FREE, ss: 'Riposa', p: {}, k: 'no' }
      ],
      main: 2, strip: [0, 2, 3],
      pre: function (P, c, o) { floor(320, GF, o); },
      post: function (P, c, o, J) {
        var on = cl((170 - P.t) / 11.9, 0, 1), hold = cl(-(P.cu + 2) / 10, 0, 1), top = [J.H[0], J.H[1] + HR];
        o.push(CI(top, 4, 'fgr', op(on)), TX(add(top, [-20, -26]), 'in alto sulla fronte', 't', 'end', op(on)));
        under(J.H[0], hold, o); under(K47[0], hold, o);
        o.push(TX([J.H[0], GF + 26], 'testa', 't', 'middle', op(hold)), TX([K47[0], GF + 26], 'ginocchia', 't', 'middle', op(hold)));
        o.push(TX([12, 24], 'facoltativo e avanzato: solo se te la senti', 't'));
      }
    });

    // E48 (N16 = M2) — polsi in quadrupedia, il gomito che gira; lente: il braccio da davanti. Il bacino gira attorno al
    // ginocchio KQ; la spalla sta a 80 dal bacino e a 81,8 dal polso (braccia tese)
    var KQ = [104, 134], WQ = [188, 136];
    function quad48(a) {
      var P = add(KQ, dir(a), TH), d = len(sub(WQ, P)), A = (6400 - 6691 + d * d) / (2 * d), h = Math.sqrt(6400 - A * A);
      var u = unit(sub(WQ, P)), sa = add(add(P, u, A), [u[1], -u[0]], h);
      return { x: P[0], y: P[1], t: ang(sub(sa, P)), ld: (a + 108) / 26 };
    }
    var LT48 = quad48(-108), HV48 = quad48(-82);
    def({
      id: 'E48', q: 1, v: [360, 160], aria: 'Figura a quattro zampe di profilo, braccia tese e mani ferme a terra con le dita in avanti; accanto, il braccio visto da davanti. Il gomito ruota in avanti e indietro: la piega del gomito guarda avanti, poi indietro. Prima col peso sulle gambe, poi portando più peso sulle braccia, con le spalle sopra i polsi',
      base: shallow(QUAD, shallow(LT48, { ln: { p: [48, 134], b: -1, f: 182 }, lf: { p: [51, 134], b: -1, f: 182 },
        an: { p: WQ, b: 1, w: 0 }, af: { p: [191, 136], b: 1, w: 0 } })),
      keys: [
        { d: 6, s: 'Gomito avanti, gomito indietro: uno, due', ss: 'Gomito avanti e indietro', p: {}, k: 'gr', os: 3 },
        { d: 2, s: 'Più peso sulle braccia', ss: 'Più peso sulle braccia', p: HV48, k: 'gr' },
        { d: 4, s: 'Ancora avanti e indietro, col peso', ss: 'Col peso: avanti, indietro', p: {}, k: 'gr', os: 2, sx: -1 },
        { d: 2, s: 'Torna sulle gambe, ' + FREE, ss: 'Torna sulle gambe', p: LT48, k: 'no' }
      ],
      main: 0, strip: [0, 1, 2],
      pre: function (P, c, o) { floor(360, GQ, o); },
      post: function (P, c, o, J) {
        var os = c.k.os, w = os ? wave(c, os) : 0, v = os ? Math.cos(2 * Math.PI * os * c.u) : 0, ld = cl(P.ld, 0, 1);
        var Lc = [298, 78], g = [], E0 = J.an.E, au = unit(sub(J.an.Wr, J.sa)), fw = [au[1], -au[0]];
        o.push(CI(add(E0, fw, 5 * w), 3.2, 'fgr', op(Math.abs(w))));
        o.push(TX([12, 24], ld < 0.5 ? 'se sei debole,' : 'più peso sulle braccia:', 'tk'), TX([12, 38], ld < 0.5 ? 'peso sulle gambe' : 'spalle sopra i polsi', 't'));
        g.push(L(E0, add(Lc, dir(180), 56), 0, 'ghost'));
        lensC(Lc, 56, g);
        g.push(L([Lc[0] - 31, 125], [Lc[0] + 31, 125], 0, 'g'));
        var x = Lc[0], fi = 90 * (1 - w), sn = Math.sin(fi * R), cs = Math.cos(fi * R);
        g.push(rrect([x, 50], 24, 52, 0, 'bf', 11), rrect([x, 96], 20, 44, 0, 'bf', 9));
        g.push(PA(pth([[x - 9, 114], [x - 15, 123], [x + 15, 123], [x + 9, 114]], true), 'bf'));
        [-11, -5.5, 0, 5.5, 11].forEach(function (dx) { g.push(CI([x + dx, 123], 2.6, 'bf')); });
        if (cs > 0.05) g.push(PA(qd([x - 9 * sn - 8 * cs, 72], [x - 9 * sn, 79], [x - 9 * sn + 8 * cs, 72]), 'gr', ext(op(cs), { 'stroke-width': 3.5 })));
        if (cs < -0.05) g.push(CI([x + 9 * sn, 75], 3.4, 'b', { style: 'fill:currentColor', opacity: f1(-cs * 100) / 100, 'stroke-width': 0 }));
        if (os) g.push(CAR([x, 83], 20, 6, v >= 0 ? 160 : 20, v >= 0 ? 20 : 160, 'gr'));
        o.push(G({}, g));
        o.push(TX([Lc[0], 14], 'il braccio da davanti', 't', 'middle'));
        o.push(TX([354, 154], w > 0.3 ? 'la piega guarda avanti' : w < -0.3 ? 'la piega guarda indietro' : 'la mano non si muove', 't', 'end'));
      }
    });

    // E49 (N17 = M3), da vedere: le dita si sollevano col palmo a terra. Mano di profilo dal lato del pollice: avambraccio
    // e palmo in un contorno, dita e pollice tubi a falangi; gli estensori stanno sul lato davanti dell'avambraccio
    var AH49 = [[80, -12], [82, 110], [86, 152], [88, 172], [97, 184], [150, 184], [170, 184], [177, 178],
      [172, 170], [146, 167], [118, 160], [111, 134], [110, 60], [112, -12]];
    function tube(pts, w, o) { o.push(PL(pts, w + 5, 'b'), PL(pts, w, 'b', { style: 'stroke:var(--surface-2)' })); }
    function finger(b, a, ls, o) { var p = [b]; ls.forEach(function (l, i) { b = add(b, dir(a + 3 * i), l); p.push(b); }); tube(p, 8, o); }
    def({
      id: 'E49', q: 1, v: [300, 206], aria: 'Mano e avambraccio di profilo, ingranditi: braccio teso e palmo a terra, le dita si sollevano e si riappoggiano 5–6 volte, poi restano su 10 secondi; lavorano gli estensori, sul lato dell\'avambraccio che guarda le dita. Se le dita non salgono è normale. Le braccia restano tese: piegarle è un inganno',
      base: { fu: 0 },
      keys: [
        { d: 8, s: 'Dita su, dita giù: 5–6 volte', ss: 'Dita su, il palmo resta giù', p: {}, k: 'gr', os: 1 },
        { d: 1, s: 'Poi tieni le dita su: 10 secondi', ss: 'Tieni su 10 s', n: 1, p: { fu: 1 }, k: 'gr' },
        { d: 9, s: 'Poi tieni le dita su: 10 secondi', n: 1, p: {}, k: 'gr' },
        { d: 1.5, s: 'Rilascia, ' + FREE, ss: 'Rilascia', p: { fu: 0 }, k: 'no' },
        { d: 2.5, s: 'Braccia tese: flesse è un inganno', ss: 'Braccia tese, non flesse', p: {}, k: 'gr', vis: 'io' }
      ],
      main: 2, strip: [0, 2, 4],
      draw: function (P, c) {
        var o = [], lift = c.k.os ? pulse(c, 5) : P.fu, a = -34 * lift, v = vis(c);
        o.push(L([16, 184], [290, 184], 0, 'g'));
        var bk = [];
        finger([165, 171], a, [27, 18, 14], bk);
        o.push(G(op(0.5), bk));
        finger([170, 176], a, [24, 16, 12], o);
        o.push(PA(smooth(AH49, true), 'bf'));
        finger([124, 175], 3, [20, 15], o);
        o.push(AR([122, 150], [122, 76], 'gr', 0.25 + 0.75 * lift), TX([130, 104], 'estensori', 'tk', 'start', op(0.4 + 0.6 * lift)));
        o.push(TX([200, 200], 'il palmo resta giù', 't', 'middle'), TX([70, 30], 'braccio', 't', 'end'), TX([70, 44], 'teso', 't', 'end'));
        if (c.k.os) o.push(TX([244, 140], rep(c, 5), 'tk'));
        o.push(TX([290, 24], 'se non salgono, è normale', 't', 'end', op(1 - v)));
        var g = [L([198, 104], [294, 104], 0, 'g')];
        g.push(PL([[214, 20], [214, 60], [214, 98], [226, 100]], 5, 'b'), TX([218, 120], 'tese', 't', 'middle'));
        g.push(PL([[270, 44], [254, 70], [270, 98], [282, 100]], 0, 'ghost'), cross([282, 60], 5), TX([266, 120], 'flesse: no', 't', 'middle'));
        o.push(G(op(v), g));
        return o;
      }
    });
  })();
  /* ======================= FINE BLOCCO B ======================= */

  /* ======================= LEZIONE 6 — BLOCCO C: routine dei polsi e gatto-mucca ======================= */
  (function () {
    // E50–E56 (L6, schede M4–M10). Quadrupedia di profilo come E26: ginocchia e piedi fermi, la coscia ruota sul
    // ginocchio (th) e la spalla sta fra bacino e polso, così le braccia restano tese e le mani non si muovono.
    // Braccio vicino e mano sono disegnati qui, perché la mano cambia forma (piatta, girata, pugno, nocche, dita).
    // A destra una lente con le due mani viste dall'alto: avanti è a destra come nel profilo, la mano vicina (la
    // destra) è in basso. Respiro libero (regola della mobilità): riposo grigio, movimento ocra.
    var KQ = [90, GQ - 6], AQ = [34, GQ - 6], WQ = 166, LC = [298, 74], LR = 58, LG = { p: AQ, b: -1, f: 182 };
    var FY = [-5.5, -1.8, 1.8, 5.5], FL = [11, 12, 11, 8.5], HS = { style: 'stroke:var(--surface)' };
    var LB = { th: 0, wy: 0, dn: 0, eo: 0, hr: 0, tp: 0, fi: 0, pu: 0, kn: 0, tc: 0, er: 0 };
    function rig(P) { // posa intera da th, polso (wy, tp) e braccio accorciato (dn)
      var hip = add(KQ, dir(P.th - 90), TH), W = [WQ + P.tp, GQ - 3 - P.wy - 7 * P.tp], la = (P.la || 81.9) - 30 * P.dn;
      var d = sub(W, hip), dl = len(d), u = unit(d), a = (6400 - la * la + dl * dl) / (2 * dl);
      var sa = add(add(hip, u, a), [u[1], -u[0]], Math.sqrt(Math.max(0, 6400 - a * a)));
      return shallow(P, { x: hip[0], y: hip[1], t: ang(sub(sa, hip)), ln: LG, lf: LG, W: W });
    }
    function blob(c, w, h) { return E('rect', { x: f1(c[0] - w / 2), y: f1(c[1] - h / 2), width: w, height: h, rx: 4, 'class': 'b', style: 'fill:currentColor' }); }
    function arm(P, J, o) { // braccio vicino con l'alone; coi gomiti in fuori (eo) il gomito si vede di scorcio
      var s = J.sa, d = sub(P.W, s), dl = cl(len(d), 20, UA + FA - 0.01), u = unit(d), c = Math.cos(P.hr * R), tp = P.tp;
      var a = (UA * UA - FA * FA + dl * dl) / (2 * dl), e = add(add(s, u, a), rot(u, 90), Math.sqrt(Math.max(0, UA * UA - a * a)) * (1 - 0.8 * P.eo));
      var w = add(s, u, dl), h = P.kn > 0.5 ? blob([w[0] + 1, GQ - 7], 10, 13) : P.fi > 0.5 ? blob([w[0] + 5.5, GQ - 6.5], 13, 11) : // pugni appoggiati a terra
        PL([w, add(w, [6 * c + 0.5 * tp, 3 * tp]), [w[0] + 11 * c - tp + 0.1, GQ - 3]], WHA);
      o.push(L(mid(s, e, 0.45), e, WUA + 5, 'b', HS), L(e, w, WFA + 5, 'b', HS), L(s, e, WUA), L(e, w, WFA), h);
      J.E = e; J.W = w; J.Wt = [w[0] + 11 * c - tp + 0.1, GQ - 3]; // polso e punta della mano, per la pelle di Quiver
    }
    function hand(p, a, s, P, z) { // mano dall'alto: polso in p, dita verso a (gradi), s 1 la destra (in basso), -1 la sinistra
      var k = [], up = P.pu > 0.5, tp = P.tp, i;
      z = z || 1.15;
      if (P.kn > 0.5) { // pugno sulle nocche: si vede il dorso, le nocche toccano terra
        k.push(E('rect', { x: 1, y: -7.5, width: 15, height: 15, rx: 4, 'class': 'bf' }));
        for (i = 0; i < 4; i++) k.push(CI([13.5, FY[i] * 1.05], 2.3, 'fgr'));
      } else if (P.fi > 0.5) {
        k.push(E('rect', { x: 0, y: -8, width: 20, height: 16, rx: 5, 'class': 'bf' }));
        if (up) { for (i = 0; i < 4; i++) k.push(L([12, FY[i]], [18, FY[i]], 3)); k.push(L([3, -8], [13, -1], 3.6)); } // sul dorso: dita chiuse e pollice di traverso
        else { for (i = 0; i < 4; i++) k.push(CI([19.5, FY[i]], 2.4, 'bf')); k.push(L([4, -8.5], [15, -9.5], 3.6)); } // palmo giù: le nocche
      } else {
        k.push(E('rect', { x: 0, y: -8, width: 17, height: 16, rx: 5, 'class': 'bf' }));
        for (i = 0; i < 4; i++) { var q = [16 + FL[i] * (1 - 0.4 * tp), FY[i]]; k.push(L([16, FY[i]], q, 3.4)); if (tp) k.push(CI(add(q, [1.5, 0]), 2.4, 'fgr', op(tp))); }
        if (up) k.push(PA('M4 -5 Q8 3 15 4', 'b', { 'stroke-width': 1.5 })); // palmo in su: una piega
        k.push(L([3, -7], add([3, -7], dir(-40 + 85 * P.tc), 11), 3.6, P.tc > 0.5 ? 'gr' : 'b', P.tc > 0.5 ? { 'stroke-dasharray': '3 2' } : null));
      }
      return G({ transform: 'translate(' + M(p) + ') rotate(' + f1(a) + ') scale(' + z + ' ' + z * s * (up ? -1 : 1) + ')' }, k);
    }
    function dot(p, o) { fore(p, [[0, 0]], o); } // il braccio verticale visto dall'alto
    function fore(p, pts, o) { // il braccio visto dall'alto: dal polso verso gomito e spalla (un punto se è verticale)
      var q = [p].concat(pts.map(function (v) { return add(p, v); }));
      q[q.length - 1] = add(q[q.length - 1], [0.1, 0]);
      o.push(PL(q, 13, 'b', HS), PL(q, 8));
    }
    function lens(P, o, lab) { // cerchio, linea dalla mano del profilo, scritte (lab: una o due righe)
      o.push(L(add(P.W, [12, -6]), add(LC, dir(160), LR), 0, 'ghost'), CI(LC, LR, 'b', { 'stroke-width': 2, style: 'stroke:var(--line-strong)' }));
      o.push(TX([LC[0], LC[1] - LR - 5], 'le mani, dall\'alto', 't', 'middle'));
      lab.split('|').forEach(function (s, i) { o.push(TX([LC[0], LC[1] + LR + 16 + 14 * i], s, i ? 't' : 'tk', 'middle')); });
    }
    function flr(P, c, o) { o.push(L([8, GQ], [238, GQ], 0, 'g')); }
    function qdef(A, pre) { // quadrupedia: ogni posa passa dal rig; il braccio vicino va fra tronco e gamba vicina
      var side;
      A.q = 1; A.base = shallow(LB, A.base); A.pre = A.pre || flr;
      A.mid = function (P, c, o, J) { var g = []; arm(P, J, g); o.push(G({ 'class': 'qg-corpo' }, g)); };
      side = sideFig(A);
      A.draw = function (P, c) { return side(rig(pre ? pre(P, c) : P), c); };
      def(A);
    }
    function dx(J, P) { return J.sa[0] - P.W[0]; } // quanto la spalla sta oltre il polso

    // E50 (M4) — polsi su angoli diversi: il peso va avanti, a destra, a sinistra, indietro, poi cerchi
    qdef({
      id: 'E50', v: [360, 166], aria: 'Figura a quattro zampe di profilo, braccia tese, con una lente sulle due mani viste dall\'alto, dita in avanti: senza spostare le mani il peso va avanti oltre i polsi, poi a destra, a sinistra e indietro, e infine disegna dei cerchi. Nella lente un pallino segue il peso',
      base: { fx: 0, fy: 0 },
      keys: [
        { d: 1.5, s: 'Braccia tese, respira libero dal naso', ss: 'Braccia tese', p: { fx: 0, fy: 0 }, k: 'no' },
        { d: 1.5, s: 'Peso avanti, oltre i polsi', ss: 'Avanti', p: { fx: 1 } },
        { d: 1.5, s: 'Peso a destra', ss: 'Destra', p: { fx: 0, fy: 1 } },
        { d: 1.5, s: 'Peso a sinistra', ss: 'Sinistra', p: { fy: -1 } },
        { d: 1.5, s: 'Peso indietro', ss: 'Indietro', p: { fx: -1, fy: 0 } },
        { d: 3, s: 'Disegna dei cerchi col peso', ss: 'Cerchi', p: {}, circ: 1, e: 'l' }
      ],
      main: 1, strip: [1, 2, 5],
      post: function (P, c, o, J) {
        var y0 = LC[1];
        o.push(TX([LC[0] - 4, y0 - 38], 'sinistra', 't', 'middle', op(0.5 + 0.5 * cl(-P.fy, 0, 1))), TX([LC[0] - 4, y0 + 47], 'destra', 't', 'middle', op(0.5 + 0.5 * cl(P.fy, 0, 1))));
        [-1, 1].forEach(function (s) { var p = [LC[0] - 20, y0 + 20 * s]; o.push(hand(p, 0, s, P)); dot(p, o); });
        if (c.k && c.k.circ) o.push(E('ellipse', { cx: LC[0], cy: y0, rx: 17, ry: 17, 'class': 'gr dash' }));
        o.push(CI([LC[0] + 17 * P.fx, y0 + 17 * P.fy], 6, 'fgr'));
        var r = Math.abs(P.fx) + Math.abs(P.fy) < 0.4 ? 'peso al centro' : c.k && c.k.circ ? 'cerchi col peso' : Math.abs(P.fx) > Math.abs(P.fy) ? (P.fx > 0 ? 'peso avanti' : 'peso indietro') : P.fy > 0 ? 'peso a destra' : 'peso a sinistra';
        lens(P, o, r);
      }
    }, function (P, c) {
      var q = c.k && c.k.circ ? { fx: -Math.cos(2 * Math.PI * c.u), fy: -Math.sin(2 * Math.PI * c.u) } : {};
      q = shallow(P, q);
      q.th = 13 * q.fx;
      return q;
    });

    // E51 (M5) — allungamento dei flessori: mani girate di 180°, dita verso le ginocchia, seduto indietro
    qdef({
      id: 'E51', v: [360, 166], aria: 'Figura a quattro zampe di profilo con una lente sulle mani viste dall\'alto: le mani girano di 180 gradi finché le dita guardano le ginocchia, poi a braccia tese il bacino va indietro verso i talloni e si allunga l\'interno dell\'avambraccio; si tiene respirando libero, poi si molla',
      keys: [
        { d: 2, s: 'Gira le mani: dita verso le ginocchia', ss: 'Gira le mani', p: { hr: 180 } },
        { d: 3, s: 'Braccia tese, siediti indietro', ss: 'Braccia tese, siediti indietro', p: { th: -52 } },
        { d: 6, s: 'Tieni, respira libero dal naso', ss: 'Tieni 20–30 s', n: 1, p: {}, k: 'no' },
        { d: 2, s: 'Molla: torna avanti, gira le mani', ss: 'Molla', p: { th: 0, hr: 0 } }
      ],
      main: 2, strip: [0, 1, 2],
      post: function (P, c, o, J) {
        [-1, 1].forEach(function (s) { var p = [LC[0], LC[1] + 20 * s]; o.push(hand(p, s * P.hr, s, P)); dot(p, o); });
        o.push(TX([12, 24], 'braccia tese', 't'));
        lens(P, o, P.hr > 120 ? 'dita verso|le ginocchia' : P.hr > 60 ? 'gira le mani' : 'dita avanti');
      }
    });

    // E52 (M6) — allungamento a pugni chiusi, dorso a terra; non ci si siede indietro
    qdef({
      id: 'E52', v: [360, 166], base: { rq: 0 }, aria: 'Figura a quattro zampe di profilo con una lente sulle mani viste dall\'alto: chiude forte i pugni e li appoggia a terra sul dorso, braccia tese; tiene senza aprire le dita e senza sedersi indietro, respirando libero, poi rilassa',
      keys: [
        { d: 1.5, s: 'Chiudi forte i pugni', ss: 'Chiudi forte i pugni', p: { fi: 1, wy: 4 } },
        { d: 2, s: 'Pugni a terra sul dorso, braccia tese', ss: 'Pugni sul dorso, braccia tese', p: { pu: 1 } },
        { d: 6, s: 'Tieni, pugni chiusi: respira libero dal naso', ss: 'Tieni, resta qua 20–30 s', n: 1, p: { rq: 1 }, k: 'no', vis: 'in' },
        { d: 2, s: 'Rilassa', p: { fi: 0, pu: 0, wy: 0, rq: 0 } }
      ],
      main: 2, strip: [0, 1, 2],
      post: function (P, c, o, J) {
        var v = c.k.vis ? vis(c) : P.rq, h = J.to.P; // «resta qua» compare nella tenuta e sfuma rilassando
        o.push(G(op(v), [AR(add(h, [-12, 6]), add(h, [-44, 34]), 'gr'), cross(add(h, [-28, 20]), 6), TX([12, 24], 'resta qua:', 'tk'), TX([12, 38], 'non sederti indietro', 't')]));
        [-1, 1].forEach(function (s) { var p = [LC[0] - 18, LC[1] + 20 * s]; o.push(hand(p, 0, s, P)); dot(p, o); });
        lens(P, o, P.fi < 0.5 ? 'mani aperte' : P.pu > 0.5 ? 'pugni sul dorso|non aprire le dita' : 'pugni chiusi, forte');
      }
    });

    // E53 (M7, da vedere) — pollice chiuso sotto la mano, il gomito ruota avanti e indietro (come E48)
    var E53A = 'Pollice chiuso: gomito avanti', E53I = 'Pollice chiuso: gomito indietro';
    qdef({
      id: 'E53', v: [360, 166], aria: 'Figura a quattro zampe di profilo con una lente sulle mani viste dall\'alto: il pollice si chiude sotto la mano e resta chiuso mentre il gomito ruota avanti e indietro, con la mano ferma; si guarda dove ci si blocca, poi si rilascia',
      keys: [
        { d: 2, s: 'Chiudi il pollice sotto la mano', ss: 'Chiudi il pollice', p: { tc: 1 } },
        { d: 1.5, s: E53A, ss: 'Gomito avanti', p: { er: 1 } },
        { d: 1.5, s: E53I, ss: 'Gomito indietro', p: { er: -1 } },
        { d: 1.5, s: E53A, p: { er: 1 } },
        { d: 1.5, s: E53I, p: { er: -1 } },
        { d: 2, s: 'Dove ti blocchi? Rilascia, respira libero dal naso', ss: 'Rilascia', p: { er: 0, tc: 0 }, k: 'no' }
      ],
      main: 1, strip: [0, 1, 2],
      post: function (P, c, o, J) {
        var e = J.E, r = Math.abs(P.er);
        o.push(CAR(add(e, [0, 1]), 13, 5, P.er > 0 ? 160 : 20, P.er > 0 ? 20 : 160, 'gr', r));
        o.push(TX(add(e, [-14, -6]), P.er < 0 ? 'indietro' : 'avanti', 't', 'end', op(r)));
        [-1, 1].forEach(function (s) {
          var p = [LC[0] - 20, LC[1] + 20 * s], a = s * (90 * P.er - 90);
          o.push(hand(p, 0, s, P), CI(p, 5, 'b', { 'stroke-width': 2.5, style: 'fill:var(--surface)' }), L(add(p, dir(a), 3), add(p, dir(a), 12), 3.5, 'gr', op(r)));
        });
        lens(P, o, P.tc < 0.5 ? 'pollice libero' : r > 0.3 ? 'pollice chiuso|gomito ' + (P.er > 0 ? 'avanti' : 'indietro') : 'pollice chiuso|sotto la mano');
      }
    });

    // E54 (M8, da vedere) — spinte a palmi giù con le dita in dentro, poi sulle nocche, gomiti in fuori.
    // Biomeccanica: prima era sul dorso delle mani (palmi in su), da «spingo sui dorsi» (0:56:03). Ma in 00-56-00 e
    // 00-56-15 i pollici stanno dalla parte del corpo (palmi giù), in chat si parla di «flessioni sul palmo» (W 28/10)
    // e «rinforzare il dorsi» è quasi certamente «i polsi». Spinte col polso piegato del tutto sotto il peso sono un
    // carico rischioso per un principiante: si torna alla lettura più probabile, palmi a terra (da vedere a video)
    var E54D = 'Giù coi gomiti, in fuori';
    qdef({
      id: 'E54', v: [360, 166], aria: 'Figura a quattro zampe di profilo con una lente sulle mani viste dall\'alto: le mani stanno a terra coi palmi giù e le dita verso l\'interno; si scende piegando i gomiti in fuori e si risale spingendo sulle mani. Poi a pugni chiusi, sulle nocche, la stessa cosa',
      base: { pu: 0, hr: 90 },
      keys: [
        { d: 1.5, s: 'Palmi a terra, dita in dentro, braccia tese', ss: 'Palmi a terra, dita in dentro', p: {}, k: 'no' },
        { d: 2, s: E54D, ss: E54D, p: { dn: 1, eo: 1 } },
        { d: 2, s: 'Spingi sulle mani e risali', ss: 'Spingi sulle mani', p: { dn: 0, eo: 0 }, push: 1 },
        { d: 1.5, s: 'Ora chiudi i pugni: sulle nocche', ss: 'Sulle nocche', p: { kn: 1, wy: 9 } },
        { d: 2, s: E54D, ss: 'Sulle nocche: giù, gomiti in fuori', p: { dn: 1, eo: 1 } },
        { d: 2, s: 'Spingi sulle nocche e risali', ss: 'Spingi sulle nocche', p: { dn: 0, eo: 0 }, push: 1 },
        { d: 1.5, s: 'Apri i pugni, palmi a terra', ss: 'Di nuovo palmi a terra', p: { kn: 0, wy: 0 }, k: 'no' }
      ],
      main: 1, strip: [0, 1, 4],
      post: function (P, c, o, J) {
        var e = J.E, pu = c.k.push ? Math.sin(Math.PI * c.u) : 0;
        o.push(AR([P.W[0] - 26, GQ - 26], [P.W[0] - 26, GQ - 4], 'gr', pu)); // spingi: la mano preme a terra
        [-1, 1].forEach(function (s) {
          var p = [LC[0] - 4, LC[1] + 33 * s];
          o.push(hand(p, -90 * s, s, P, 1));
          fore(p, [[(e[0] - P.W[0]) * 0.6, s * 16 * P.dn]], o);
        });
        lens(P, o, (P.kn > 0.5 ? 'sulle nocche|' : 'palmi a terra|') + (P.dn > 0.3 ? 'gomiti in fuori' : P.kn > 0.5 ? 'pugni chiusi' : 'dita in dentro'));
      }
    });

    // E55 (M9, da vedere) — finger push-up a braccia tese: sali sulle dita e scendi
    qdef({
      id: 'E55', v: [360, 166], aria: 'Figura a quattro zampe di profilo con una lente sulle mani viste dall\'alto: a braccia tese porta il peso sulle braccia e sale sulla punta delle dita staccando il palmo da terra, poi riscende',
      keys: [
        { d: 1.5, s: 'Palmi a terra, braccia tese: respira libero dal naso', ss: 'Palmi a terra, braccia tese', p: { tp: 0, th: 0 }, k: 'no' },
        { d: 1.5, s: 'Peso sulle braccia: sali sulle dita', ss: 'Sali sulle dita', p: { tp: 1, th: 6 } },
        { d: 1.5, s: 'Giù, il palmo torna a terra', ss: 'Giù', p: { tp: 0, th: 0 } }
      ],
      main: 1, strip: [0, 1],
      post: function (P, c, o, J) {
        [-1, 1].forEach(function (s) { var p = [LC[0] - 18, LC[1] + 20 * s]; o.push(hand(p, 0, s, P)); dot(p, o); });
        o.push(TX([12, 24], 'braccia tese,', 't'), TX([12, 38], 'se riesci', 't'));
        lens(P, o, P.tp > 0.5 ? 'sulle dita|il palmo si stacca' : 'palmo a terra');
      }
    });

    // E56 (M10) — gatto-mucca: chiudo e butto fuori, apro e inspiro (D14, 1:17:14)
    qdef({
      id: 'E56', v: [280, 152], aria: 'Figura a quattro zampe di profilo: nel gatto la schiena si arrotonda e la testa scende espirando; nella mucca il petto va avanti, la schiena si incava e la testa sale inspirando',
      base: { cu: 0, nk: 14, la: 80 },
      keys: [
        { d: 3, s: 'Gatto: schiena tonda, testa giù, espira', ss: 'Gatto: schiena tonda, espira', p: { cu: -15, nk: 46 }, air: -1 },
        { d: 3, s: 'Mucca: petto avanti, testa su, inspira', ss: 'Mucca: petto avanti, inspira', p: { cu: 12, nk: -26 }, air: 1 }
      ],
      nose: 1, main: 1,
      pre: function (P, c, o) { o.push(L([8, GQ], [272, GQ], 0, 'g')); },
      post: function (P, c, o, J) {
        var g = cl(-P.cu / 15, 0, 1), m = cl(P.cu / 12, 0, 1), b = J.to.pt(0.5, 10, -1);
        o.push(TX([b[0], b[1] - 8], 'gatto', 'tk', 'middle', op(g)), TX([b[0], b[1] - 4], 'mucca', 'tk', 'middle', op(m)));
      }
    });
  })();
  /* ======================= FINE BLOCCO C ======================= */

  /* ======================= LEZIONE 6 — BLOCCO D: anche a 90/90, piedi e il muro ======================= */
  (function () {
    // ---------- 90/90 (E57–E62, T14): piccolo modello 3D proiettato, una sola vista per tutto il gruppo ----------
    // X avanti (dove guarda il busto), Y su, Z verso chi guarda (il fianco destro). Gamba davanti = la sinistra:
    // coscia in avanti, tibia di traverso verso chi guarda. Gamba dietro = la destra: coscia di lato verso chi
    // guarda, tibia indietro. Si guarda da destra, un po' da davanti e dall'alto: si vede la «svastica» delle gambe
    // a terra, si vedono i piedi che si alzano e il busto che scende in avanti.
    var CA = Math.cos(-45 * R), SA = Math.sin(-45 * R), CE = Math.cos(50 * R), SE = Math.sin(50 * R), OX = 150, OY = 112, O3 = [0, 0, 0]; // da -45° e 50° in su
    function pj9(p) { var w = -p[0] * SA + p[2] * CA; return [OX + p[0] * CA + p[2] * SA, OY - p[1] * CE + w * SE]; }
    function a3(p, v, k) { if (k == null) k = 1; return [p[0] + v[0] * k, p[1] + v[1] * k, p[2] + v[2] * k]; }
    function s3(p, q) { return [p[0] - q[0], p[1] - q[1], p[2] - q[2]]; }
    function d3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function u3(v) { var l = Math.sqrt(d3(v, v)) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
    function m3(p, q, t) { return a3(p, s3(q, p), t == null ? 0.5 : t); }
    function rv(v, ax, a) { return rot3(v, O3, ax, a); }
    function ik3(S0, T, L1, L2, pole) { // due ossa nello spazio: il gomito va dalla parte di pole
      var v = s3(T, S0), d = cl(Math.sqrt(d3(v, v)), Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.01), u = u3(v);
      var q = u3(a3(pole, u, -d3(pole, u))), ca = cl((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
      return [a3(S0, a3(a3(O3, u, ca * L1), q, Math.sqrt(1 - ca * ca) * L1)), a3(S0, u, d)];
    }
    function tdir(h, l) { var sh = Math.sin(h * R), ch = Math.cos(h * R); return [sh, ch * Math.cos(l * R), -ch * Math.sin(l * R)]; }
    var HY = 10, HW = 9;
    // posa: h busto in avanti, l busto inclinato verso la gamba davanti, ro schiena tonda, hn testa giù (gradi);
    // fL/bL tutta la gamba su, fF/bF solo il piede su (la tibia gira attorno alla coscia, il ginocchio resta a terra);
    // px tutto il corpo avanti (E58), nh l'anca vicina che si muove (E57), kc il ginocchio davanti spostato (E58)
    function body9(P) {
      var l = P.l || 0, x0 = P.px || 0, J = {};
      J.side = [0, Math.sin(l * R), Math.cos(l * R)];
      J.d = tdir(P.h || 0, l);
      J.Hf = [x0, HY, -HW]; J.Hn = a3([x0, HY, HW], P.nh || O3); J.P = m3(J.Hn, J.Hf);
      J.S = a3([x0, HY, 0], J.d, LT);
      var nb = u3([J.side[1] * J.d[2] - J.side[2] * J.d[1], J.side[2] * J.d[0] - J.side[0] * J.d[2], J.side[0] * J.d[1] - J.side[1] * J.d[0]]);
      J.C = a3(m3(J.P, J.S), nb, P.ro || 0); // nb: dalla parte della schiena
      J.H = a3(J.S, tdir((P.h || 0) + (P.hn || 0), l), LN);
      var a = rv(u3([1, -0.08, 0]), [0, 0, 1], P.fL || 0), K = a3(J.Hf, a, TH);
      if (P.kc) { K = a3(J.Hf, u3(s3(a3(K, P.kc), J.Hf)), TH); a = u3(s3(K, J.Hf)); }
      var s = rv(u3(a3([0, 0, 1], a, -a[2])), a, -(P.fF || 0));
      J.a = a; J.s = s; J.Kf = K; J.Af = a3(K, s, SH); J.Tf = a3(a3(J.Af, s, 15), a, 6);
      var b = rv(u3([0, -0.08, 1]), [1, 0, 0], -(P.bL || 0)), t = rv([-1, 0, 0], b, -(P.bF || 0));
      J.b = b; J.t = t; J.Kn = a3([0, HY, HW], b, TH); J.An = a3(J.Kn, t, SH); J.Tn = a3(a3(J.An, t, 15), b, 4);
      return J;
    }
    function L9(p, q, w, cls, x) { return L(pj9(p), pj9(q), w, cls, x); }
    function H9(p, q, w) { return L9(p, q, w + 5, 'b', { style: 'stroke:var(--surface)' }); }
    // dove va una mano: p polso, e verso del gomito, h verso delle dita (s = 1 braccio vicino, -1 lontano)
    function A_TH(J, s) { return s > 0 ? { p: a3(m3(J.Hn, J.Kn, 0.6), [0, 8, 0]), e: [-0.3, 0.4, 1], h: a3(J.b, [0, -0.3, 0]) } : { p: a3(m3(J.Hf, J.Kf, 0.52), [0, 8, 0]), e: [-0.3, 0.4, -1], h: a3(J.a, [0, -0.3, 0]) }; }
    function A_WA(J, s) { return { p: a3(a3(J.P, J.d, 17), J.side, 12 * s), e: [-0.9, 0, s], h: [0.25, -1, 0] }; }
    function A_FL() { return { p: [-4, 9, -50], e: [-1, 0, -0.3], h: [0.6, -0.5, -0.25] }; }
    function A_BF(J) { return { p: a3(m3(J.An, J.Tn, 0.3), [0, 7, 0]), e: [0.2, 0.6, 1], h: J.t }; }
    function A_BK() { return { p: [-46, 9, -26], e: [-1, 0, -0.5], h: [0.6, -0.5, -0.3] }; }
    function A_FW(J, s) { return { p: [140, 6, 13 * s], e: [0.2, -0.7, 0.6 * s], h: [1, -0.25, 0] }; }
    function arm9(J, s, list, w) {
      var p = O3, e = O3, h = O3, tw = 0;
      for (var i = 0; i < list.length; i++) {
        var k = w ? w[i] || 0 : 1, q;
        if (k < 0.001) continue;
        q = list[i](J, s); p = a3(p, q.p, k); e = a3(e, q.e, k); h = a3(h, u3(q.h), k); tw += k;
      }
      p = a3(O3, p, 1 / tw);
      var sh = a3(a3(J.S, J.d, -7), J.side, 13 * s), r = ik3(sh, p, UA, FA, e);
      return [sh, r[0], r[1], a3(r[1], u3(h), HA)];
    }
    function limb9(q, halo) {
      var k = [L9(q[0], q[1], WUA), L9(q[1], q[2], WFA), L9(q[2], q[3], WHA)];
      return halo ? [H9(m3(q[0], q[1], 0.45), q[1], WUA), H9(q[1], q[2], WFA), H9(q[2], q[3], WHA)].concat(k) : k;
    }
    function ring9(c, e1, e2, r, a0, a1, n) {
      var p = [];
      for (var i = 0; i <= n; i++) { var x = (a0 + (a1 - a0) * i / n) * R; p.push(pj9(a3(a3(c, e1, r * Math.sin(x)), e2, -r * Math.cos(x)))); }
      return p;
    }
    function arrowPath(q, kind, o, x) { // percorso 2D con la punta in fondo
      var n = q.length, tip = q[n - 1], u = unit(sub(tip, q[n - 2])), nn = [-u[1], u[0]];
      q = q.slice(); q[n - 1] = add(tip, u, -5);
      return G(o == null ? {} : op(o), [PA(smooth(q), kind || 'gr', x), PA(pth([tip, add(add(tip, u, -7.5), nn, 4), add(add(tip, u, -7.5), nn, -4)], true), kind === 'br' ? 'fbr' : 'fgr')]);
    }
    var MAT9 = [[-88, 0, -60], [150, 0, -60], [150, 0, 92], [-88, 0, 92]];
    function ghostLegs9(P, o) { // la gamba a riposo, tratteggiata, sotto quella che si alza
      var lf = Math.max(P.fL || 0, P.fF || 0), lb = Math.max(P.bL || 0, P.bF || 0);
      if (lf < 1 && lb < 1) return;
      var J0 = body9(shallow(P, { fL: 0, fF: 0, bL: 0, bF: 0, kc: null }));
      if (lf >= 1) o.push(PL([P.fL ? J0.Hf : J0.Kf, J0.Kf, J0.Af, J0.Tf].map(pj9), 0, 'ghost', op(cl(lf / 15, 0, 1))));
      if (lb >= 1) o.push(PL([P.bL ? J0.Hn : J0.Kn, J0.Kn, J0.An, J0.Tn].map(pj9), 0, 'ghost', op(cl(lb / 15, 0, 1))));
    }
    function draw9(cfg) {
      return function (P, c) {
        if (cfg.mod) { P = shallow(P, {}); cfg.mod(P, c); }
        var J = body9(P), o = [];
        c.J = J;
        o.push(PA(pth(MAT9.map(pj9), true), 'mat'));
        ghostLegs9(P, o);
        if (cfg.pre) cfg.pre(P, c, o, J);
        var af = arm9(J, -1, cfg.af, P.fW), an = arm9(J, 1, cfg.an, P.nW);
        J.an = an; J.af = af;
        o.push(G({ opacity: 0.4, 'class': 'b' }, limb9(af)));
        o.push(G({ 'class': 'b' }, [L9(J.Hf, J.Kf, WTH), L9(J.Kf, J.Af, WSH), L9(J.Af, J.Tf, WFT)]));
        o.push(G({ 'class': 'b' }, [PA(qd(pj9(J.P), pj9(J.C), pj9(J.S)), 'b', { 'stroke-width': WT }), CI(pj9(J.H), HR, 'b', { 'stroke-width': 5 })]));
        o.push(G({ 'class': 'b' }, [H9(J.Hn, J.Kn, WTH), L9(J.Hn, J.Kn, WTH), L9(J.Kn, J.An, WSH), L9(J.An, J.Tn, WFT)]));
        o.push(G({ 'class': 'b' }, limb9(an, 1)));
        if (cfg.post) cfg.post(P, c, o, J, an, af);
        return o;
      };
    }
    var B9 = { h: 0, l: 0, ro: 0, hn: 0, fL: 0, fF: 0, bL: 0, bF: 0, nW: [1, 0, 0], fW: [1, 0] };
    var B9S = poseOf(B9, { l: 12, nW: [0, 1, 0], fW: [0, 1] }); // appoggiato su una mano, l'altra sul fianco
    function tag9(o, p, s, cls, anchor, ov) { o.push(TX(p, s, cls || 't', anchor, ov == null ? null : op(ov))); }

    // E57 — seduto a 90/90 e cerchi con l'anca (il tronco fermo)
    def({
      id: 'E57', q: 1, v: [300, 220], aria: 'Figura seduta a terra a 90/90 vista di lato e dall\'alto: gamba davanti piegata a 90 gradi con la tibia di traverso, gamba dietro piegata a 90 gradi di lato con la tibia indietro, schiena dritta. Con una mano sull\'anca, l\'anca disegna dei cerchi, avanti, su, indietro, mentre il tronco resta fermo; poi nell\'altro verso. Se gli ischi non arrivano a terra ci si appoggia con una mano, col busto dritto',
      base: B9,
      keys: [
        { d: 2, s: 'Seduto a 90/90, schiena dritta', ss: 'Seduto a 90/90', p: {}, k: 'no' },
        { d: 1, s: 'Mano sull\'anca', p: { nW: [0, 1, 0] }, k: 'gr' },
        { d: 5, s: 'Cerchi con l\'anca: il tronco non si muove', ss: 'Cerchi con l\'anca', p: {}, k: 'gr', cir: 1 },
        { d: 5, s: 'Cambia verso', p: {}, k: 'gr', cir: -1 },
        { d: 2.5, s: 'Gli ischi non arrivano? Una mano a terra, busto dritto', ss: 'Ischi su? Mano a terra', p: { l: 12, fW: [0, 1] }, k: 'no' }
      ],
      main: 2, strip: [0, 2, 4],
      draw: draw9({
        an: [A_TH, A_WA], af: [A_TH, A_FL],
        mod: function (P, c) { if (c.k.cir) { var f = c.k.cir * 720 * c.u * R; P.nh = [5 * Math.sin(f), 5 * (1 - Math.cos(f)), 0]; } },
        post: function (P, c, o, J) {
          var cc = [0, HY + 5, HW + 6], f = (c.k.cir || 1) * 720 * c.u, v = c.k.cir ? 1 : 0;
          if (v) {
            o.push(G({}, [PA(smooth(ring9(cc, [1, 0, 0], [0, 1, 0], 15, 0, 360, 16), true), 'gr dash', op(0.8))]));
            o.push(arrowPath(ring9(cc, [1, 0, 0], [0, 1, 0], 15, f - c.k.cir * 70, f, 6), 'gr'));
          }
          tag9(o, [214, 40], 'il tronco', 'tk', 'middle'); tag9(o, [214, 55], 'non si muove', 'tk', 'middle');
          tag9(o, [14, 214], '5 cerchi per verso', 't');
        }
      })
    });

    // E58 — cerchi col ginocchio sui tre piani (il pennarello sul ginocchio della gamba davanti, sollevata)
    var PL58 = [null, [[0, 0, 1], [0, 1, 0], 'frontale'], [[1, 0, 0], [0, 1, 0], 'sagittale'], [[1, 0, 0], [0, 0, 1], 'a terra']];
    def({
      id: 'E58', q: 1, v: [300, 220], aria: 'Figura seduta a 90/90 vista di lato e dall\'alto, appoggiata su una mano: solleva la gamba davanti e il ginocchio, come se avesse un pennarello, disegna un cerchio sul piano frontale, poi sul piano sagittale, avanti, su e indietro, poi parallelo al pavimento',
      base: B9S,
      keys: [
        { d: 1.5, s: 'Solleva tutta la gamba davanti', ss: 'Gamba davanti su', p: { fL: 16 }, k: 'gr' },
        { d: 3, s: 'Il ginocchio disegna un cerchio: piano frontale', ss: 'Piano frontale', p: {}, k: 'gr', pl: 1 },
        { d: 3, s: 'Piano sagittale: avanti, su, indietro', ss: 'Piano sagittale', p: {}, k: 'gr', pl: 2 },
        { d: 3, s: 'Cerchio sul pavimento: piano trasverso', ss: 'Piano a terra', p: {}, k: 'gr', pl: 3 },
        { d: 1.5, s: 'Giù la gamba, respira libero', ss: 'Giù la gamba', p: { fL: 0 }, k: 'no' }
      ],
      main: 1, strip: [1, 2, 3],
      draw: draw9({
        an: [A_TH, A_WA], af: [A_TH, A_FL],
        mod: function (P, c) {
          var q = PL58[c.k.pl || 0]; if (!q) return;
          var f = 360 * c.u * R, o = a3(a3(O3, q[0], 9 * Math.sin(f)), q[1], 9 * (1 - Math.cos(f)));
          P.px = o[0]; P.kc = [0, o[1], o[2]];
        },
        post: function (P, c, o, J) {
          var q = PL58[c.k.pl || 0];
          if (q) {
            var K0 = body9(shallow(P, { px: 0, kc: null })).Kf, cc = a3(K0, q[1], 9), f = 360 * c.u;
            o.push(PA(smooth(ring9(cc, q[0], q[1], 9, 0, 360, 16), true), 'gr dash'));
            o.push(arrowPath(ring9(cc, q[0], q[1], 9, f - 80, f, 6), 'gr'));
            o.push(CI(pj9(J.Kf), 4, 'fgr'));
            tag9(o, add(pj9(cc), [16, -18]), q[2], 'tk');
          }
          tag9(o, [14, 30], 'il pennarello', 't'); tag9(o, [14, 44], 'sul ginocchio', 't');
        }
      })
    });

    // E59 — stacco da seduti a 90/90: prima senza spinta, poi spingendo il ginocchio davanti a terra
    def({
      id: 'E59', q: 1, v: [300, 220], aria: 'Figura seduta a 90/90 vista di lato e dall\'alto, mani sui fianchi e staccate da terra: scende in avanti col petto verso il ginocchio davanti, schiena dritta, come in uno stacco rumeno, e risale. Poi rifà la discesa spingendo il ginocchio davanti a terra e risale con quella spinta: lavora il gluteo, non la schiena',
      base: poseOf(B9, { nW: [1], fW: [1], pk: 0, up: 0 }),
      keys: [
        { d: 1.5, s: 'Seduto dritto, mani staccate da terra', ss: 'Seduto dritto', p: {}, k: 'no', lab: 'senza spinta' },
        { d: 2.5, s: 'Scendi in avanti, come uno stacco', ss: 'Giù in avanti', p: { h: 40 }, k: 'gr', lab: 'senza spinta' },
        { d: 2, s: 'Risali', p: { h: 0 }, k: 'gr', lab: 'senza spinta' },
        { d: 2.5, s: 'Giù di nuovo: spingi il ginocchio davanti a terra', ss: 'Spingi il ginocchio a terra', p: { h: 40, pk: 1 }, k: 'gr', lab: 'con la spinta' },
        { d: 2.5, s: 'Risali spingendo: lavora il gluteo', ss: 'Risali spingendo', p: { h: 0, up: 1 }, k: 'gr', lab: 'con la spinta' }
      ],
      main: 3, strip: [1, 3, 4],
      draw: draw9({
        an: [A_WA], af: [A_WA],
        post: function (P, c, o, J) {
          // freccia e gluteo solo nelle fasi «con la spinta»: prima sfumavano durante «Seduto dritto», sotto la scritta
          // «senza spinta», e il primo fotogramma del ciclo diceva il contrario della fase
          var on = c.k.lab === 'con la spinta' ? 1 : 0, k = pj9(J.Kf), pk = (P.pk || 0) * on, up = (P.up || 0) * on;
          o.push(AR(add(k, [16, -34]), add(k, [16, -8]), 'gr', pk));
          o.push(TX(add(k, [24, -22]), 'spingi', 'tk', 'start', op(pk)), TX(add(k, [24, -8]), 'a terra', 't', 'start', op(pk)));
          var g = add(pj9(J.P), [-15, 0]); // il gluteo, dietro al bacino
          o.push(PA(qd(add(g, [-2, -10]), add(g, [-12, 2]), add(g, [2, 10])), 'gr', ext(op(up), { 'stroke-width': 3.5 })));
          o.push(TX(add(g, [-14, 4]), 'gluteo', 'tk', 'end', op(up)));
          tag9(o, [14, 30], c.k.lab || '', 'tk');
          tag9(o, [14, 214], '5 volte senza, 5 con la spinta', 't');
        }
      })
    });

    // T14 — prova: flessibile o mobile? Il piede della gamba dietro su con la mano, poi da solo
    function footArc(P, amax, cls, o, ov) { // dove arriva il piede dietro (la tibia gira attorno alla coscia)
      var J0 = body9(shallow(P, { bF: 0 })), p = [];
      for (var i = 0; i <= 8; i++) p.push(pj9(a3(J0.Kn, rv(J0.t, J0.b, -amax * i / 8), SH + 12)));
      o.push(G(op(ov), [PA(smooth(p), cls)]));
      return p[8];
    }
    def({
      id: 'T14', q: 1, v: [300, 220], aria: 'Prova seduti a 90/90 vista di lato e dall\'alto: inclinati indietro e appoggiati su una mano, con l\'altra mano si tira su il piede della gamba dietro tenendo il ginocchio a terra, ed è la flessibilità; poi lo si alza da solo, con la forza, ed è la mobilità. Più è piccola la differenza fra le due altezze, meglio è',
      base: poseOf(B9, { ap: 0, aa: 0 }),
      keys: [
        { d: 1.5, s: 'Appoggiati indietro, prendi il piede dietro', ss: 'Prendi il piede dietro', p: { h: -26, l: -17, nW: [0, 1, 0], fW: [0, 1] }, k: 'gr' },
        { d: 2, s: 'Con la mano tiralo su: è la flessibilità', ss: 'Con la mano: flessibilità', p: { bF: 55, ap: 1 }, k: 'gr' },
        { d: 1.5, s: 'Riportalo giù', p: { bF: 0 }, k: 'gr' },
        { d: 2, s: 'Ora alzalo da solo: è la mobilità', ss: 'Da solo: mobilità', p: { bF: 28, aa: 1, nW: [0, 0, 1] }, k: 'gr' },
        { d: 2.5, s: 'La differenza: più è piccola, meglio è', ss: 'La differenza', p: {}, k: 'no', dif: 1 },
        { d: 1.5, s: 'Giù, respira libero', ss: 'Giù', p: { bF: 0, h: 0, l: 0, nW: [1, 0, 0], fW: [1, 0], ap: 0, aa: 0 }, k: 'no' }
      ],
      main: 4, strip: [1, 3, 4],
      draw: draw9({
        an: [A_TH, A_BF, A_WA], af: [A_TH, A_BK],
        pre: function (P, c, o) {
          footArc(P, 55, 'ghost', o, P.ap); footArc(P, 28, 'gr', o, P.aa);
          if (c.k.dif) { // la differenza: la fascia fra le due altezze
            var J0 = body9(shallow(P, { bF: 0 })), q = [];
            for (var i = 0; i <= 6; i++) q.push(pj9(a3(J0.Kn, rv(J0.t, J0.b, -28 - 27 * i / 6), SH + 12)));
            o.push(PA(smooth(q), 'gr', { 'stroke-width': 9, opacity: 0.35 }));
          }
          o.push(L([16, 186], [40, 186], 0, 'ghost', op(0.35 + 0.65 * P.ap)), TX([48, 190], 'con la mano: flessibilità', 't', 'start', op(0.35 + 0.65 * P.ap)));
          o.push(L([16, 204], [40, 204], 0, 'gr', op(0.35 + 0.65 * P.aa)), TX([48, 208], 'da solo: mobilità', 'tk', 'start', op(0.35 + 0.65 * P.aa)));
        }
      })
    });

    // E60, E61: prima la gamba davanti, poi quella dietro: su, giù, su, tieni, molla
    function lift9(kf, kb, up, s1, ss, s2, hold) {
      var k = [];
      [[kf, 'Gamba davanti: ', 'Davanti: '], [kb, 'Gamba dietro: ', 'Dietro: ']].forEach(function (g) {
        var u = {}, z = {}; u[g[0]] = up; z[g[0]] = 0; // lg: quale gamba lavora, per la scritta dell'anca
        k.push({ d: 1.5, s: g[1] + s1, ss: g[2] + ss, p: u, k: 'gr', lg: g[0] }, { d: 1.5, s: 'Giù', p: z, k: 'gr', lg: g[0] }, { d: 1.5, s: 'Su', p: u, k: 'gr', lg: g[0] },
          { d: hold, s: s2, ss: 'Tieni ' + hold + ' s', p: {}, k: 'gr', n: 1, lg: g[0] }, { d: 1, s: 'Molla', p: z, k: 'no', lg: g[0] });
      });
      return k;
    }

    // E60 — forza a 90/90: il piede si alza come una sbarra, il ginocchio resta a terra
    var UP60 = 45;
    def({
      id: 'E60', q: 1, v: [300, 220], aria: 'Figura seduta a 90/90 vista di lato e dall\'alto, appoggiata su una mano e con l\'altra sul fianco: il piede della gamba davanti si alza col ginocchio a terra, come una sbarra, e riscende, poi resta su 6 secondi con la massima contrazione; poi lo stesso col piede della gamba dietro',
      base: B9S,
      keys: lift9('fF', 'bF', UP60, 'piede su, ginocchio a terra', 'piede su', 'Tieni: contrazione massima, respira', 6),
      main: 3, strip: [0, 3, 5, 8],
      draw: draw9({
        an: [A_TH, A_WA], af: [A_TH, A_FL],
        post: function (P, c, o, J) {
          var f = cl((P.fF || 0) / UP60, 0, 1), b = cl((P.bF || 0) / UP60, 0, 1), J0 = body9(shallow(P, { fF: 0, bF: 0 })), i, q;
          [[f, P.fF, J0.Kf, J0.s, J0.a], [b, P.bF, J0.Kn, J0.t, J0.b]].forEach(function (g) { // la sbarra: il piede gira attorno al ginocchio
            if (g[1] < 4) return;
            for (q = [], i = 0; i <= 6; i++) q.push(pj9(a3(g[2], rv(g[3], g[4], -g[1] * i / 6), SH + 16)));
            o.push(arrowPath(q, 'gr', cl(g[0] * 2, 0, 1)));
          });
          o.push(CI(pj9([J.Kf[0], 0, J.Kf[2]]), 4.5, 'fgr', op(0.3 + 0.7 * f)), CI(pj9([J.Kn[0], 0, J.Kn[2]]), 4.5, 'fgr', op(0.3 + 0.7 * b)));
          var kk = pj9(f > b ? [J.Kf[0], 0, J.Kf[2]] : [J.Kn[0], 0, J.Kn[2]]);
          tag9(o, [cl(kk[0] + (f > b ? 34 : 0), 64, 236), kk[1] + 22], 'ginocchio a terra', 't', 'middle', cl(Math.max(f, b) * 2, 0, 1));
          tag9(o, [14, 30], 'il piede si alza', 't'); tag9(o, [14, 44], 'come una sbarra', 't');
          // biomeccanica: col ginocchio fermo la tibia gira attorno alla coscia. Il piede davanti che sale porta l'anca
          // ancora più in fuori (extrarotazione), quello dietro più in dentro (intrarotazione): la scheda aveva ragione
          tag9(o, [14, 198], c.k.lg === 'bF' ? 'anca dietro: intrarotazione' : 'anca davanti: extrarotazione', 'tk');
          tag9(o, [14, 214], '5 volte su e giù, poi tieni', 't');
        }
      })
    });

    // E61 — «adduzione»: si solleva tutta la gamba, ginocchio compreso; prima davanti, poi dietro
    var UP61 = 24;
    def({
      id: 'E61', q: 1, v: [300, 220], aria: 'Figura seduta a 90/90 vista di lato e dall\'alto, appoggiata su una mano: la gamba davanti si solleva tutta da terra, ginocchio compreso, quattro volte, poi resta su 5 secondi; poi lo stesso con la gamba dietro',
      base: B9S,
      keys: lift9('fL', 'bL', UP61, 'solleva tutto, anche il ginocchio', 'su tutta', 'Tieni su, respira', 5),
      main: 3, strip: [0, 3, 5, 8],
      draw: draw9({
        an: [A_TH, A_WA], af: [A_TH, A_FL],
        post: function (P, c, o, J) {
          var J0 = body9(shallow(P, { fL: 0, bL: 0 }));
          [[P.fL, J0.Kf, J.Kf], [P.bL, J0.Kn, J.Kn]].forEach(function (g) {
            if (g[0] < 4) return;
            var k0 = add(pj9(g[1]), [15, 2]), k1 = add(pj9(g[2]), [15, -2]);
            o.push(AR(k0, k1, 'gr', cl(g[0] / 10, 0, 1)));
          });
          tag9(o, [14, 30], 'si alza tutta la gamba,', 't'); tag9(o, [14, 44], 'ginocchio compreso', 't');
          // biomeccanica: la coscia dietro, di lato, sale ruotando attorno all'asse avanti-indietro: è abduzione (il
          // fianco, medio gluteo), non adduzione; la coscia davanti sale attorno all'asse di traverso: flessione
          tag9(o, [14, 198], c.k.lg === 'bL' ? 'lavora il fianco (abduttori)' : 'lavora la piega dell\'anca', 'tk');
          tag9(o, [14, 214], '4 volte, poi tieni 5 s', 't');
        }
      })
    });

    // E62 — giù in avanti sulla gamba davanti (l'allungamento)
    def({
      id: 'E62', q: 1, v: [300, 220], aria: 'Figura seduta a 90/90 vista di lato e dall\'alto: dal busto dritto scende in avanti sopra la gamba davanti, appoggia gli avambracci a terra e porta la testa verso le braccia; resta qualche secondo respirando libero, poi risale e cambia lato',
      base: poseOf(B9, { nW: [1, 0], fW: [1, 0] }),
      keys: [
        { d: 1.5, s: 'Seduto a 90/90, busto dritto', ss: 'Busto dritto', p: {}, k: 'no' },
        { d: 3, s: 'Giù in avanti sulla gamba, avambracci a terra', ss: 'Giù in avanti', p: { h: 70, ro: 8, hn: 30, nW: [0, 1], fW: [0, 1] }, k: 'gr' },
        { d: 4, s: 'Resta qualche secondo, respira libero', ss: 'Resta qualche secondo', p: {}, k: 'no' },
        { d: 2, s: 'Risali, poi l\'altro lato', ss: 'Risali', p: { h: 0, ro: 0, hn: 0, nW: [1, 0], fW: [1, 0] }, k: 'gr' }
      ],
      main: 2, strip: [0, 2],
      draw: draw9({ an: [A_TH, A_FW], af: [A_TH, A_FW], post: function (P, c, o) { tag9(o, [14, 30], 'mi allungo', 't'); } })
    });

    // ---------- E63 — seduto sulle dita dei piedi puntate: profilo in ginocchio (come E31) e lente sul piede ----------
    // Il piede non si muove mai (dita piegate a terra, tallone su). Fra quattro zampe e seduto sui talloni il
    // ginocchio resta a terra: l'anca gira attorno al ginocchio (ka), così la gamba non passa sotto il pavimento.
    var G63 = 230, AK63 = [44, G63 - 15], P63 = [101, G63 - 66], K63 = ik(P63, AK63, TH, SH, -1)[0];
    var KA63 = ang(sub(P63, K63)) + 360, KC63 = 180 - Math.asin((G63 - 34 - K63[1]) / TH) / R;
    var FT63 = { b: -1, f: 96, tb: 82 }, HD63 = { an: { p: [186, G63 - 4], b: 1, w: 0 }, af: { p: [183, G63 - 4], b: 1, w: 0 } };
    var A63 = {
      id: 'E63', q: 1, v: [280, 245], aria: 'Figura di profilo a quattro zampe con le dita dei piedi puntate a terra: stacca le ginocchia e sale sulle dita, poi si siede indietro sui talloni con le dita sempre puntate e le mani sulle cosce, e respira; poi torna giù e lo rifà. Una lente mostra il piede: dita piegate a terra, tallone in alto, il peso sulle dita',
      base: shallow({ kw: 1, ka: KA63, x: P63[0], y: P63[1], t: -10.5, nk: 14, pb: 0, pc: 0, ln: shallow(FT63, { p: AK63 }), lf: shallow(FT63, { p: AK63 }) }, HD63),
      keys: [
        { d: 2, s: 'A quattro zampe, dita dei piedi puntate', ss: 'Dita dei piedi puntate', p: {}, k: 'gr' },
        { d: 2, s: 'Sali: ginocchia su, sulle dita', ss: 'Ginocchia su', p: { kw: 0, x: 80, y: G63 - 92, t: 10, nk: 28 }, k: 'gr' },
        { d: 2.5, s: 'Siediti indietro sui talloni', ss: 'Seduto sui talloni', p: { kw: 1, ka: KC63, t: -82, nk: 4, an: { p: [72, 196], b: 1, w: 20 }, af: { p: [69, 196], b: 1, w: 20 } }, k: 'gr' },
        { d: 4, s: 'Seduto sulle dita: inspira', ss: 'Respira', n: 1, p: { pb: 0.9, pc: 0.6 } },
        { d: 4, s: 'Seduto sulle dita: espira', ss: 'Espira', n: 1, p: { pb: 0, pc: 0 } },
        { d: 2, s: 'Torna giù e rifallo', ss: 'Torna giù, rifallo', p: shallow({ ka: KA63, x: P63[0], y: P63[1], t: -10.5, nk: 14 }, HD63), k: 'gr' }
      ],
      arrows: ['pb'], nose: 1, main: 3, strip: [0, 1, 2, 3],
      pre: function (P, c, o) { floor(280, G63, o); },
      post: function (P, c, o, J) {
        var ft = J.ln.ft, LC = [230, 54], sc = 2, w = P.kw < 0.5 ? 1 : 0.5;
        var tr = 'translate(' + f1(LC[0] - 44 * sc) + ' ' + f1(LC[1] - 218 * sc) + ') scale(' + sc + ')';
        o.push(CI(LC, 40, 'b', { 'stroke-width': 2, style: 'stroke:var(--line-strong)' }));
        o.push(G({ transform: tr }, [L([30, G63], [58, G63], 0, 'g'), G({ 'class': 'b' }, [L(mid(J.ln.K, J.ln.A, 0.75), J.ln.A, WSH), PL([ft.heel, ft.ball, ft.toe], WFT)])]));
        o.push(AR([LC[0] + 12, LC[1] - 10], [LC[0] + 12, LC[1] + 16], 'gr', w));
        o.push(TX([LC[0] - 46, 30], 'tallone su,', 't', 'end'), TX([LC[0] - 46, 44], 'dita piegate', 't', 'end')); // fuori dal giro della testa
        o.push(TX([274, 108], 'il peso', 'tk', 'end', op(0.4 + 0.6 * w)), TX([274, 121], 'sulle dita', 'tk', 'end', op(0.4 + 0.6 * w)));
        o.push(TX([12, 26], '2 volte', 't'));
      }
    };
    A63.draw = (function (side) { // anca attorno al ginocchio a terra (kw = 1) o libera (kw = 0)
      return function (P, c) {
        var h = add(K63, dir(P.ka), TH);
        return side(shallow(P, { x: P.x + (h[0] - P.x) * P.kw, y: P.y + (h[1] - P.y) * P.kw }), c);
      };
    })(sideFig(A63));
    def(A63);

    // ---------- E64 — al muro: torace e bacino allineati, poi fuori tutta l'aria (e la stessa cosa a terra) ----------
    // Due scene con la stessa posa: in piedi col muro dietro e supino col pavimento sotto (la posa ruotata di 90°).
    // Tronco in due tratti: lombare un po' avanti (ci passa la mano), dorsale che si arrotonda quando i gomiti vanno
    // avanti. Il bacino si sposta da solo finché sacro e dorso toccano il muro; la testa è inclinata quanto basta
    // perché la nuca lo tocchi. Le braccia sono risolte in 3D (gomiti avanti e in fuori) e viste di lato.
    var WX64 = 62, FY64 = 204;
    var SC64 = [
      { t: -90, n: [-1, 0], c: -WX64, x: WX64 + 10, y: GS - 100, hv: 14, ln: { p: [WX64 + 64, GS - 6], b: -1, f: 0 }, lf: { p: [WX64 + 61, GS - 6], b: -1, f: 0 } },
      { t: 180, n: [0, 1], c: FY64, x: 166, y: FY64 - 9, hv: -5, ln: { p: [246, FY64 - 6], b: -1, f: -6 }, lf: { p: [249, FY64 - 6], b: -1, f: -6 } }
    ];
    function onLine(p, g) { var e = p[0] * g.n[0] + p[1] * g.n[1] - g.c; return [p[0] - g.n[0] * e, p[1] - g.n[1] * e]; }
    function fade64(c) { var u = c.u == null ? 0.5 : c.u; return cl(Math.min(4 * u, 4 * (1 - u)), 0, 1); }
    function scene64(P, c, g, wallScene) {
      var o = [], pr = P.pr || 0, hc = P.hc || 0, i, q;
      var Q = { x: g.x, y: g.y, t: g.t, cu: 12, t2: g.t + 1 + 3 * pr, cu2: -3 - 7 * pr, nk: 0, ln: g.ln, lf: g.lf };
      var to = torso(Q), ex = -1e9, sd = 0.75, exd = -1e9;
      for (i = 0; i <= 24; i++) { q = to.pt(i / 24, 0, -1); ex = Math.max(ex, q[0] * g.n[0] + q[1] * g.n[1]); }
      Q.x += g.n[0] * (g.c - ex); Q.y += g.n[1] * (g.c - ex); // sacro e dorso appoggiati
      to = torso(Q);
      for (i = 12; i <= 24; i++) { q = to.pt(i / 24, 0, -1); q = q[0] * g.n[0] + q[1] * g.n[1]; if (q > exd) { exd = q; sd = i / 24; } }
      var v = cl((g.c - HR - 2.5 - (to.S[0] * g.n[0] + to.S[1] * g.n[1])) / LN, -1, 1); // la nuca tocca
      Q.nk = ((ang(g.n) + Math.acos(v) / R - ang(sub(to.S, to.C)) + 540) % 360) - 180;
      Q.pb = P.pb; Q.ps = P.ps;
      var J = body(Q); to = J.to; c.J = J;
      var u = to.U(0.1), nv = to.N(0.1), sa = add(J.sa, to.N(0.93), 5 * pr); // spalle che cadono avanti
      // braccia: polso nella piega dell'anca (hc) o lungo il corpo; gomito avanti e in fuori a 45°
      var crease = add(to.pt(0.02, 0, 1), u, -5), wr = mix(add(add(sa, u, -72), nv, g.hv), add(add(crease, u, 16), nv, 3), hc);
      var kp = hc, r = ik3([sa[0], sa[1], 13], [wr[0], wr[1], 13 - 3 * hc], UA, FA, [nv[0] * kp, nv[1] * kp, 0.8]);
      var E2 = [r[0][0], r[0][1]], W2 = [r[1][0], r[1][1]], hdv = unit(mix(unit(sub(W2, E2)), add(add([0, 0], u, -0.85), nv, 0.3), hc)), tip = add(W2, hdv, HA);
      var arm = [L(sa, E2, WUA), L(E2, W2, WFA), L(W2, tip, WHA)], hs = { style: 'stroke:var(--surface)' }, fo = add(add([0, 0], u, 1.5), nv, -2.5);
      // lo spazio sotto la lombare: ci passa la mano
      var bp = to.pt(0.27, 0, -1), lp = onLine(bp, g), gap = len(sub(lp, bp));
      if (wallScene) { floor(280, GS, o); wall(WX64, GS, 22, 1, o); } else o.push(L([8, FY64], [272, FY64], 0, 'g'));
      var hand = rrect(mid(bp, lp), 26, Math.max(gap - 1.5, 3), ang(u), 'ghost', 3);
      hand.a.style = 'fill:var(--ground-soft);stroke-dasharray:3 3;stroke-width:2';
      o.push(hand);
      o.push(G({ opacity: 0.4, 'class': 'b' }, [L(add(sa, fo), add(E2, fo), WUA), L(add(E2, fo), add(W2, fo), WFA), L(add(W2, fo), add(tip, fo), WHA)]));
      if (J.far.length) o.push(G({ opacity: 0.4 }, J.far));
      o.push(G({ 'class': 'b' }, J.tor.concat(J.head)));
      o.push(G({}, J.near));
      o.push(G({ 'class': 'b' }, [L(mid(sa, E2, 0.45), E2, WUA + 5, 'b', hs), L(E2, W2, WFA + 5, 'b', hs), L(W2, tip, WHA + 5, 'b', hs)].concat(arm)));
      // respiro: pancia avanti inspirando; espirando bocca aperta e addome duro
      if (P.pb > 0.03) { var a0 = to.pt(0.28, 3, 1); o.push(AR(a0, add(a0, to.N(0.28), 6 + 14 * P.pb), 'br', cl(P.pb, 0, 1))); }
      if (c.air > 0) nose(J, c, o);
      if (c.air < 0) {
        var mo = add(add(J.H, J.face, HR - 1), dir(J.hd), -6), mu = rot(J.face, 24), mn = [-mu[1], mu[0]], d = (c.time || 0) * -14;
        o.push(CI(mo, 3.6, 'bf', { 'stroke-width': 2.5 }));
        for (i = -1; i <= 1; i++) { var m0 = add(add(mo, mu, 7), mn, 4 * i); o.push(L(m0, add(m0, mu, 22 - 4 * Math.abs(i)), 2, 'br', { 'stroke-dasharray': '3 4', 'stroke-dashoffset': f1(d), opacity: 0.9 })); }
      }
      var ab = c.air < 0 ? P.ab : 0; // l'addome duro solo mentre si butta fuori
      [0.16, 0.34].forEach(function (s) { o.push(AR(to.pt(s, 26, 1), to.pt(s, 7, 1), 'gr', ab)); });
      o.push(TX(add(to.pt(0.25, 30, 1), wallScene ? [2, 4] : [0, -8]), 'addome duro', 'tk', wallScene ? 'start' : 'middle', op(ab)));
      // i tre appoggi e la mano sotto la lombare
      var cs = [onLine(to.pt(0.03, 0, -1), g), onLine(to.pt(sd, 0, -1), g), onLine(J.H, g)], nm = ['sacro', 'dorso', 'testa'];
      cs.forEach(function (p, k) {
        o.push(CI(p, 5, 'fgr', op(0.3 + 0.7 * P.ct)));
        o.push(TX(wallScene ? [p[0] - 14, p[1] + (k ? 4 : 16)] : [p[0], p[1] + 18], nm[k], 'tk', wallScene ? 'end' : 'middle', op(0.4 + 0.6 * P.ct)));
      });
      if (wallScene) o.push(TX([lp[0] - 14, lp[1] - 2], 'ci passa', 't', 'end'), TX([lp[0] - 14, lp[1] + 12], 'la mano', 't', 'end'));
      else o.push(TX([lp[0], lp[1] + 34], 'ci passa la mano', 't', 'middle'));
      if (wallScene) { // la corda: testa in alto, sacro in basso
        var ht = add(J.H, u, HR + 6), sb = add(to.pt(0, -4, -1), u, -8);
        o.push(AR(ht, add(ht, u, 20), 'gr', P.cy), AR(sb, add(sb, u, -22), 'gr', P.cy));
        o.push(TX(add(ht, [10, -4]), 'testa su', 't', 'start', op(P.cy)), TX([WX64 + 6, sb[1] + 58], 'sacro giù', 't', 'start', op(P.cy)));
        if (c.k.ch) o.push(TX(add(J.H, [HR + 10, 14]), 'mento dentro', 'tk', 'start', op(fade64(c))));
        if (c.k.el) o.push(TX(add(E2, [10, -4]), 'gomiti avanti', 'tk', 'start', op(fade64(c))));
      }
      return o;
    }
    def({
      id: 'E64', q: 1, v: [280, 290], aria: 'Figura di profilo in piedi con la schiena al muro, piedi un passo avanti e ginocchia piegate: sacro, dorso e nuca toccano il muro, mento in dentro, sotto la lombare passa una mano. Le mani vanno nella piega dell\'anca e i gomiti avanti, le scapole si allontanano. Inspira col cilindro gonfiando fianchi, pancia e schiena; poi a bocca aperta butta fuori tutta l\'aria finché l\'addome diventa duro. Cinque respiri, non di più. Poi la stessa cosa a terra, supino a ginocchia piegate',
      base: { vt: 0, ct: 0, cy: 0, hc: 0, pr: 0, pb: 0, ps: 0, ab: 0 },
      keys: [
        { d: 2.5, s: 'Al muro: sacro, dorso e testa; mento dentro', ss: 'Sacro, dorso e testa al muro', p: { ct: 1, cy: 1 }, k: 'gr', air: 0, ch: 1 },
        { d: 2.5, s: 'Mani nella piega dell\'anca, gomiti avanti', ss: 'Mani all\'anca, gomiti avanti', p: { cy: 0, hc: 1, pr: 1 }, k: 'gr', air: 0, el: 1 },
        { d: 4, s: 'Inspira col cilindro: fianchi, pancia, schiena', ss: 'Inspira col cilindro', n: 1, p: { pb: 1, ps: 0.45 }, air: 1 },
        { d: 3.5, s: 'Bocca aperta: fuori tutta l\'aria', ss: 'Bocca aperta: fuori l\'aria', g: 'fuori', n: 1, p: { pb: 0.15, ps: 0 }, air: -1 },
        { d: 2.5, s: 'Fino in fondo: l\'addome diventa duro', ss: 'L\'addome diventa duro', g: 'fuori', n: 1, p: { pb: 0, ab: 1 }, air: -1 },
        { d: 2, s: 'Anche a terra, da supino: stessa posizione', ss: 'Variante a terra', p: { vt: 1, ab: 0 }, k: 'no', air: 0, sw: 1 },
        { d: 4, s: 'A terra: inspira col cilindro', ss: 'A terra: inspira', n: 1, p: { pb: 1, ps: 0.45 }, air: 1 },
        { d: 5, s: 'Bocca aperta: fuori tutta l\'aria, addome duro', ss: 'Fuori l\'aria, addome duro', n: 1, p: { pb: 0, ps: 0, ab: 1 }, air: -1 },
        { d: 1, s: 'Di nuovo al muro', p: { vt: 0, ct: 0, hc: 0, pr: 0, ab: 0 }, k: 'no', air: 0, sw: -1 }
      ],
      main: 4, strip: [0, 1, 2, 4, 7],
      draw: function (P, c) { // cambio di scena: sw 1 dal muro a terra, -1 di nuovo al muro
        var x = c.k.sw ? (c.k.sw > 0 ? cl(c.u * 2.5, 0, 1) : 1 - cl(c.u * 1.6, 0, 1)) : (P.vt > 0.5 ? 1 : 0), o = [];
        if (x < 0.99) o.push(G(op(1 - x), scene64(P, c, SC64[0], 1)));
        if (x > 0.01) o.push(G(op(x), scene64(P, c, SC64[1], 0)));
        o.push(TX([270, 28], '5 respiri, non di più', 'tk', 'end'), TX([270, 43], 'ogni giorno', 't', 'end'));
        return o;
      }
    });
  })();
  /* ======================= FINE BLOCCO D ======================= */

  /* ======================= LEZIONE 7 — BLOCCO A: spalla a terra, supini a ginocchia piegate (E67–E71) ======================= */
  (function () {
    // E67–E71 (L7, spalla e scapola). Profilo per E67 ed E70 (come E25); dall'alto per E68, E69 ed E71 (aiuto top7, testa in alto),
    // con una lente di lato sull'avambraccio in E68 ed E69. Nessun numero di gradi nelle scritte.
    var DX = 26, V7 = [320, 134, 14], SP7 = poseOf(SUP, {
      x: SUP.x + DX, pb: 0, pc: 0, pp: 0, th: 0,
      ln: { p: [SUP.ln.p[0] + DX, SUP.ln.p[1]], b: -1, f: -6 }, lf: { p: [SUP.lf.p[0] + DX, SUP.lf.p[1]], b: -1, f: -6 }
    });
    function floorBr(J, P, o) { if (P.pb > 0.02) breathArrows(J, P, ['pb'], o); } // solo quando si respira: la schiena è sul pavimento

    // E67 (N5) — braccio teso oltre la testa, pollice a terra. Il pollice è segnato solo dove il braccio è a terra
    function A67(a, fr) { return { a: a + (fr ? 1.6 : 0), r: 82, b: 1 }; } // r oltre la lunghezza: l'IK lo tiene teso
    var DN67 = A67(3.4), UP67 = A67(-90), OV67 = A67(-183.4), DN67f = A67(3.4, 1), OV67f = A67(-183.4, 1);
    def({
      id: 'E67', q: 1, v: V7, aria: 'Figura supina a ginocchia piegate, di profilo: il braccio teso parte lungo il fianco col pollice verso il pavimento, sale verso il soffitto e passa oltre la testa fino a terra, oltre l\'orecchio, e il pollice torna a toccare il pavimento; poi scende. Prima un braccio, poi l\'altro, poi tutti e due insieme inspirando; lassù si resta 3–5 respiri e le spalle scendono un po\' di più',
      base: poseOf(SP7, { an: DN67, af: DN67f, th: 1 }),
      keys: [
        { d: 2, s: 'Braccio teso, pollice verso il pavimento', ss: 'Pollice verso il pavimento', p: {}, k: 'no' },
        { d: 2.5, s: 'Sali col braccio teso', ss: 'Sali teso', p: { an: UP67, th: 0 }, k: 'gr' },
        { d: 2.5, s: 'Oltre la testa, fino a terra', ss: 'Oltre la testa, a terra', p: { an: OV67 }, k: 'gr' },
        { d: 1.5, s: 'Gira il pollice a terra', p: { th: 1 }, k: 'gr' },
        { d: 2.5, s: 'Torna giù. Poi fai l\'altro braccio', ss: 'Giù, poi l\'altro braccio', p: { an: DN67 }, k: 'gr' },
        { d: 4, s: 'Inspira e porta su tutte e due le braccia', ss: 'Inspira, due braccia su', n: 1, p: { an: OV67, af: OV67f, pb: 0.8, pc: 0.5, th: 0 } },
        { d: 1.5, s: 'Gira i pollici a terra', ss: 'Pollici a terra', p: { th: 1 }, k: 'gr', air: 0 },
        { d: 3, s: 'Espira: le spalle scendono un po\' di più', ss: 'Espira, spalle giù', n: 1, p: { pb: 0, pc: 0 } },
        { d: 3, s: 'Inspira: cilindro e petto', ss: 'Inspira', n: 1, p: { pb: 0.8, pc: 0.5, pp: 0.5 } },
        { d: 3, s: 'Espira e torna giù', ss: 'Espira, giù', p: { an: DN67, af: DN67f, pb: 0, pc: 0, pp: 0 } }
      ],
      nose: 1, main: 3, strip: [1, 3, 5, 7], pre: supFloor,
      post: function (P, c, o, J) {
        var tp = mid(J.an.Wr, J.an.tip), th = P.th * cl((tp[1] - (GF - 30)) / 18, 0, 1);
        if (th > 0.01) o.push(L([tp[0], tp[1] + 1], [tp[0], GF - 1], 3.5, 'gr', op(th)), CI([tp[0], GF - 1], 3.2, 'fgr', op(th)),
          TX([Math.max(tp[0] - 10, 8), GF + 16], 'pollice a terra', 'tk', 'start', op(th)));
        floorBr(J, P, o);
        o.push(TX([232, 32], 'braccio sempre teso', 't', 'middle'));
        o.push(TX([8, 90], 'oltre l\'orecchio', 't', 'start', op(cl((-P.an.a - 160) / 20, 0, 1))));
        o.push(TX([232, 48], '3–5 respiri', 't', 'middle', op(cl((-P.af.a - 160) / 20, 0, 1))));
      }
    });

    // E70 (N9) — braccia su: spalle giù, poi spingi. Tronco fermo a terra: si muove solo la radice del braccio (sh verso i fianchi, li dal pavimento)
    function arm70(J, P, o, dx) {
      var s = add(J.sa, [dx, -P.li]), e = add(s, [0, -UA]), w = add(e, [0, -FA]), t = add(w, [0, -HA]);
      o.push(L(s, e, WUA), L(e, w, WFA), L(w, t, WHA));
      return { s: s, w: w, t: t };
    }
    def({
      id: 'E70', q: 1, v: V7, aria: 'Figura supina a ginocchia piegate, di profilo, braccia tese verso il soffitto: prima le spalle scivolano verso i fianchi, lontano dalle orecchie, e il braccio resta perpendicolare al pavimento; poi, con le spalle basse, le mani salgono di poco verso il soffitto e la scapola si stacca un poco da terra. In tutte e due le posizioni si resta e si respira col diaframma, col cilindro e col petto',
      base: poseOf(SP7, { an: null, af: null, sh: 0, li: 0 }),
      keys: [
        { d: 2, s: 'Braccia tese al soffitto, dita lunghe', ss: 'Braccia su', p: {}, k: 'no' },
        { d: 2.5, s: 'Spalle giù, verso i fianchi: il braccio resta fermo', ss: 'Spalle giù', p: { sh: -8 }, k: 'gr' },
        { d: 3, s: 'Resta: inspira con diaframma, cilindro e petto', ss: 'Inspira', n: 1, p: { pb: 0.8, pc: 0.5, pp: 0.5 } },
        { d: 3, s: 'Espira', n: 1, p: { pb: 0, pc: 0, pp: 0 } },
        { d: 2.5, s: 'Spalle basse: spingi le mani al soffitto', ss: 'Spingi al soffitto', p: { li: 7 }, k: 'gr' },
        { d: 3, s: 'Tieni e inspira: le scapole si allontanano', ss: 'Tieni, inspira', n: 1, p: { pb: 0.8, pc: 0.5, pp: 0.5 } },
        { d: 3, s: 'Espira', n: 1, p: { pb: 0, pc: 0, pp: 0 } },
        { d: 2.5, s: 'Molla, torna alla partenza', ss: 'Molla', p: { sh: 0, li: 0 }, k: 'no' }
      ],
      nose: 1, main: 4, strip: [0, 1, 4],
      pre: function (P, c, o, J) { var f = []; supFloor(P, c, o); arm70(J, P, f, 3); o.push(G({ opacity: 0.4 }, f)); },
      mid: function (P, c, o, J) { c.hand = arm70(J, P, o, 0); },
      post: function (P, c, o, J) {
        var h = c.hand, S0 = J.to.B(0.93), v1 = cl(-P.sh / 8, 0, 1), v2 = cl(P.li / 7, 0, 1), sx = h.s[0];
        o.push(CI(S0, 5, 'ghost', op(v1)), CI(h.s, 4.5, 'fgr'));
        o.push(AR([sx + 9, 104], [sx + 38, 104], 'gr', v1), TX([sx + 12, 76], 'spalle giù', 'tk', 'start', op(v1 * (1 - v2))));
        var d = qd([sx - 13, GF - 1], [sx, GF - 1 - 9 * v2], [sx + 13, GF - 1]);
        o.push(G(op(v2), [PA(d, 'b', { 'stroke-width': 7, style: 'stroke:var(--surface)' }), PA(d, 'gr', { 'stroke-width': 3 })]));
        o.push(AR([sx + 16, 48], [sx + 16, 24], 'gr', v2), TX([sx + 26, 38], 'spingi al soffitto', 'tk', 'start', op(v2)));
        o.push(TX([sx, GF + 16], 'la scapola si stacca un poco', 't', 'start', op(v2)));
        o.push(TX([sx + 12, 58], 'braccio dritto', 't', 'start', op(1 - v2)));
        floorBr(J, P, o);
      }
    });

    // Supino visto dall'alto (E68, E69, E71): testa in alto, ginocchia piegate verso chi guarda (si vedono di scorcio).
    var SW = 25;
    function top7(P, o, cx, Ys, x0, x1, y0) {
      var Yp = Ys + LT, wb = 4 * (P.pc || 0), B = [];
      o.push(E('rect', { x: x0, y: y0, width: x1 - x0, height: Ys + LT + 72 - y0, rx: 12, 'class': 'mat' }));
      [-1, 1].forEach(function (s) {
        var h = [cx + s * 10, Yp + 2], kn = [cx + s * 13, Yp + 26], an = [cx + s * 15, Yp + 50], tp = [cx + s * 16, Yp + 64];
        B.push(L(h, kn, WTH), L(kn, an, WSH), L(an, tp, WFT));
        o.push(G({ 'class': 'b' }, B)); B = [];
        o.push(CI(kn, 7.5, 'bf'));
      });
      var T = [[-24, -9], [-27 - wb, 10], [-25 - wb, 52], [-21, LT + 4], [0, LT + 9], [21, LT + 4], [25 + wb, 52], [27 + wb, 10], [24, -9], [0, -12]]
        .map(function (p) { return [cx + p[0], Ys + p[1]]; });
      o.push(PA(smooth(T, true), 'bf'));
      o.push(L([cx, Ys - 6], [cx, Ys - 20], 10), CI([cx, Ys - 34], HR + 1, 'b', { 'stroke-width': 5 }));
      return { S: function (s) { return [cx + s * SW, Ys + 2]; }, wb: wb };
    }
    function ribs(P, o, cx, Ys, wb, rg) { // il respiro visto dall'alto: frecce ai fianchi e (rg) cerchi tratteggiati su petto e pancia
      var v = P.pc || 0, y = Ys + 52;
      [-1, 1].forEach(function (s) { o.push(AR([cx + s * (26 + wb), y], [cx + s * (39 + wb + 3 * v), y], 'br', v)); });
      if (rg) o.push(CI([cx, Ys + 22], 8 + 6 * v, 'br dash', op(v)), CI([cx, Ys + 60], 8 + 8 * v, 'br dash', op(v)));
    }
    // lente di lato sull'avambraccio di E68 ed E69: sagoma grigia di torace e testa, gomito sul pavimento, avambraccio che ruota
    function lens7(P, o, ar) {
      var Lc = [246, 106], El = [Lc[0], Lc[1] + 26], fy = El[1] + 5, ch = 54, u = dir(-90 - P.rf * 90), Wr = add(El, u, FA), T = add(Wr, u, HA);
      o.push(CI(Lc, 60, 'b', { 'stroke-width': 2, style: 'stroke:var(--line-strong)' }));
      o.push(L([El[0] + 6, fy - 8], [El[0] + 46, fy - 8], 0, 'g', { style: 'stroke-width:14;stroke-linecap:round;opacity:.45' }), CI([El[0] - 23, fy - 17], 13, 'g', { style: 'fill:none;stroke-width:3' }));
      o.push(L([Lc[0] - ch, fy], [Lc[0] + ch, fy], 0, 'g'));
      o.push(CAR(El, 53, 53, ar[0], ar[1], 'gr', ar[2]));
      o.push(L(El, Wr, WFA), L(Wr, T, WHA), CI(El, 7, 'bf'));
      o.push(TX([Lc[0], Lc[1] - 42], 'di lato', 't', 'middle'));
      return { Wr: Wr, T: T, El: El, fy: fy };
    }
    function panca(c7) {
      return function (P) {
        var o = [], cx = 90, Ys = 92, B = top7(P, o, cx, Ys, 8, 174, 32), sn = Math.sin(P.rf * 90 * R), mv = 1 - Math.abs(sn);
        [-1, 1].forEach(function (s) {
          var S = B.S(s), El = add(S, [s * UA, 0]), Wr = add(El, [0, -FA * sn]), T = add(El, [0, -(FA + HA) * sn]);
          o.push(L(S, El, WUA), CI(El, 8, 'b', { 'stroke-width': 2, opacity: f1(mv) }), L(El, Wr, WFA), L(Wr, T, WHA));
          o.push(CI(S, 8, 'gr'));
          o.push(AR(add(El, [-s * 13, c7.sg * 6]), add(El, [-s * 13, c7.sg * 34]), 'gr', mv));
        });
        ribs(P, o, cx, Ys, B.wb, 1);
        o.push(TX([166, Ys + 152], 'dall\'alto', 't', 'end'));
        var h = lens7(P, o, c7.arc), on = c7.on(P);
        o.push(TX([246, h.fy + 16], c7.lab, 'tk', 'middle', op(on)));
        c7.txt.forEach(function (t, i) { o.push(TX([246, 188 + i * 16], t, i ? 't' : 'tk', 'middle')); });
        return o;
      };
    }

    // E68 (N7) — panca a terra: l'avambraccio va indietro, verso la testa, il dorso della mano a terra
    def({
      id: 'E68', q: 1, v: [320, 230, 28], aria: 'Figura supina a ginocchia piegate vista dall\'alto, con una lente di lato sull\'avambraccio: braccia larghe all\'altezza delle spalle, gomiti piegati e avambracci in verticale come alla panca; l\'avambraccio ruota indietro verso la testa fino a portare il dorso della mano a terra, il braccio resta fermo e la spalla non si stacca. Si resta 3–5 respiri gonfiando diaframma e petto, lasciando rilassare, poi si torna con i palmi verso l\'alto',
      base: { rf: 0, pc: 0 },
      keys: [
        { d: 2, s: 'Come alla panca: gomiti all\'altezza delle spalle', ss: 'Posizione di panca', p: {}, k: 'no' },
        { d: 3, s: 'Dorsi delle mani verso terra, indietro: fin dove arrivi', ss: 'Dorsi verso terra', p: { rf: 0.86 }, k: 'gr' },
        { d: 3.5, s: 'Resta: inspira, gonfia diaframma e petto', ss: 'Inspira, diaframma e petto', n: 1, p: { pc: 1 } },
        { d: 3.5, s: 'Espira, rilassa: il dorso scende un poco', ss: 'Espira, scende un poco', n: 1, p: { pc: 0, rf: 1 } },
        { d: 3, s: 'Torna alla panca, palmi verso l\'alto', ss: 'Torna', p: { rf: 0 }, k: 'no' }
      ],
      main: 1, strip: [0, 1, 3],
      draw: panca({ sg: -1, arc: [-92, -168, 1], lab: 'dorso a terra', on: function (P) { return cl((P.rf - 0.7) / 0.15, 0, 1); }, txt: ['spalla ferma a terra', 'lontana dalle orecchie', '3–5 respiri'] })
    });

    // E69 (N8) — panca a terra: l'avambraccio va in avanti, verso i fianchi, il palmo verso il pavimento. Non deve per forza toccare terra
    def({
      id: 'E69', q: 1, v: [320, 230, 28], aria: 'Figura supina a ginocchia piegate vista dall\'alto, con una lente di lato sull\'avambraccio: dalla posizione di panca, l\'avambraccio ruota in avanti verso i fianchi e il palmo va verso il pavimento; le spalle restano ferme a terra e si scende dove si arriva, senza dover per forza toccare il pavimento. Si resta lì respirando dal naso, con il viso rilassato',
      base: { rf: 0, pc: 0 },
      keys: [
        { d: 2, s: 'Come alla panca: avambracci in su', ss: 'Posizione di panca', p: {}, k: 'no' },
        { d: 3, s: 'Avambracci in avanti, palmi verso il pavimento', ss: 'Palmi verso il pavimento', p: { rf: -0.68 }, k: 'gr' },
        { d: 3.5, s: 'Spalla a terra: resta e inspira dal naso', ss: 'Inspira dal naso', n: 1, p: { pc: 0.8 } },
        { d: 3.5, s: 'Espira: rilassa, non per forza fino a terra', ss: 'Espira, scendi dove arrivi', n: 1, p: { pc: 0, rf: -0.76 } },
        { d: 3, s: 'Torna su, avambracci in verticale', ss: 'Torna', p: { rf: 0 }, k: 'no' }
      ],
      main: 1, strip: [0, 1, 3],
      draw: panca({ sg: 1, arc: [-88, -26, 1], lab: 'palmo giù', on: function (P) { return cl((-P.rf - 0.5) / 0.15, 0, 1); }, txt: ['spalla ferma a terra', 'scendi dove arrivi', 'viso rilassato'] })
    });

    // E71 (N10) — scivolate a terra, come un angelo: braccia nel piano del pavimento, gomiti e dorsi sempre giù
    var S71 = [{ ha: -38, fa: 76 }, { ha: -12, fa: 78 }, { ha: 48, fa: 72 }]; // W stretta, W, Y
    function hand71(cx, Ys, ha, fa, s) {
      var S = [cx + s * SW, Ys + 2], El = add(S, [s * UA * Math.cos(ha * R), -UA * Math.sin(ha * R)]), u = [s * Math.cos(fa * R), -Math.sin(fa * R)];
      return { S: S, El: El, Wr: add(El, u, FA), T: add(El, u, FA + HA) };
    }
    def({
      id: 'E71', q: 1, v: [320, 250, 12], aria: 'Figura supina a ginocchia piegate vista dall\'alto, come un angelo sul pavimento: gomiti e dorsi delle mani sempre a terra. Le braccia a W scivolano verso l\'alto fino alla Y, poi scendono con i gomiti verso i fianchi finché il polso resta a terra; scendendo le scapole si avvicinano. Al limite si resta 3–5 respiri gonfiando i fianchi e si prova a scendere di poco, poi si risale',
      base: { ha: -12, fa: 78, pc: 0 },
      keys: [
        { d: 2, s: 'Braccia a W: gomiti e dorsi delle mani a terra', ss: 'W: gomiti e dorsi a terra', p: {}, k: 'no' },
        { d: 2.5, s: 'Scivola su, senza staccare', ss: 'Scivola su, a Y', p: { ha: 48, fa: 72 }, k: 'gr' },
        { d: 2.5, s: 'Scivola giù, gomiti verso i fianchi', ss: 'Scivola giù', p: { ha: -38, fa: 76 }, k: 'gr' },
        { d: 2.5, s: 'Scivola su, senza staccare', ss: 'Scivola su', p: { ha: 48, fa: 72 }, k: 'gr' },
        { d: 3, s: 'Giù finché il polso resta a terra', ss: 'Giù, polso a terra', p: { ha: -38, fa: 76 }, k: 'gr' },
        { d: 3.5, s: 'Fermati lì, petto aperto: inspira nei fianchi', ss: 'Inspira nei fianchi', n: 1, p: { pc: 1 } },
        { d: 3.5, s: 'Espira: prova a scendere di poco', ss: 'Espira, scendi di poco', n: 1, p: { pc: 0, ha: -42 } },
        { d: 3, s: 'Risali e recupera', ss: 'Recupera', p: { ha: -12, fa: 78 }, k: 'no' }
      ],
      main: 4, strip: [0, 1, 4, 5],
      draw: function (P) {
        var o = [], cx = 160, Ys = 100, B = top7(P, o, cx, Ys, 14, 306, 16), i, j, low = cl((-P.ha - 14) / 24, 0, 1);
        [-1, 1].forEach(function (s) {
          var tr = [];
          for (i = 0; i < 2; i++) for (j = 0; j < (i ? 5 : 4); j++) {
            var a = S71[i], b = S71[i + 1], t = j / 4;
            tr.push(hand71(cx, Ys, a.ha + (b.ha - a.ha) * t, a.fa + (b.fa - a.fa) * t, s).Wr);
          }
          o.push(PA(smooth(tr), 'ghost'));
        });
        // scapole: si avvicinano scendendo (ventaglio)
        [-1, 1].forEach(function (s) {
          var x = cx + s * (18 - 8 * low), y = Ys + 12;
          o.push(PA(pth([[x - s * 7, y], [x + s * 6, y + 3], [x - s * 2, y + 28]], true), 'gr', { 'stroke-width': 2, 'stroke-linejoin': 'round' }));
        });
        [-1, 1].forEach(function (s) {
          var h = hand71(cx, Ys, P.ha, P.fa, s);
          o.push(L(h.S, h.El, WUA), L(h.El, h.Wr, WFA), L(h.Wr, h.T, WHA));
          o.push(CI(h.Wr, 8, 'gr', op(low)));
        });
        ribs(P, o, cx, Ys, B.wb, 0);
        o.push(TX([26, Ys + 92], 'gomiti e dorsi', 't'), TX([26, Ys + 107], 'sempre a terra', 't'));
        o.push(TX([294, Ys + 92], 'le scapole', 't', 'end', op(low)), TX([294, Ys + 107], 'si avvicinano', 't', 'end', op(low)), TX([294, Ys + 148], '3–5 respiri', 't', 'end', op(low)));
        var w = hand71(cx, Ys, P.ha, P.fa, 1).Wr;
        o.push(TX([w[0] + 12, w[1] - 2], 'polso', 'tk', 'start', op(low)), TX([w[0] + 12, w[1] + 12], 'a terra', 'tk', 'start', op(low)));
        o.push(TX([26, Ys + 148], 'dall\'alto', 't'));
        return o;
      }
    });
  })();
  /* ======================= FINE BLOCCO A ======================= */

  /* ======================= LEZIONE 7 — BLOCCO B: prove in piedi, occhi nel buio, muro, quadrupedia, push-up ======================= */
  (function () {
    // T15, T16, E65, E66, E72, E73 (L7, spalla e scapola). Nessun numero di gradi nelle indicazioni. Respiro: verde dove lo dà
    // il coach (E65, E66, E72); altrove fasi di movimento ocra e riposo grigio con «respira libero dal naso».
    var FREE = 'respira libero dal naso', THIN = { style: 'stroke-width:2' }, SOLID = { style: 'fill:currentColor', 'stroke-width': 0 };

    // ---------- T15 (N1) — prova: il braccio teso sale fin dove arriva da solo ----------
    // L'errore è una sagoma tratteggiata accanto alla figura: sovrapposta al corpo non si leggerebbe (come nota E34).
    function arm15(a) { return { a: a, r: 84, b: 1 }; } // r oltre la lunghezza: l'IK lo tiene teso
    var G15 = [], J15 = ghostBody(poseOf(STD, { x: 232, y: GS - 120, t: -100, cu: 16, nk: 16, ln: { p: [218, GS - 6], b: -1, f: 0 }, an: arm15(-101) }), G15);
    [10, 4, 7, 5].forEach(function (w, i) { G15[i].a.style = 'stroke-width:' + w; });
    G15.push(cross(J15.to.pt(0.24, 18, -1), 6), AR(add(J15.to.P, [12, 4]), add(J15.to.P, [32, 4]), 'gr'), TX([216, GS + 15], 'non così', 'tk', 'middle'));
    def({
      id: 'T15', q: 1, v: [300, 322, -30],
      aria: 'Prova di profilo, in piedi: il braccio teso lungo il fianco sale in avanti e poi in alto, fin dove arriva da solo, con la bassa schiena ferma. Accanto, una sagoma tratteggiata con la croce mostra l\'errore: il bacino avanza e la bassa schiena si inarca. Poi il braccio scende e si rifà con l\'altro',
      base: poseOf(STD, { an: arm15(84), li: 0 }),
      keys: [
        { d: 2, s: 'Di profilo, braccio teso lungo il fianco', ss: 'Braccio lungo il fianco', p: {}, k: 'no' },
        { d: 2.5, s: 'Sali teso, in avanti', ss: 'Sali teso', p: { an: arm15(2) }, k: 'gr', vis: 'io', a0: 62, a1: 12 },
        { d: 2.5, s: 'Su: fermati dove non sale più da solo', ss: 'Su, fin dove sale da solo', p: { an: arm15(-85), li: 1 }, k: 'gr', vis: 'io', a0: -14, a1: -74 },
        { d: 3, s: 'Non così: il bacino avanza, la schiena si inarca', ss: 'Non così: la schiena si inarca', p: {}, k: 'no', vis: 'io', er: 1 },
        { d: 2.5, s: 'Giù, poi l\'altro braccio: ' + FREE, ss: 'Giù, poi l\'altro braccio', p: { an: arm15(84), li: 0 }, k: 'no' }
      ],
      main: 2, strip: [0, 1, 2, 3],
      pre: function (P, c, o) { floor(300, GS, o); o.push(G(op(c.k.er ? vis(c) : 0), G15)); },
      post: function (P, c, o, J) {
        var lo = J.to.pt(0.24, 0, -1);
        o.push(CI(lo, 5, 'fbr'), TX([lo[0] - 10, lo[1] + 1], 'bassa schiena', 'tk', 'end'), TX([lo[0] - 10, lo[1] + 15], 'ferma', 't', 'end'));
        if (c.k.a0) o.push(CAR(J.sa, 100, 100, c.k.a0, c.k.a1, 'gr', vis(c)));
        o.push(TX([90, -14], 'fin dove', 'tk', 'end', op(P.li)), TX([90, 1], 'sale da solo', 'tk', 'end', op(P.li)));
      }
    });

    // ---------- T16 (N2) — prova prima e dopo: giù alle punte, piedi uniti ----------
    var UB16 = { x: STD.x, y: STD.y, t: -90, cu: 0, t2: -90, cu2: 0, nk: STD.nk, an: STD.an, af: STD.af }, UP16 = poseOf(STD, shallow(UB16, { pm: 0, dm: 0 }));
    function dn16(x, t, t2, a) { return { x: x, y: GS - 120, t: t, cu: -3, t2: t2, cu2: -7, nk: 30, an: { a: a, r: 81, b: 1 }, af: { a: a - 2, r: 81, b: 1 } }; }
    var D1 = dn16(92, -28, 30, 104), D2 = dn16(87, -17, 45, 108);
    var Y1 = body(resolve(shallow(UP16, D1))).an.tip[1], Y2 = body(resolve(shallow(UP16, D2))).an.tip[1];
    def({
      id: 'T16', q: 1, v: [300, 290],
      aria: 'Prova di profilo, in piedi a piedi uniti: si scende fluidi in avanti verso le punte dei piedi fin dove si arriva e si prende nota di dove arrivano le dita. Si torna su, si fa l\'esercizio da provare e poi si rifà la stessa discesa: due tacche, prima e dopo, mostrano se è cambiato qualcosa. Meglio o peggio, conta che cambi',
      base: UP16,
      keys: [
        { d: 1.5, s: 'Prima: in piedi, piedi uniti', ss: 'Prima: piedi uniti', p: {}, k: 'no', tl: 'prima' },
        { d: 3, s: 'Scendi fluido, arriva dove arrivi', ss: 'Scendi fluido', p: D1, k: 'gr', tl: 'prima' },
        { d: 2, s: 'Prendi punto: dove arrivano le dita?', ss: 'Prendi punto', p: { pm: 1 }, k: 'gr', tl: 'prima' },
        { d: 2.5, s: 'Torna su', p: UB16, k: 'gr', tl: 'prima' },
        { d: 2.5, s: 'Ora fai l\'esercizio da provare', ss: 'L\'esercizio da provare', p: {}, k: 'no', tl: 'ora', vis: 'io' },
        { d: 3, s: 'Dopo: rifai la stessa discesa', ss: 'Dopo: stessa discesa', p: D2, k: 'gr', tl: 'dopo' },
        { d: 2.5, s: 'È cambiato? Meglio o peggio, conta che cambi', ss: 'È cambiato qualcosa?', p: { dm: 1 }, k: 'gr', tl: 'dopo' },
        { d: 2.5, s: 'Torna su, ' + FREE, ss: 'Torna su', p: shallow(UB16, { pm: 0, dm: 0 }), k: 'no', tl: 'dopo' }
      ],
      main: 2, strip: [0, 2, 4, 6],
      pre: function (P, c, o) { floor(300, GS, o); },
      post: function (P, c, o, J) {
        var x0 = 124, x1 = 204;
        o.push(L([x0, Y1], [x1, Y1], 0, 'gr dash', op(P.pm)), TX([x1 + 5, Y1 - 2], 'prima', 'tk', null, op(P.pm)));
        o.push(L([x0, Y2], [x1, Y2], 0, 'gr dash', op(P.dm)), TX([x1 + 5, Y2 + 12], 'dopo', 'tk', null, op(P.dm)));
        o.push(TX([292, 26], c.k.tl === 'ora' ? 'esercizio' : c.k.tl, 'tk', 'end'));
        if (c.k.tl === 'ora') o.push(TX([292, 44], 'per esempio', 't', 'end', op(vis(c))), TX([292, 59], 'occhi nel buio', 't', 'end', op(vis(c))));
        o.push(TX([292, 44], 'meglio o peggio:', 't', 'end', op(P.dm)), TX([292, 59], 'conta che cambi', 't', 'end', op(P.dm)));
      }
    });

    // ---------- E65 (N3) — occhi aperti nel buio delle mani: testa e mani di fronte, ingrandite ----------
    var EY65 = 78, CX65 = 160;
    function eye65(x, a) { // occhio aperto; sopra le mani è una trasparenza: gli occhi restano aperti sotto
      return G(op(a), [PA('M' + M([x - 11, EY65]) + 'Q' + M([x, EY65 - 10]) + ' ' + M([x + 11, EY65]) + 'Q' + M([x, EY65 + 10]) + ' ' + M([x - 11, EY65]) + 'Z', 'b', { 'stroke-width': 2, style: 'fill:var(--surface)' }), CI([x, EY65], 3.4, 'b', SOLID)]);
    }
    function hand65(s, hu, o) { // s -1 a sinistra di chi guarda; hu 0 giù, fuori dal riquadro, 1 sugli occhi. Pollice verso la tempia
      if (hu < 0.02) return;
      var W = mix([CX65 + s * 104, 268], [CX65 + s * 33, 108], hu), a = mix(-90 + s * 22, -90 - s * 11, hu), u = dir(a), n = rot(u, 90 * s), El = mix([CX65 + s * 128, 340], [CX65 + s * 84, 300], hu);
      var v = sub(El, W), T = W[1] < 234 ? add(W, v, (234 - W[1]) / v[1]) : W, p = rot(unit(v), 90);
      if (W[1] < 234) o.push(PA(pth([add(W, p, -10), add(T, p, -13), add(T, p, 13), add(W, p, 10)]), 'bf'));
      var t0 = add(add(W, u, 12), n, 19), ta = a + s * 26;
      o.push(rrect(add(t0, dir(ta), 13), 30, 12, ta, 'bf', 6), rrect(add(W, u, 24), 50, 46, a, 'bf', 13));
      [[-16, 22], [-5.5, 28], [5.5, 30], [16, 26]].forEach(function (f) { o.push(rrect(add(add(W, u, 46 + f[1] / 2), n, f[0]), f[1] + 6, 11, a, 'bf', 5.5)); });
    }
    function nose65(c, o) { // tratteggi al naso: scorrono verso il naso inspirando e verso fuori espirando
      if (!c.air) return;
      [-1, 1].forEach(function (s) {
        o.push(L([CX65 + s * 5, 134], [CX65 + s * 9, 116], 2, 'br', { 'stroke-dasharray': '3 4', 'stroke-dashoffset': f1((c.time || 0) * 12 * c.air), opacity: 0.9 }));
      });
    }
    def({
      id: 'E65', q: 1, v: [320, 236],
      aria: 'Testa e mani di fronte, ingrandite. Senza occhiali, a occhi aperti, si coprono bene gli occhi con le mani a coppa e si tengono gli occhi aperti dietro le mani, guardando il buio per 10–15 secondi, respirando lentamente dal naso. Poi le mani scendono',
      base: { hu: 0 },
      keys: [
        { d: 2, s: 'Togli gli occhiali, occhi aperti', ss: 'Senza occhiali, occhi aperti', p: {}, k: 'no' },
        { d: 2.5, s: 'Copri bene gli occhi con le mani', ss: 'Copri gli occhi', p: { hu: 1 }, k: 'gr' },
        { d: 3, s: 'Occhi aperti, guarda il buio: inspira', ss: 'Occhi aperti, guarda il buio', g: 'buio', n: 1, p: {}, air: 1 },
        { d: 3, s: 'Guarda il buio: espira', g: 'buio', n: 1, p: {}, air: -1 },
        { d: 3, s: 'Guarda il buio: inspira', g: 'buio', n: 1, p: {}, air: 1 },
        { d: 3, s: 'Guarda il buio: espira', g: 'buio', n: 1, p: {}, air: -1 },
        { d: 2.5, s: 'Giù le mani, piano', ss: 'Giù le mani', p: { hu: 0 }, k: 'gr' }
      ],
      main: 2, strip: [0, 1, 2],
      draw: function (P, c) {
        var o = [], on = cl((P.hu - 0.7) / 0.3, 0, 1), W4 = { style: 'stroke-width:4' };
        o.push(PA(smooth([[46, 236], [50, 200], [76, 176], [126, 164], [194, 164], [244, 176], [270, 200], [274, 236]]), 'bf'));
        o.push(PA(pth([[136, 124], [134, 170], [186, 170], [184, 124]]), 'bf'));
        o.push(E('ellipse', { cx: CX65, cy: 84, rx: 47, ry: 58, 'class': 'bf', style: 'stroke-width:4' }));
        o.push(eye65(CX65 - 21, 1), eye65(CX65 + 21, 1));
        o.push(PL([[CX65, 86], [CX65 - 3, 106], [CX65 + 3, 108]], 2.5));
        hand65(-1, P.hu, o); hand65(1, P.hu, o);
        o.push(eye65(CX65 - 21, on), eye65(CX65 + 21, on));
        nose65(c, o);
        o.push(L([CX65 + 32, 76], [CX65 + 72, 62], 0, 'ghost', op(on)), TX([CX65 + 76, 60], 'occhi aperti', 'tk', null, op(on)), TX([CX65 + 76, 75], 'guarda il buio', 't', null, op(on)));
        o.push(TX([10, 22], '10–15 secondi', 'tk'), TX([10, 38], 'non chiudere', 't'), TX([10, 52], 'gli occhi', 't'));
        return o;
      }
    });

    // ---------- E66 (N4, codici-L7) — al muro: apri tutto e prova a respirare ----------
    // Tronco in due tratti (E64). Il bacino si sposta finché la schiena tocca il muro; le ginocchia restano piegate.
    var WX66 = 62, A66 = [WX66 + 56, GS - 6];
    function fit66(P) {
      var q = shallow(P, { x: 100, pb: 0 }), to = torso(q), mn = 1e9, i;
      for (i = 0; i <= 24; i++) mn = Math.min(mn, to.pt(i / 24, 0, -1)[0]);
      return shallow(P, { x: q.x + WX66 + 1.5 - mn });
    }
    var A66D = {
      id: 'E66', q: 1, v: [280, 290],
      aria: 'Figura di profilo con la schiena al muro e le ginocchia piegate, mani sulle cosce: attacca la lombare al muro, apre il petto cercando di attaccare tutta la schiena, porta il mento indietro come per tenere un uovo sotto il mento e spinge la testa in alto, senza stendere le gambe. Prova a deglutire senza muovere la testa. Poi rilassa la pancia in fuori e respira a cilindro, dietro e di fianco. È una prova, non una postura da tenere',
      base: { y: GS - 106, t: -90, cu: 12, t2: -85, cu2: -5, nk: 34, pb: 0, lo: 0, ds: 0, hc: 0, eg: 0, su: 0, cy: 0, ln: { p: A66, b: -1, f: 0 }, lf: { p: [A66[0] - 3, A66[1]], b: -1, f: 0 } },
      keys: [
        { d: 2, s: 'Schiena al muro, ginocchia piegate', ss: 'Schiena al muro', p: {}, k: 'no' },
        { d: 2.5, s: 'Attacca la lombare al muro', ss: 'Lombare al muro', p: { cu: 0, lo: 1 }, k: 'gr', vis: 'io', ar: 1 },
        { d: 2.5, s: 'Apri il petto: tutta la schiena al muro', ss: 'Apri il petto', p: { t2: -90, cu2: 0, nk: 30, ds: 1 }, k: 'gr' },
        { d: 2.5, s: 'Mento indietro, come un uovo sotto il mento', ss: 'Mento indietro, l\'uovo', p: { nk: 18, hc: 1, eg: 1 }, k: 'gr', vis: 'io', ch: 1 },
        { d: 2.5, s: 'Su, su: la testa spinge in alto, la colonna si allunga', ss: 'La testa spinge in alto', p: { su: 1 }, k: 'gr' },
        { d: 2, s: 'Prova a deglutire: la testa non si muove', ss: 'Deglutisci, testa ferma', p: {}, k: 'gr', vis: 'io', sw: 1 },
        { d: 2.5, s: 'Rilassa la pancia: buttala in fuori', ss: 'Pancia in fuori', p: { pb: 1, su: 0 }, k: 'gr' },
        { d: 4, s: 'Inspira a cilindro: dietro e di fianco', ss: 'Inspira a cilindro', n: 1, p: { cy: 1 }, air: 1 },
        { d: 4, s: 'Espira', n: 1, p: { cy: 0 }, air: -1 },
        { d: 2, s: 'Molla, ' + FREE, ss: 'Molla', p: { cu: 12, t2: -85, cu2: -5, nk: 34, pb: 0, lo: 0, ds: 0, hc: 0, eg: 0 }, k: 'no' }
      ],
      nose: 1, main: 7, strip: [1, 3, 4, 6, 7],
      pre: function (P, c, o) { floor(280, GS, o); wall(WX66, GS, 10, 1, o); },
      post: function (P, c, o, J) {
        var to = J.to, up = dir(J.hd), a, b, v = P.cy;
        [[to.pt(0.26, 0, -1)[1], 'lombare', P.lo], [to.pt(0.76, 0, -1)[1], 'dorso', P.ds], [J.H[1], 'testa', P.hc]].forEach(function (d) {
          o.push(CI([WX66 + 1, d[0]], 5, 'fgr', op(0.25 + 0.75 * d[2])), TX([WX66 - 12, d[0] + 4], d[1], 'tk', 'end', op(0.35 + 0.65 * d[2])));
        });
        if (c.k.ar) { a = to.pt(0.26, 30, 1); o.push(AR(a, add(a, [-20, 0]), 'gr', vis(c))); }
        if (P.eg > 0.02) { var eg = rrect(add(add(J.H, J.face, 9), up, -19), 11, 15, ang(J.face), 'bf', 5.5); eg.a.style = 'stroke-width:2'; o.push(G(op(P.eg), [eg])); }
        if (c.k.ch) o.push(TX(add(J.H, [26, 16]), 'un uovo', 'tk', null, op(vis(c))), TX(add(J.H, [26, 31]), 'sotto il mento', 't', null, op(vis(c))));
        if (c.k.sw) { a = add(to.S, [32, -6]); o.push(AR2(add(a, [0, -12]), add(a, [0, 12]), 'gr', vis(c)), TX(add(a, [10, 4]), 'deglutisci', 'tk', null, op(vis(c)))); }
        a = [J.H[0], J.H[1] - HR - 6];
        o.push(AR(a, add(a, [0, -22]), 'gr', P.su), TX(add(a, [12, -8]), 'testa su', 'tk', null, op(P.su)));
        a = to.pt(0.28, 3, 1); b = add(a, to.N(0.28), 6 + 14 * P.pb);
        o.push(AR(a, b, 'br', P.pb), TX(add(b, [6, 4]), 'pancia in fuori', 't', null, op(P.pb)));
        var q = [], i, m = to.pt(0.6, 22, 1);
        for (i = 0; i <= 6; i++) q.push(to.pt(0.42 + 0.36 * i / 6, 0, -1));
        o.push(PA(smooth(q), 'br', { 'stroke-width': 5, opacity: f1(100 * v) / 100 }), TX([WX66 - 12, q[3][1] + 4], 'dietro', 't', 'end', op(v)));
        o.push(CI(m, 3 + 3 * v, 'br', op(v)), CI(m, 1.8, 'fbr', op(v)), CI(m, 9 + 7 * v, 'br dash', op(v)), TX(add(m, [20, 4]), 'di fianco', 't', null, op(v)));
        o.push(TX([272, 24], 'è una prova,', 'tk', 'end'), TX([272, 38], 'non una postura', 't', 'end'), TX([272, 56], '3–5 respiri, poi molla', 't', 'end'));
        var K = J.ln.K;
        o.push(TX(add(K, [16, -4]), 'le ginocchia', 't'), TX(add(K, [16, 11]), 'restano piegate', 't'));
      }
    };
    A66D.draw = (function (side) { // le mani sulle cosce vanno ricalcolate dopo aver spostato il bacino
      return function (P, c) {
        var Q = fit66(P), H = [Q.x, Q.y], K = ik(H, A66, TH, SH, -1)[0], u = unit(sub(K, H)), w = add(mid(H, K, 0.12), [0, -6.5]);
        Q.an = { p: w, b: 1, w: ang(u) }; Q.af = { p: add(w, [3, 0]), b: 1, w: ang(u) };
        return side(Q, c);
      };
    })(sideFig(A66D));
    def(A66D);

    // ---------- E72 (N11) — quadrupedia: mano radicata, spingi il pavimento ----------
    // Ginocchio sotto l'anca, polso sotto la spalla, mani ferme. La spinta è la curva del solo tratto dorsale (cu2): il
    // torace sale fra le scapole, il tratto lombare resta dritto. A destra una lente che cambia con la fase.
    var W72 = [181, GQ - 4], LX72 = 298, LY72 = 78;
    function lens72(iv, P, o) {
      var g = [], x = LX72, y = LY72, f = y + 34, s, sn, cs;
      if (iv === 1) { // il braccio da davanti: la piega del gomito viene davanti
        g.push(rrect([x, y - 26], 22, 48, 0, 'bf', 10), rrect([x, y + 16], 18, 40, 0, 'bf', 8));
        g.push(PA(pth([[x - 9, y + 33], [x - 15, y + 44], [x + 15, y + 44], [x + 9, y + 33]], true), 'bf'));
        sn = Math.cos(P.ge * 90 * R); cs = Math.sin(P.ge * 90 * R);
        g.push(PA(qd([x - 9 * sn - 2 - 6 * cs, y - 5], [x - 9 * sn, y + 3], [x - 9 * sn + 2 + 6 * cs, y - 5]), 'gr', { 'stroke-width': 3.5 }));
        g.push(CAR([x, y - 3], 20, 6, 160, 20, 'gr'));
      } else if (iv === 2) { // la mano di lato: il palmo si solleva, le dita agganciano
        var sg = P.sg, wr = [x - 24, f - 9], k = [x + 4, f - 10 - 8 * sg], m = [x + 21, f - 7 - 3 * sg], t = [x + 33, f - 2];
        g.push(L([x - 34, f + 4], [x + 44, f + 4], 0, 'g'), L([x - 30, y - 44], wr, 15), L(wr, k, 13), L(k, m, 8), L(m, t, 7));
        g.push(PA(qd([x - 18, f + 1], [x - 2, f - 7 - 9 * sg], [x + 16, f + 1]), 'gr', ext(op(0.3 + 0.7 * sg), { 'stroke-width': 3 })), CI([x - 26, f + 2], 3.2, 'fgr', op(sg)), CI(t, 3.2, 'fgr', op(sg)));
      } else { // la schiena dall'alto: avanti a destra, spina orizzontale, scapole che si allontanano
        var d = 7 + 12 * P.sa;
        g.push(L([x - 44, y], [x + 30, y], 6), CI([x + 42, y], 9, 'bf'));
        [-1, 1].forEach(function (sd) {
          g.push(PA(pth([[x - 16, y + sd * d], [x + 16, y + sd * d], [x + 6, y + sd * (d + 26)]], true), 'bf'));
          var a = [x - 24, y + sd * 6];
          g.push(AR(a, add(a, [0, sd * (8 + 10 * P.sa)]), 'gr', P.sa));
        });
        if (P.pc > 0.02) g.push(E('ellipse', { cx: x, cy: y, rx: f1(4 + 12 * P.pc), ry: f1(2 + 5 * P.pc), 'class': 'br', opacity: f1(cl(P.pc * 2, 0, 1) * 100) / 100 }));
      }
      o.push(CI([x, y], 56, 'b', { 'stroke-width': 2, style: 'stroke:var(--line-strong)' }));
      o.push.apply(o, g);
    }
    var A72 = {
      id: 'E72', q: 1, v: [360, 160],
      aria: 'Figura a quattro zampe di profilo, polsi sotto le spalle e ginocchia sotto le anche; accanto una lente sul dettaglio. I gomiti ruotano e la piega guarda avanti; le dita agganciano il pavimento e il palmo si solleva; le spalle vanno lontano dalle orecchie. Poi si spinge il pavimento: il torace sale fra le scapole, il dorso si arrotonda appena e la lombare resta neutra. Si respira al centro della schiena, poi si molla',
      base: { x: 104, y: GQ - 66, t: -14.1, cu: 0, t2: -14.1, cu2: 0, nk: 16, pb: 0, pc: 0, sh: 0, ge: 0, sg: 0, sa: 0,
        ln: { p: [48, GQ - 6], b: -1, f: 182 }, lf: { p: [51, GQ - 6], b: -1, f: 182 }, an: { p: W72, b: 1, w: 0 }, af: { p: [W72[0] + 3, W72[1]], b: 1, w: 0 } },
      keys: [
        { d: 2.5, s: 'Polsi sotto le spalle, ginocchia sotto le anche', ss: 'Polsi e ginocchia sotto', p: {}, k: 'no' },
        { d: 2.5, s: 'Gira i gomiti: la piega guarda avanti', ss: 'La piega del gomito avanti', p: { ge: 1 }, k: 'gr', vis: 'io', iv: 1 },
        { d: 2.5, s: 'Le dita agganciano il pavimento', ss: 'Le dita agganciano', p: { sg: 1 }, k: 'gr', vis: 'io', iv: 2 },
        { d: 2.5, s: 'Spalle giù, lontane dalle orecchie', ss: 'Spalle giù', p: { sh: -6 }, k: 'gr', vis: 'io', sh: 1 },
        { d: 3, s: 'Spingi il pavimento, le scapole si allontanano', ss: 'Spingi il pavimento', p: { t: -11.2, t2: -11.2, cu2: -12, sa: 1, nk: -6 }, k: 'gr', vis: 'in', iv: 3, pu: 1 },
        { d: 4, s: 'Inspira al centro della schiena', ss: 'Inspira al centro della schiena', n: 1, p: { pc: 1 }, air: 1, vis: 1, iv: 3, pu: 1 },
        { d: 4, s: 'Espira, tieni la spinta', ss: 'Espira, tieni la spinta', n: 1, p: { pc: 0 }, air: -1, vis: 1, iv: 3, pu: 1 },
        { d: 2.5, s: 'Molla, ' + FREE, ss: 'Molla', p: { t: -14.1, t2: -14.1, ge: 0, sg: 0, sh: 0, cu2: 0, sa: 0, nk: 16 }, k: 'no', vis: 'out', iv: 3 }
      ],
      nose: 1, main: 5, strip: [1, 2, 3, 4, 5],
      pre: function (P, c, o) { floor(360, GQ, o); },
      post: function (P, c, o, J) {
        var to = J.to, E0 = J.an.E, a, b, va = vis(c);
        o.push(CI(to.pt(0.25, 0, -1), 4.5, 'fbr'), TX(add(to.pt(0.25, 0, -1), [6, -11]), 'lombare neutra', 't', 'end'));
        o.push(CI(add(E0, [5, 0]), 3.2, 'fgr', op(P.ge)));
        if (c.k.sh) { a = to.pt(0.98, 11, -1); b = to.pt(0.72, 11, -1); o.push(AR(a, b, 'gr', va), TX(add(mid(a, b), [0, -9]), 'lontano dalle orecchie', 't', 'middle', op(va))); }
        if (c.k.pu) { o.push(AR([W72[0] + 4, GQ + 3], [W72[0] + 4, GQ + 15], 'gr', 1)); a = to.pt(0.8, 5, -1); o.push(AR(a, add(a, [0, -18]), 'gr', c.air ? 0 : 1), TX(add(a, [0, -24]), 'il torace sale', 't', 'middle', op(c.air ? 0 : 1))); }
        if (P.pc > 0.02) { a = to.pt(0.57, 3, -1); o.push(AR(a, add(a, to.N(0.57), -(6 + 14 * P.pc)), 'br', cl(P.pc * 2, 0, 1))); }
        if (c.k.iv) { var g = []; lens72(c.k.iv, P, g); if (c.k.iv === 3) g.push(TX([LX72, 151], 'scapole lontane', 't', 'middle', op(P.sa))); o.push(G(op(va), g)); o.push(TX([LX72, 14], ['il braccio da davanti', 'la mano di lato', 'la schiena dall\'alto'][c.k.iv - 1], 't', 'middle', op(va))); }
        o.push(TX([12, 155], '5 respiri, poi molla', 'tk'));
      }
    };
    def(A72);

    // ---------- E73 (N12) — push-up con la spinta. Tutto il corpo ruota attorno alle dita dei piedi (B73), le mani restano ferme ----------
    var B73 = [38, GQ - 3.5], T073 = -19.7, F073 = 70, DM73 = 15, W73 = [217, GQ - 4];
    var A073 = add(B73, [-2.75, -15]), H073 = add(A073, dir(T073), 115.8);
    function rp73(p, d) { return add(B73, rot(sub(p, B73), d)); }
    function rig73(P) {
      var d = P.dn * DM73, H = rp73(H073, d), A = rp73(A073, d), t = T073 + d, f = F073 + d;
      return shallow(P, { x: H[0], y: H[1], t: t, cu: 0, t2: t, nk: 8,
        ln: { p: A, b: -1, f: f, tb: -f }, lf: { p: A, b: -1, f: f, tb: -f },
        an: { p: W73, b: 1, w: 0 }, af: { p: add(W73, [3, 0]), b: 1, w: 0 } });
    }
    function lens73(P, o) { // dall'alto: i gomiti restano a metà strada, non aperti a T
      var c = [72, 48], g = [];
      g.push(CI(c, 40, 'b', { 'stroke-width': 2, style: 'stroke:var(--line-strong)' }));
      g.push(rrect(add(c, [-10, 0]), 46, 24, 0, 'bf', 10), CI(add(c, [24, 0]), 8, 'bf'));
      [-1, 1].forEach(function (s) {
        var S = add(c, [10, s * 11]), Hn = add(c, [14, s * 26]), E0 = mix(mid(S, Hn), add(S, [-15, s * 15]), P.dn);
        g.push(L(S, E0, 5), L(E0, Hn, 4), CI(Hn, 3, 'b', SOLID));
      });
      o.push.apply(o, g);
    }
    var A73 = {
      id: 'E73', q: 1, v: [320, 160],
      aria: 'Figura di profilo in plank alto, corpo in linea e mani sotto le spalle: spinge il pavimento con le spalle lontane dalle orecchie, poi scende piano piegando i gomiti, non aperti, tenendo la spinta e il bacino in linea. Risale spingendo. Pochi e lenti, finché si tiene la spinta. Una lente dall\'alto mostra i gomiti',
      base: { dn: 0, cu2: 0, sh: 0, sa: 0 },
      keys: [
        { d: 2.5, s: 'Plank: mani sotto le spalle, corpo in linea', ss: 'Plank, corpo in linea', p: {}, k: 'no', vis: 'io', er: 1 },
        { d: 2.5, s: 'Spingi il pavimento, spalle lontane dalle orecchie', ss: 'Spingi il pavimento', p: { cu2: -6, sh: -3, sa: 1 }, k: 'gr', pu: 1 },
        { d: 3.5, s: 'Scendi piano, tieni la spinta', ss: 'Scendi piano', p: { dn: 1 }, k: 'gr', pu: 1 },
        { d: 1.5, s: 'Gomiti non aperti, bacino in linea', ss: 'Gomiti non aperti', p: {}, k: 'gr', pu: 1 },
        { d: 3, s: 'Risali spingendo il pavimento', ss: 'Risali spingendo', p: { dn: 0 }, k: 'gr', pu: 1 },
        { d: 2, s: 'Pochi e lenti: ' + FREE, ss: 'Pochi e lenti', p: { cu2: 0, sh: 0, sa: 0 }, k: 'no' }
      ],
      main: 2, strip: [0, 1, 2, 4],
      pre: function (P, c, o) { floor(320, GQ, o); },
      post: function (P, c, o, J) {
        var to = J.to, h = to.P, a = to.P, b = J.ln.A, s = to.S;
        lens73(P, o);
        o.push(TX([118, 26], 'gomiti', 't'), TX([118, 40], 'non aperti', 't'));
        if (c.k.pu) o.push(AR([W73[0] + 4, GQ + 3], [W73[0] + 4, GQ + 15], 'gr', 1));
        var sag = add(mid(b, s, 0.56), [0, 18]);
        o.push(G(op(c.k.er ? vis(c) : 0), [PL([b, sag, s], 0, 'ghost', { style: 'stroke-width:4' }), cross(add(sag, [0, 14]), 5), TX(add(sag, [11, 11]), 'il bacino', 't'), TX(add(sag, [11, 25]), 'non cade', 't')]));
        o.push(TX([12, 155], 'piano', 'tk'), TX([316, 155], 'scapole lontane', 't', 'end', op(P.sa)));
      }
    };
    A73.draw = (function (side) { return function (P, c) { return side(rig73(P), c); }; })(sideFig(A73));
    def(A73);
  })();
  /* ======================= FINE BLOCCO B ======================= */

  /* ---------- tempo, fasi, indicazioni ---------- */
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  function mix(a, b, t) {
    if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
    if (Array.isArray(a) && Array.isArray(b)) return a.map(function (v, i) { return mix(v, b[i], t); });
    if (isObj(a) && isObj(b)) {
      var r = {}, k;
      for (k in a) r[k] = (k in b) ? mix(a[k], b[k], t) : a[k];
      for (k in b) if (!(k in a)) r[k] = b[k];
      return r;
    }
    return t < 0.5 ? a : b;
  }
  var BK = ['pb', 'pc', 'pp', 'ps', 'br'];
  function bsum(P) { var s = 0; for (var i = 0; i < BK.length; i++) s += P[BK[i]] || 0; return s; }
  function resolve(P) { // bersagli calcolati sulla posa intera (mani che tengono il bastone…)
    var r = shallow(P, {});
    ['ln', 'lf', 'an', 'af'].forEach(function (k) { if (r[k] && typeof r[k].p === 'function') r[k] = shallow(r[k], { p: r[k].p(P) }); });
    return r;
  }
  function prep(A) {
    if (A.full) return A;
    var cur = A.base, t = 0, n = A.keys.length, i;
    A.full = []; A.start = [];
    for (i = 0; i < n; i++) { cur = shallow(cur, A.keys[i].p || {}); A.full.push(cur); A.start.push(t); t += A.keys[i].d; }
    A.full = A.full.map(resolve);
    A.total = t;
    for (i = 0; i < n; i++) {
      var k = A.keys[i];
      if (k.air == null) { var d = bsum(A.full[i]) - bsum(A.full[(i - 1 + n) % n]); k.air = d > 0.05 ? 1 : d < -0.05 ? -1 : 0; }
      if (!k.k) k.k = k.air ? 'br' : 'gr';
    }
    return A;
  }
  function get(id) { var A = LIB[id]; if (A && A.alias) A = LIB[A.alias]; return A ? prep(A) : null; }
  function at(A, time) {
    var n = A.keys.length, t = ((time % A.total) + A.total) % A.total, i = 0;
    while (i < n - 1 && t >= A.start[i + 1]) i++;
    // e: 'l' lineare; 'i' parte piano e arriva lanciata, 'o' parte lanciata e arriva piano: una coppia i+o passa per una
    // posa di mezzo senza fermarsi (E28)
    var k = A.keys[i], u = (t - A.start[i]) / k.d, P = mix(A.full[(i - 1 + n) % n], A.full[i],
      k.e === 'l' ? u : k.e === 'i' ? 1 - Math.cos(Math.PI * u / 2) : k.e === 'o' ? Math.sin(Math.PI * u / 2) : ease(u));
    var gk = k.g || k.s, j = i;
    while (j > 0 && (A.keys[j - 1].g || A.keys[j - 1].s) === gk) j--;
    return { P: P, k: k, u: u, txt: k.s + (k.n ? ' · ' + (Math.floor(t - A.start[j]) + 1) : '') };
  }
  function draw(A, P, k, time, u) { return A.draw(P, { time: time, air: k.air, k: k, u: u, w: A.v[0] }); }
  function vb(A) { return '0 ' + (A.v[2] || 0) + ' ' + A.v[0] + ' ' + A.v[1]; }
  function svgOpen(box, label) { return '<svg xmlns="' + NS + '" viewBox="' + box + '" role="img" aria-label="' + esc(label) + '">'; }

  /* ---------- striscia statica per la stampa ---------- */
  function wrap(s, max) {
    var w = s.split(' '), lines = [], cur = '';
    for (var i = 0; i < w.length; i++) {
      var nx = cur ? cur + ' ' + w[i] : w[i];
      if (nx.length > max && cur) { lines.push(cur); cur = w[i]; } else cur = nx;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function strip(id, n) {
    var A = get(id);
    if (!A) return '';
    var idx = A.strip ? A.strip.slice() : A.keys.map(function (_, i) { return i; }), i;
    if (n && n > idx.length) idx = A.keys.map(function (_, i) { return i; });
    if (n && n < idx.length) { var pick = []; for (i = 0; i < n; i++) pick.push(idx[Math.round(i * (idx.length - 1) / Math.max(1, n - 1))]); idx = pick; }
    var w = A.v[0], h = A.v[1], y0 = A.v[2] || 0, gap = 12, lab = 40, Wt = idx.length * w + (idx.length - 1) * gap;
    var s = svgOpen('0 0 ' + Wt + ' ' + (h + lab), (LIB[id].aria || A.aria) + ' Pose chiave: ' + idx.map(function (ki) { return A.keys[ki].ss || A.keys[ki].s; }).join(', ') + '.');
    idx.forEach(function (ki, c) {
      var k = A.keys[ki], els = draw(A, A.full[ki], k, 0, 0.5);
      s += '<g transform="translate(' + c * (w + gap) + ' 0)"><g transform="translate(0 ' + (-y0) + ')">' + els.map(ser).join('') + '</g>';
      var lines = wrap(k.ss || k.s, Math.floor((w - 34) / 6.8));
      s += ser(badge([14, h + 12], c + 1, k.k === 'gr' ? 'gr' : 'br', k.k === 'no' ? 0.5 : 1));
      lines.slice(0, 2).forEach(function (ln, li) { s += ser(TX([29, h + 16 + li * 15], ln, li ? 't' : 'tk')); });
      s += '</g>';
    });
    return s + '</svg>';
  }

  /* ---------- montaggio nella pagina ---------- */
  var CSS = '.qg-bar{display:flex;align-items:center;gap:10px;margin-top:8px;min-height:36px}' +
    '.qg-say{flex:1;min-width:0;margin:0;font:700 .95rem/1.3 var(--body);color:var(--ink);font-variant-numeric:tabular-nums}' +
    '.qg-say i{display:inline-block;width:.62em;height:.62em;border-radius:50%;background:var(--breath);margin-right:.5em;vertical-align:.04em}' +
    '.qg-say i.gr{background:var(--ground)}.qg-say i.no{background:var(--line-strong)}' +
    '.qg-play{flex:none;display:inline-flex;align-items:center;gap:7px;font:700 .8rem/1 var(--body);padding:8px 12px;border-radius:999px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);cursor:pointer;min-height:36px}' +
    '.qg-play:hover{border-color:var(--breath)}' +
    '.qg-ic{display:inline-block;width:0;height:0;border-style:solid;border-color:transparent transparent transparent currentColor;border-width:5px 0 5px 8px}' +
    '.qg-play[aria-pressed="true"] .qg-ic{width:8px;height:10px;border-width:0 3px;border-color:currentColor}';
  var styled = false;
  function style() {
    if (styled || !document.head) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true;
  }
  var live = [], raf = 0, last = 0;
  var lessMotion = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function render(F, time) {
    var r = at(F.A, time);
    patch(F.g, G({}, draw(F.A, r.P, r.k, time, r.u)));
    if (F.txt !== r.txt) { F.txt = r.txt; F.dot.className = r.k.k; F.say.textContent = r.txt; }
  }
  function running(F) { return F.play && F.vis && document.visibilityState !== 'hidden'; }
  function loop(now) {
    raf = 0;
    var dt = last ? Math.min(0.1, (now - last) / 1000) : 0, any = false;
    last = now;
    for (var i = 0; i < live.length; i++) {
      var F = live[i];
      if (!running(F)) continue;
      any = true; F.t += dt;
      if (now - F.drawn >= 33) { F.drawn = now; render(F, F.t); } // ~30 fotogrammi al secondo bastano
    }
    if (any) raf = requestAnimationFrame(loop); else last = 0;
  }
  function kick() { if (!raf && live.some(running)) { last = 0; raf = requestAnimationFrame(loop); } }
  var io = W.IntersectionObserver ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { var F = e.target._qg; if (F) F.vis = e.isIntersecting; });
    kick();
  }, { rootMargin: '40px' }) : null;
  document.addEventListener('visibilitychange', kick);

  function mount(el) {
    if (!el) return null;
    var id = el.getAttribute('data-anim'), A = get(id);
    if (el._qg) { // la stessa figura riusata per un altro esercizio (il player): si rimonta
      var old = el._qg;
      if (old.A === A && el.contains(old.g)) return old;
      var i = live.indexOf(old); if (i !== -1) live.splice(i, 1);
      if (io) io.unobserve(el);
      el._qg = null;
    }
    if (!A) return null;
    style();
    var cap = el.querySelector('figcaption');
    while (el.firstChild) el.removeChild(el.firstChild);
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', vb(A));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', LIB[id].aria || A.aria);
    var g = document.createElementNS(NS, 'g'); g._a = {}; svg.appendChild(g);
    var bar = document.createElement('div'); bar.className = 'qg-bar';
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'qg-play';
    btn.innerHTML = '<span class="qg-ic" aria-hidden="true"></span>Animazione';
    var say = document.createElement('p'); say.className = 'qg-say';
    var dot = document.createElement('i'); dot.setAttribute('aria-hidden', 'true');
    var sayT = document.createElement('span');
    say.appendChild(dot); say.appendChild(sayT); bar.appendChild(btn); bar.appendChild(say);
    el.appendChild(svg); el.appendChild(bar);
    if (cap) el.appendChild(cap);
    var main = A.main || 0;
    var F = { el: el, A: A, g: g, say: sayT, dot: dot, btn: btn, drawn: 0, vis: !io, play: !lessMotion.matches,
      t: lessMotion.matches ? A.start[main] + A.keys[main].d - 0.001 : 0 };
    btn.setAttribute('aria-pressed', F.play ? 'true' : 'false');
    btn.addEventListener('click', function () { F.play = !F.play; btn.setAttribute('aria-pressed', F.play ? 'true' : 'false'); kick(); });
    el._qg = F; live.push(F);
    render(F, F.t);
    if (io) io.observe(el);
    kick();
    return F;
  }
  function mountAll(root) {
    var list = (root || document).querySelectorAll('figure[data-anim]');
    for (var i = 0; i < list.length; i++) mount(list[i]);
  }
  function frame(id, t) { // un istante qualsiasi, come SVG statico (per le verifiche)
    var A = get(id); if (!A) return '';
    var r = at(A, t);
    return svgOpen(vb(A), A.aria) + draw(A, r.P, r.k, t, r.u).map(ser).join('') + '</svg>';
  }
  W.QGFig = {
    mount: mount, mountAll: mountAll, strip: strip, frame: frame,
    ids: function () { // E1…E31, T7, poi in coda quelli aggiunti dopo (q): E32, E33, T8…T12
      var by = function (a, b) { return (a[0] === 'T') - (b[0] === 'T') || parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10); };
      var old = ORDER.filter(function (id) { return !LIB[id].q; }), nw = ORDER.filter(function (id) { return LIB[id].q; });
      return old.sort(by).concat(nw.sort(by));
    },
    _j: function (id, t) { var A = get(id), r = at(A, t), c = { time: t, air: r.k.air, k: r.k, u: r.u, w: A.v[0] }; A.draw(r.P, c); return c.J; },
    info: function (id) { var A = get(id); return A ? { id: id, durata: A.total, fasi: A.keys.map(function (k) { return { s: k.s, d: k.d }; }) } : null; }
  };
})(window);
