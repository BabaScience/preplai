/**
 * @preplai/db — MCP usage_log (MCP server usage tracking)
 */
import mongoose from 'mongoose';

const mcpUsageLogSchema = new mongoose.Schema({
  id: { type: String, required: true },
  apiKeyId: { type: String, required: true },
  action: { type: String, required: true },
  sessionId: { type: String, default: null },
  createdAt: { type: Number, required: true },
});

mcpUsageLogSchema.index({ apiKeyId: 1 });
mcpUsageLogSchema.index({ createdAt: 1 });

export const McpUsageLog = mongoose.models.McpUsageLog ?? mongoose.model('McpUsageLog', mcpUsageLogSchema);
