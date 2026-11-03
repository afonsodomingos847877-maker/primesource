import './dynamic-services.js';
/**
 * PrimeSource Procurement and Services - Main Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initActiveNav();
  initScrollAnimations();
  initJumpNavigation();
  initRfqForm();
  initContactUrlParams();
});

/* ==========================================================================
   Header Scroll State
   ========================================================================== */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ==========================================================================
   Mobile Menu & Drawer
   ========================================================================== */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.mobile-drawer-overlay');
  const drawerLinks = document.querySelectorAll('.mobile-nav-link');

  if (!hamburger || !drawer || !overlay) return;

  const openDrawer = () => {
    hamburger.classList.add('is-active');
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    hamburger.classList.remove('is-active');
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('is-open');
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  overlay.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });
}

/* ==========================================================================
   Active Nav Link Indicator
   ========================================================================== */
function initActiveNav() {
  const currentPath = window.location.pathname.replace(/\/$/, '');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Normalizing link path
    const linkPath = href.replace(/\/$/, '').split('#')[0];
    const isHome = (currentPath === '' || currentPath.endsWith('index.html')) && (linkPath === '/' || linkPath === './' || linkPath.endsWith('index.html'));

    if (isHome) {
      if (linkPath === '/' || linkPath === './' || linkPath.endsWith('index.html')) {
        link.classList.add('active');
      }
    } else if (linkPath && currentPath.endsWith(linkPath)) {
      link.classList.add('active');
    }
  });
}

/* ==========================================================================
   Scroll-Triggered Reveal Animations
   ========================================================================== */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal-fade');
  if (!revealElements.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(el => el.classList.add('is-visible'));
  }
}

/* ==========================================================================
   Jump Navigation for Services Page
   ========================================================================== */
function initJumpNavigation() {
  const jumpLinks = document.querySelectorAll('.jump-link');
  if (!jumpLinks.length) return;

  jumpLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          jumpLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          targetElement.scrollIntoView({ behavior: 'smooth' });
          history.pushState(null, null, targetId);
        }
      }
    });
  });
}

/* ==========================================================================
   URL Query Parameters on Contact Page
   ========================================================================== */
function initContactUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceParam = urlParams.get('servico') || urlParams.get('area');
  const serviceSelect = document.getElementById('areaInteresse');

  if (serviceParam && serviceSelect) {
    for (let i = 0; i < serviceSelect.options.length; i++) {
      if (serviceSelect.options[i].value.toLowerCase().includes(serviceParam.toLowerCase())) {
        serviceSelect.selectedIndex = i;
        break;
      }
    }

    const formElement = document.getElementById('rfqForm');
    if (formElement && window.location.hash !== '#contacto-directo') {
      setTimeout(() => {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }
}

/* ==========================================================================
   RFQ Form Handling & Submission
   ========================================================================== */
function initRfqForm() {
  const form = document.getElementById('rfqForm');
  if (!form) return;

  const fileInput = document.getElementById('documentoAnexo');
  const fileDropzone = document.getElementById('fileDropzone');
  const filePreview = document.getElementById('filePreview');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const removeFileBtn = document.getElementById('removeFileBtn');
  const submitBtn = document.getElementById('rfqSubmitBtn');
  const modal = document.getElementById('quoteSuccessModal');
  const modalClose = document.querySelectorAll('.modal-close, .modal-close-btn');

  // File Drag & Drop
  if (fileDropzone && fileInput) {
    ['dragenter', 'dragover'].forEach(eventName => {
      fileDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileDropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      fileDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileDropzone.classList.remove('dragover');
      }, false);
    });

    fileDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length) {
        fileInput.files = files;
        updateFilePreview(files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        updateFilePreview(fileInput.files[0]);
      }
    });

    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.value = '';
        if (filePreview) filePreview.style.display = 'none';
        if (fileDropzone) fileDropzone.style.display = 'block';
      });
    }
  }

  function updateFilePreview(file) {
    if (!filePreview || !fileNameDisplay) return;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    fileNameDisplay.textContent = `${file.name} (${sizeMb} MB)`;
    filePreview.style.display = 'flex';
    fileDropzone.style.display = 'none';
  }

  // Form Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check spam honeypot
    const honeypot = document.getElementById('website_url_check');
    if (honeypot && honeypot.value !== '') {
      console.warn('Spam submission prevented.');
      return;
    }

    // Extract form data
    const nome = document.getElementById('nomeCompleto').value.trim();
    const empresa = document.getElementById('nomeEmpresa').value.trim();
    const email = document.getElementById('emailCorporativo').value.trim();
    const telefone = document.getElementById('numeroTelefone').value.trim();
    const area = document.getElementById('areaInteresse').value;
    const descricao = document.getElementById('descricaoNecessidade').value.trim();
    const equipamentos = document.getElementById('listaEquipamentos').value.trim();
    const quantidade = document.getElementById('quantidadePretendida') ? document.getElementById('quantidadePretendida').value.trim() : '';

    if (!nome || !empresa || !email || !telefone || !area || !descricao) {
      alert('Por favor, preencha todos os campos obrigatórios marcados com (*).');
      return;
    }

    // Button loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner" width="20" height="20" viewBox="0 0 50 50" style="animation: spin 1s linear infinite;">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="80" stroke-dashoffset="60"></circle>
      </svg>
      A registar na base de dados...
    `;

    // Send to MongoDB API
    const quotePayload = {
      nome,
      empresa,
      email,
      telefone,
      area,
      descricao,
      equipamentos,
      quantidade,
      ficheiro_nome: fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0].name : '',
      website_url_check: honeypot ? honeypot.value : ''
    };

    let mongoQuoteId = null;

    try {
      // Try /api/quotes or direct port 5000 fallback
      const apiUrl = window.location.port === '3000' ? '/api/quotes' : (window.location.origin + '/api/quotes');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotePayload)
      }).catch(() => {
        // Fallback directly to localhost:5050 if running in local dev without proxy
        return fetch('http://localhost:5050/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quotePayload)
        });
      });

      if (response && response.ok) {
        const data = await response.json();
        if (data.quoteId) {
          mongoQuoteId = data.quoteId;
          console.log('[MongoDB] Pedido registado com ID:', mongoQuoteId);
        }
      }
    } catch (err) {
      console.warn('[MongoDB] Registo offline/fallback:', err.message);
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;

    // Populate Success Modal Summary
    const summaryNome = document.getElementById('modalSummaryNome');
    const summaryEmpresa = document.getElementById('modalSummaryEmpresa');
    const summaryArea = document.getElementById('modalSummaryArea');
    const modalWhatsappLink = document.getElementById('modalWhatsappAction');
    const modalEmailLink = document.getElementById('modalEmailAction');
    const modalDownloadBtn = document.getElementById('modalDownloadAction');

    if (summaryNome) summaryNome.textContent = nome;
    if (summaryEmpresa) summaryEmpresa.textContent = empresa;
    if (summaryArea) summaryArea.textContent = `${area} ${mongoQuoteId ? `(Ref. MongoDB: #${mongoQuoteId.slice(-6)})` : ''}`;

    // Prepare WhatsApp message
    const whatsappMsg = encodeURIComponent(
      `*PEDIDO DE COTAÇÃO - PRIMESOURCE PROCUREMENT*\n\n` +
      (mongoQuoteId ? `*Ref. Registo:* ${mongoQuoteId}\n` : '') +
      `*Nome:* ${nome}\n` +
      `*Empresa:* ${empresa}\n` +
      `*Email:* ${email}\n` +
      `*Telefone:* ${telefone}\n` +
      `*Área de Interesse:* ${area}\n` +
      `*Descrição:* ${descricao}\n` +
      (equipamentos ? `*Equipamentos/Serviços:* ${equipamentos}\n` : '') +
      (quantidade ? `*Quantidade:* ${quantidade}\n` : '') +
      `\n_Enviado através do website oficial primesourceps.co.mz_`
    );

    if (modalWhatsappLink) {
      modalWhatsappLink.href = `https://wa.me/258843318434?text=${whatsappMsg}`;
    }

    // Prepare Mailto link
    const emailSubject = encodeURIComponent(`Solicitação de Cotação - ${empresa} (${area}) ${mongoQuoteId ? `[Ref: ${mongoQuoteId.slice(-6)}]` : ''}`);
    const emailBody = encodeURIComponent(
      `Prezada equipa PrimeSource Procurement and Services,\n\n` +
      `Gostaria de solicitar uma cotação formal com os seguintes dados:\n\n` +
      (mongoQuoteId ? `Referência do Sistema: ${mongoQuoteId}\n` : '') +
      `Nome do Contacto: ${nome}\n` +
      `Empresa / Instituição: ${empresa}\n` +
      `Email: ${email}\n` +
      `Telefone: ${telefone}\n` +
      `Área de Interesse: ${area}\n` +
      `Descrição da Necessidade:\n${descricao}\n\n` +
      `Lista de Equipamentos / Serviços:\n${equipamentos}\n` +
      (quantidade ? `Quantidade: ${quantidade}\n\n` : '\n') +
      `Cumprimentos,\n${nome}\n${empresa}`
    );

    if (modalEmailLink) {
      modalEmailLink.href = `mailto:info@primesourceps.co.mz?subject=${emailSubject}&body=${emailBody}`;
    }

    // Download summary function
    if (modalDownloadBtn) {
      modalDownloadBtn.onclick = () => {
        const refCode = mongoQuoteId || `PS-RFQ-${Date.now().toString().slice(-6)}`;
        const dossier = 
`=============================================================
PRIMESOURCE PROCUREMENT AND SERVICES
RESUMO DE SOLICITAÇÃO DE COTAÇÃO / REQUISIÇÃO
=============================================================
Data: ${new Date().toLocaleString('pt-MZ')}
Referência do Sistema (MongoDB): ${refCode}

DADOS DO SOLICITANTE:
- Nome Completo: ${nome}
- Empresa / Instituição: ${empresa}
- Email: ${email}
- Telefone: ${telefone}

DETALHES DO PEDIDO:
- Área de Negócio: ${area}
- Descrição da Necessidade:
${descricao}

- Equipamentos ou Serviços Pretendidos:
${equipamentos || 'Ver descrição ou anexo fornecido.'}

- Quantidade Estimada: ${quantidade || 'Conforme especificação técnica'}

CONTACTOS PRIMESOURCE:
Website: https://www.primesourceps.co.mz/
Email: info@primesourceps.co.mz
Telefones: +258 84 331 8434 / +258 84 700 8172
Maputo, Moçambique
=============================================================`;
        const blob = new Blob([dossier], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PrimeSource_Cotacao_${empresa.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    }

    // Show modal
    if (modal) {
      modal.classList.add('is-active');
    }

    // Reset form
    form.reset();
    if (filePreview) filePreview.style.display = 'none';
    if (fileDropzone) fileDropzone.style.display = 'block';
  });

  // Modal Close Handlers
  modalClose.forEach(btn => {
    btn.addEventListener('click', () => {
      if (modal) modal.classList.remove('is-active');
    });
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-active');
      }
    });
  }
}
