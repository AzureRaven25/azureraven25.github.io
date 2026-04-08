// Mobile nav
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
if (hamburger) hamburger.addEventListener('click', () => navMobile.classList.toggle('open'));
function closeMenu() { if (navMobile) navMobile.classList.remove('open'); }

// Enable fade-in animations only once JS is confirmed running
document.documentElement.classList.add('js-ready');

// Intersection observer for fade-ins
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });
fadeEls.forEach(el => observer.observe(el));

// Hard fallback: show everything after 1.2s in case observer misfires
setTimeout(() => {
  document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
}, 1200);
