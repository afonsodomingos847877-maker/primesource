/**
 * Dynamic Content Hydration for PrimeSource
 * Fetches latest content from MongoDB API, updates service cards/details,
 * and activates automatic multi-image slideshows when a service has 2+ images.
 */

document.addEventListener('DOMContentLoaded', () => {
  hydrateServices();
});

function normalizeNumberTag(text) {
  const match = String(text || '').match(/\d+/);
  return match ? match[0].padStart(2, '0') : '';
}

function getServiceImages(service) {
  const list = Array.isArray(service.imagens)
    ? service.imagens.filter(src => typeof src === 'string' && src.trim())
    : [];
  if (list.length) return list;
  return service.imagem && String(service.imagem).trim() ? [service.imagem.trim()] : [];
}

function setupServiceImageCarousel(container, imgClass, images, altText, staggerMs = 0) {
  if (!container || !images.length) return;

  const existingImg = container.querySelector(`.${imgClass}`);

  // Single image: just update src cleanly
  if (images.length === 1) {
    if (existingImg && existingImg.getAttribute('src') !== images[0]) {
      existingImg.src = images[0];
      if (altText) existingImg.alt = altText;
    }
    return;
  }

  // Multi-image: build smooth crossfade slideshow preserving badges
  container.classList.add('has-carousel');
  if (existingImg) existingImg.remove();
  container.querySelectorAll('.service-carousel-slide, .service-carousel-dots, .service-carousel-arrow').forEach(el => el.remove());

  const slides = images.map((src, idx) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `${altText || 'PrimeSource'} (${idx + 1}/${images.length})`;
    img.className = `${imgClass} service-carousel-slide${idx === 0 ? ' is-active' : ''}`;
    img.loading = idx === 0 ? 'eager' : 'lazy';
    container.appendChild(img);
    return img;
  });

  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'service-carousel-dots';
  dotsWrap.setAttribute('aria-label', 'Galeria de imagens do serviço');

  const dots = images.map((_, idx) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `service-carousel-dot${idx === 0 ? ' is-active' : ''}`;
    dot.setAttribute('aria-label', `Ver imagem ${idx + 1}`);
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToSlide(idx);
      restartAutoPlay();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });
  container.appendChild(dotsWrap);

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'service-carousel-arrow prev';
  prevBtn.setAttribute('aria-label', 'Imagem anterior');
  prevBtn.innerHTML = '&#8249;';
  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    goToSlide((currentIndex - 1 + slides.length) % slides.length);
    restartAutoPlay();
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'service-carousel-arrow next';
  nextBtn.setAttribute('aria-label', 'Próxima imagem');
  nextBtn.innerHTML = '&#8250;';
  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    goToSlide((currentIndex + 1) % slides.length);
    restartAutoPlay();
  });

  container.appendChild(prevBtn);
  container.appendChild(nextBtn);

  let currentIndex = 0;
  let timerId = null;
  let isHovered = false;

  function goToSlide(nextIdx) {
    if (nextIdx === currentIndex) return;
    slides[currentIndex].classList.remove('is-active');
    dots[currentIndex].classList.remove('is-active');
    currentIndex = nextIdx;
    slides[currentIndex].classList.add('is-active');
    dots[currentIndex].classList.add('is-active');
  }

  function startAutoPlay() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      if (!isHovered) {
        goToSlide((currentIndex + 1) % slides.length);
      }
    }, 3500);
  }

  function restartAutoPlay() {
    startAutoPlay();
  }

  container.addEventListener('mouseenter', () => {
    isHovered = true;
  });

  container.addEventListener('mouseleave', () => {
    isHovered = false;
  });

  setTimeout(() => {
    startAutoPlay();
  }, staggerMs);
}

async function hydrateServices() {
  try {
    const res = await fetch('/api/services');
    if (!res.ok) return;
    const services = await res.json();
    if (!Array.isArray(services) || !services.length) return;

    // 1. Hydrate index.html service cards if on homepage
    const indexGrid = document.querySelector('.services-grid');
    if (indexGrid) {
      services.forEach((s, idx) => {
        const targetNum = normalizeNumberTag(s.numero);
        const card = Array.from(document.querySelectorAll('.service-card')).find(c => {
          const badge = c.querySelector('.service-num-badge');
          return badge && normalizeNumberTag(badge.textContent) === targetNum;
        });

        if (card) {
          const title = card.querySelector('.service-card-title');
          const desc = card.querySelector('.service-card-desc');
          const list = card.querySelector('.service-card-list');
          const media = card.querySelector('.service-card-media');

          if (title && s.titulo) title.textContent = s.titulo;
          if (desc && s.descricao) desc.textContent = s.descricao;
          if (list && Array.isArray(s.produtos_servicos) && s.produtos_servicos.length) {
            list.innerHTML = '';
            s.produtos_servicos.slice(0, 3).forEach(item => {
              const li = document.createElement('li');
              li.className = 'service-card-list-item';
              li.textContent = item;
              list.appendChild(li);
            });
          }

          const images = getServiceImages(s);
          if (media && images.length) {
            setupServiceImageCarousel(media, 'service-card-img', images, s.titulo, (idx % 5) * 450);
          }
        }
      });
    }

    // 2. Hydrate servicos.html service blocks if on services page
    const detailBlocks = document.querySelectorAll('.service-detail-block');
    if (detailBlocks.length) {
      services.forEach((s, idx) => {
        const targetNum = normalizeNumberTag(s.numero);
        const block = Array.from(detailBlocks).find(b => {
          const tag = b.querySelector('.service-detail-tag');
          return tag && normalizeNumberTag(tag.textContent) === targetNum;
        });

        if (block) {
          const title = block.querySelector('.service-detail-title');
          const lead = block.querySelector('.service-detail-lead');
          const checklist = block.querySelector('.products-checklist');
          const imgBox = block.querySelector('.service-detail-img-box');

          if (title && s.titulo) title.textContent = s.titulo;
          if (lead && s.descricao) lead.textContent = s.descricao;
          if (checklist && Array.isArray(s.produtos_servicos) && s.produtos_servicos.length) {
            checklist.innerHTML = '';
            s.produtos_servicos.forEach(item => {
              const div = document.createElement('div');
              div.className = 'product-item';
              div.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
              const span = document.createElement('span');
              span.textContent = item;
              div.appendChild(span);
              checklist.appendChild(div);
            });
          }

          const images = getServiceImages(s);
          if (imgBox && images.length) {
            setupServiceImageCarousel(imgBox, 'service-detail-img', images, s.titulo, (idx % 5) * 450);
          }
        }
      });
    }
  } catch (err) {
    // Graceful fallback to static pre-rendered HTML
  }
}
