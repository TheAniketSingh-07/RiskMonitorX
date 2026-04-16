import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  status: { type: String, enum: ['Open', 'Monitoring', 'Mitigated', 'Closed'], required: true },
  note: { type: String, default: '', trim: true, maxlength: 1000 },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now }
});

const riskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: [true, 'projectId is required'] },
  title: { type: String, required: [true, 'title is required'], trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 5000 },
  probability: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  impact: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  mitigationActions: { type: String, required: [true, 'mitigationActions is required'], trim: true, maxlength: 5000 },
  currentStatus: { type: String, enum: ['Open', 'Monitoring', 'Mitigated', 'Closed'], default: 'Open' },
  history: [historySchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Supports project-scoped list views and status filtering at scale.
riskSchema.index({ projectId: 1, createdAt: -1 });
riskSchema.index({ projectId: 1, currentStatus: 1 });

export default mongoose.model('Risk', riskSchema);
