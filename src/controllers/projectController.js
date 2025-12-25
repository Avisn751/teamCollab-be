const { Project, Task } = require('../models');

const getProjects = async (req, res, next) => {
  try {
    const teamId = req.user.teamId?._id || req.user.teamId;
    const projects = await Project.find({ teamId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const teamId = req.user.teamId?._id || req.user.teamId;
    if (project.teamId.toString() !== teamId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const teamId = req.user.teamId?._id || req.user.teamId;

    const project = new Project({
      name,
      description,
      teamId,
    });

    await project.save();

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const teamId = req.user.teamId?._id || req.user.teamId;
    if (project.teamId.toString() !== teamId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;
    await project.save();

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const teamId = req.user.teamId?._id || req.user.teamId;
    if (project.teamId.toString() !== teamId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await Task.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
