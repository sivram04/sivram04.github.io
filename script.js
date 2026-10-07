/* Motion is progressive enhancement: every link, section and number works without this file. */
(() => {
  "use strict";
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement, page = document.getElementById("page");
  const svg = document.getElementById("graph"), bar = document.getElementById("bar"), main = document.querySelector("main");
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.append(n);
    return n;
  };
  // Hero order is top to bottom; after the two bends the same lines sit right to left in the gutter.
  const KEYS = ["s", "c", "i", "a"], PARENT = { a: "s", i: "a", c: "s" };
  const NAMES = { a: "Analytics", i: "AI & imaging", c: "Cloud & DevOps", s: "Software" };
  const len = (name) => parseFloat(getComputedStyle(root).getPropertyValue(name)) * parseFloat(getComputedStyle(root).fontSize);
  const laneKeys = (el) => (el.dataset.lanes || el.dataset.lane).split(" ");
  let runs = [], stops = [], yTop = 0, ySpine = 0, drawn = false;
root.classList.add("js");

  // Name the lines on each item, so the encoding never depends on colour or on the gutter alone.
  document.querySelectorAll("main [data-lanes]").forEach((item) => {
    const slot = item.querySelector(".lines");
    if (slot) slot.innerHTML = ["a", "i", "c", "s"].filter((k) => laneKeys(item).includes(k)).map((k) => `<span style="--lane:var(--${k})">${NAMES[k]}</span>`).join("");
  });
  document.querySelectorAll(".strip, .weeks").forEach((ul) => [...ul.children].forEach((li, n) => li.style.setProperty("--n", n)));

  function layout() {
    svg.setAttribute("height", 0);
    const pr = page.getBoundingClientRect(), W = page.clientWidth, H = page.offsetHeight;
    const gap = len("--gap"), rmin = len("--rmin"), pad = len("--pad"), sw = len("--sw");
    const wide = matchMedia("(min-width: 900px)").matches;
    svg.replaceChildren();
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const gBase = mk("g", {}, svg), gLive = mk("g", {}, svg), gStops = mk("g", {}, svg), gHeads = mk("g", {}, svg);
    const later = [];
    const gx = (k) => pad + (3 - k) * gap, cx3 = gx(0) + rmin;
    const mid = (el) => {
      const r = el.getBoundingClientRect(), lh = parseFloat(getComputedStyle(el).lineHeight) || r.height;
      return r.top - pr.top + Math.min(lh, r.height) / 2;
    };
    const yEnd = mid(document.getElementById("terminus"));
    const bend = document.querySelector(".bend"), bendTop = bend.getBoundingClientRect().top - pr.top;
    runs = [];
    stops = [];
    const addRun = (key, d, spine) => {
      const p = mk("path", { d, class: "lane l-" + key }, gLive), L = p.getTotalLength();
      p.style.strokeDasharray = `${L} ${L}`;
      runs.push({ p, L, S: L - (yEnd - spine), head: mk("circle", { r: sw * 0.95, class: "head l-" + key }, gHeads) });
    };

    if (wide) {
      const lis = [...document.querySelectorAll(".map li")];
      const rr = lis[0].querySelector(".rails").getBoundingClientRect();
      const y0 = rr.top - pr.top + (rr.height - 3 * gap) / 2, yk = (k) => y0 + k * gap;
      const sx = lis.map((li) => { const r = li.getBoundingClientRect(); return r.left - pr.left + r.width / 2; });
      const cx1 = W - pad - rmin - 3 * gap, cy1 = y0 + rmin + 3 * gap;
      const cy2 = Math.max(cy1, bendTop + bend.offsetHeight - 2 * rmin - 3 * gap), cy3 = cy2 + 2 * rmin + 3 * gap;
      const T = 1500, span = cx1 - sx[0], intro = !still && !drawn;
      yTop = y0;
      ySpine = cy3;
      KEYS.forEach((key, k) => {
        const x = sx[lis.findIndex((li) => laneKeys(li).includes(key))], y = yk(k);
        const r1 = rmin + (3 - k) * gap, r3 = rmin + k * gap;
        let x0 = x, hero = `M${x} ${y}`;
        if (PARENT[key]) {
          const py = yk(KEYS.indexOf(PARENT[key])), bw = Math.min(90, (sx[1] - sx[0]) * 0.7);
          x0 = x - bw;
          hero = `M${x0} ${py}C${x0 + bw * 0.5} ${py} ${x - bw * 0.5} ${y} ${x} ${y}`;
        }
        hero += `H${cx1}`;
        const tail = `A${r1} ${r1} 0 0 1 ${cx1 + r1} ${cy1}V${cy2}A${r1} ${r1} 0 0 1 ${cx1} ${cy2 + r1}H${cx3}A${r3} ${r3} 0 0 0 ${cx3 - r3} ${cy3}V${yEnd}`;
        mk("path", { d: hero + tail, class: "track" }, gBase);
        const hp = mk("path", { d: hero, class: "lane l-" + key }, gLive);
        if (intro) {
          const hl = hp.getTotalLength();
          hp.style.strokeDasharray = `${hl} ${hl}`;
          hp.style.strokeDashoffset = hl;
          later.push(() => {
            hp.style.transition = `stroke-dashoffset ${(T * (cx1 - x0)) / span}ms linear ${350 + (T * (x0 - sx[0])) / span}ms`;
            hp.style.strokeDashoffset = 0;
          });
        }
        addRun(key, `M${cx1} ${y}` + tail, cy3);
      });
      lis.forEach((li, n) => {
        const ys = laneKeys(li).map((key) => yk(KEYS.indexOf(key))), g = mk("g", { class: "stop" }, gStops);
        if (ys.length > 1) mk("line", { x1: sx[n], x2: sx[n], y1: Math.min(...ys), y2: Math.max(...ys), class: "link" }, g);
        ys.forEach((y) => mk("circle", { cx: sx[n], cy: y, r: sw * 1.05, class: "ring" }, g));
        if (intro) {
          g.style.transitionDelay = `${350 + (T * (sx[n] - sx[0])) / span}ms`;
          later.push(() => g.classList.add("on"));
        } else g.classList.add("on");
      });
    } else {
      const cy3 = bendTop + bend.offsetHeight;
      yTop = bendTop;
      ySpine = cy3;
      KEYS.forEach((key, k) => {
        const r3 = rmin + k * gap, d = `M${W + 12} ${cy3 - r3}H${cx3}A${r3} ${r3} 0 0 0 ${cx3 - r3} ${cy3}V${yEnd}`;
        mk("path", { d, class: "track" }, gBase);
        addRun(key, d, cy3);
      });
    }

    document.querySelectorAll("main [data-lanes], main [data-lane]").forEach((item) => {
      const minor = item.hasAttribute("data-lane"), kind = !minor ? "major" : item.hasAttribute("data-gate") ? "gate" : "minor";
      const y = mid(minor || item.matches("h2, h3") ? item : item.querySelector("h3") || item);
      const xs = laneKeys(item).map((key) => gx(KEYS.indexOf(key))), g = mk("g", { class: "stop " + kind }, gStops);
      if (xs.length > 1) mk("line", { x1: Math.min(...xs), x2: Math.max(...xs), y1: y, y2: y, class: "link" }, g);
      xs.forEach((x) => {
        if (kind === "gate") mk("rect", { x: x - sw * 0.8, y: y - sw * 0.8, width: sw * 1.6, height: sw * 1.6, transform: `rotate(45 ${x} ${y})`, class: "ring" }, g);
        else mk("circle", { cx: x, cy: y, r: kind === "minor" ? sw * 0.7 : sw * 1.05, class: "ring" }, g);
      });
      stops.push({ y, g });
    });
    update();
    if (later.length) requestAnimationFrame(() => requestAnimationFrame(() => later.forEach((fn) => fn())));
  }

  // The head of every line follows the scroll: round the bends, then straight down the gutter.
  function update() {
    const atEnd = scrollY + innerHeight >= root.scrollHeight - 4;
    const head = atEnd ? Infinity : scrollY + innerHeight * 0.64 * Math.min(1, scrollY / 240);
    runs.forEach((r) => {
      const n = still ? r.L : head <= yTop ? 0 : head < ySpine ? (r.S * (head - yTop)) / (ySpine - yTop) : Math.min(r.L, r.S + head - ySpine);
      r.p.style.strokeDashoffset = r.L - n;
      const pt = r.p.getPointAtLength(n);
      r.head.setAttribute("cx", pt.x);
      r.head.setAttribute("cy", pt.y);
      r.head.style.opacity = !still && n > 2 && n < r.L - 2 ? 1 : 0;
    });
    stops.forEach((s) => {
      const on = still || head >= s.y;
      if (s.on !== on) { s.on = on; s.g.classList.toggle("on", on); }
    });
    bar.classList.toggle("stuck", scrollY > 8);
  }
  let queued = false;
  addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });

  // Counts drawn one square each, in blocks of a hundred so they can be read as well as seen.
