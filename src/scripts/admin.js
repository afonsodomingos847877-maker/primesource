/**
 * PrimeSource Procurement and Services - Admin Panel Application Script
 */

const API_BASE = '/api';
let authToken = localStorage.getItem('ps_admin_token') || '';
let currentQuotes = [];
let currentServices = [];
let serviceGallery = null;
let companyGallery = null;

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNavigation();
  initQuotesModule();
  initServicesModule();
  initCompanyModule();
});

/* ==========================================================================
   1. Authentication & Session Handling
   ========================================================================== */
function initAuth() {
  const loginScreen = document.getElementById('loginScreen');
  const adminApp = document.getElementById('adminApp');
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('adminPassword');
  const togglePwdBtn = document.getElementById('togglePasswordBtn');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  // Toggle Password Visibility
  togglePwdBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePwdBtn.style.color = isPassword ? '#ea580c' : '#64748b';
  });

  // Verify existing token on load
  if (authToken) {
    verifySession();
  } else {
    showLogin();
  }

  // Handle Login Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const password = passwordInput.value.trim();
    if (!password) return;

    const submitBtn = document.getElementById('loginSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>A verificar...</span>';

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        authToken = data.token;
        localStorage.setItem('ps_admin_token', authToken);
        passwordInput.value = '';
        showApp();
        showToast('Sessão iniciada com sucesso!', 'success');
        loadAllData();
      } else {
        loginError.textContent = data.error || 'Credenciais inválidas.';
        loginError.style.display = 'block';
      }
    } catch (err) {
      loginError.textContent = 'Erro ao contactar o servidor da API.';
      loginError.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Iniciar Sessão</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    authToken = '';
    localStorage.removeItem('ps_admin_token');
    showLogin();
    showToast('Sessão terminada.', 'info');
  });

  async function verifySession() {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showApp();
        loadAllData();
      } else {
        localStorage.removeItem('ps_admin_token');
        authToken = '';
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  function showLogin() {
    loginScreen.style.display = 'flex';
    adminApp.style.display = 'none';
  }

  function showApp() {
    loginScreen.style.display = 'none';
    adminApp.style.display = 'flex';
  }
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

/* ==========================================================================
   2. Navigation & Tab Switching
   ========================================================================== */
function initNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const sidebar = document.getElementById('adminSidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const viewAllQuotesBtn = document.getElementById('viewAllQuotesBtn');

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTabId = item.getAttribute('data-tab');
      switchTab(targetTabId);
      if (window.innerWidth <= 991) {
        sidebar.classList.remove('open');
      }
    });
  });

  if (viewAllQuotesBtn) {
    viewAllQuotesBtn.addEventListener('click', () => {
      switchTab('tabQuotes');
    });
  }

  function switchTab(tabId) {
    navItems.forEach(n => {
      if (n.getAttribute('data-tab') === tabId) {
        n.classList.add('active');
      } else {
        n.classList.remove('active');
      }
    });

    tabPanes.forEach(pane => {
      if (pane.id === tabId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }
}

/* ==========================================================================
   3. Load All Data & Statistics
   ========================================================================== */
async function loadAllData() {
  loadStats();
  loadQuotes();
  loadServices();
  loadCompany();
}

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('statTotalQuotes').textContent = data.quotesCount || 0;
    document.getElementById('statPendingQuotes').textContent = data.quotesPending || 0;
    document.getElementById('statTotalServices').textContent = data.servicesCount || 0;

    const badgePending = document.getElementById('badgePendingQuotes');
    if (data.quotesPending > 0) {
      badgePending.textContent = data.quotesPending;
      badgePending.style.display = 'inline-block';
    } else {
      badgePending.style.display = 'none';
    }
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
  }
}

document.getElementById('refreshStatsBtn')?.addEventListener('click', () => {
  loadAllData();
  showToast('Dados actualizados.', 'info');
});

/* ==========================================================================
   4. Quotes (RFQs) Module
   ========================================================================== */
