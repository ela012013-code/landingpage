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

/* ---------- Calendly (nur auf /termin vorhanden, nur nach Consent) ---------- */
let calendlyLoaded = false;
function loadCalendly() {
  if (calendlyLoaded) return;
  const gate = document.getElementById('calendly-gate');
  if (gate) gate.hidden = true;
  const target = document.getElementById('calendly-embed');
  if (!target) return; // nicht auf /termin
  target.hidden = false;
  calendlyLoaded = true;
  target.innerHTML = '<div class="calendly-inline-widget" data-url="https://calendly.com/office-belogran/rasen-potenzialgesprach?hide_gdpr_banner=1" style="min-width:320px;height:750px;"></div>';
  const s = document.createElement('script');
  s.src = 'https://assets.calendly.com/assets/external/widget.js';
  s.async = true;
  document.head.appendChild(s);
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
    if (typeof loadVimeo === 'function') loadVimeo();
    if (typeof loadCalendly === 'function') loadCalendly();
  } else {
    armBlockedMedia();          // unentschieden ODER abgelehnt: Poster als Ein-Klick-Einstieg
    if (gate) gate.hidden = false;
    if (!c) showCookieBar();    // Banner nur beim ersten Besuch automatisch, nach „Ablehnen" nicht wieder
  }
})();

/* ---------- Conversion-Tracking via Calendly postMessage (nur auf /termin) ---------- */
let leadFired = false;
window.addEventListener('message', function (e) {
  if (e.origin !== 'https://calendly.com') return;
  if (!e.data || e.data.event !== 'calendly.event_scheduled') return;
  if (leadFired) return; leadFired = true;

  if (typeof fbq === 'function') {
    fbq('track', 'Lead', {
      content_name: 'rasen-potenzialgespraech',
      eventID: crypto.randomUUID()
    });
  }
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
