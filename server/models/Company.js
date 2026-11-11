import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  nome: { type: String, required: true },
  pais: { type: String, default: 'Moçambique' },
  website: { type: String, default: 'https://www.primesourceps.co.mz/' },
  email: { type: String, default: 'info@primesourceps.co.mz' },
  telefones: [{ type: String }],
  whatsapp: [{ type: String }],
  descricao_institucional: { type: String, required: true },
  imagens_institucionais: [{ type: String }],
  redes_electricas: { type: String },
  missao: { type: String, required: true },
  visao: { type: String, required: true },
  valores: [{ type: String }],
  objecto_principal: { type: String, required: true },
  pilares_qualidade: [{ type: String }],
  compromisso_parceria: {
    titulo: String,
    desafios: String,
    compromisso: String
  },
  actualizado_em: { type: Date, default: Date.now }
}, { collection: 'company' });

export const Company = mongoose.models.Company || mongoose.model('Company', companySchema);
export default Company;
