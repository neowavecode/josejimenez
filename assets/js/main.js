/* ===========================================================================
   main.js — interacciones (vanilla JS, sin dependencias)
   =========================================================================== */
(function () {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---- Año dinámico ---- */
  $$("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---- Nav: sombra al hacer scroll + menú móvil ---- */
  const nav = $(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const toggle = $(".nav__toggle", nav);
    const links = $(".nav__links", nav);
    if (toggle && links) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      $$(".nav__link, .nav__cta", links).forEach(a =>
        a.addEventListener("click", () => {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        })
      );
    }
  }

  /* ---- Scrollspy: marca el enlace de la sección visible ---- */
  const spyLinks = $$('.nav__link[href^="#"]');
  const spyTargets = spyLinks
    .map(l => { const id = l.getAttribute("href").slice(1); const el = id && document.getElementById(id); return el ? { l, el } : null; })
    .filter(Boolean);
  if (spyTargets.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          spyLinks.forEach(l => l.classList.remove("is-active"));
          const match = spyTargets.find(t => t.el === e.target);
          if (match) match.l.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    spyTargets.forEach(t => spy.observe(t.el));
  }

  /* ---- Reveal on scroll ---- */
  const reveals = $$(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el, i) => { el.style.transitionDelay = (i % 6) * 60 + "ms"; io.observe(el); });
  } else {
    reveals.forEach(el => el.classList.add("is-visible"));
  }

  /* ---- Filtro de certificaciones ---- */
  const filters = $$(".filter");
  const certs = $$(".cert");
  if (filters.length && certs.length) {
    filters.forEach(btn => {
      btn.addEventListener("click", () => {
        filters.forEach(b => { b.classList.remove("is-active"); b.setAttribute("aria-pressed", "false"); });
        btn.classList.add("is-active"); btn.setAttribute("aria-pressed", "true");
        const f = btn.dataset.filter;
        certs.forEach(c => {
          const show = f === "all" || c.dataset.issuer === f;
          c.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  /* ---- Lightbox de certificados (accesible por teclado) ---- */
  const lb = $(".lightbox");
  if (lb) {
    const lbImg = $(".lightbox__img", lb);
    const lbCap = $(".lightbox__cap", lb);
    let visible = [];   // certs actualmente visibles
    let idx = 0;
    let lastFocused = null;

    const openFrom = (el) => {
      // Reconstruimos la lista de visibles y buscamos la posición del elemento
      // clicado DENTRO de esa lista (evita desajustes cuando hay un filtro activo).
      visible = certs.filter(c => !c.classList.contains("is-hidden"));
      idx = Math.max(0, visible.indexOf(el));
      render();
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      $(".lightbox__close", lb).focus();
    };
    const render = () => {
      const c = visible[idx]; if (!c) return;
      const img = $("img", c);
      lbImg.src = img.dataset.full || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = c.dataset.caption || img.alt;
    };
    const close = () => {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    };
    const move = (d) => { idx = (idx + d + visible.length) % visible.length; render(); };

    certs.forEach((c) => c.addEventListener("click", () => { lastFocused = c; openFrom(c); }));
    $(".lightbox__close", lb).addEventListener("click", close);
    $(".lightbox__prev", lb).addEventListener("click", () => move(-1));
    $(".lightbox__next", lb).addEventListener("click", () => move(1));
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    document.addEventListener("keydown", e => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
    });
  }

  /* ---- Cards de informes: toda la tarjeta es clicable ---- */
  $$(".report").forEach((card) => {
    const link = card.querySelector(".report__link");
    if (!link) return;
    card.style.cursor = "pointer";
    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return; // no interferir con el enlace real
      window.open(link.href, "_blank", "noopener");
    });
  });

  /* ---- Formulario de contacto (vía mailto) ---- */
  const form = $("#contact-form");
  if (form) {
    const status = $(".form__status", form);
    const val = (n) => (form.querySelector('[name="' + n + '"]')?.value || "").trim();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const to = form.dataset.mailto;
      const name = val("name"), email = val("email"), message = val("message");
      if (!name || !email || !message) {
        status.className = "form__status err";
        status.textContent = "Por favor, rellena todos los campos.";
        return;
      }
      const subject = encodeURIComponent("Contacto web — " + name);
      const body = encodeURIComponent("Nombre: " + name + "\nEmail: " + email + "\n\n" + message);
      window.location.href = "mailto:" + to + "?subject=" + subject + "&body=" + body;
      status.className = "form__status ok";
      status.textContent = "✓ Abriendo tu aplicación de correo con el mensaje preparado…";
    });
  }
})();
