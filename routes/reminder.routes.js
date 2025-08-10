const express = require('express');
const router = express.Router();
const ReminderController = require('../controllers/reminder.controller');
const ValidationHelper = require('../src/utils/validation');
const { authAccess } = require('../middleware/auth.middleware');

router.use(authAccess);

router.get('/', ReminderController.getReminders);
router.post('/', ReminderController.createReminder);
router.get('/templates', ReminderController.getQuickTemplates);
router.put('/:id', ReminderController.updateReminder);
router.patch('/:id/toggle', ReminderController.toggleReminder);
router.delete('/:id', ReminderController.deleteReminder);

// Admin/system endpoint
router.post('/process-due', ReminderController.processDueReminders);

module.exports = router;
