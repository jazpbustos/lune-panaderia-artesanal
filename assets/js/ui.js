window.LuneUI = (() => {

  function initNavbar() {
    const navbar = document.querySelector('#navbar');
    const hamburger = document.querySelector('#hamburger');
    const mobileMenu = document.querySelector('#mobileMenu');

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {

      /* NAVBAR SCROLLED */
      navbar?.classList.toggle('scrolled', window.scrollY > 20);

      /* ACTIVE LINK */
      let current = '';

      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 140;
        const sectionHeight = section.offsetHeight;

        if (window.scrollY >= sectionTop) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove('active');

        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });

    /* MOBILE MENU */
    hamburger?.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu?.classList.toggle('open');
    });

    document.querySelectorAll('.mobile-link').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger?.classList.remove('open');
        mobileMenu?.classList.remove('open');
      });
    });
  }

  function initReveal() {
    const items = document.querySelectorAll('.section .reveal-up');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.15
    });

    items.forEach((item) => observer.observe(item));
  }

  function initForms() {
    const contactForm = document.querySelector('#contactForm');
    const success = document.querySelector('#formSuccess');

    contactForm?.addEventListener('submit', (event) => {
      event.preventDefault();

      success?.classList.remove('hidden');

      contactForm.reset();
    });
  }
function initTestimonials() {

  const track = document.querySelector('#testimoniosTrack');
  const dotsContainer = document.querySelector('#testimoniosDots');

  const cards = track
    ? Array.from(track.children)
    : [];

  if (!track || !dotsContainer || !cards.length) return;

  // CREAR DOTS
  dotsContainer.innerHTML = cards.map((_, index) => `
    <button
      class="dot ${index === 0 ? 'active' : ''}"
      data-index="${index}"
      aria-label="Testimonio ${index + 1}">
    </button>
  `).join('');

  const dots = dotsContainer.querySelectorAll('.dot');

  // CLICK EN DOT
  dots.forEach((dot, index) => {

    dot.addEventListener('click', () => {

      cards[index].scrollIntoView({
        behavior: 'smooth',
        inline: 'start',
        block: 'nearest'
      });

      updateActiveDot(index);
    });
  });

  // ACTUALIZAR DOT ACTIVO
  function updateActiveDot(activeIndex) {

    dots.forEach(dot =>
      dot.classList.remove('active')
    );

    dots[activeIndex]?.classList.add('active');
  }

  // DETECTAR SCROLL
  track.addEventListener('scroll', () => {

    const scrollLeft = track.scrollLeft;

    let activeIndex = 0;

    cards.forEach((card, index) => {

      const offset = card.offsetLeft;

      if (scrollLeft >= offset - 100) {
        activeIndex = index;
      }
    });

    updateActiveDot(activeIndex);
  });
}

  function init() {
    initNavbar();
    initReveal();
    initForms();
    initTestimonials();
  }

  return { init };

})();