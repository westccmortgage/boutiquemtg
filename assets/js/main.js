/* boutiquemtg.com — interactions */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- nav ---------- */
  const nav = $(".nav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = $(".nav-toggle");
  const menu = $(".mobile-menu");
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
  }

  /* active section highlight */
  const sections = $$("section[id]");
  const navLinks = $$(".nav-links a");
  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- reveal on scroll ---------- */
  const reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const ro = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => ro.observe(el));
  }

  /* ---------- pointer glow (desktop only) ---------- */
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const glow = $(".cursor-glow");
  if (finePointer && glow && !reduceMotion) {
    document.body.classList.add("has-pointer");
    let gx = 0, gy = 0, tx = 0, ty = 0, raf = null;
    const tick = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx - 260}px, ${gy - 260}px)`;
      if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) raf = requestAnimationFrame(tick); else raf = null;
    };
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  }

  /* per-element spotlight coords for .btn / .pillar */
  $$(".btn, .pillar").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    }, { passive: true });
  });

  /* ---------- hero scenario cards ---------- */
  const visual = $(".hero-visual");
  const cards = $$(".scard");
  const dots = $$(".hero-dots button");
  if (cards.length) {
    let idx = 0, timer = null;
    const n = cards.length;
    const render = () => {
      cards.forEach((c, i) => {
        const rel = (i - idx + n) % n;
        c.classList.remove("pos-0", "pos-1", "pos-2", "pos-out");
        c.classList.add(rel < 3 ? "pos-" + rel : "pos-out");
        c.setAttribute("aria-hidden", String(rel !== 0));
      });
      dots.forEach((d, i) => d.setAttribute("aria-current", String(i === idx)));
    };
    const go = (i) => { idx = (i + n) % n; render(); restart(); };
    const restart = () => { if (reduceMotion) return; clearInterval(timer); timer = setInterval(() => go(idx + 1), 4200); };
    dots.forEach((d, i) => d.addEventListener("click", () => go(i)));
    render(); restart();

    if (finePointer && visual && !reduceMotion) {
      visual.addEventListener("pointermove", (e) => {
        const r = visual.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const top = cards[idx];
        top.style.setProperty("--ry", (x * 14).toFixed(2) + "deg");
        top.style.setProperty("--rx", (-y * 14).toFixed(2) + "deg");
      }, { passive: true });
      visual.addEventListener("pointerleave", () => cards.forEach((c) => { c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); }));
    }
  }

  /* ---------- counters ---------- */
  const counters = $$("[data-count]");
  if (counters.length) {
    const fmt = (v, dec) => v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const run = (el) => {
      const end = parseFloat(el.dataset.count);
      const dec = (el.dataset.count.split(".")[1] || "").length;
      if (reduceMotion) { el.textContent = fmt(end, dec); return; }
      const t0 = performance.now(), dur = 1600;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(end * e, dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      const co = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { run(en.target); co.unobserve(en.target); }
      }), { threshold: 0.5 });
      counters.forEach((c) => co.observe(c));
    } else counters.forEach(run);
  }

  /* ---------- payment estimator ---------- */
  const est = $("#estimator-form");
  if (est) {
    const price = $("#f-price"), down = $("#f-down"), rate = $("#f-rate"), taxRate = $("#f-tax");
    const termBtns = $$("[data-term]", est);
    const incl = $("#f-incl");
    const outs = {
      price: $("#o-price"), down: $("#o-down"), rate: $("#o-rate"), tax: $("#o-tax"),
      total: $("#r-total"), pi: $("#r-pi"), tx: $("#r-tx"), ins: $("#r-ins"), mi: $("#r-mi"), loan: $("#r-loan"), ltv: $("#r-ltv"),
      bpi: $("#b-pi"), btx: $("#b-tx"), bins: $("#b-ins"), bmi: $("#b-mi"), miRow: $("#row-mi"), term: $("#r-term")
    };
    let term = 30;
    const usd = (v) => "$" + Math.round(v).toLocaleString("en-US");
    const usd0 = (v) => Math.round(v).toLocaleString("en-US");
    const paintRange = (r) => {
      const p = ((r.value - r.min) / (r.max - r.min)) * 100;
      r.style.setProperty("--p", p + "%");
    };
    const calc = () => {
      const P = +price.value, dp = +down.value / 100, r = +rate.value / 100 / 12, nM = term * 12;
      const loan = P * (1 - dp);
      const pi = r > 0 ? (loan * r) / (1 - Math.pow(1 + r, -nM)) : loan / nM;
      const tx = incl.checked ? (P * (+taxRate.value / 100)) / 12 : 0;
      const ins = incl.checked ? (P * 0.0035) / 12 : 0;          /* ~0.35% of value / yr, illustrative */
      const ltv = (1 - dp) * 100;
      const mi = incl.checked && ltv > 80 ? (loan * (ltv > 95 ? 0.0095 : ltv > 90 ? 0.0075 : ltv > 85 ? 0.0055 : 0.004)) / 12 : 0;
      const total = pi + tx + ins + mi;

      outs.price.textContent = usd(P); outs.down.textContent = down.value + "% · " + usd(P * dp);
      outs.rate.textContent = (+rate.value).toFixed(3) + "%"; outs.tax.textContent = (+taxRate.value).toFixed(2) + "%";
      outs.total.textContent = usd0(total);
      outs.pi.textContent = usd(pi); outs.tx.textContent = usd(tx); outs.ins.textContent = usd(ins); outs.mi.textContent = usd(mi);
      outs.loan.textContent = usd(loan); outs.ltv.textContent = ltv.toFixed(0) + "% LTV"; outs.term.textContent = term + "-year fixed";
      outs.miRow.style.display = mi > 0 ? "" : "none";
      const pct = (v) => (total ? (v / total) * 100 : 0) + "%";
      outs.bpi.style.width = pct(pi); outs.btx.style.width = pct(tx); outs.bins.style.width = pct(ins); outs.bmi.style.width = pct(mi);
      [price, down, rate, taxRate].forEach(paintRange);
    };
    [price, down, rate, taxRate].forEach((i) => i.addEventListener("input", calc));
    incl.addEventListener("change", calc);
    termBtns.forEach((b) => b.addEventListener("click", () => {
      term = +b.dataset.term;
      termBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      calc();
    }));
    calc();

    /* carry the scenario into the contact form */
    const carry = $("#carry-scenario");
    if (carry) carry.addEventListener("click", () => {
      const msg = $("#c-message");
      if (msg && !msg.value.trim()) {
        msg.value = `Scenario from the estimator: price ${outs.price.textContent}, down ${outs.down.textContent}, ${term}-yr fixed at ${outs.rate.textContent}. Estimated payment ~$${outs.total.textContent}/mo.`;
      }
    });
  }

  /* ---------- contact form (Netlify Forms, AJAX) ---------- */
  const form = $("#contact-form");
  if (form) {
    const wrap = form.closest(".form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const btn = $("button[type=submit]", form);
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";
      wrap.classList.remove("error");
      try {
        const body = new URLSearchParams(new FormData(form)).toString();
        const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
        if (!res.ok) throw new Error("HTTP " + res.status);
        wrap.classList.add("sent");
        wrap.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      } catch (err) {
        wrap.classList.add("error");
        btn.disabled = false; btn.textContent = label;
      }
    });
  }

  /* ---------- footer year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();

/* ============================================================
   Integrations: attribution + reliable lead delivery, live rates,
   AI concierge, GR CRM booking, estimator → concierge hand-off
   ============================================================ */
(function () {
  "use strict";
  const cfg = window.BQ_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.dataLayer = window.dataLayer || [];
  const push = (event, detail) => window.dataLayer.push(Object.assign({ event }, detail || {}));
  const lang = () => (window.BQi18n ? window.BQi18n.get() : "en");

  /* ---------- attribution (UTM / click IDs / landing page), same keys as the WCCM sites ---------- */
  const ATTR = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "fbclid"];
  const param = (k) => { try { return new URLSearchParams(location.search).get(k) || ""; } catch (e) { return ""; } };
  const ss = { get: (k) => { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  ATTR.forEach((k) => { const v = param(k); if (v) ss.set("bq_" + k, v); });
  if (!ss.get("bq_landing_page")) ss.set("bq_landing_page", location.href);
  if (!ss.get("bq_referrer")) ss.set("bq_referrer", document.referrer || "direct");
  const uuid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  const setHidden = (form, name, value) => { const el = form.querySelector(`input[name="${name}"]`); if (el && value != null) el.value = value; };
  function stampForm(form) {
    ATTR.forEach((k) => setHidden(form, k, param(k) || ss.get("bq_" + k)));
    setHidden(form, "landing_page", ss.get("bq_landing_page") || location.href);
    setHidden(form, "conversion_page", location.href);
    setHidden(form, "source_path", location.pathname);
    setHidden(form, "page_path", location.pathname);
    setHidden(form, "referrer", ss.get("bq_referrer") || document.referrer || "direct");
    setHidden(form, "language", lang());
    if (!form.querySelector('input[name="submission_id"]').value) setHidden(form, "submission_id", uuid());
  }

  /* ---------- lead form: Netlify Forms (AJAX) with retry; dataLayer conversion event; CRM relay happens server-side ---------- */
  const form = $("#contact-form");
  if (form) {
    stampForm(form);
    const wrap = form.closest(".form");
    const btn = $("button[type=submit]", form);
    const encode = (f) => new URLSearchParams(new FormData(f)).toString();
    const post = (body) => fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const phone = $("#c-phone").value.replace(/\D/g, ""), email = $("#c-email").value.trim();
      if (!phone && !email) { $("#c-phone").setCustomValidity("Add a phone or email"); form.reportValidity(); $("#c-phone").setCustomValidity(""); return; }
      stampForm(form);
      const summary = window.BQChat && window.BQChat.summary ? window.BQChat.summary() : "";
      if (summary) setHidden(form, "concierge_summary", summary);
      const label = btn.textContent; btn.disabled = true; btn.textContent = "Sending…"; wrap.classList.remove("error");
      const body = encode(form);
      let ok = false;
      for (const delay of [0, 1500, 4000]) {
        if (delay) await new Promise((r) => setTimeout(r, delay));
        try { const res = await post(body); if (res.ok) { ok = true; break; } } catch (err) { /* retry */ }
      }
      if (ok) {
        const id = form.querySelector('input[name="submission_id"]').value;
        push("wccm_lead_submit", { lead_event_id: id, form_name: "boutique-scenario", goal: (form.querySelector('input[name="goal"]:checked') || {}).value, state: $("#c-state").value, site: cfg.SITE });
        wrap.classList.add("sent");
        wrap.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      } else {
        wrap.classList.add("error"); btn.disabled = false; btn.textContent = label;
      }
    });
  }
  /* smooth-scroll helpers + program → concierge prefill */
  document.addEventListener("click", (e) => {
    const s = e.target.closest("[data-scroll]"); if (s) { const t = $(s.getAttribute("data-scroll")); if (t) t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }
    const a = e.target.closest("[data-ask]");
    if (a) {
      e.preventDefault();
      const tag = a.querySelector("h3"); if (tag && form) setHidden(form, "program_interest", tag.textContent.trim());
      window.BQChat && window.BQChat.ask(a.getAttribute("data-ask"));
    }
  });

  /* ---------- live rates board (proxied from the WCCM rate desk) ---------- */
  const grid = $("#rates-grid"), meta = $("#rates-meta");
  if (grid && cfg.RATES_URL) {
    const use = { Conventional: "Well-qualified purchase or refi", FHA: "Lower down payment", VA: "Eligible veterans", Jumbo: "Above conforming limits", "Non-QM": "Alternative documentation", DSCR: "Investor cash-flow", USDA: "Eligible rural areas" };
    fetch(cfg.RATES_URL, { headers: { accept: "application/json" } }).then((r) => r.json()).then((d) => {
      if (!d || !d.ok || !d.products || !d.products.length) throw new Error("empty");
      const products = d.products.filter((p) => /30-Year/i.test(p.name)).slice(0, 8);
      grid.innerHTML = products.map((p) => {
        const short = p.name.replace(/\s*30-Year Fixed/i, "").replace(/\(A\+\)/, "").trim();
        const key = Object.keys(use).find((k) => short.indexOf(k) === 0) || "";
        const r = Number(p.rate);
        return `<article class="rate-card"><small>${short} · 30-yr fixed</small><b>${r.toFixed(3)}<i>%</i></b><div class="use">${use[key] || "Sample pricing"}</div><button type="button" data-rate="${r}" data-program="${short}">Use in estimator →</button></article>`;
      }).join("");
      if (meta) meta.textContent = (d.effective ? "Effective " + d.effective : "Latest board") + " · sample pricing";
      grid.addEventListener("click", (e) => {
        const b = e.target.closest("[data-rate]"); if (!b) return;
        const rate = $("#f-rate"); if (rate) { rate.value = b.getAttribute("data-rate"); rate.dispatchEvent(new Event("input", { bubbles: true })); }
        if (form) setHidden(form, "program_interest", b.getAttribute("data-program"));
        const est = $("#estimate"); if (est) est.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        push("bq_rate_use", { program: b.getAttribute("data-program") });
      });
      if (window.BQi18n) window.BQi18n.apply(grid);
    }).catch(() => {
      grid.innerHTML = `<div class="rates-empty">Today's board is being updated. <a href="https://westcoastcapitalmortgage.com/rates" target="_blank" rel="noopener">See current sample rates →</a></div>`;
      if (meta) meta.textContent = "";
    });
  }

  /* ---------- AI concierge ---------- */
  const log = $("#chat-log"), chatForm = $("#chat-form"), input = $("#chat-input"), status = $("#chat-status"), fab = $("#chat-fab"), chatBox = $("#chat");
  if (log && chatForm) {
    const history = [];
    let lastSummary = "", busy = false, disabled = false;
    const add = (cls, text) => { const d = document.createElement("div"); d.className = "msg " + cls; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
    const typing = () => { const d = document.createElement("div"); d.className = "msg bot typing"; d.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
    const estimatorContext = () => {
      const g = (id) => { const el = $(id); return el ? el.textContent : ""; };
      return $("#r-total") ? { price: g("#o-price"), down: g("#o-down"), rate: g("#o-rate"), term: g("#r-term"), estimated_payment: "$" + g("#r-total") + "/mo", loan: g("#r-loan"), ltv: g("#r-ltv") } : null;
    };
    const offline = () => {
      disabled = true; if (status) status.textContent = "Concierge resting · humans are on";
      add("bot", "The AI concierge is taking a break right now. Send your scenario through the form below, or call (310) 654-1577 and a licensed loan officer will pick it up personally.");
    };
    async function send(text) {
      text = (text || "").trim(); if (!text || busy) return;
      if (disabled) { add("user", text); add("bot", "Our team will answer this personally — use the form below or call (310) 654-1577."); return; }
      busy = true; add("user", text); history.push({ role: "user", content: text }); input.value = ""; autosize();
      const t = typing(); if (status) status.textContent = "Thinking…";
      push("bq_concierge_message", { turn: history.length });
      try {
        const res = await fetch(cfg.CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-16), lang: lang(), context: estimatorContext() }) });
        const data = await res.json().catch(() => ({}));
        t.remove();
        if (res.status === 503 || data.error === "concierge_not_configured") { history.pop(); offline(); return; }
        if (!res.ok || !data.ok) { history.pop(); add("err", data.error || "Something went wrong. Try again in a moment."); return; }
        history.push({ role: "assistant", content: data.reply });
        const m = add("bot", data.reply);
        if (data.summary) {
          lastSummary = data.summary;
          const h = document.createElement("a"); h.href = "#contact"; h.className = "handoff"; h.textContent = "Send this scenario to a loan officer →";
          h.addEventListener("click", () => { const msg = $("#c-message"); if (msg && !msg.value.trim()) msg.value = "From the concierge: " + lastSummary; });
          m.appendChild(document.createElement("br")); m.appendChild(h);
        }
      } catch (err) { t.remove(); history.pop(); add("err", "Connection hiccup. Try again, or call (310) 654-1577."); }
      finally { busy = false; if (status && !disabled) status.textContent = "Online · powered by Claude"; }
    }
    function autosize() { input.style.height = "auto"; input.style.height = Math.min(140, input.scrollHeight) + "px"; }
    input.addEventListener("input", autosize);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chatForm.requestSubmit(); } });
    chatForm.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
    window.BQChat = {
      ask(q) { const sec = $("#concierge"); if (sec) sec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); setTimeout(() => send(q), reduceMotion ? 0 : 500); },
      summary: () => lastSummary
    };
    $$(".concierge-chips button").forEach((b) => b.addEventListener("click", () => send(b.getAttribute("data-ask"))));
    const askEst = $("#ask-estimate");
    if (askEst) askEst.addEventListener("click", () => { const c = estimatorContext(); window.BQChat.ask(`I'm looking at ${c.price} with ${c.down} down on a ${c.term} at ${c.rate}, estimated ${c.estimated_payment}. What should I know about this structure and what could lower the payment?`); });
    if (fab) {
      fab.addEventListener("click", () => { window.BQChat.ask(""); const sec = $("#concierge"); if (sec) sec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); setTimeout(() => input.focus(), 600); });
      if ("IntersectionObserver" in window && chatBox) new IntersectionObserver((en) => fab.classList.toggle("hide", en[0].isIntersecting), { threshold: 0.2 }).observe(chatBox);
    }
  }

  /* ---------- GR CRM live booking (shown only when a booking slug is configured) ---------- */
  const booking = $("#booking");
  if (booking && cfg.BOOKING_SLUG && cfg.CRM_BOOKING_BASE) {
    booking.hidden = false;
    const date = $("#booking-date"), slots = $("#booking-slots"), note = $("#booking-note"), tz = $("#booking-tz");
    const today = new Date(); date.min = today.toISOString().slice(0, 10);
    const max = new Date(today.getTime() + 60 * 864e5); date.max = max.toISOString().slice(0, 10);
    let picked = null, pageTz = "";
    date.addEventListener("change", async () => {
      slots.innerHTML = ""; picked = null; note.textContent = "Checking the calendar…";
      try {
        const r = await fetch(`${cfg.CRM_BOOKING_BASE}/booking-get?slug=${encodeURIComponent(cfg.BOOKING_SLUG)}&date=${date.value}`);
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error || "unavailable");
        pageTz = d.timezone || ""; if (tz) tz.textContent = pageTz ? "Times in " + pageTz : "";
        if (!d.slots || !d.slots.length) { note.textContent = "No open times that day — try another date or call (310) 654-1577."; return; }
        slots.innerHTML = d.slots.map((iso) => `<button type="button" data-slot="${iso}">${new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: pageTz || undefined })}</button>`).join("");
        note.textContent = "Pick a time, then confirm with your name and email.";
      } catch (e) { note.textContent = "The scheduler is unavailable right now — the form on the right reaches us just as fast."; }
    });
    slots.addEventListener("click", (e) => {
      const b = e.target.closest("[data-slot]"); if (!b) return;
      $$("button", slots).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); picked = b.getAttribute("data-slot");
      let c = $(".booking-confirm", booking);
      if (!c) { c = document.createElement("div"); c.className = "booking-confirm"; c.innerHTML = `<input placeholder="Your name" id="bk-name"><input placeholder="Email" type="email" id="bk-email"><input placeholder="Phone (optional)" type="tel" id="bk-phone"><button type="button" class="btn sm" id="bk-go">Confirm call</button>`; booking.appendChild(c); }
      $("#bk-go").onclick = async () => {
        const name = $("#bk-name").value.trim(), email = $("#bk-email").value.trim(), phone = $("#bk-phone").value.trim();
        if (!name || !email) { note.textContent = "Name and email are needed to confirm."; return; }
        $("#bk-go").disabled = true; note.textContent = "Booking…";
        let r;
        try {
          r = await fetch(`${cfg.CRM_BOOKING_BASE}/booking-submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.BOOKING_SLUG, startsAt: picked, name, email, phone, note: "Booked from boutiquemtg.com" }) });
          const d = await r.json();
          if (!r.ok || !d.ok) throw new Error(d.error || "failed");
          note.textContent = "Booked. A calendar invite is on its way to " + email + ".";
          c.remove(); slots.innerHTML = ""; push("bq_booking", { when: picked });
        } catch (e) { $("#bk-go").disabled = false; note.textContent = r && r.status === 409 ? "That time was just taken — pick another." : "Couldn't book that slot. Try another time or call us."; }
      };
    });
  }
})();
