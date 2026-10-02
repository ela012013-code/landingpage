/* Tierra Nua – gemeinsames Skript für alle Seiten
   Consent-Banner (nicht-blockierend), Meta-Pixel (consent-gated), Calendly-Loader, Tracking-Listener, Fade-in */

/* ---------- Meta-Pixel (nur nach Consent) ---------- */
function loadMetaPixel() {
  if (window._pixelLoaded) return; window._pixelLoaded = true;
  var PIXEL_ID = '2181043349103864';
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,
  'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
}

/* ---------- Calendly (nur auf /termin vorhanden, nur nach Consent) ----------
   Kein widget.js: Das iframe wird direkt erzeugt (spart einen seriellen
   Request zu einer zweiten Domain). embed_domain muss deshalb selbst gesetzt
   werden, sonst erreichen page_height (s.u.) und event_scheduled die Seite nicht. */
let calendlyLoaded = false;
function loadCalendly() {
  if (calendlyLoaded) return; calendlyLoaded = true;
  const gate = document.getElementById('calendly-gate');
  if (gate) gate.hidden = true;
  const box = document.getElementById('calendly-embed');
  if (!box) return;                         // nur auf der Terminseite vorhanden
  box.hidden = false;

  const ifr = document.createElement('iframe');
  ifr.src = 'https://calendly.com/office-belogran/rasen-potenzialgesprach'
    + '?embed_domain=' + encodeURIComponent(location.host)
    + '&embed_type=Inline'
    + '&hide_event_type_details=1&hide_gdpr_banner=1&primary_color=76A632';
  ifr.title = 'Termin für Rasen-Potenzialgespräch buchen';
  ifr.style.cssText = 'width:100%;height:100%;border:0;display:block;';
  box.appendChild(ifr);
}

/* Calendly meldet seine Inhaltshöhe selbst (kein offizielles API, aber ohne
   diese Meldung bliebe der Kasten auf der Startgröße stehen).
   Zwischenwerte beim Laden (z. B. 2px, 26px) werden gefiltert, sonst klappt
   der Kasten kurz zusammen. Eigener Listener, getrennt vom Conversion-Tracking. */
window.addEventListener('message', function (e) {
  if (e.origin !== 'https://calendly.com') return;
  if (!e.data || e.data.event !== 'calendly.page_height') return;
  const h = parseInt(e.data.payload && e.data.payload.height, 10);
  if (!h || h < 300) return;
  const box = document.getElementById('calendly-embed');
  if (box) box.style.height = (h + 8) + 'px';   // +8px Puffer gegen Rundungsfehler
});

/* ---------- Hero-Video (YouTube, nur nach Consent) ---------- */
function loadYouTube() {
  const wrap = document.querySelector('.hero-video');
  if (!wrap || wrap.dataset.loaded) return;
  wrap.dataset.loaded = '1';
  const VIDEO_ID = 'ZKYUde9CwYs';
  wrap.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + VIDEO_ID + '?autoplay=1&playsinline=1" title="Tierra Nua – Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe>';
}

