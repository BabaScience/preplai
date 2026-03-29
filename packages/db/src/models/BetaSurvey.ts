/**
 * @preplai/db — Beta survey model (5-question survey, triggered after 3rd session)
 */
import mongoose from 'mongoose';

const betaSurveySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  answers: {
    overallExperience: { type: Number, min: 1, max: 5, required: true },
    easeOfUse: { type: Number, min: 1, max: 5, required: true },
    visualQuality: { type: Number, min: 1, max: 5, required: true },
    wouldRecommend: { type: String, enum: ['yes', 'maybe', 'no'], required: true },
    openFeedback: { type: String, default: null, maxlength: 2000 },
  },
  sessionCountAtSurvey: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

betaSurveySchema.index({ createdAt: -1 });

export const BetaSurvey =
  mongoose.models.BetaSurvey ?? mongoose.model('BetaSurvey', betaSurveySchema);
