/**
 * Dynamic Content Hydration for PrimeSource
 * Fetches latest content from MongoDB API, updates service cards/details,
 * activates automatic multi-image slideshows, and provides details modals.
 */

const servicesByNumber = new Map();
let companyData = null;

document.addEventListener('DOMContentLoaded', () => {
  initServiceCardDetailsModal();
  initIntroDetailsModal();
  hydrateServices();
  hydrateCompany();
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

  if (typeof container._carouselCleanup === 'function') {
    container._carouselCleanup();
    container._carouselCleanup = null;
  }

  const existingImg = container.querySelector(`.${imgClass}`);

  // Single image: just update src cleanly
  if (images.length === 1) {
    container.classList.remove('has-carousel');
    container.querySelectorAll('.service-carousel-dots, .service-carousel-arrow').forEach(el => el.remove());
    if (existingImg) {
      existingImg.classList.remove('service-carousel-slide', 'is-active');
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
  dotsWrap.setAttribute('aria-label', 'Galeria de imagens');

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

  const onEnter = () => { isHovered = true; };
  const onLeave = () => { isHovered = false; };
  container.addEventListener('mouseenter', onEnter);
  container.addEventListener('mouseleave', onLeave);

  const startTimer = setTimeout(() => {
    startAutoPlay();
  }, staggerMs);

  container._carouselCleanup = () => {
    clearTimeout(startTimer);
    if (timerId) clearInterval(timerId);
    container.removeEventListener('mouseenter', onEnter);
    container.removeEventListener('mouseleave', onLeave);
  };
}

function createServiceDetailsModal() {
  let backdrop = document.getElementById('serviceDetailsModal');
  if (backdrop) return backdrop;

  backdrop = document.createElement('div');
  backdrop.id = 'serviceDetailsModal';
  backdrop.className = 'service-details-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-labelledby', 'serviceDetailsModalTitle');

  backdrop.innerHTML = `
    <div class="service-details-dialog">
      <div class="service-details-header">
        <div>
          <span class="service-details-kicker" id="serviceDetailsModalKicker">Área de Actuação</span>
          <h3 class="service-details-title" id="serviceDetailsModalTitle"></h3>
        </div>
        <button type="button" class="service-details-close" id="closeServiceDetailsBtn" aria-label="Fechar">&times;</button>
      </div>
      <div class="service-details-body">
        <div class="service-details-media" id="serviceDetailsMedia">
          <img src="" alt="" class="service-details-media-img">
        </div>
        <div class="service-details-paragraphs" id="serviceDetailsModalParagraphs"></div>
        <h4 class="service-details-subtitle" id="serviceDetailsModalSubtitle">Equipamentos e Soluções Incluídas</h4>
        <div class="service-details-checklist" id="serviceDetailsModalList"></div>
      </div>
      <div class="service-details-footer">
        <button type="button" class="btn btn-sm btn-outline-navy" id="closeServiceDetailsFooterBtn">Fechar</button>
        <div class="service-details-footer-actions">
          <a href="/servicos.html" class="btn btn-sm btn-secondary" id="serviceDetailsPageLink">Ver página completa</a>
          <a href="/contactos.html" class="btn btn-sm btn-primary" id="serviceDetailsQuoteLink">Solicitar Cotação</a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  function closeModal() {
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    const media = document.getElementById('serviceDetailsMedia');
    if (media && typeof media._carouselCleanup === 'function') {
      media._carouselCleanup();
      media._carouselCleanup = null;
    }
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  backdrop.querySelector('#closeServiceDetailsBtn')?.addEventListener('click', closeModal);
  backdrop.querySelector('#closeServiceDetailsFooterBtn')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
      closeModal();
    }
  });

  backdrop._closeModal = closeModal;
  return backdrop;
}

function openDetailsModal({
  kicker,
  title,
  paragraphs,
  itemsSubtitle = 'Equipamentos e Soluções Incluídas',
  items = [],
  images = [],
  pageLink = '',
  pageLinkText = 'Ver página completa',
  quoteLink = '/contactos.html'
}) {
  const backdrop = createServiceDetailsModal();
  const kickerEl = document.getElementById('serviceDetailsModalKicker');
  const titleEl = document.getElementById('serviceDetailsModalTitle');
  const paragraphsEl = document.getElementById('serviceDetailsModalParagraphs');
  const subtitleEl = document.getElementById('serviceDetailsModalSubtitle');
  const listEl = document.getElementById('serviceDetailsModalList');
  const mediaEl = document.getElementById('serviceDetailsMedia');
  const pageLinkEl = document.getElementById('serviceDetailsPageLink');
  const quoteLinkEl = document.getElementById('serviceDetailsQuoteLink');

  kickerEl.textContent = kicker || 'PrimeSource';
  titleEl.textContent = title || '';

  paragraphsEl.innerHTML = '';
  (paragraphs || []).filter(Boolean).forEach(text => {
    const p = document.createElement('p');
    p.className = 'service-details-desc';
    p.textContent = text;
    paragraphsEl.appendChild(p);
  });

  if (items.length) {
    subtitleEl.textContent = itemsSubtitle;
    subtitleEl.style.display = '';
    listEl.style.display = '';
    listEl.innerHTML = '';
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'service-details-item';
      div.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      const span = document.createElement('span');
      span.textContent = item;
      div.appendChild(span);
      listEl.appendChild(div);
    });
  } else {
    subtitleEl.style.display = 'none';
    listEl.style.display = 'none';
  }

  if (mediaEl) {
    mediaEl.innerHTML = '<img src="" alt="" class="service-details-media-img">';
    if (images.length) {
      setupServiceImageCarousel(mediaEl, 'service-details-media-img', images, title, 0);
    }
  }

  if (pageLink) {
    pageLinkEl.href = pageLink;
    pageLinkEl.textContent = pageLinkText;
    pageLinkEl.style.display = 'inline-flex';
  } else {
    pageLinkEl.style.display = 'none';
  }
  quoteLinkEl.href = quoteLink;

  backdrop.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function initServiceCardDetailsModal() {
  const cards = document.querySelectorAll('.services-grid .service-card');
  if (!cards.length) return;

  createServiceDetailsModal();

  function openCardDetails(card) {
    const badge = card.querySelector('.service-num-badge');
    const numKey = badge ? normalizeNumberTag(badge.textContent) : '';
    const dbService = numKey ? servicesByNumber.get(numKey) : null;

    const title = (dbService && dbService.titulo) || card.querySelector('.service-card-title')?.textContent?.trim() || '';
    const desc = (dbService && dbService.descricao) || card.querySelector('.service-card-desc')?.textContent?.trim() || '';
    const items = (dbService && Array.isArray(dbService.produtos_servicos) && dbService.produtos_servicos.length)
      ? dbService.produtos_servicos
      : Array.from(card.querySelectorAll('.service-card-list-item')).map(li => li.textContent.trim()).filter(Boolean);

    let images = dbService ? getServiceImages(dbService) : [];
    if (!images.length) {
      const domImgs = Array.from(card.querySelectorAll('.service-card-media img'))
        .map(img => img.getAttribute('src'))
        .filter(Boolean);
      images = Array.from(new Set(domImgs));
    }

    openDetailsModal({
      kicker: numKey ? `Área de Actuação ${numKey}` : 'Área de Actuação',
      title,
      paragraphs: [desc],
      itemsSubtitle: 'Equipamentos e Soluções Incluídas',
      items,
      images,
      pageLink: card.querySelector('.service-card-link')?.getAttribute('href') || '',
      pageLinkText: 'Ver página completa',
      quoteLink: card.querySelector('.service-card-footer .btn')?.getAttribute('href') || '/contactos.html'
    });
  }

  cards.forEach(card => {
    card.classList.add('is-clickable');
    card.addEventListener('click', (e) => {
      if (e.target.closest('.service-carousel-arrow, .service-carousel-dot')) return;
      if (e.target.closest('.service-card-footer .btn')) return;

      const link = e.target.closest('.service-card-link');
      if (link) {
        e.preventDefault();
      }
      openCardDetails(card);
    });
  });
}

function initIntroDetailsModal() {
  const openBtn = document.getElementById('openIntroDetailsBtn');
  const introWrapper = document.querySelector('.intro-image-wrapper');
  const introContent = document.querySelector('.intro-content');
  if (!introContent || (!openBtn && !introWrapper)) return;

  createServiceDetailsModal();

  function openIntroModal() {
    const title = introContent.querySelector('#introHeading, .section-title')?.textContent?.trim() || 'Apresentação Institucional';
    const domParagraphs = Array.from(introContent.querySelectorAll('p'))
      .map(p => p.textContent.trim())
      .filter(Boolean);

    if (companyData && companyData.descricao_institucional && domParagraphs.length) {
      domParagraphs[0] = companyData.descricao_institucional;
    }

    const items = Array.from(introContent.querySelectorAll('.feature-check-item'))
      .map(el => el.textContent.trim())
      .filter(Boolean);

    let images = (companyData && Array.isArray(companyData.imagens_institucionais))
      ? companyData.imagens_institucionais.filter(src => typeof src === 'string' && src.trim())
      : [];

    if (!images.length && introWrapper) {
      const domImgs = Array.from(introWrapper.querySelectorAll('img'))
        .map(img => img.getAttribute('src'))
        .filter(Boolean);
      images = Array.from(new Set(domImgs));
    }

    openDetailsModal({
      kicker: 'Apresentação Institucional',
      title,
      paragraphs: domParagraphs,
      itemsSubtitle: 'Diferenciais Operacionais',
      items,
      images,
      pageLink: '/sobre.html',
      pageLinkText: 'Conheça a PrimeSource',
      quoteLink: '/contactos.html'
    });
  }

  openBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openIntroModal();
  });

  if (introWrapper) {
    introWrapper.classList.add('is-clickable');
    introWrapper.addEventListener('click', (e) => {
      if (e.target.closest('.service-carousel-arrow, .service-carousel-dot')) return;
      openIntroModal();
    });
  }
}

async function hydrateServices() {
  try {
    const res = await fetch('/api/services');
    if (!res.ok) return;
    const services = await res.json();
    if (!Array.isArray(services) || !services.length) return;

    services.forEach(s => {
      const num = normalizeNumberTag(s.numero);
      if (num) servicesByNumber.set(num, s);
    });

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

async function hydrateCompany() {
  try {
    const introWrapper = document.querySelector('.intro-image-wrapper');
    if (!introWrapper) return;

    const res = await fetch('/api/company');
    if (!res.ok) return;
    const company = await res.json();
    companyData = company;

    const leadEl = document.querySelector('.intro-content .lead');
    if (leadEl && company.descricao_institucional) {
      leadEl.textContent = company.descricao_institucional;
    }

    const images = Array.isArray(company.imagens_institucionais)
      ? company.imagens_institucionais.filter(src => typeof src === 'string' && src.trim())
      : [];
    if (!images.length) return;

    let imgBox = introWrapper.querySelector('.intro-image-box');
    if (!imgBox) {
      const origImg = introWrapper.querySelector('.intro-image');
      if (!origImg) return;
      imgBox = document.createElement('div');
      imgBox.className = 'intro-image-box';
      introWrapper.insertBefore(imgBox, origImg);
      imgBox.appendChild(origImg);
    }

    setupServiceImageCarousel(imgBox, 'intro-image', images, company.nome || 'PrimeSource Procurement and Services', 250);
  } catch (err) {
    // Graceful fallback to static pre-rendered HTML
  }
}
