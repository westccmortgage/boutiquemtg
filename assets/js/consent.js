/* boutiquemtg.com — cookie consent + tag loading.
   Analytics/ads tags (GTM, Google Ads + GA4, Microsoft Clarity) load ONLY after
   "Accept & continue". "Essential only" keeps the site fully functional with
   first-party storage only. Mirrors the consent model used on the
   California Mortgage / K West concierge sites. */
(function () {
  "use strict";
  var KEY = "bq_consent", VID = "bq_visitor_id";
  var cfg = window.BQ_CONFIG || {};
  window.dataLayer = window.dataLayer || [];

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); });
  }
  function visitorId() { var v = read(VID); if (!v) { v = uuid(); write(VID, v); } return v; }

  var loaded = false;
  function loadTags() {
    if (loaded) return; loaded = true;
    /* Consent signals for Google tags */
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "update", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });

    /* Google Tag Manager */
    if (cfg.GTM_ID) {
      window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var g = document.createElement("script"); g.async = true; g.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(cfg.GTM_ID); document.head.appendChild(g);
    }
    /* Google Ads + GA4 (gtag) with the WCCM lead conversion hook:
       fires once per accepted lead on the `wccm_lead_submit` dataLayer event. */
    if (cfg.ADS_ID) {
      var a = document.createElement("script"); a.async = true; a.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ADS_ID); document.head.appendChild(a);
      window.gtag("js", new Date());
      window.gtag("config", cfg.ADS_ID);
      if (cfg.GA4_ID) window.gtag("config", cfg.GA4_ID);
      if (!window.__bqAdsLeadHook) {
        window.__bqAdsLeadHook = true; var cursor = 0, sent = {};
        setInterval(function () {
          var dl = window.dataLayer || [];
          while (cursor < dl.length) {
            var item = dl[cursor++];
            if (item && item.event === "wccm_lead_submit" && !item.__sent) {
              item.__sent = true; var id = item.lead_event_id || "";
              if (id && sent[id]) continue; if (id) sent[id] = true;
              if (cfg.ADS_LEAD_DESTINATION) window.gtag("event", "conversion", { send_to: cfg.ADS_LEAD_DESTINATION, value: 1.0, currency: "USD", transaction_id: id });
              if (cfg.GA4_ID) window.gtag("event", "generate_lead", { send_to: cfg.GA4_ID, value: 1.0, currency: "USD", lead_event_id: id });
            }
          }
        }, 250);
      }
    }
    /* Microsoft Clarity */
    if (cfg.CLARITY_ID) {
      (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, "clarity", "script", cfg.CLARITY_ID);
    }
    window.dataLayer.push({ event: "bq_consent_accepted", visitor_id: visitorId() });
  }

  var banner = document.getElementById("consent-banner");
  function show() { if (banner) { banner.hidden = false; requestAnimationFrame(function () { banner.classList.add("show"); }); } }
  function hide() { if (banner) { banner.classList.remove("show"); setTimeout(function () { banner.hidden = true; }, 400); } }
  function set(choice) { write(KEY, choice); hide(); if (choice === "accepted") loadTags(); window.dataLayer.push({ event: "bq_consent", choice: choice }); }

  window.BQConsent = {
    get: function () { return read(KEY); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} show(); },
    visitorId: visitorId
  };

  function init() {
    var current = read(KEY);
    if (current === "accepted") loadTags(); else if (!current) show();
    if (banner) banner.addEventListener("click", function (e) { var b = e.target.closest("[data-consent]"); if (b) set(b.getAttribute("data-consent")); });
    document.addEventListener("click", function (e) { if (e.target.closest("[data-consent-manage]")) { e.preventDefault(); window.BQConsent.reset(); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
