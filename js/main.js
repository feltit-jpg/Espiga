// ESPIGA — interacciones del sitio
document.addEventListener('DOMContentLoaded', function () {

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA_NUMBER = '56958963440';

  // ===== Medición: cada clic en WhatsApp, PedidosYa, Uber Eats, Maps, reseñas e Instagram =====
  // Se envía directo a GA4 (G-MPP8X9K5NX) y queda en el dataLayer para GTM.
  var EVENT_NAMES = {
    whatsapp: 'click_whatsapp',
    pedidosya: 'click_pedidosya',
    ubereats: 'click_ubereats',
    instagram: 'click_instagram',
    maps: 'click_como_llegar',
    review: 'click_resena_google',
    llamar: 'click_llamar'
  };
  function track(eventName, params) {
    params = params || {};
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
      }
      window.dataLayer = window.dataLayer || [];
      var payload = { event: 'espiga_' + eventName };
      for (var k in params) { if (Object.prototype.hasOwnProperty.call(params, k)) payload[k] = params[k]; }
      window.dataLayer.push(payload);
    } catch (err) { /* la medición nunca debe romper el sitio */ }
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-track]') : null;
    if (!el) return;
    var type = el.getAttribute('data-track');
    var name = EVENT_NAMES[type] || ('click_' + type);
    track(name, {
      link_location: el.getAttribute('data-loc') || 'sin_ubicacion',
      link_url: el.getAttribute('href') || '',
      outbound: true
    });
  }, true);

  // ===== Menú móvil =====
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.main-nav');
  if (burger && nav) {
    var setNav = function (open) {
      nav.classList.toggle('open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('nav-open', open);
    };
    burger.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setNav(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); burger.focus(); }
    });
  }

  // ===== Tabs del menú (con teclado y enlace directo #panel-cafe) =====
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.menu-tab'));
  var panels = document.querySelectorAll('.menu-panel');
  function activateTab(tab, focus) {
    var target = tab.getAttribute('data-target');
    tabs.forEach(function (t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    panels.forEach(function (p) { p.classList.remove('active'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.removeAttribute('tabindex');
    var panel = document.getElementById(target);
    if (panel) panel.classList.add('active');
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    if (!tab.classList.contains('active')) tab.setAttribute('tabindex', '-1');
    tab.addEventListener('click', function () {
      activateTab(tab);
      track('ver_categoria_menu', { categoria: tab.textContent.trim() });
    });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) { e.preventDefault(); activateTab(next, true); }
    });
  });
  if (location.hash && location.hash.indexOf('#panel-') === 0) {
    var deepTab = document.querySelector('.menu-tab[data-target="' + location.hash.slice(1) + '"]');
    if (deepTab) activateTab(deepTab);
  }

  // ===== Año dinámico en el footer =====
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Abierto ahora / Cerrado (hora de Santiago) =====
  // 0 = domingo ... 6 = sábado. Horas en formato decimal.
  var HOURS = {
    0: [9, 14], 1: [8, 20], 2: [8, 20], 3: [8, 20], 4: [8, 20], 5: [8, 20], 6: [9, 15]
  };
  var DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function fmt(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); return hh + ':' + (mm < 10 ? '0' : '') + mm; }
  function santiagoNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Santiago', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var hour = parseInt(map.hour, 10) % 24;
      return { day: days[map.weekday], time: hour + parseInt(map.minute, 10) / 60 };
    } catch (err) {
      var d = new Date();
      return { day: d.getDay(), time: d.getHours() + d.getMinutes() / 60 };
    }
  }
  function openStatus() {
    var now = santiagoNow();
    var today = HOURS[now.day];
    if (today && now.time >= today[0] && now.time < today[1]) {
      var left = today[1] - now.time;
      return { open: true, text: left <= 1 ? 'Abierto · cierra pronto (' + fmt(today[1]) + ')' : 'Abierto ahora · hasta las ' + fmt(today[1]) };
    }
    if (today && now.time < today[0]) {
      return { open: false, text: 'Cerrado · abrimos hoy a las ' + fmt(today[0]) };
    }
    var nextDay = (now.day + 1) % 7;
    return { open: false, text: 'Cerrado · abrimos mañana ' + DAY_NAMES[nextDay] + ' a las ' + fmt(HOURS[nextDay][0]) };
  }
  function paintStatus() {
    var st = openStatus();
    document.querySelectorAll('[data-open-status]').forEach(function (el) {
      el.textContent = st.text;
      el.classList.toggle('is-open', st.open);
      el.classList.toggle('is-closed', !st.open);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  // ===== Precios desde data/precios.json (si falla, quedan los del HTML) =====
  var PANEL_LABELS = {
    'panel-panaderia': 'Panadería y bollería',
    'panel-sandwiches': 'Sándwiches',
    'panel-brunch': 'Brunch',
    'panel-cafe': 'Café y bebidas'
  };
  if (window.fetch) {
    fetch('data/precios.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        Object.keys(PANEL_LABELS).forEach(function (pid) {
          var panel = document.getElementById(pid);
          var prices = data[PANEL_LABELS[pid]];
          if (!panel || !prices) return;
          var seen = {};
          panel.querySelectorAll('.menu-item').forEach(function (item) {
            var nameEl = item.querySelector('.menu-item-name');
            var priceEl = item.querySelector('.menu-item-price');
            if (!nameEl || !priceEl) return;
            var clone = nameEl.cloneNode(true);
            clone.querySelectorAll('span').forEach(function (s) { s.remove(); });
            var base = clone.textContent.trim();
            seen[base] = (seen[base] || 0) + 1;
            var key = seen[base] > 1 ? base + ' (' + seen[base] + ')' : base;
            if (typeof prices[key] === 'string' && prices[key].trim()) priceEl.textContent = prices[key];
          });
        });
        var enc = data['Encargos'] || {};
        document.querySelectorAll('[data-price-key^="encargos|"]').forEach(function (el) {
          var k = el.getAttribute('data-price-key').split('|')[1];
          if (typeof enc[k] === 'string' && enc[k].trim()) el.textContent = enc[k];
        });
      })
      .catch(function () { /* se mantienen los precios del HTML */ });
  }

  // ===== Hero: zoom suave al hacer scroll =====
  var heroSection = document.getElementById('inicio');
  var heroBgImg = document.querySelector('#heroBg img');
  var heroIngredients = document.getElementById('heroIngredients');
  if (heroIngredients) heroIngredients.classList.add('show');
  if (heroSection && heroBgImg && !reduceMotion) {
    var ticking = false;
    var updateHero = function () {
      var heroHeight = heroSection.offsetHeight || 1;
      var progress = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
      heroBgImg.style.transform = 'scale(' + (1 + progress * 0.32).toFixed(3) + ')';
      heroBgImg.style.objectPosition = 'center ' + (22 + progress * 30).toFixed(1) + '%';
      ticking = false;
    };
    updateHero();
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(updateHero); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', updateHero);
  }

  // ===== Sliders de fotos que avanzan solos =====
  document.querySelectorAll('.photo-slider').forEach(function (slider) {
    var track = slider.querySelector('.photo-slider-track');
    if (!track) return;
    if (slider.getAttribute('data-shuffle') === 'true') {
      var imgs = Array.prototype.slice.call(track.children);
      for (var i = imgs.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = imgs[i]; imgs[i] = imgs[j]; imgs[j] = tmp;
      }
      imgs.forEach(function (img) { track.appendChild(img); });
    }
    var count = track.children.length;
    if (count <= 1 || reduceMotion) return;
    var interval = parseInt(slider.getAttribute('data-interval'), 10) || 4000;
    var index = 0;
    setInterval(function () {
      if (document.hidden) return;
      index = (index + 1) % count;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
    }, interval);
  });

  // ===== Barra móvil: hoja de delivery =====
  var mbBtn = document.getElementById('mb-delivery');
  var mbSheet = document.getElementById('mb-sheet');
  if (mbBtn && mbSheet) {
    var setSheet = function (open) {
      mbSheet.hidden = !open;
      mbBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    mbBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = mbSheet.hidden;
      setSheet(open);
      if (open) track('abrir_delivery', { link_location: 'barra_movil' });
    });
    document.addEventListener('click', function (e) {
      if (!mbSheet.hidden && !mbSheet.contains(e.target)) setSheet(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setSheet(false); });
  }

  // ===== Formulario B2B: se envía de verdad (FormSubmit) y, si falla, se ofrece WhatsApp =====
  var b2bForm = document.getElementById('b2b-form');
  if (b2bForm) {
    var statusEl = document.getElementById('b2b-status');
    var submitBtn = document.getElementById('b2b-submit');
    var setStatus = function (msg, type) {
      if (!statusEl) return;
      statusEl.innerHTML = msg;
      statusEl.className = 'full b2b-status' + (type ? ' is-' + type : '');
    };
    var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var waFallback = function () {
      var text = 'Hola Espiga, tengo un negocio y me interesa el catálogo B2B.\n' +
        'Nombre: ' + val('b2b-nombre') + '\nEmpresa: ' + val('b2b-empresa') +
        '\nEmail: ' + val('b2b-email') + '\nTeléfono: ' + val('b2b-telefono') +
        '\n' + val('b2b-mensaje');
      return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
    };

    b2bForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!b2bForm.checkValidity()) {
        b2bForm.reportValidity();
        setStatus('Completa nombre, empresa y un email válido para enviarte el catálogo.', 'error');
        return;
      }
      if (b2bForm.querySelector('[name="_honey"]').value) return; // bot

      var data = {};
      new FormData(b2bForm).forEach(function (v, k) { data[k] = v; });
      submitBtn.disabled = true;
      var oldLabel = submitBtn.textContent;
      submitBtn.textContent = 'Enviando…';
      setStatus('', '');

      fetch('https://formsubmit.co/ajax/ventas@espigabolleria.cl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          var ok = res.ok && res.body && (res.body.success === true || res.body.success === 'true');
          if (!ok) throw new Error('envio');
          track('generate_lead', { form: 'b2b', link_location: 'b2b' });
          b2bForm.reset();
          setStatus('¡Gracias! Recibimos tu solicitud. Te escribiremos pronto para coordinar el catálogo y la BOX de muestras.', 'ok');
        })
        .catch(function () {
          track('b2b_error_envio', { form: 'b2b' });
          setStatus('No pudimos enviar el formulario. <a href="' + waFallback() + '" target="_blank" rel="noopener" data-track="whatsapp" data-loc="b2b_respaldo">Envíanos tus datos por WhatsApp</a> o escríbenos a <a href="mailto:ventas@espigabolleria.cl">ventas@espigabolleria.cl</a>.', 'error');
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = oldLabel;
        });
    });
  }
});
