/* =========================================================
   Interactive Data Story — behaviour
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  if (stored) root.setAttribute("data-theme", stored);

  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.classList.contains("nav-link")) navLinks.classList.remove("open");
    });
  }

  /* ---------- Scroll progress ---------- */
  var progress = document.getElementById("scrollProgress");
  function onScrollProgress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? h.scrollTop / max : 0;
    if (progress) progress.style.transform = "scaleX(" + p + ")";
  }
  window.addEventListener("scroll", onScrollProgress, { passive: true });
  onScrollProgress();

  /* ---------- Count-up animation ---------- */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function formatNumber(value, decimals) {
    var parts = value.toFixed(decimals).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1500;

    var finalText = prefix + formatNumber(target, decimals) + suffix;
    if (reduceMotion) {
      el.textContent = finalText;
      return;
    }
    var done = false;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var val = target * easeOutCubic(t);
      el.textContent = prefix + formatNumber(val, decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else { done = true; el.textContent = finalText; }
    }
    requestAnimationFrame(step);
    // Safety net: if rAF never runs (e.g. page never composited), still show the value.
    setTimeout(function () { if (!done) el.textContent = finalText; }, 2200);
  }

  /* ---------- Reveal + chart + counter observer ---------- */
  var counted = new WeakSet();

  function triggerCounters(container) {
    var nums = container.querySelectorAll("[data-count]");
    for (var i = 0; i < nums.length; i++) {
      if (!counted.has(nums[i])) {
        counted.add(nums[i]);
        animateCount(nums[i]);
      }
    }
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      triggerCounters(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".reveal, .chart[data-observe]").forEach(function (el) {
    io.observe(el);
  });

  // hero counters fire on load (above the fold)
  var heroPanel = document.getElementById("heroPanel");
  if (heroPanel) {
    heroPanel.classList.add("in");
    setTimeout(function () { triggerCounters(heroPanel); }, 300);
  }

  /* ---------- Scrollspy (active nav link) ---------- */
  var sections = [].slice.call(document.querySelectorAll("section[id], header[id]"));
  var linkMap = {};
  document.querySelectorAll(".nav-link").forEach(function (a) {
    var id = a.getAttribute("href").replace("#", "");
    linkMap[id] = a;
  });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.getAttribute("id");
      Object.keys(linkMap).forEach(function (k) { linkMap[k].classList.remove("active"); });
      if (linkMap[id]) linkMap[id].classList.add("active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(function (s) { spy.observe(s); });

  /* ---------- Command palette ---------- */
  var overlay = document.getElementById("cmdk");
  var input = document.getElementById("cmdkInput");
  var list = document.getElementById("cmdkList");
  var items = [];
  var activeIdx = 0;

  if (overlay && input && list) {
    var commands = [
      { label: "About", sub: "Section", href: "#about", icon: iconUser() },
      { label: "Skills", sub: "Section", href: "#skills", icon: iconLayers() },
      { label: "Work", sub: "Section", href: "#work", icon: iconChart() },
      { label: "Experience", sub: "Section", href: "#experience", icon: iconBriefcase() },
      { label: "Education", sub: "Section", href: "#education", icon: iconCap() },
      { label: "Certifications", sub: "Section", href: "#certifications", icon: iconBadge() },
      { label: "Contact", sub: "Section", href: "#contact", icon: iconMail() },
      { label: "Download Résumé", sub: "PDF", href: "assets/Sivaram_Resume.pdf", external: true, icon: iconDownload() },
      { label: "GitHub", sub: "External", href: "https://github.com/sivram04", external: true, icon: iconGithub() },
      { label: "LinkedIn", sub: "External", href: "https://www.linkedin.com/in/sivaramvangavolu/", external: true, icon: iconLinkedin() },
      { label: "Toggle theme", sub: "Action", action: "theme", icon: iconMoon() }
    ];

    function renderList(filter) {
      list.innerHTML = "";
      items = [];
      var f = (filter || "").toLowerCase().trim();
      var matched = commands.filter(function (c) { return c.label.toLowerCase().indexOf(f) !== -1; });
      if (matched.length === 0) {
        list.innerHTML = '<div class="cmdk-empty">No matches</div>';
        return;
      }
      matched.forEach(function (c, i) {
        var el = document.createElement("div");
        el.className = "cmdk-item" + (i === 0 ? " active" : "");
        el.innerHTML = '<span class="ci">' + c.icon + '</span><span class="cl">' + c.label + '</span><span class="cs">' + c.sub + "</span>";
        el.addEventListener("click", function () { runCommand(c); });
        el.addEventListener("mousemove", function () { setActive(i); });
        list.appendChild(el);
        items.push({ el: el, cmd: c });
      });
      activeIdx = 0;
    }

    function setActive(i) {
      if (!items.length) return;
      activeIdx = (i + items.length) % items.length;
      items.forEach(function (it, idx) { it.el.classList.toggle("active", idx === activeIdx); });
      items[activeIdx].el.scrollIntoView({ block: "nearest" });
    }

    function runCommand(c) {
      closePalette();
      if (c.action === "theme") { themeBtn && themeBtn.click(); return; }
      if (c.external) { window.open(c.href, "_blank", "noopener"); return; }
      var target = document.querySelector(c.href);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }

    function openPalette() {
      overlay.classList.add("open");
      input.value = "";
      renderList("");
      setTimeout(function () { input.focus(); }, 30);
    }
    function closePalette() { overlay.classList.remove("open"); }

    input.addEventListener("input", function () { renderList(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIdx + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIdx - 1); }
      else if (e.key === "Enter") { e.preventDefault(); if (items[activeIdx]) runCommand(items[activeIdx].cmd); }
      else if (e.key === "Escape") { closePalette(); }
    });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closePalette(); });

    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        overlay.classList.contains("open") ? closePalette() : openPalette();
      }
    });

    document.querySelectorAll("[data-open-cmdk]").forEach(function (b) {
      b.addEventListener("click", openPalette);
    });
  }

  /* ---------- Experience: expand / collapse responsibilities ---------- */
  document.querySelectorAll(".xp-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".xp-card");
      if (!card) return;
      var open = card.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      var label = btn.querySelector(".xp-label");
      if (label) label.textContent = open
        ? (btn.getAttribute("data-hide") || "Hide responsibilities")
        : (btn.getAttribute("data-show") || "View responsibilities");
    });
  });

  /* ---------- Contact form (Formspree) ---------- */
  var form = document.getElementById("contactForm");
  var statusEl = document.getElementById("formStatus");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.textContent = "Sending…";
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (!res.ok) throw new Error("fail");
        statusEl.textContent = "✅ Message sent — I'll get back to you soon.";
        form.reset();
      }).catch(function () {
        statusEl.textContent = "❌ Something went wrong. Please try again later.";
      });
    });
  }

  /* ---------- Inline icon helpers (for palette) ---------- */
  function iconUser() { return '<svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z"/></svg>'; }
  function iconLayers() { return '<svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5Zm0 8L2 15l10 5 10-5Z"/></svg>'; }
  function iconChart() { return '<svg viewBox="0 0 24 24"><path d="M4 20V10h3v10Zm6.5 0V4h3v16Zm6.5 0v-7h3v7Z"/></svg>'; }
  function iconBriefcase() { return '<svg viewBox="0 0 24 24"><path d="M9 4h6a2 2 0 0 1 2 2v1h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3V6a2 2 0 0 1 2-2Zm0 3h6V6H9Z"/></svg>'; }
  function iconCap() { return '<svg viewBox="0 0 24 24"><path d="M12 3 1 8l11 5 9-4.09V15h2V8Zm-7 8.2v3.3c0 1.66 3.13 3 7 3s7-1.34 7-3v-3.3l-7 3.18Z"/></svg>'; }
  function iconBadge() { return '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Zm-1.2 13-3.3-3.3 1.4-1.4 1.9 1.9 4.3-4.3 1.4 1.4Z"/></svg>'; }
  function iconMail() { return '<svg viewBox="0 0 24 24"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7 8-5H4Z"/></svg>'; }
  function iconDownload() { return '<svg viewBox="0 0 24 24"><path d="M11 4h2v7h3l-4 5-4-5h3Zm-6 13h14v2H5Z"/></svg>'; }
  function iconMoon() { return '<svg viewBox="0 0 24 24"><path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z"/></svg>'; }
  function iconGithub() { return '<svg viewBox="0 0 24 24"><path d="M12 .5C5.7.5.5 5.7.5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.2.8-.5v-1.9c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17 4.5 18 4.8 18 4.8c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5Z"/></svg>'; }
  function iconLinkedin() { return '<svg viewBox="0 0 24 24"><path d="M5 3.5A2.5 2.5 0 1 1 2.5 6 2.5 2.5 0 0 1 5 3.5ZM.5 8h4v15h-4Zm7 0h3.8v2h.1c.5-1 1.8-2.1 3.8-2.1 4 0 4.8 2.6 4.8 6V23h-4v-6.6c0-1.6 0-3.6-2.2-3.6s-2.5 1.7-2.5 3.5V23h-4Z"/></svg>'; }
})();
