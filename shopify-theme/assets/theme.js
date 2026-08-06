(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sticky nav shrink + scroll progress */
  var nav = document.getElementById('siteNav');
  var progress = document.getElementById('scrollProgress');
  var stickyBuy = document.getElementById('stickyBuy');
  var hero = document.querySelector('.hero');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('scrolled', y > 12);

    if (progress) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      progress.style.width = max > 0 ? (y / max) * 100 + '%' : '0%';
    }

    if (stickyBuy && hero) {
      var heroBottom = hero.getBoundingClientRect().bottom + y;
      stickyBuy.classList.toggle('show', y > heroBottom);
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile nav toggle */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* Animated counters */
  var counters = document.querySelectorAll('[data-count]');
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimal = el.hasAttribute('data-decimal') ? parseInt(el.getAttribute('data-decimal'), 10) : 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var finalValue = decimal ? parseFloat(target + '.' + decimal) : target;
    var duration = 1400;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var progressRatio = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progressRatio, 3);
      var current = finalValue * eased;
      el.textContent = prefix + (decimal ? current.toFixed(1) : Math.round(current)) + suffix;
      if (progressRatio < 1) requestAnimationFrame(step);
    }
    if (prefersReducedMotion) {
      el.textContent = prefix + (decimal ? finalValue.toFixed(1) : Math.round(finalValue)) + suffix;
    } else {
      requestAnimationFrame(step);
    }
  }
  if (counters.length && 'IntersectionObserver' in window) {
    var counterIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { counterIo.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* Speed mode toggle */
  var modes = {
    eco: { rpm: 150, pct: 30, desc: 'Gentle, controlled spin — perfect for glass, mirrors, delicate tile and everyday wipe-downs.' },
    standard: { rpm: 250, pct: 65, desc: 'The everyday setting — strong enough for kitchen counters, sinks and daily bathroom cleaning.' },
    turbo: { rpm: 350, pct: 100, desc: 'Maximum torque for baked-on grime, grout lines and tile that hasn’t seen a real clean in years.' }
  };
  var modeTabs = document.querySelectorAll('.mode-tab');
  var rpmValue = document.getElementById('rpmValue');
  var modeDesc = document.getElementById('modeDesc');
  var gauge = document.getElementById('gauge');
  var gaugeHead = document.getElementById('gaugeHead');

  modeTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      modeTabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      var mode = modes[tab.getAttribute('data-mode')];
      if (!mode) return;
      if (rpmValue) rpmValue.textContent = mode.rpm;
      if (modeDesc) modeDesc.textContent = mode.desc;
      if (gauge) gauge.style.setProperty('--pct', mode.pct);
      if (gaugeHead) {
        gaugeHead.classList.remove('speed-eco', 'speed-standard', 'speed-turbo');
        gaugeHead.classList.add('speed-' + tab.getAttribute('data-mode'));
      }
    });
  });

  /* Hero device 3D tilt on pointer move */
  var deviceTilt = document.getElementById('deviceTilt');
  var heroVisual = document.querySelector('.hero-visual');
  if (deviceTilt && heroVisual && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    heroVisual.addEventListener('mousemove', function (e) {
      var rect = heroVisual.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      deviceTilt.style.transform = 'rotateY(' + (x * 18) + 'deg) rotateX(' + (y * -18) + 'deg)';
    });
    heroVisual.addEventListener('mouseleave', function () {
      deviceTilt.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  }

  /* Real Shopify cart: Buy Now buttons add the variant then go straight to checkout */
  document.querySelectorAll('.add-to-cart-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      var variantId = btn.getAttribute('data-variant-id');
      if (!variantId) return;

      var originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Adding…';

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Could not add to cart');
          window.location.href = '/checkout';
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = originalText;
          alert('Sorry, something went wrong adding that to your cart. Please try again.');
        });
    });
  });
})();