const lit = new WeakMap();
function units(cv, upto) {
  const n = +cv.dataset.n, w = cv.clientWidth, dpr = devicePixelRatio || 1;
  if (!w) return;
  const gapB = Math.max(4, w * 0.022), p = (w - 4 * gapB) / 50, cell = p * 0.72, blocks = Math.ceil(n / 100), rows = Math.ceil(blocks / 5);
  const lastFull = blocks - (rows - 1) * 5 > 1 || n % 100 === 0;
  const h = (rows - 1) * (10 * p + gapB) + (lastFull ? 10 : Math.ceil((n % 100) / 10)) * p - (p - cell);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.style.height = h + "px";
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const c = cv.getContext("2d"), on = getComputedStyle(cv).getPropertyValue("--lane").trim(), off = getComputedStyle(root).getPropertyValue("--track").trim();
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const b = Math.floor(i / 100), k = i % 100;
    c.fillStyle = i < upto ? on : off;
    c.fillRect((b % 5) * (10 * p + gapB) + (k % 10) * p, Math.floor(b / 5) * (10 * p + gapB) + Math.floor(k / 10) * p, cell, cell);
  }
}
const sizeUnits = () => document.querySelectorAll(".units").forEach((cv) => units(cv, lit.get(cv) ? +cv.dataset.n : 0));
function fillUnits(cv) {
  lit.set(cv, true);
  if (still) return units(cv, +cv.dataset.n);
  const t0 = performance.now(), n = +cv.dataset.n;
  (function step(now) {
    const p = Math.min(1, (now - t0) / 1500);
    units(cv, Math.round(n * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

const seen = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    seen.unobserve(e.target);
    if (e.target.matches(".units")) fillUnits(e.target);
    else e.target.classList.add("in");
  }), { threshold: 0.45 });
  document.querySelectorAll(".pair, .tally, .strip, .weeks, .forecast, .units").forEach((el) => seen.observe(el));

  // Follow one line: everything off that line steps back.
  const riders = [...document.querySelectorAll("[data-ride]")];
  riders.forEach((b) => b.addEventListener("click", () => {
    const k = root.dataset.ride === b.dataset.ride ? "" : b.dataset.ride;
    if (k) root.dataset.ride = k;
    else delete root.dataset.ride;
    riders.forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.ride === k)));
  }));

  // Section in view.
  const links = [...document.querySelectorAll(".bar nav a")];
  const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => (a.getAttribute("href") === "#" + e.target.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
  }), { rootMargin: "-35% 0px -60% 0px" });
  document.querySelectorAll("main section").forEach((s) => spy.observe(s));

  // Certificate viewer.
  const viewer = document.getElementById("viewer"), shot = viewer.querySelector("img");
  let opener = null;
  document.querySelectorAll("[data-cert]").forEach((b) => b.addEventListener("click", () => {
    opener = b;
    shot.src = b.dataset.cert;
    shot.alt = b.dataset.title + " certificate";
    viewer.querySelector("h2").textContent = b.dataset.title;
    viewer.showModal();
  }));
  viewer.querySelector("button").addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener("close", () => opener && opener.focus());

  // The only network write on the page: the visitor's own, validated message.
const form = document.getElementById("contactForm"), note = document.getElementById("formStatus");
let sending = false;
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (sending || !form.reportValidity()) return;
  sending = true;
  const send = form.querySelector("button");
  send.disabled = true;
  note.textContent = "Sending your message…";
  try {
    const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("not delivered");
    note.textContent = "Message sent. Thank you, I will reply soon.";
    form.reset();
  } catch {
    note.textContent = "That did not send. Please try again, or email sivmm29@gmail.com.";
  } finally {
    sending = false;
    send.disabled = false;
  }
});

// First layout once type and images have their final size; redo it whenever the content column changes size.
  let wait = 0;
  const redo = () => { sizeUnits(); layout(); };
  const loaded = new Promise((done) => (document.readyState === "complete" ? done() : addEventListener("load", done, { once: true })));
  Promise.all([document.fonts.ready, loaded]).then(() => {
    redo();
    setTimeout(() => { drawn = true; }, 2600);
    new ResizeObserver(() => { clearTimeout(wait); wait = setTimeout(redo, 120); }).observe(main);
  });
})();
