import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';
import { createProjectRisk, getProjectRisks, getRiskById } from '../controllers/riskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createProject).get(getProjects);
router.route('/:projectId').get(getProjectById).put(updateProject).delete(deleteProject);
router.route('/:projectId/risks').post(createProjectRisk).get(getProjectRisks);
router.route('/:projectId/risks/:riskId').get(getRiskById);

export default router;
