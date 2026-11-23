const { db } = require('../database/db');
const { randomUUID } = require('crypto');

class AuditService {
  /**
   * Log an MCP tool execution or action
   */
  static logToolExecution({
    sessionId = 'session_default',
    actionType = 'TOOL_EXECUTION',
    serverName,
    toolName,
    inputArguments,
    outputResult,
    requiresApproval = false,
    approvalStatus = 'NOT_REQUIRED',
    approvalDetails = null
  }) {
    try {
      const id = 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const stmt = db.prepare(`
        INSERT INTO audit_logs (
          id, session_id, action_type, server_name, tool_name,
          input_arguments, output_result, requires_approval,
          approval_status, approval_details, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        id,
        sessionId,
        actionType,
        serverName,
        toolName,
        typeof inputArguments === 'string' ? inputArguments : JSON.stringify(inputArguments || {}),
        typeof outputResult === 'string' ? outputResult : JSON.stringify(outputResult || {}),
        requiresApproval ? 1 : 0,
        approvalStatus,
        approvalDetails ? (typeof approvalDetails === 'string' ? approvalDetails : JSON.stringify(approvalDetails)) : null
      );

      return id;
    } catch (err) {
      console.error('AuditService error logging execution:', err);
      return null;
    }
  }

  /**
   * Update approval status for an action
   */
  static updateApproval(auditId, status, details = {}) {
    try {
      const stmt = db.prepare(`
        UPDATE audit_logs
        SET approval_status = ?,
            approval_details = ?
        WHERE id = ?
      `);
      stmt.run(status, JSON.stringify(details), auditId);
      return true;
    } catch (err) {
      console.error('AuditService error updating approval:', err);
      return false;
    }
  }

  /**
   * Get audit log history
   */
  static getAuditLogs(limit = 50) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM audit_logs
        ORDER BY created_at DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('AuditService error fetching logs:', err);
      return [];
    }
  }

  /**
   * Get actions pending human approval
   */
  static getPendingApprovals() {
    try {
      const stmt = db.prepare(`
        SELECT * FROM audit_logs
        WHERE approval_status = 'PENDING'
        ORDER BY created_at DESC
      `);
      return stmt.all();
    } catch (err) {
      console.error('AuditService error fetching pending approvals:', err);
      return [];
    }
  }
}

module.exports = AuditService;