/* ---------- Cookie-Consent: nicht-blockierender Banner ---------- */
function hideCookieBar() {
  const bar = document.getElementById('cookie-bar');
  if (bar) bar.hidden = true;
  document.body.classList.remove('consent-open');
}
function acceptAll() {
  localStorage.setItem('consent_v1', 'all');
  hideCookieBar();
  loadMetaPixel();
  loadYouTube();
  if (typeof loadVimeo === 'function') loadVimeo();
  if (typeof loadCalendly === 'function') loadCalendly();
}
/* Ohne Consent werden Video-Poster (Hero + Testimonials mit ID) zu Ein-Klick-Einstiegen. */
function armBlockedMedia() {
  const heroPoster = document.getElementById('hero-video-poster');
  if (heroPoster) { heroPoster.classList.add('is-blocked'); heroPoster.addEventListener('click', acceptAll); }
  document.querySelectorAll('.testi-video').forEach(function (fig) {
    if (!/\d{6,}/.test(fig.dataset.vimeo || '')) return;   // keine ID → „Video folgt" bleibt
    const poster = fig.querySelector('.testi-video__poster');
    if (!poster) return;
    const label = poster.querySelector('.testi-video__label');
    if (label) label.textContent = 'Video ansehen';
    if (!poster.querySelector('.testi-video__consent')) {
      const hint = document.createElement('span');
      hint.className = 'testi-video__consent';
      hint.textContent = 'Mit Klick werden Cookies akzeptiert';
      poster.appendChild(hint);
    }
    poster.classList.add('is-blocked');
    poster.setAttribute('role', 'button'); poster.tabIndex = 0; poster.removeAttribute('aria-hidden');
    const go = function (e) { e.preventDefault(); acceptAll(); };
    poster.addEventListener('click', go);
    poster.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') go(e); });
  });
}
(function () {
  const KEY = 'consent_v1';
  const bar = document.getElementById('cookie-bar');
  const gate = document.getElementById('calendly-gate');
  function showCookieBar() { if (bar) bar.hidden = false; document.body.classList.add('consent-open'); }
  function decline() {
    const wasAll = localStorage.getItem(KEY) === 'all';
    localStorage.setItem(KEY, 'declined');
    hideCookieBar();
    /* War vorher akzeptiert, sind die Skripte schon geladen — nur ein Reload
       entfernt sie wirklich aus dem Speicher (Widerruf, Art. 7 Abs. 3 DSGVO). */
    if (wasAll) location.reload();
  }
  document.getElementById('cookie-accept')?.addEventListener('click', acceptAll);
  document.getElementById('cookie-decline')?.addEventListener('click', decline);
  document.getElementById('calendly-load')?.addEventListener('click', acceptAll);
  /* Footer-Link „Cookie-Einstellungen" zeigt den Banner erneut (Widerruf/Zustimmung jederzeit). */
  document.querySelectorAll('[data-open-cookie-settings]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); showCookieBar(); });
  });

  const c = localStorage.getItem(KEY);
  if (c === 'all') {
    loadMetaPixel();
    loadYouTube();
    if (typeof loadVimeo === 'function') loadVimeo();
    if (typeof loadCalendly === 'function') loadCalendly();
  } else {
    armBlockedMedia();          // unentschieden ODER abgelehnt: Poster als Ein-Klick-Einstieg
    if (gate) gate.hidden = false;
    if (!c) showCookieBar();    // Banner nur beim ersten Besuch automatisch, nach „Ablehnen" nicht wieder
  }
})();

/* ---------- Conversion-Tracking via Calendly postMessage (nur auf /termin) ----------
   Gebrandetes Ziel-Event NOW_LEAD + Meta-Standard-Event Lead.
   Gleiche eventID → CAPI-Dedup-ready. Feuert genau 1×. */
let nowEventFired = false;

function fireNowConversion() {
  if (nowEventFired) return;
  if (typeof fbq !== 'function') return;   // kein Consent → kein Pixel → No-Op
  nowEventFired = true;

  const eventId = (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'now-' + Date.now() + '-' + Math.random().toString(16).slice(2);

  const data = { content_name: 'erstgespraech', content_category: 'now_erstgespraech' };

  fbq('trackCustom', 'NOW_LEAD', data, { eventID: eventId });   // Ziel-Event
  fbq('track',       'Lead',     data, { eventID: eventId });   // Standard-Signal
}

window.addEventListener('message', function (e) {
  if (e.origin !== 'https://calendly.com') return;
  if (!e.data || e.data.event !== 'calendly.event_scheduled') return;
  fireNowConversion();
  setTimeout(function () { window.location.href = '/danke'; }, 300);
});

/* ---------- Fade-in beim Scrollen ---------- */
(function () {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach((el) => observer.observe(el));
})();
