// Vasdesign — minimál interakciók
(function () {
  'use strict';

  // Sticky header árnyalása görgetésnél
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () {
      head.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobil menü
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Betöltés-animáció
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // Lightbox — egyszerű, akadálymentes
  var imgs = document.querySelectorAll('[data-lightbox]');
  if (imgs.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Képnagyítás');
    lb.innerHTML = '<button class="lb-close" aria-label="Bezárás">&times;</button>' +
                   '<button class="lb-prev" aria-label="Előző">&#8249;</button>' +
                   '<img alt="">';
    lb.style.display = 'none';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector('img');
    var lbClose = lb.querySelector('.lb-close');
    var lbPrev = lb.querySelector('.lb-prev');
    var current = null, lastFocus = null;

    var groupList = function (group) {
      return Array.prototype.filter.call(
        document.querySelectorAll('[data-lightbox="' + group + '"]'),
        function (a) { return a.offsetParent !== null; }
      );
    };

    var show = function (anchor) {
      lastFocus = document.activeElement;
      current = anchor;
      lbImg.src = anchor.getAttribute('href');
      lbImg.alt = anchor.querySelector('img') ? anchor.querySelector('img').alt : '';
      lb.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    };
    var hide = function () {
      lb.style.display = 'none';
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
      current = null;
    };
    var move = function (dir) {
      if (!current) return;
      var list = groupList(current.getAttribute('data-lightbox'));
      var idx = list.indexOf(current);
      var next = list[(idx + dir + list.length) % list.length];
      if (next) show(next);
    };

    imgs.forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); show(a); });
    });
    lbClose.addEventListener('click', hide);
    lbPrev.addEventListener('click', function () { move(-1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) hide(); });
    document.addEventListener('keydown', function (e) {
      if (lb.style.display === 'none') return;
      if (e.key === 'Escape') hide();
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'Tab') {
        // fókuszzár a párbeszédpanelen belül
        var f = lb.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
