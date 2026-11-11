import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  numero: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  produtos_servicos: [{ type: String }],
  imagem: { type: String },
  imagens: [{ type: String }],
  ordem: { type: Number, default: 0 },
  activo: { type: Boolean, default: true }
}, { collection: 'services' });

export const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
export default Service;
