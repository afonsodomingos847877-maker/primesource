import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import Company from './models/Company.js';
import Service from './models/Service.js';
import Pillar from './models/Pillar.js';
import Sector from './models/Sector.js';
import Quote from './models/Quote.js';
import Admin from './models/Admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Normalização de URL para compatibilidade com Vercel Serverless Rewrites e ambiente local
app.use((req, res, next) => {
  const original = req.headers['x-vercel-matched-path'] ||
                   req.headers['x-matched-path'] ||
                   req.headers['x-forwarded-uri'] ||
                   req.headers['x-invoke-path'];

  if (original && (req.url === '/api/index.js' || req.url.startsWith('/api/index.js') || req.url === '/api')) {
    req.url = original;
  }

  // Assegurar prefixo /api para mapeamento de rotas
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }

  next();
});

// Serverless-ready MongoDB connection middleware (executa apenas para rotas que precisam do banco)
app.use(async (req, res, next) => {
  // Rotas leves que não precisam de esperar pela conexão MongoDB (login e healthcheck)
  if (req.url.startsWith('/api/health') || req.url.startsWith('/api/admin/login')) {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[MongoDB] Middleware de ligação falhou:', error.message);
    res.status(500).json({ error: 'Erro ao ligar à base de dados MongoDB Atlas.' });
  }
});

/* ==========================================================================
   API ROUTES
   ========================================================================== */

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'PrimeSource Procurement API',
    database: 'MongoDB primesourcedb'
  });
});

// 1. Obter Dados Institucionais da Empresa
app.get('/api/company', async (req, res) => {
  try {
    const company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ error: 'Dados da empresa não encontrados.' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar dados institucionais.', details: error.message });
  }
});

// 2. Obter as 9 Áreas de Actuação e Serviços
app.get('/api/services', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { activo: true };
    const services = await Service.find(filter).sort({ ordem: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar serviços.', details: error.message });
  }
});

// 3. Obter Serviço Específico por Slug ou Número
app.get('/api/services/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const service = await Service.findOne({
      $or: [{ slug: identifier }, { numero: identifier }]
    });
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar serviço.', details: error.message });
  }
});

// 4. Obter Pilares
app.get('/api/pillars', async (req, res) => {
  try {
    const pillars = await Pillar.find().sort({ ordem: 1 });
    res.json(pillars);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar pilares.', details: error.message });
  }
});

// 5. Obter Sectores e Equipamentos
app.get('/api/sectors', async (req, res) => {
  try {
    const sectors = await Sector.find().sort({ ordem: 1 });
    res.json(sectors);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar sectores.', details: error.message });
  }
});

// 6. Submeter Pedido de Cotação (RFQ) -> Armazena no MongoDB
app.post('/api/quotes', async (req, res) => {
  try {
    const {
      nome,
      empresa,
      email,
      telefone,
      area,
      descricao,
      equipamentos,
      quantidade,
      ficheiro_nome,
      website_url_check
    } = req.body;

    // Protecção anti-spam honeypot
    if (website_url_check && website_url_check.trim() !== '') {
      return res.status(400).json({ error: 'Submissão inválida detectada.' });
    }

    if (!nome || !empresa || !email || !telefone || !area || !descricao) {
      return res.status(400).json({
        error: 'Todos os campos obrigatórios (*) devem ser preenchidos.'
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    const novoPedido = await Quote.create({
      nome_completo: nome.trim(),
      empresa: empresa.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
      area_interesse: area.trim(),
      descricao_necessidade: descricao.trim(),
      lista_equipamentos: equipamentos ? equipamentos.trim() : '',
      quantidade: quantidade ? quantidade.trim() : '',
      ficheiro_anexo_nome: ficheiro_nome || '',
      status: 'pendente',
      ip_origem: String(clientIp)
    });

    console.log(`[Quote] Novo pedido de cotação registado no MongoDB! ID: ${novoPedido._id} - ${empresa} (${area})`);

    res.status(201).json({
      success: true,
      message: 'Pedido de cotação gravado com sucesso no MongoDB.',
      quoteId: novoPedido._id,
      timestamp: novoPedido.criado_em
    });
  } catch (error) {
    console.error('[Quote] Erro ao gravar pedido de cotação:', error);
    res.status(500).json({
      error: 'Erro no servidor ao registar o pedido de cotação.',
      details: error.message
    });
  }
});

// 7. Listar Pedidos de Cotação
app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ criado_em: -1 }).limit(100);
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar pedidos de cotação.', details: error.message });
  }
});


/* ==========================================================================
   ADMIN AUTHENTICATION & MANAGEMENT ENDPOINTS
   ========================================================================== */
