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

  // ---------- E-mail összeállítása (robotok ellen) ----------
  // A HTML-ben a cím fordított részekben szerepel (data-u / data-d), itt állítjuk össze.
  function emailCim(a) {
    return a.getAttribute('data-u').split('').reverse().join('') + '@' +
           a.getAttribute('data-d').split('').reverse().join('');
  }
  document.querySelectorAll('a.mail-link').forEach(function (a) {
    var cim = emailCim(a);
    a.setAttribute('href', 'mailto:' + cim);
    a.removeAttribute('data-r');
  });

  // ---------- Galéria: keresés és kategóriaszűrés ----------
  var galQ = document.getElementById('gal-q');
  var galCats = document.getElementById('gal-kategoriak');
  var galHint = document.getElementById('gal-hint');
  var galTorol = document.getElementById('gal-torol');
  if (galQ && galCats) {
    var galSections = Array.prototype.slice.call(document.querySelectorAll('[data-gal-cat]'));
    // minden kép-cséhez tartozó szöveg (fájlnév + kategória) – a szűrés ezt használja
    var galCells = [];
    galSections.forEach(function (sec) {
      var cat = sec.getAttribute('data-gal-cat');
      Array.prototype.forEach.call(sec.querySelectorAll('.gallery a[data-keres]'), function (a) {
        galCells.push({ a: a, sec: sec, cat: cat, text: (a.getAttribute('data-keres') || '').toLowerCase() });
      });
    });

    var normalise = function (s) {
      return String(s).toLowerCase()
        .replace(/hu/g, 'u').replace(/ö/g, 'o').replace(/ő/g, 'o').replace(/ü/g, 'u')
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o')
        .replace(/ú/g, 'u').replace(/ü/g, 'u')
        .replace(/img/g, 'img ').replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ').trim();
    };

    var galCat = 'osszes';
    var galSearch = '';

    var apply = function () {
      var words = normalise(galSearch).split(' ').filter(Boolean);
      var shown = 0;
      var perCat = {};

      galCells.forEach(function (c) {
        // minden szónak illeszkednie kell a kép szövegéhez
        var textOk = words.every(function (w) { return c.text.indexOf(w) !== -1; });
        var catOk = galCat === 'osszes' || c.cat === galCat;
        var on = catOk && textOk;
        c.a.hidden = !on;
        if (on) shown++;
        // a gombok számai a szöveges keresésre vonatkozzanak – így a
        // kategóriaszűrő nem nullázza le a többi kategóriát
        if (textOk) perCat[c.cat] = (perCat[c.cat] || 0) + 1;
      });

      // az üres kategóriákat elrejtjük, a számokat frissítjük
      galSections.forEach(function (sec) {
        var cat = sec.getAttribute('data-gal-cat');
        var n = perCat[cat] || 0;
        var el = sec.querySelector('[data-gal-count="' + cat + '"]');
        if (el) el.textContent = n === 1 ? '1 munka' : n + ' munka';
        // a kategóriaszűrő mellett a másik kategóriák szekciói rejtve maradnak;
        // a szöveges keresés viszont elrejti azokat, ahol nincs találat
        var aktiv = galCat === 'osszes' || cat === galCat;
        sec.hidden = !aktiv || (words.length > 0 && n === 0);
      });

      // a kategóriaszűrő gombjainak számlálója
      Array.prototype.forEach.call(galCats.querySelectorAll('button'), function (b) {
        var c = b.getAttribute('data-cat');
        if (c === 'osszes') return;
        var n = perCat[c] || 0;
        var label = b.getAttribute('data-label') || b.textContent.replace(/\s*\(\d+\)\s*$/, '');
        b.setAttribute('data-label', label);
        b.textContent = label + ' (' + n + ')';
        b.disabled = n === 0 && c !== galCat;
      });

      if (galHint) {
        if (!shown) {
          galHint.textContent = 'Nincs találat. Próbáld rövidebb kifejezéssel, vagy szűrj kategóriára.';
        } else if (galSearch || galCat !== 'osszes') {
          // "a galériában" akkor helyes, ha a szöveges keresés sem szűkített
          var szukitett = words.length > 0 || galCat !== 'osszes';
          galHint.textContent = shown + ' találat' + (shown === 1 ? '' : 'a') +
            (szukitett ? ' a szűkített nézetben.' : ' a galériában.');
        } else {
          galHint.textContent = '';
        }
      }
      if (galTorol) galTorol.hidden = !galSearch && galCat === 'osszes';
    };

    var onInput = function () { galSearch = galQ.value; apply(); };
    galQ.addEventListener('input', onInput);
    galQ.addEventListener('search', onInput);

    galCats.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-cat]');
      if (!b) return;
      galCat = b.getAttribute('data-cat');
      Array.prototype.forEach.call(galCats.querySelectorAll('button'), function (x) {
        x.classList.toggle('on', x === b);
      });
      apply();
    });

    if (galTorol) {
      galTorol.addEventListener('click', function () {
        galQ.value = '';
        galSearch = '';
        galCat = 'osszes';
        Array.prototype.forEach.call(galCats.querySelectorAll('button'), function (x) {
          x.classList.toggle('on', x.getAttribute('data-cat') === 'osszes');
        });
        apply();
        galQ.focus();
      });
    }

    // a ?q=… hivatkozás is működjön (megosztható szűkített nézet)
    var urlQ = new URLSearchParams(location.search).get('q');
    if (urlQ) { galQ.value = urlQ; galSearch = urlQ; }
    apply();
  }

  // ---------- Ajánlatkérő űrlap → saját levelezőprogram ----------
  var form = document.querySelector('.ajanlat-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var mezok = function (n) { return (form.querySelector('[name=' + n + ']') || {}).value || ''; };
      var nev = mezok('nev'), email = mezok('email'), targy = mezok('targy'), uzenet = mezok('uzenet');
      if (!nev || !email || !uzenet) {
        form.reportValidity && form.reportValidity();
        return;
      }
      var links = document.querySelectorAll('a.mail-link');
      var cim = links.length ? emailCim(links[0]) : '';
      var tipus = mezok('tipus'), meret = mezok('meret'), felulet = mezok('felulet');
      var helyEl = form.querySelector('[name=hely]:checked');
      var targyMezo = targy || ('Ajánlatkérés — ' + (tipus ? tipus + ' — ' : '') + nev);
      var test = 'Név: ' + nev + '\nE-mail: ' + email +
        (tipus ? '\nTípus: ' + tipus : '') +
        (helyEl ? '\nHely: ' + helyEl.value : '') +
        (meret ? '\nMéret: ' + meret : '') +
        (felulet ? '\nFelületkezelés: ' + felulet : '') +
        '\n\n' + uzenet;
      window.location.href = 'mailto:' + cim +
        '?subject=' + encodeURIComponent(targyMezo) +
        '&body=' + encodeURIComponent(test);
    });
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
