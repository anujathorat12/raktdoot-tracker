'use strict';
const issuesService = require('./issues.service');
const { getIO } = require('../../sockets/socket.handler');

function getAllIssues(req, res, next) {
  try {
    const { status, limit } = req.query;
    const issues = issuesService.getAllIssues({ status, limit: parseInt(limit) || 50 });
    res.json({ success: true, data: issues, count: issues.length });
  } catch (err) {
    next(err);
  }
}

function getIssueById(req, res, next) {
  try {
    const issue = issuesService.getIssueById(req.params.id);
    res.json({ success: true, data: issue });
  } catch (err) {
    next(err);
  }
}

function createIssue(req, res, next) {
  try {
    const { description, lat, lng } = req.body;
    if (!description) {
      return res.status(400).json({ success: false, message: 'description is required.' });
    }
    const driver_id = req.user.id;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;

    const issue = issuesService.createIssue({ driver_id, description, image_path, lat, lng });

    // Broadcast real-time alert to manager/admin clients
    try {
      const io = getIO();
      io.to('fleet-monitors').emit('issue_alert', { issue });
    } catch (_) { /* Socket may not be ready in tests */ }

    res.status(201).json({ success: true, data: issue });
  } catch (err) {
    next(err);
  }
}

function updateIssueStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required.' });
    }
    const issue = issuesService.updateIssueStatus(req.params.id, status, req.user.id);

    // Broadcast resolution
    try {
      const io = getIO();
      io.to('fleet-monitors').emit('issue_updated', { issue });
    } catch (_) { /* ok */ }

    res.json({ success: true, data: issue });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllIssues, getIssueById, createIssue, updateIssueStatus };
