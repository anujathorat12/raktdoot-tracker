'use strict';
const { Router } = require('express');
const controller = require('./issues.controller');
const { authenticate, requireRole } = require('../../middlewares/auth.middleware');
const { upload } = require('../../middlewares/upload.middleware');

const router = Router();
router.use(authenticate);

router.get('/', requireRole('manager', 'admin'), controller.getAllIssues);
router.get('/:id', requireRole('manager', 'admin'), controller.getIssueById);
router.post('/', requireRole('driver'), upload.single('image'), controller.createIssue);
router.patch('/:id/status', requireRole('manager', 'admin'), controller.updateIssueStatus);

module.exports = router;
