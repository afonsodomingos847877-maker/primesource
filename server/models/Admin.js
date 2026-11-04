import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    default: 'admin'
  },
  password: {
    type: String,
    required: true,
    default: 'primesource2026!'
  },
  email: {
    type: String,
    default: 'info@primesourceps.co.mz'
  },
  nome: {
    type: String,
    default: 'Administrador PrimeSource'
  },
  criado_em: {
    type: Date,
    default: Date.now
  },
  ultimo_login: {
    type: Date
  }
});

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

