import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Project title is required'], trim: true, maxlength: 200 },
  description: { type: String, default: '', trim: true, maxlength: 5000 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date },
  endDate: { type: Date }
}, { timestamps: true });

projectSchema.index({ createdAt: -1 });

export default mongoose.model('Project', projectSchema);
