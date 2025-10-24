const AuditLog = require('../models/AuditLog');

class AuditService {
  async logAction(userId, userRole, action, targetEntity, targetId, details = {}) {
    try {
      await AuditLog.create({
        action,
        userId,
        userRole,
        targetEntity,
        targetId,
        newState: details,
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent()
      });
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  async getAuditLogs(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(filters)
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filters);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  getClientIP() {
    // This would be set by your reverse proxy in production
    return '0.0.0.0'; // Default, should be implemented based on your infrastructure
  }

  getUserAgent() {
    // This would be extracted from request headers
    return 'Unknown'; // Default, should be implemented based on your infrastructure
  }
}

module.exports = new AuditService();