function initQuotesModule() {
  const searchInput = document.getElementById('quotesSearchInput');
  const statusChips = document.querySelectorAll('.status-chip');
  const exportCsvBtn = document.getElementById('exportQuotesCsvBtn');
  const quoteModal = document.getElementById('quoteModal');
  const closeQuoteModalBtn = document.getElementById('closeQuoteModalBtn');
  const closeQuoteBtn = document.getElementById('closeQuoteBtn');

  closeQuoteModalBtn.addEventListener('click', () => quoteModal.style.display = 'none');
  closeQuoteBtn.addEventListener('click', () => quoteModal.style.display = 'none');

  let activeStatusFilter = 'all';

  searchInput.addEventListener('input', () => {
    filterAndRenderQuotes();
  });

  statusChips.forEach(chip => {
    chip.addEventListener('click', () => {
      statusChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStatusFilter = chip.getAttribute('data-status');
      filterAndRenderQuotes();
    });
  });

  exportCsvBtn.addEventListener('click', () => {
    exportQuotesToCSV();
  });

  window.filterAndRenderQuotes = function() {
    const query = searchInput.value.toLowerCase().trim();
    let filtered = currentQuotes.filter(q => {
      const matchSearch = (
        (q.nome_completo || '').toLowerCase().includes(query) ||
        (q.empresa || '').toLowerCase().includes(query) ||
        (q.email || '').toLowerCase().includes(query) ||
        (q.area_interesse || '').toLowerCase().includes(query)
      );

      const matchStatus = activeStatusFilter === 'all' || q.status === activeStatusFilter;
      return matchSearch && matchStatus;
    });

    renderQuotesTable(filtered);
  };
}

