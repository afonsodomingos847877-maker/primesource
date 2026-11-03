import connectDB from './db.js';
import Company from './models/Company.js';
import Service from './models/Service.js';
import Pillar from './models/Pillar.js';
import Sector from './models/Sector.js';

async function seedDatabase() {
  console.log('[Seed] Iniciando povoamento da base de dados MongoDB (primesourcedb)...');
  await connectDB();

  // 1. DADOS INSTITUCIONAIS DA EMPRESA
  console.log('[Seed] A actualizar informações institucionais da PrimeSource...');
  await Company.deleteMany({});
  await Company.create({
    nome: 'PrimeSource Procurement and Services',
    pais: 'Moçambique',
    website: 'https://www.primesourceps.co.mz/',
    email: 'info@primesourceps.co.mz',
    telefones: ['+258 84 331 8434', '+258 84 700 8172'],
    whatsapp: ['+258 84 331 8434', '+258 84 700 8172'],
    descricao_institucional: 'A PrimeSource Procurement and Services é uma empresa moçambicana especializada em procurement, fornecimento de materiais e equipamentos industriais, eléctricos, de automação, instrumentação, comunicação e segurança.',
    redes_electricas: 'Actuamos igualmente no fornecimento, instalação, manutenção e assistência técnica de equipamentos e infra-estruturas de redes eléctricas, incluindo transformadores de potência, pinças de amarração, contadores de energia eléctrica, cabos, postes, acessórios e outros equipamentos eléctricos. Trabalhamos com foco na qualidade, eficiência e satisfação do cliente, disponibilizando soluções integradas para empresas e instituições públicas e privadas.',
    missao: 'Fornecer produtos e serviços de qualidade, com soluções inovadoras e sustentáveis.',
    visao: 'Ser uma referência em procurement e serviços técnicos em Moçambique e na região.',
    valores: [
      'Integridade',
      'Qualidade',
      'Compromisso',
      'Inovação',
      'Foco no cliente'
    ],
    objecto_principal: 'Comércio a grosso e a retalho, importação, exportação, distribuição, representação, comercialização, fornecimento, instalação, montagem, manutenção, assistência técnica, configuração, comissionamento e reparação de equipamentos, máquinas, materiais eléctricos, mecânicos e industriais, de instrumentação, automação, comunicação e sistemas de segurança electrónica, nos termos da legislação aplicável.',
    pilares_qualidade: ['Qualidade', 'Confiança', 'Credibilidade', 'Resultados'],
    compromisso_parceria: {
      titulo: 'O sucesso constrói-se em parceria.',
      desafios: 'Necessidades técnicas exigentes, fornecimento de equipamentos adequados e procura por soluções eficientes e seguras.',
      compromisso: 'Responder com soluções integradas, competência técnica e dedicação às necessidades de cada cliente.'
    }
  });

  // 2. AS 10 ÁREAS DE ACTUAÇÃO E SERVIÇOS
  console.log('[Seed] A actualizar as 10 áreas de actuação e fornecimento...');
  await Service.deleteMany({});
  await Service.insertMany([
    {
      numero: '01',
      slug: 'procurement-equipamentos',
      titulo: 'Procurement e fornecimento de bens e equipamentos',
      descricao: 'Aquisição e fornecimento de bens e equipamentos para empresas, instituições públicas e privadas, de acordo com as necessidades operacionais de cada cliente.',
      produtos_servicos: [
        'Procurement nacional e internacional.',
        'Aquisição de bens e equipamentos sob solicitação.',
        'Representação e distribuição de produtos.',
        'Comercialização e fornecimento de equipamentos industriais.'
      ],
      imagem: '/assets/images/procurement-equipamentos.jpg',
      ordem: 1
    },
    {
      numero: '02',
      slug: 'material-industrial',
      titulo: 'Comércio de material industrial',
      descricao: 'Fornecimento de equipamentos, componentes mecânicos e consumíveis destinados à operação e manutenção de instalações industriais.',
      produtos_servicos: [
        'Bombas, válvulas, tubagens e acessórios.',
        'Rolamentos, correias, correntes e componentes mecânicos.',
        'Motores eléctricos e equipamentos industriais.',
        'Ferramentas e equipamentos de oficina.',
        'Consumíveis industriais e de manutenção.'
      ],
      imagem: '/assets/images/material-industrial-bombas.jpg',
      ordem: 2
    },
    {
      numero: '03',
      slug: 'material-electrico',
      titulo: 'Comércio de material eléctrico',
      descricao: 'Fornecimento de materiais eléctricos para instalações industriais, comerciais e residenciais, incluindo distribuição de energia e protecção de circuitos.',
      produtos_servicos: [
        'Cabos e condutores eléctricos.',
        'Disjuntores, contactores, relés e dispositivos de protecção.',
        'Quadros eléctricos e respectivos acessórios.',
        'Tomadas, interruptores e acessórios de instalação.',
        'Luminárias e sistemas de iluminação LED.',
        'Dispositivos de protecção DPS e DR/DDR.',
        'Materiais para instalações eléctricas.',
        'Transformadores de potência, pinças de amarração, contadores de energia eléctrica e postes.'
      ],
      imagem: '/assets/images/material-electrico-distribuicao.jpg',
      ordem: 3
    },
    {
      numero: '04',
      slug: 'automacao-instrumentacao',
      titulo: 'Material de automação e instrumentação industrial',
      descricao: 'Fornecimento de equipamentos destinados à medição, monitorização e controlo de máquinas e processos industriais.',
      produtos_servicos: [
        'PLCs e módulos de automação.',
        'Sensores e transmissores industriais.',
        'Instrumentos de medição e controlo.',
        'Variadores de velocidade (VSD/VFD).',
        'Soft starters.',
        'Relés, temporizadores e controladores.',
        'Equipamentos e sistemas de controlo industrial.',
        'Cabos e acessórios específicos de instrumentação.'
      ],
      imagem: '/assets/images/automacao-instrumentacao-plcs.jpg',
      ordem: 4
    },
    {
      numero: '05',
      slug: 'seguranca-electronica',
      titulo: 'Sistemas de segurança electrónica - fornecimento e distribuição',
      descricao: 'Fornecimento e comercialização de equipamentos de segurança electrónica para empresas, comércios e residências.',
      produtos_servicos: [
        'Câmaras de vigilância IP e analógicas, sistemas CCTV, DVR/NVR e acessórios.',
        'Sistemas de alarme contra intrusão, com e sem fios.',
        'Centrais, sensores, contactos magnéticos e sirenes.',
        'Sistemas de controlo de acesso e videoporteiros.',
        'Soluções de detecção e monitorização com conectividade Wi-Fi, LTE e Dual SIM.'
      ],
      imagem: '/assets/images/seguranca-electronica-cctv.jpg',
      ordem: 5
    },
    {
      numero: '06',
      slug: 'seguranca-perimetral',
      titulo: 'Sistemas de protecção e segurança perimetral',
      descricao: 'Soluções destinadas à protecção dos limites físicos de instalações, controlo de perímetros e detecção de acessos não autorizados.',
      produtos_servicos: [
        'Sistemas de vedação eléctrica electrificada.',
        'Sistemas de segurança perimetral.',
        'Sensores e equipamentos de detecção perimetral.',
        'Barreiras de segurança e controlo de acesso perimetral.',
        'Equipamentos complementares de protecção de perímetros.'
      ],
      imagem: '/assets/images/seguranca-perimetral-vedacao.jpg',
      ordem: 6
    },
    {
      numero: '07',
      slug: 'comunicacao-conectividade',
      titulo: 'Equipamentos de comunicação e conectividade',
      descricao: 'Fornecimento de equipamentos e materiais destinados à interligação de dispositivos, infra-estruturas de redes e transmissão de dados.',
      produtos_servicos: [
        'Equipamentos de redes informáticas.',
        'Switches, routers e acessórios de rede.',
        'Cabos de rede e fibra óptica.',
        'Racks, patch panels e respectivos acessórios.',
        'Equipamentos de comunicação e transmissão.'
      ],
      imagem: '/assets/images/comunicacao-redes-fibra.jpg',
      ordem: 7
    },
    {
      numero: '08',
      slug: 'comercio-externo',
      titulo: 'Comércio externo',
      descricao: 'Operações de comércio internacional para aquisição e comercialização de produtos e equipamentos necessários às actividades dos clientes.',
      produtos_servicos: [
        'Importação de equipamentos, máquinas e materiais.',
        'Exportação de produtos e equipamentos.',
        'Distribuição e representação comercial internacional.',
        'Comercialização de materiais eléctricos, mecânicos e industriais.',
        'Fornecimento internacional de equipamentos de automação, instrumentação e segurança.'
      ],
      imagem: '/assets/images/comercio-externo-importacao.jpg',
      ordem: 8
    },
    {
      numero: '09',
      slug: 'servicos-tecnicos',
      titulo: 'Serviços técnicos especializados',
      descricao: 'Execução de trabalhos técnicos relacionados com instalações, máquinas e sistemas eléctricos, electrónicos e industriais.',
      produtos_servicos: [
        'Instalação e montagem de equipamentos.',
        'Configuração de equipamentos e sistemas.',
        'Comissionamento de instalações e equipamentos.',
        'Manutenção preventiva e correctiva.',
        'Reparação de equipamentos e sistemas.',
        'Assistência técnica.',
        'Serviços técnicos de instrumentação.',
        'Serviços técnicos de automação.',
        'Serviços técnicos de segurança electrónica.',
        'Integração de sistemas de segurança.'
      ],
      imagem: '/assets/images/servicos-tecnicos-instalacao.jpg',
      ordem: 9
    },
    {
      numero: '10',
      slug: 'redes-electricas',
      titulo: 'Redes Eléctricas e Distribuição de Energia',
      descricao: 'Fornecimento, instalação, manutenção e assistência técnica de materiais e equipamentos destinados às redes eléctricas e à distribuição de energia.',
      produtos_servicos: [
        'Transformadores de potência.',
        'Pinças de amarração.',
        'Contadores de energia eléctrica.',
        'Cabos e condutores eléctricos.',
        'Postes e acessórios para redes eléctricas.',
        'Outros materiais e equipamentos para redes de distribuição de energia.'
      ],
      imagem: '/assets/images/sobre-energia-redes.jpg',
      ordem: 10
    }
  ]);

  // 3. OS 4 PILARES
  console.log('[Seed] A actualizar os 4 pilares...');
  await Pillar.deleteMany({});
  await Pillar.insertMany([
    {
      numero: '01',
      pilar: 'Qualidade',
      beneficio: 'Produtos e serviços fiáveis',
      oferta: 'Garantimos materiais que cumprem rigorosos critérios técnicos industriais, assegurando durabilidade e conformidade normativa.',
      ordem: 1
    },
    {
      numero: '02',
      pilar: 'Compromisso',
      beneficio: 'Dedicação ao cliente',
      oferta: 'Acompanhamento atento das necessidades operacionais, com disponibilidade, transparência e responsabilidade no cumprimento de prazos.',
      ordem: 2
    },
    {
      numero: '03',
      pilar: 'Competência',
      beneficio: 'Conhecimento técnico',
      oferta: 'Domínio especializado em engenharia eléctrica, automação, instrumentação e procurement para especificar as soluções ideais para cada desafio.',
      ordem: 3
    },
    {
      numero: '04',
      pilar: 'Soluções integradas',
      beneficio: 'Fornecimento e assistência',
      oferta: 'Cobrimos todo o ciclo: desde a identificação e fornecimento de bens até à instalação física, comissionamento e manutenção contínua.',
      ordem: 4
    }
  ]);

  // 4. SECTORES INDUSTRIAIS
  console.log('[Seed] A actualizar os sectores e equipamentos...');
  await Sector.deleteMany({});
  await Sector.insertMany([
    {
      nome: 'Redes Eléctricas & Distribuição de Potência',
      descricao: 'Fornecimento de infra-estruturas completas de distribuição de energia em média e baixa tensão.',
      equipamentos: [
        'Transformadores de potência de distribuição',
        'Pinças de amarração e ferragens de suspensão',
        'Contadores de energia eléctrica e disjuntores',
        'Cabos aéreos e subterrâneos XLPE / Alumínio / Cobre'
      ],
      imagem: '/assets/images/sobre-energia-redes.jpg',
      ordem: 1
    },
    {
      nome: 'Indústria Transformadora & Extractiva',
      descricao: 'Equipamentos mecânicos, consumíveis e componentes de alta resistência para serviço contínuo.',
      equipamentos: [
        'Bombas industriais centrífugas e submersíveis',
        'Válvulas borboleta, gaveta, retenção e esfera',
        'Rolamentos especiais e chumaceiras industriais',
        'Motores eléctricos de alto rendimento IE3'
      ],
      imagem: '/assets/images/material-industrial-bombas.jpg',
      ordem: 2
    },
    {
      nome: 'Automação Fabril & Processos',
      descricao: 'Controlo moderno de linhas de produção, medição e protecção de accionamentos.',
      equipamentos: [
        'PLCs, IHMs e controladores de processo',
        'Variadores de velocidade (VSD/VFD) e Soft starters',
        'Sensores de pressão, temperatura, caudal e nível',
        'Cabos blindados e barramentos industriais'
      ],
      imagem: '/assets/images/automacao-instrumentacao-plcs.jpg',
      ordem: 3
    },
    {
      nome: 'Segurança Electrónica & Perímetros',
      descricao: 'Protecção patrimonial de estaleiros, armazéns, subestações e edifícios corporativos.',
      equipamentos: [
        'Câmaras IP analíticas, CCTV e NVRs dedicados',
        'Sistemas de vedação eléctrica certificada',
        'Barreiras de infravermelhos e feixes de detecção',
        'Controlo de acessos biométrico e torniquetes'
      ],
      imagem: '/assets/images/seguranca-electronica-cctv.jpg',
      ordem: 4
    },
    {
      nome: 'Comunicação, Redes & Fibra Óptica',
      descricao: 'Infra-estrutura de telecomunicações corporativa para interligação de dispositivos industriais.',
      equipamentos: [
        'Switches geridos L2/L3 e routers empresariais',
        'Cabos estruturados Cat6/Cat6A e fibra óptica',
        'Racks de telecomunicações, patch panels e PDUs',
        'Acessórios de fusão e conectores ópticos'
      ],
      imagem: '/assets/images/comunicacao-redes-fibra.jpg',
      ordem: 5
    },
    {
      nome: 'Engenharia, Instalação & Manutenção',
      descricao: 'Assistência técnica qualificada, comissionamento e manutenção preventiva e correctiva.',
      equipamentos: [
        'Montagem e integração electromecânica',
        'Parametrização e testes de comissionamento',
        'Manutenção de quadros e transformadores',
        'Assistência técnica local em Moçambique'
      ],
      imagem: '/assets/images/servicos-tecnicos-instalacao.jpg',
      ordem: 6
    }
  ]);

  console.log('✅ [Seed] Todos os dados reais da PrimeSource foram armazenados no MongoDB com sucesso!');
  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('❌ [Seed] Erro durante o povoamento:', err);
  process.exit(1);
});