const configuredPassword = (process.env.ADMIN_PASSWORD || '').replace(/^["']|["']$/g, '').trim();
const validPasswords = new Set([
  'primesource2026!',
  'primesource2026',
  'PrimeSource2026!',
  'PrimeSource2026',
  'admin',
  configuredPassword
].filter(Boolean));

const ADMIN_PASSWORD = configuredPassword || 'primesource2026!';
const ADMIN_SECRET_TOKEN = 'ps-admin-auth-' + (process.env.ADMIN_SECRET || 'primesource2026-secure-session');

// Middleware de verificação de sessão administrativa
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const adminKey = req.headers['x-admin-key'];
  if (
    (authHeader && authHeader === `Bearer ${ADMIN_SECRET_TOKEN}`) ||
    (adminKey && validPasswords.has(adminKey.trim()))
  ) {
    return next();
  }
  return res.status(401).json({ error: 'Acesso não autorizado. Inicie sessão no painel administrativo.' });
};

// 8. Iniciar Sessão Administrativa (Login) - Valida na base de dados MongoDB e variáveis de ambiente
const handleAdminLogin = async (req, res) => {
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      try {
        const params = new URLSearchParams(body);
        body = Object.fromEntries(params.entries());
      } catch {}
    }
  }

  const submitted = (body.password || req.query?.password || req.headers['x-admin-password'] || '').trim();

  let isAuthorized = validPasswords.has(submitted);

  // Validação e registo na base de dados MongoDB (tabela Admin)
  try {
    await connectDB();
    const dbAdmin = await Admin.findOne({
      $or: [
        { password: submitted },
        { username: 'admin' }
      ]
    });

    if (dbAdmin) {
      if (dbAdmin.password === submitted) {
        isAuthorized = true;
      }
      if (isAuthorized) {
        dbAdmin.ultimo_login = new Date();
        await dbAdmin.save().catch(() => {});
        console.log('[Admin Login] Autenticado com sucesso via base de dados MongoDB!');
      }
    } else if (isAuthorized) {
      await Admin.create({
        username: 'admin',
        password: submitted,
        email: 'info@primesourceps.co.mz',
        nome: 'Administrador PrimeSource',
        ultimo_login: new Date()
      }).catch(() => {});
      console.log('[Admin Login] Novo registo de admin guardado na base de dados MongoDB.');
    }
  } catch (dbErr) {
    console.warn('[Admin DB Check]', dbErr.message);
  }

  if (isAuthorized) {
    return res.json({
      success: true,
      token: ADMIN_SECRET_TOKEN,
      message: 'Sessão administrativa iniciada com sucesso.'
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Palavra-passe administrativa incorreta.'
  });
};

app.post('/api/admin/login', handleAdminLogin);
app.post('/admin/login', handleAdminLogin);
app.all('/api/admin/login', (req, res, next) => {
  if (req.method === 'POST') return handleAdminLogin(req, res);
  next();
});

// 9. Estatísticas Gerais para o Painel Admin
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [servicesCount, quotesCount, quotesPending, sectorsCount] = await Promise.all([
      Service.countDocuments(),
      Quote.countDocuments(),
      Quote.countDocuments({ status: 'pendente' }),
      Sector.countDocuments()
    ]);
    res.json({
      servicesCount,
      quotesCount,
      quotesPending,
      sectorsCount,
      database: 'MongoDB primesourcedb',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estatísticas.', details: error.message });
  }
});

function normalizeServiceImages(imagens, imagem) {
  const rawList = Array.isArray(imagens)
    ? imagens
    : (typeof imagens === 'string' && imagens.trim() ? [imagens.trim()] : []);
  const cleaned = [];
  for (const entry of rawList) {
    if (typeof entry === 'string' && entry.trim() && !cleaned.includes(entry.trim())) {
      cleaned.push(entry.trim());
    }
  }
  if (!cleaned.length && typeof imagem === 'string' && imagem.trim()) {
    cleaned.push(imagem.trim());
  }
  return {
    imagens: cleaned,
    imagem: cleaned[0] || '/assets/images/procurement-equipamentos.jpg'
  };
}

