// ESPIGA — interacciones del sitio
document.addEventListener('DOMContentLoaded', function () {

  // Menú móvil
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.main-nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('open');
      burger.classList.toggle('is-open');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
      });
    });
  }

  // Tabs del menú
  var tabs = document.querySelectorAll('.menu-tab');
  var panels = document.querySelectorAll('.menu-panel');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-target');
      tabs.forEach(function (t) { t.classList.remove('active'); });
      panels.forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });

  // Año dinámico en el footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Hero: la focaccia "se abre" y revela sus ingredientes al hacer scroll =====
  var heroSection = document.getElementById('inicio');
  var heroBgImg = document.querySelector('#heroBg img');
  var heroIngredients = document.getElementById('heroIngredients');
  if (heroSection && heroBgImg && heroIngredients) { heroIngredients.classList.add('show');
    var ticking = false;
    var updateHero = function () {
      var heroHeight = heroSection.offsetHeight || 1;
      var progress = window.scrollY / heroHeight;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      var scale = 1 + progress * 0.32;
      var posY = 22 + progress * 30; // baja hacia el corte relleno de la ciabatta
      heroBgImg.style.transform = 'scale(' + scale.toFixed(3) + ')';
      heroBgImg.style.objectPosition = 'center ' + posY.toFixed(1) + '%';

      if (true) {
        heroIngredients.classList.add('show');
      } else {
        heroIngredients.classList.remove('show');
      }
      ticking = false;
    };
    updateHero();
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHero);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', updateHero);
  }

  // ===== Sliders de fotos que avanzan solos (ej. Lo nuevo) =====
  document.querySelectorAll('.photo-slider').forEach(function (slider) {
    var track = slider.querySelector('.photo-slider-track');
    if (!track) return;

    // Orden al azar (para que no se sienta repetido si hay fotos del mismo producto)
    if (slider.getAttribute('data-shuffle') === 'true') {
      var imgs = Array.prototype.slice.call(track.children);
      for (var i = imgs.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = imgs[i]; imgs[i] = imgs[j]; imgs[j] = tmp;
      }
      imgs.forEach(function (img) { track.appendChild(img); });
    }

    var count = track.children.length;
    if (count <= 1) return;
    var interval = parseInt(slider.getAttribute('data-interval'), 10) || 4000;
    var index = 0;
    setInterval(function () {
      index = (index + 1) % count;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
    }, interval);
  });

  // ===== Formulario B2B: arma un correo con los datos y abre el cliente de mail =====
  var b2bForm = document.getElementById('b2b-form');
  if (b2bForm) {
    b2bForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = document.getElementById('b2b-nombre').value.trim();
      var empresa = document.getElementById('b2b-empresa').value.trim();
      var email = document.getElementById('b2b-email').value.trim();
      var telefono = document.getElementById('b2b-telefono').value.trim();
      var mensaje = document.getElementById('b2b-mensaje').value.trim();

      var subject = 'Solicitud B2B – Catálogo y BOX de muestras';
      var body =
        'Nombre: ' + nombre + '\n' +
        'Empresa: ' + empresa + '\n' +
        'Email: ' + email + '\n' +
        'Teléfono: ' + telefono + '\n\n' +
        'Mensaje:\n' + mensaje;

              var mailto = 'mailto:ventas@espigabolleria.cl' +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      window.location.href = mailto;
    });
  }
});
