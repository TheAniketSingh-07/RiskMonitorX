// Ownership check utility
const isOwner = (resource, user) => {
  if (!resource || !user) return false;
  // Accept both string and ObjectId
  return String(resource.owner) === String(user._id);
};
import Project from '../models/Project.js';
import Risk from '../models/Risk.js';

const isValidObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(value || '');

const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.status = 400;
    throw error;
  }
  return date;
};

export const createProject = async (req, res, next) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    if (!title || !title.trim()) {
      res.status(400);
      return res.json({ success: false, message: 'title is required', data: null, error: null });
    }

    const parsedStartDate = normalizeDate(startDate, 'startDate');
    const parsedEndDate = normalizeDate(endDate, 'endDate');
    if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
      res.status(400);
      return res.json({ success: false, message: 'endDate must be greater than or equal to startDate', data: null, error: null });
    }

    const project = await Project.create({
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      owner: req.user._id,
      startDate: parsedStartDate,
      endDate: parsedEndDate
    });

    res.status(201).json({ success: true, message: 'Project created', data: project, error: null });
  } catch (error) {
    console.error('[project-create-error]', { path: req.originalUrl, message: error.message });
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    let query = {};
    if (!req.user || req.user.role !== 'admin') {
      query.owner = req.user._id;
    }
    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query)
    ]);
    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
    res.status(200).json({ success: true, message: 'Projects fetched', count: projects.length, data: projects, meta, error: null });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
      res.status(400);
      return res.json({ success: false, message: 'Invalid projectId format', data: null, error: null });
    }

    const project = await Project.findById(projectId).lean();
    if (!project) {
      res.status(404);
      return res.json({ success: false, message: 'Project not found', data: null, error: null });
    }
    if (!isOwner(project, req.user)) {
      res.status(403);
      return res.json({ success: false, message: 'Forbidden: Not your project', data: null, error: null });
    }
    res.status(200).json({ success: true, message: 'Project fetched', data: project, error: null });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
      res.status(400);
      return res.json({ success: false, message: 'Invalid projectId format', data: null, error: null });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return res.json({ success: false, message: 'Project not found', data: null, error: null });
    }
    if (!isOwner(project, req.user)) {
      res.status(403);
      return res.json({ success: false, message: 'Forbidden: Not your project', data: null, error: null });
    }

    const allowedFields = ['title', 'description', 'startDate', 'endDate'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    }

    const parsedStartDate = normalizeDate(project.startDate, 'startDate');
    const parsedEndDate = normalizeDate(project.endDate, 'endDate');
    if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
      res.status(400);
      return res.json({ success: false, message: 'endDate must be greater than or equal to startDate', data: null, error: null });
    }

    project.startDate = parsedStartDate;
    project.endDate = parsedEndDate;

    const updatedProject = await project.save();
    res.status(200).json({ success: true, message: 'Project updated', data: updatedProject, error: null });
  } catch (error) {
    console.error('[project-update-error]', {
      path: req.originalUrl,
      projectId: req.params?.projectId,
      message: error.message
    });
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
      res.status(400);
      return res.json({ success: false, message: 'Invalid projectId format', data: null, error: null });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return res.json({ success: false, message: 'Project not found', data: null, error: null });
    }
    if (!isOwner(project, req.user)) {
      res.status(403);
      return res.json({ success: false, message: 'Forbidden: Not your project', data: null, error: null });
    }
    await Risk.deleteMany({ projectId });
    await project.deleteOne();
    res.status(200).json({ success: true, message: 'Project deleted', data: {}, error: null });
  } catch (error) {
    next(error);
  }
};
