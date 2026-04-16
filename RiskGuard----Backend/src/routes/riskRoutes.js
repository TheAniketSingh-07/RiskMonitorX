import express from 'express';
import { getRiskById, updateRisk, deleteRisk, updateRiskStatus, getRiskHistory, getAllUserRisks } from '../controllers/riskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes protected

router.route('/').get(getAllUserRisks);
router.route('/:riskId').get(getRiskById).put(updateRisk).delete(deleteRisk);
router.route('/:riskId/status').patch(updateRiskStatus);
router.route('/:riskId/history').get(getRiskHistory);

export default router;
