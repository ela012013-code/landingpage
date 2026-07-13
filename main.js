/* Tierra Nua – gemeinsames Skript für alle Seiten
   Consent-Modal, Meta-Pixel (consent-gated), Calendly-Loader, Tracking-Listener, Fade-in */

/* ---------- Meta-Pixel (nur nach Consent) ---------- */
function loadMetaPixel() {
  if (window._pixelLoaded) return; window._pixelLoaded = true;
  var PIXEL_ID = '4436287399962639';
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
  const target = document.getElementById('calendly-embed');
  if (!target) return; // nicht auf /termin
  calendlyLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://assets.calendly.com/assets/external/widget.js';
  s.async = true;
  s.onload = function () {
    Calendly.initInlineWidget({
      url: 'https://calendly.com/office-belogran/rasen-potenzialgesprach',
      parentElement: target
    });
  };
  document.head.appendChild(s);
}

/* ---------- Cookie-Consent-Modal (blockierend, ein einziger Consent-Punkt) ---------- */
(function () {
  const KEY = 'consent_v1';
  const modal = document.getElementById('cookie-modal');
  if (!modal) return;

  function openModal() {
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('cookie-all').focus(), 40);
  }
  function closeModal() {
    modal.hidden = true;
    document.documentElement.style.overflow = '';
  }

  document.getElementById('cookie-all').addEventListener('click', () => {
    localStorage.setItem(KEY, 'all');
    closeModal();
    loadMetaPixel();
    loadCalendly();
  });
  document.querySelectorAll('[data-open-cookie-settings]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  });

  // Fokus-Falle: Tab bleibt im Modal
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = modal.querySelectorAll('button, a[href]');
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Beim Laden: schon zugestimmt -> Pixel + Kalender; sonst Modal blockiert
  const c = localStorage.getItem(KEY);
  if (c === 'all') {
    modal.hidden = true;
    loadMetaPixel();
    loadCalendly();
  } else {
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('cookie-all').focus(), 40);
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
