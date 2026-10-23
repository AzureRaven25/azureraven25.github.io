// Motion for the site. Everything here is an enhancement: the page reads the same without it.
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav turns solid once the hero (or the page head) has scrolled under it.
  const nav = document.querySelector('.nav');
  const top = document.querySelector('.hero, .page-hero');
  if (nav) {
    const update = () => {
      const limit = top ? top.offsetHeight - nav.offsetHeight - 40 : 0;
      nav.classList.toggle('is-solid', window.scrollY > Math.max(limit, 0));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  // Sections slide up as they arrive.
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
    setTimeout(() => reveals.forEach((el) => el.classList.add('is-in')), 4000);
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // The hero waveform: "JASE GEORGE" as 8-bit ASCII, sent with frequency shift keying.
  // A 0 is a slow tone and a 1 is a fast one, the same scheme the door buttons use.
  const canvas = document.querySelector('[data-fsk]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const text = canvas.dataset.fsk || 'JASE GEORGE';
  const bits = [...text].flatMap((ch) => ch.charCodeAt(0).toString(2).padStart(8, '0').split('').map(Number));
  const bitEls = document.querySelectorAll('.stream b');
  const css = getComputedStyle(root);
  const wave = css.getPropertyValue('--color-wave').trim() || '#9fd8e6';
  const hot = css.getPropertyValue('--color-wave-2').trim() || '#f15d22';

  let w = 0, h = 0, dpr = 1, running = true, start = performance.now(), mouseY = 0.5, lastBit = -1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // y of the FSK signal at horizontal position x (in px), shifted by `offset` px of travel.
  const bitWidth = () => Math.max(90, w / 14);
  const fsk = (x, offset) => {
    const bw = bitWidth();
    const pos = x + offset;
    const i = Math.floor(pos / bw);
    const bit = bits[((i % bits.length) + bits.length) % bits.length];
    const cycles = bit ? 3 : 1.5;
    return Math.sin((pos / bw) * cycles * Math.PI * 2);
  };

  const draw = (now) => {
    const t = (now - start) / 1000;
    const speed = reduceMotion ? 0 : 70;
    const offset = t * speed;
    ctx.clearRect(0, 0, w, h);
    const narrow = w < 700;
    const mid = narrow ? Math.min(h * 0.17, 150) : h * 0.34;
    const lines = 9;
    for (let k = 0; k < lines; k++) {
      const lead = k === 4;
      const spread = (k - 4) / 4;
      const amp = (narrow ? Math.min(h, 700) * 0.6 : h) * (lead ? 0.11 : 0.05 + Math.abs(spread) * 0.07) * (0.75 + mouseY * 0.5);
      const drift = Math.sin(t * 0.35 + k) * 18 * spread;
      ctx.beginPath();
      for (let x = -4; x <= w + 4; x += 3) {
        const env = 0.55 + 0.45 * Math.sin(x / w * Math.PI);
        const y = mid + spread * (narrow ? 60 : h * 0.16) + drift + fsk(x, offset + k * 23) * amp * env;
        x === -4 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = lead ? hot : wave;
      ctx.globalAlpha = lead ? 0.95 : 0.16 + (1 - Math.abs(spread)) * 0.22;
      ctx.lineWidth = lead ? 2.2 : 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Light up the bit currently passing the playhead at 72% of the width.
    if (bitEls.length) {
      const pos = w * 0.72 + offset + 4 * 23;
      const i = ((Math.floor(pos / bitWidth()) % bits.length) + bits.length) % bits.length;
      if (i !== lastBit) {
        if (lastBit >= 0 && bitEls[lastBit]) bitEls[lastBit].classList.remove('on');
        if (bitEls[i]) bitEls[i].classList.add('on');
        lastBit = i;
      }
    }
    if (running && !reduceMotion) requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener('resize', resize);
  canvas.parentElement.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseY = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      const was = running; running = e.isIntersecting;
      if (running && !was && !reduceMotion) requestAnimationFrame(draw);
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => {
    const was = running; running = !document.hidden;
    if (running && !was && !reduceMotion) requestAnimationFrame(draw);
  });
  requestAnimationFrame(draw);
})();