async function loadQuotes() {
  const tbody = document.getElementById('quotesTableBody');
  const recentTbody = document.getElementById('recentQuotesTbody');

  try {
    const res = await fetch(`${API_BASE}/quotes`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar pedidos');
    currentQuotes = await res.json();

    // Render main quotes table
    filterAndRenderQuotes();

    // Render recent quotes in dashboard
    renderRecentQuotes(currentQuotes.slice(0, 5));
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-red-600">Erro ao ligar ao servidor de pedidos.</td></tr>`;
    recentTbody.innerHTML = `<tr><td colspan="5" class="text-center p-4">Sem dados disponíveis.</td></tr>`;
  }
}

function renderQuotesTable(quotes) {
  const tbody = document.getElementById('quotesTableBody');
  if (!quotes || !quotes.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4">Nenhum pedido de cotação encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = quotes.map(q => {
    const dateFormatted = new Date(q.criado_em).toLocaleDateString('pt-MZ', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
      <tr>
        <td style="white-space: nowrap; font-size: 0.8rem; color: #64748b;">${dateFormatted}</td>
        <td><strong>${escapeHtml(q.nome_completo)}</strong></td>
        <td>${escapeHtml(q.empresa)}</td>
        <td>
          <a href="mailto:${q.email}" style="color: #2563eb; text-decoration: none;">${escapeHtml(q.email)}</a><br>
          <a href="tel:${q.telefone}" style="color: #64748b; text-decoration: none; font-size: 0.82rem;">${escapeHtml(q.telefone)}</a>
        </td>
        <td><span style="font-weight: 600;">${escapeHtml(q.area_interesse)}</span></td>
        <td><span class="status-badge ${q.status}">${formatStatusLabel(q.status)}</span></td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="viewQuoteDetails('${q._id}')">Ver Detalhes</button>
            <button class="btn btn-danger btn-sm" onclick="deleteQuote('${q._id}')" title="Eliminar">&times;</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderRecentQuotes(quotes) {
  const recentTbody = document.getElementById('recentQuotesTbody');
  if (!quotes || !quotes.length) {
    recentTbody.innerHTML = `<tr><td colspan="5" class="text-center p-4">Nenhum pedido recente.</td></tr>`;
    return;
  }

  recentTbody.innerHTML = quotes.map(q => {
    const dateFormatted = new Date(q.criado_em).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `
      <tr>
        <td>${dateFormatted}</td>
        <td><strong>${escapeHtml(q.nome_completo)}</strong> (${escapeHtml(q.empresa)})</td>
        <td>${escapeHtml(q.area_interesse)}</td>
        <td><span class="status-badge ${q.status}">${formatStatusLabel(q.status)}</span></td>
        <td><button class="btn btn-secondary btn-sm" onclick="viewQuoteDetails('${q._id}')">Detalhes</button></td>
      </tr>
    `;
  }).join('');
}

window.viewQuoteDetails = function(quoteId) {
  const q = currentQuotes.find(item => item._id === quoteId);
  if (!q) return;

  const modalBody = document.getElementById('quoteModalBody');
  const dateFormatted = new Date(q.criado_em).toLocaleString('pt-MZ');

  modalBody.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; background: #f8fafc; padding: 1rem; border-radius: 8px;">
      <div><strong>Cliente:</strong> ${escapeHtml(q.nome_completo)}</div>
      <div><strong>Empresa:</strong> ${escapeHtml(q.empresa)}</div>
      <div><strong>Email:</strong> <a href="mailto:${q.email}">${escapeHtml(q.email)}</a></div>
      <div><strong>Telefone:</strong> <a href="tel:${q.telefone}">${escapeHtml(q.telefone)}</a></div>
      <div><strong>Data de Registo:</strong> ${dateFormatted}</div>
      <div><strong>Endereço IP:</strong> ${escapeHtml(q.ip_origem || 'Não registado')}</div>
    </div>

    <div style="margin-bottom: 1.25rem;">
      <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.35rem;">Área de Interesse Solicitada:</h4>
      <div style="padding: 0.6rem 0.85rem; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; font-weight: 700; color: #ea580c;">
        ${escapeHtml(q.area_interesse)}
      </div>
    </div>

    <div style="margin-bottom: 1.25rem;">
      <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.35rem;">Descrição da Necessidade Operacional:</h4>
      <div style="padding: 0.85rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(q.descricao_necessidade)}</div>
    </div>

    ${q.lista_equipamentos ? `
      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.35rem;">Equipamentos / Quantidade:</h4>
        <div style="padding: 0.85rem; background: #f1f5f9; border-radius: 6px;">
          ${escapeHtml(q.lista_equipamentos)} ${q.quantidade ? `(Qtd: ${escapeHtml(q.quantidade)})` : ''}
        </div>
      </div>
    ` : ''}

    <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e2e8f0;">

    <div class="form-group">
      <label class="form-label">Estado do Pedido:</label>
      <select id="modalQuoteStatus" class="form-input" style="font-weight: 700;">
        <option value="pendente" ${q.status === 'pendente' ? 'selected' : ''}>Pendente (Aguardando Resposta)</option>
        <option value="em_analise" ${q.status === 'em_analise' ? 'selected' : ''}>Em Análise Técnica / Cotação</option>
        <option value="respondido" ${q.status === 'respondido' ? 'selected' : ''}>Respondido ao Cliente</option>
        <option value="concluido" ${q.status === 'concluido' ? 'selected' : ''}>Concluído / Fornecido</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Notas Internas da Equipa PrimeSource:</label>
      <textarea id="modalQuoteNotes" class="form-textarea" rows="3" placeholder="Insira apontamentos internos sobre este pedido...">${escapeHtml(q.notas_internas || '')}</textarea>
    </div>

    <button type="button" class="btn btn-primary btn-block" onclick="saveQuoteStatus('${q._id}')">
      Guardar Alterações do Pedido
    </button>
  `;

  document.getElementById('quoteModal').style.display = 'flex';
};

window.saveQuoteStatus = async function(quoteId) {
  const status = document.getElementById('modalQuoteStatus').value;
  const notas_internas = document.getElementById('modalQuoteNotes').value;

  try {
    const res = await fetch(`${API_BASE}/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notas_internas })
    });

    if (res.ok) {
      showToast('Estado do pedido atualizado!', 'success');
      document.getElementById('quoteModal').style.display = 'none';
      loadQuotes();
      loadStats();
    } else {
      showToast('Erro ao atualizar o pedido.', 'error');
    }
  } catch (err) {
    showToast('Erro de comunicação com o servidor.', 'error');
  }
};