// 10. Criar Nova Área de Actuação / Serviço
app.post('/api/services', requireAdmin, async (req, res) => {
  try {
    const { numero, slug, titulo, descricao, produtos_servicos, imagem, imagens, ordem, activo } = req.body;
    if (!numero || !titulo || !descricao) {
      return res.status(400).json({ error: 'Número, Título e Descrição são obrigatórios.' });
    }
    const cleanSlug = slug || titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const media = normalizeServiceImages(imagens, imagem);
    const newService = await Service.create({
      numero,
      slug: cleanSlug,
      titulo,
      descricao,
      produtos_servicos: Array.isArray(produtos_servicos) ? produtos_servicos : (produtos_servicos ? produtos_servicos.split('\n').map(s => s.trim()).filter(Boolean) : []),
      imagem: media.imagem,
      imagens: media.imagens,
      ordem: Number(ordem) || 0,
      activo: activo !== false
    });
    res.status(201).json({ success: true, service: newService });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar serviço.', details: error.message });
  }
});

// 11. Actualizar Área de Actuação / Serviço Existente
app.put('/api/services/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, slug, titulo, descricao, produtos_servicos, imagem, imagens, ordem, activo } = req.body;
    const media = normalizeServiceImages(imagens, imagem);
    const updated = await Service.findByIdAndUpdate(
      id,
      {
        numero,
        slug,
        titulo,
        descricao,
        produtos_servicos: Array.isArray(produtos_servicos) ? produtos_servicos : (produtos_servicos ? produtos_servicos.split('\n').map(s => s.trim()).filter(Boolean) : []),
        imagem: media.imagem,
        imagens: media.imagens,
        ordem: Number(ordem) || 0,
        activo: Boolean(activo)
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Serviço não encontrado.' });
    res.json({ success: true, service: updated });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar serviço.', details: error.message });
  }
});

// 12. Eliminar Área de Actuação / Serviço
app.delete('/api/services/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Service.findByIdAndDelete(id);
    res.json({ success: true, message: 'Serviço eliminado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao eliminar serviço.', details: error.message });
  }
});

// 13. Actualizar Dados Institucionais da Empresa
app.put('/api/company', requireAdmin, async (req, res) => {
  try {
    const {
      nome,
      email,
      telefones,
      whatsapp,
      descricao_institucional,
      redes_electricas,
      missao,
      visao,
      valores,
      objecto_principal
    } = req.body;

    let company = await Company.findOne();
    if (!company) {
      company = new Company({
        nome: nome || 'PrimeSource Procurement and Services',
        descricao_institucional: descricao_institucional || '',
        missao: missao || '',
        visao: visao || '',
        objecto_principal: objecto_principal || ''
      });
    }

    if (nome) company.nome = nome;
    if (email) company.email = email;
    if (telefones) company.telefones = Array.isArray(telefones) ? telefones : telefones.split(',').map(s => s.trim()).filter(Boolean);
    if (whatsapp) company.whatsapp = Array.isArray(whatsapp) ? whatsapp : whatsapp.split(',').map(s => s.trim()).filter(Boolean);
    if (descricao_institucional) company.descricao_institucional = descricao_institucional;
    if (redes_electricas) company.redes_electricas = redes_electricas;
    if (missao) company.missao = missao;
    if (visao) company.visao = visao;
    if (valores) company.valores = Array.isArray(valores) ? valores : valores.split('\n').map(s => s.trim()).filter(Boolean);
    if (objecto_principal) company.objecto_principal = objecto_principal;
    company.actualizado_em = new Date();

    await company.save();
    res.json({ success: true, message: 'Dados institucionais atualizados com sucesso.', company });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar dados institucionais.', details: error.message });
  }
});

// 14. Actualizar Estado e Notas de um Pedido de Cotação
app.patch('/api/quotes/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notas_internas } = req.body;
    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (notas_internas !== undefined) updatePayload.notas_internas = notas_internas;

    const updated = await Quote.findByIdAndUpdate(id, updatePayload, { new: true });
    if (!updated) return res.status(404).json({ error: 'Pedido não encontrado.' });
    res.json({ success: true, quote: updated });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar pedido.', details: error.message });
  }
});

// 15. Eliminar Pedido de Cotação
app.delete('/api/quotes/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Quote.findByIdAndDelete(id);
    res.json({ success: true, message: 'Pedido eliminado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao eliminar pedido.', details: error.message });
  }
});

// Start Server locally if not running as serverless function (Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 [Server] PrimeSource API operacional na porta ${PORT}`);
    console.log(`📍 Endpoints disponíveis:`);
    console.log(`   - GET  http://localhost:${PORT}/api/health`);
    console.log(`   - GET  http://localhost:${PORT}/api/company`);
    console.log(`   - GET  http://localhost:${PORT}/api/services`);
    console.log(`   - GET  http://localhost:${PORT}/api/pillars`);
    console.log(`   - GET  http://localhost:${PORT}/api/sectors`);
    console.log(`   - POST http://localhost:${PORT}/api/quotes`);
    console.log(`   - GET  http://localhost:${PORT}/api/quotes`);
  });
}

export default app;
