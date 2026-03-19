/**
 * @preplai/db — Contact form submission model (enterprise inquiries, custom support)
 */
import mongoose from 'mongoose';

const contactSubmissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, default: null },
  useCase: {
    type: String,
    enum: ['enterprise', 'integration', 'partnership', 'support', 'other'],
    default: 'other',
  },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['new', 'responded', 'closed'],
    default: 'new',
  },
  createdAt: { type: Date, default: Date.now },
});

contactSubmissionSchema.index({ status: 1, createdAt: -1 });

export const ContactSubmission =
  mongoose.models.ContactSubmission ?? mongoose.model('ContactSubmission', contactSubmissionSchema);