window.deleteQuote = async function(quoteId) {
  if (!confirm('Tem a certeza que deseja eliminar este pedido de cotação? Esta ação é irreversível.')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/quotes/${quoteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (res.ok) {
      showToast('Pedido eliminado.', 'info');
      loadQuotes();
      loadStats();
    } else {
      showToast('Erro ao eliminar pedido.', 'error');
    }
  } catch (err) {
    showToast('Erro de comunicação.', 'error');
  }
};

function exportQuotesToCSV() {
  if (!currentQuotes.length) {
    showToast('Nenhum pedido para exportar.', 'error');
    return;
  }

  const headers = ['Data', 'Nome', 'Empresa', 'Email', 'Telefone', 'Area', 'Descricao', 'Equipamentos', 'Quantidade', 'Estado'];
  const rows = currentQuotes.map(q => [
    `"${new Date(q.criado_em).toISOString()}"`,
    `"${(q.nome_completo || '').replace(/"/g, '""')}"`,
    `"${(q.empresa || '').replace(/"/g, '""')}"`,
    `"${(q.email || '').replace(/"/g, '""')}"`,
    `"${(q.telefone || '').replace(/"/g, '""')}"`,
    `"${(q.area_interesse || '').replace(/"/g, '""')}"`,
    `"${(q.descricao_necessidade || '').replace(/"/g, '""')}"`,
    `"${(q.lista_equipamentos || '').replace(/"/g, '""')}"`,
    `"${(q.quantidade || '').replace(/"/g, '""')}"`,
    `"${q.status || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos-cotacao-primesource-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Ficheiro CSV gerado com sucesso!', 'success');
}

/* ==========================================================================
   5. Services Module (Áreas de Actuação)
   ========================================================================== */
function optimizeImageFile(file, maxDim = 960, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o ficheiro.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reusable controller for multi-image upload, preview, reorder and manual URL entry.
 */
function createGalleryController({ galleryId, fileInputId, uploadBtnId, urlInputId, addUrlBtnId }) {
  const gallery = document.getElementById(galleryId);
  const fileInput = document.getElementById(fileInputId);
  const uploadBtn = document.getElementById(uploadBtnId);
  const urlInput = document.getElementById(urlInputId);
  const addUrlBtn = document.getElementById(addUrlBtnId);
  let images = [];

  function render() {
    if (!gallery) return;
    if (!images.length) {
      gallery.innerHTML = '';
      gallery.style.display = 'none';
      return;
    }

    gallery.style.display = 'grid';
    gallery.innerHTML = images.map((src, idx) => `
      <div class="service-gallery-item">
        <span class="service-gallery-order ${idx === 0 ? 'primary' : ''}">
          ${idx === 0 ? 'Principal' : `#${idx + 1}`}
        </span>
        <img src="${escapeHtml(src)}" alt="Imagem ${idx + 1}" class="service-gallery-thumb">
        <div class="service-gallery-actions">
          <div style="display: flex; gap: 3px;">
            <button type="button" class="service-gallery-btn" data-action="prev" data-index="${idx}" title="Mover para trás" ${idx === 0 ? 'disabled style="opacity:0.4;cursor:default;"' : ''}>&larr;</button>
            <button type="button" class="service-gallery-btn" data-action="next" data-index="${idx}" title="Mover para a frente" ${idx === images.length - 1 ? 'disabled style="opacity:0.4;cursor:default;"' : ''}>&rarr;</button>
          </div>
          <button type="button" class="service-gallery-btn remove" data-action="remove" data-index="${idx}" title="Remover imagem">&times;</button>
        </div>
      </div>
    `).join('');
  }

  gallery?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const idx = Number(btn.getAttribute('data-index'));
    const action = btn.getAttribute('data-action');
    if (action === 'remove') {
      images.splice(idx, 1);
      render();
    } else if (action === 'prev' && idx > 0) {
      const [item] = images.splice(idx, 1);
      images.splice(idx - 1, 0, item);
      render();
    } else if (action === 'next' && idx < images.length - 1) {
      const [item] = images.splice(idx, 1);
      images.splice(idx + 1, 0, item);
      render();
    }
  });

  uploadBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (files.some(f => !f.type.startsWith('image/'))) {
      showToast('Selecione apenas ficheiros de imagem válidos (JPG, PNG ou WebP).', 'error');
      fileInput.value = '';
      return;
    }

    const originalLabel = uploadBtn.innerHTML;
    uploadBtn.disabled = true;
    uploadBtn.textContent = `A processar ${files.length} ${files.length === 1 ? 'imagem' : 'imagens'}...`;

    try {
      for (const file of files) {
        const optimized = await optimizeImageFile(file);
        images.push(optimized);
      }
      render();
      showToast(`${files.length} ${files.length === 1 ? 'imagem adicionada' : 'imagens adicionadas'} à galeria!`, 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao processar imagem.', 'error');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = originalLabel;
      fileInput.value = '';
    }
  });

  addUrlBtn?.addEventListener('click', () => {
    const url = (urlInput?.value || '').trim();
    if (!url) return;
    if (!images.includes(url)) {
      images.push(url);
      render();
      showToast('URL de imagem adicionada!', 'success');
    }
    urlInput.value = '';
  });

  return {
    getImages: () => [...images],
    setImages: (nextList) => {
      images = Array.isArray(nextList) ? nextList.filter(Boolean) : [];
      if (fileInput) fileInput.value = '';
      if (urlInput) urlInput.value = '';
      render();
    }
  };
}

function initServicesModule() {
  const addServiceBtn = document.getElementById('addServiceBtn');
  const serviceModal = document.getElementById('serviceModal');
  const closeServiceModalBtn = document.getElementById('closeServiceModalBtn');
  const cancelServiceBtn = document.getElementById('cancelServiceBtn');
  const serviceForm = document.getElementById('serviceForm');

  serviceGallery = createGalleryController({
    galleryId: 'serviceImagesGallery',
    fileInputId: 'serviceImageFile',
    uploadBtnId: 'triggerImageUploadBtn',
    urlInputId: 'manualImageUrlInput',
    addUrlBtnId: 'addManualImageUrlBtn'
  });

  closeServiceModalBtn.addEventListener('click', () => serviceModal.style.display = 'none');
  cancelServiceBtn.addEventListener('click', () => serviceModal.style.display = 'none');

  addServiceBtn.addEventListener('click', () => {
    document.getElementById('serviceModalTitle').textContent = 'Nova Área de Actuação';
    document.getElementById('serviceFormId').value = '';
    document.getElementById('serviceNumero').value = String(currentServices.length + 1).padStart(2, '0');
    document.getElementById('serviceTitulo').value = '';
    document.getElementById('serviceSlug').value = '';
    document.getElementById('serviceOrdem').value = currentServices.length + 1;
    serviceGallery.setImages(['/assets/images/procurement-equipamentos.jpg']);
    document.getElementById('serviceDescricao').value = '';
    document.getElementById('serviceProdutos').value = '';
    document.getElementById('serviceActivo').checked = true;
    serviceModal.style.display = 'flex';
  });

  serviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const images = serviceGallery.getImages();
    if (!images.length) {
      showToast('Adicione pelo menos 1 imagem para a área de actuação.', 'error');
      return;
    }

    const serviceId = document.getElementById('serviceFormId').value;
    const payload = {
      numero: document.getElementById('serviceNumero').value.trim(),
      titulo: document.getElementById('serviceTitulo').value.trim(),
      slug: document.getElementById('serviceSlug').value.trim(),
      ordem: Number(document.getElementById('serviceOrdem').value),
      imagem: images[0],
      imagens: images,
      descricao: document.getElementById('serviceDescricao').value.trim(),
      produtos_servicos: document.getElementById('serviceProdutos').value.split('\n').map(s => s.trim()).filter(Boolean),
      activo: document.getElementById('serviceActivo').checked
    };

    const payloadBytes = new Blob([JSON.stringify(payload)]).size;
    if (payloadBytes > 4 * 1024 * 1024) {
      showToast('O conjunto de imagens excede 4 MB. Remova ou reduza algumas imagens.', 'error');
      return;
    }

    const saveBtn = document.getElementById('saveServiceBtn');
    const origSaveText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'A guardar...';

    const isEdit = Boolean(serviceId);
    const url = isEdit ? `${API_BASE}/services/${serviceId}` : `${API_BASE}/services`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isEdit ? 'Área atualizada com sucesso!' : 'Nova área criada com sucesso!', 'success');
        serviceModal.style.display = 'none';
        loadServices();
        loadStats();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Erro ao guardar serviço.', 'error');
      }
    } catch (err) {
      showToast('Erro de comunicação.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = origSaveText;
    }
  });
}

async function loadServices() {
  const grid = document.getElementById('servicesCardsGrid');
  try {
    const res = await fetch(`${API_BASE}/services?all=true`);
    currentServices = await res.json();

    if (!currentServices.length) {
      grid.innerHTML = `<div class="p-4 text-center">Nenhum serviço registado.</div>`;
      return;
    }

    grid.innerHTML = currentServices.map(s => {
      const itemsCount = (s.produtos_servicos || []).length;
      const imagesList = (Array.isArray(s.imagens) && s.imagens.length) ? s.imagens : (s.imagem ? [s.imagem] : []);
      const thumbImg = imagesList[0] || '/assets/images/procurement-equipamentos.jpg';
      return `
        <div class="service-admin-card">
          <div class="service-admin-media">
            <span class="service-admin-badge">${escapeHtml(s.numero)}</span>
            <img src="${escapeHtml(thumbImg)}" alt="${escapeHtml(s.titulo)}" class="service-admin-img">
            ${imagesList.length > 1 ? `<span class="service-admin-media-count">${imagesList.length} fotos</span>` : ''}
          </div>
          <div class="service-admin-body">
            <h4 class="service-admin-title">${escapeHtml(s.titulo)}</h4>
            <p class="service-admin-desc">${escapeHtml(s.descricao)}</p>
            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">
              <strong>${itemsCount}</strong> itens &bull; <strong>${imagesList.length}</strong> ${imagesList.length === 1 ? 'imagem' : 'imagens'}
            </div>
            <div class="service-admin-footer">
              <span class="status-badge ${s.activo !== false ? 'concluido' : 'pendente'}">
                ${s.activo !== false ? 'Activo no Site' : 'Inactivo'}
              </span>
              <div style="display: flex; gap: 0.4rem;">
                <button class="btn btn-secondary btn-sm" onclick="editService('${s._id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteService('${s._id}')">&times;</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = `<div class="p-4 text-center text-red-600">Erro ao carregar serviços.</div>`;
  }
}

window.editService = function(serviceId) {
  const s = currentServices.find(item => item._id === serviceId);
  if (!s) return;

  document.getElementById('serviceModalTitle').textContent = `Editar Área ${s.numero}`;
  document.getElementById('serviceFormId').value = s._id;
  document.getElementById('serviceNumero').value = s.numero || '';
  document.getElementById('serviceTitulo').value = s.titulo || '';
  document.getElementById('serviceSlug').value = s.slug || '';
  document.getElementById('serviceOrdem').value = s.ordem || 1;

  serviceGallery?.setImages(
    (Array.isArray(s.imagens) && s.imagens.length) ? s.imagens : (s.imagem ? [s.imagem] : [])
  );

  document.getElementById('serviceDescricao').value = s.descricao || '';
  document.getElementById('serviceProdutos').value = (s.produtos_servicos || []).join('\n');
  document.getElementById('serviceActivo').checked = s.activo !== false;

  document.getElementById('serviceModal').style.display = 'flex';
};

window.deleteService = async function(serviceId) {
  if (!confirm('Deseja realmente eliminar esta área de serviço?')) return;
  try {
    const res = await fetch(`${API_BASE}/services/${serviceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      showToast('Área eliminada.', 'info');
      loadServices();
      loadStats();
    } else {
      showToast('Erro ao eliminar.', 'error');
    }
  } catch {
    showToast('Erro de comunicação.', 'error');
  }
};

/* ==========================================================================
   6. Company / Institutional Data Module
   ========================================================================== */
function initCompanyModule() {
  const form = document.getElementById('companyForm');
  companyGallery = createGalleryController({
    galleryId: 'companyImagesGallery',
    fileInputId: 'companyImageFile',
    uploadBtnId: 'triggerCompanyImageUploadBtn',
    urlInputId: 'manualCompanyImageUrlInput',
    addUrlBtnId: 'addManualCompanyImageUrlBtn'
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveCompanyBtn');
    const imagensInstitucionais = companyGallery ? companyGallery.getImages() : [];

    const payload = {
      nome: document.getElementById('companyNome').value.trim(),
      email: document.getElementById('companyEmail').value.trim(),
      telefones: document.getElementById('companyTelefones').value.split(',').map(s => s.trim()).filter(Boolean),
      whatsapp: document.getElementById('companyWhatsapp').value.split(',').map(s => s.trim()).filter(Boolean),
      descricao_institucional: document.getElementById('companyDescricao').value.trim(),
      imagens_institucionais: imagensInstitucionais,
      missao: document.getElementById('companyMissao').value.trim(),
      visao: document.getElementById('companyVisao').value.trim(),
      valores: document.getElementById('companyValores').value.split('\n').map(s => s.trim()).filter(Boolean),
      objecto_principal: document.getElementById('companyObjecto').value.trim()
    };

    const payloadBytes = new Blob([JSON.stringify(payload)]).size;
    if (payloadBytes > 4 * 1024 * 1024) {
      showToast('O conjunto de imagens excede 4 MB. Remova ou reduza algumas imagens.', 'error');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'A guardar...';

    try {
      const res = await fetch(`${API_BASE}/company`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Informações institucionais atualizadas com sucesso!', 'success');
      } else {
        showToast('Erro ao atualizar informações.', 'error');
      }
    } catch {
      showToast('Erro de comunicação.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar Alterações Institucionais';
    }
  });
}

async function loadCompany() {
  try {
    const res = await fetch(`${API_BASE}/company`);
    if (!res.ok) return;
    const c = await res.json();

    document.getElementById('companyNome').value = c.nome || '';
    document.getElementById('companyEmail').value = c.email || '';
    document.getElementById('companyTelefones').value = (c.telefones || []).join(', ');
    document.getElementById('companyWhatsapp').value = (c.whatsapp || []).join(', ');
    document.getElementById('companyDescricao').value = c.descricao_institucional || '';
    companyGallery?.setImages(
      Array.isArray(c.imagens_institucionais) && c.imagens_institucionais.length
        ? c.imagens_institucionais
        : ['/assets/images/sobre-energia-redes.jpg']
    );
    document.getElementById('companyMissao').value = c.missao || '';
    document.getElementById('companyVisao').value = c.visao || '';
    document.getElementById('companyValores').value = (c.valores || []).join('\n');
    document.getElementById('companyObjecto').value = c.objecto_principal || '';
  } catch (err) {
    console.error('Erro ao carregar dados institucionais:', err);
  }
}

/* ==========================================================================
   Utilities
   ========================================================================== */
function formatStatusLabel(status) {
  switch (status) {
    case 'pendente': return 'Pendente';
    case 'em_analise': return 'Em Análise';
    case 'respondido': return 'Respondido';
    case 'concluido': return 'Concluído';
    default: return status || 'Pendente';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

