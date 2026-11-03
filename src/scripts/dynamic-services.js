/**
 * Dynamic Content Hydration for PrimeSource
 * Fetches latest content from MongoDB API and updates service cards if customized via Admin Panel.
 */

document.addEventListener('DOMContentLoaded', () => {
  hydrateServices();
});

async function hydrateServices() {
  try {
    const res = await fetch('/api/services');
    if (!res.ok) return;
    const services = await res.json();
    if (!Array.isArray(services) || !services.length) return;

    // 1. Hydrate index.html service cards if on homepage
    const indexGrid = document.querySelector('.services-grid');
    if (indexGrid) {
      services.forEach(s => {
        const card = Array.from(document.querySelectorAll('.service-card')).find(c => {
          const badge = c.querySelector('.service-num-badge');
          return badge && badge.textContent.trim() === s.numero;
        });

        if (card) {
          const title = card.querySelector('.service-card-title');
          const desc = card.querySelector('.service-card-desc');
          const list = card.querySelector('.service-card-list');
          if (title && s.titulo) title.textContent = s.titulo;
          if (desc && s.descricao) desc.textContent = s.descricao;
          if (list && Array.isArray(s.produtos_servicos) && s.produtos_servicos.length) {
            list.innerHTML = s.produtos_servicos.slice(0, 3).map(item => `<li class="service-card-list-item">${item}</li>`).join('');
          }
        }
      });
    }

    // 2. Hydrate servicos.html service blocks if on services page
    const detailBlocks = document.querySelectorAll('.service-detail-block');
    if (detailBlocks.length) {
      services.forEach(s => {
        const block = Array.from(detailBlocks).find(b => {
          const tag = b.querySelector('.service-detail-tag');
          return tag && tag.textContent.includes(s.numero);
        });

        if (block) {
          const title = block.querySelector('.service-detail-title');
          const lead = block.querySelector('.service-detail-lead');
          const checklist = block.querySelector('.products-checklist');
          if (title && s.titulo) title.textContent = s.titulo;
          if (lead && s.descricao) lead.textContent = s.descricao;
          if (checklist && Array.isArray(s.produtos_servicos) && s.produtos_servicos.length) {
            checklist.innerHTML = s.produtos_servicos.map(item => `
              <div class="product-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>${item}</span>
              </div>
            `).join('');
          }
        }
      });
    }
  } catch (err) {
    // Graceful fallback to static pre-rendered HTML
  }
}

