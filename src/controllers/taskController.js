const { Task, Project } = require('../models');
const { createNotification } = require('./notificationController');

const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const teamId = req.user.teamId?._id || req.user.teamId;

    let query = {};
    
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project || project.teamId.toString() !== teamId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      query.projectId = projectId;
    } else {
      const projects = await Project.find({ teamId });
      const projectIds = projects.map(p => p._id);
      query.projectId = { $in: projectIds };
    }

    // If the requester is a MEMBER, only return tasks assigned to them
    if (req.user.role === 'MEMBER') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, projectId, assignedTo, priority } = req.body;
    const teamId = req.user.teamId?._id || req.user.teamId;

    const project = await Project.findById(projectId);
    if (!project || project.teamId.toString() !== teamId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied or project not found',
      });
    }

    const task = new Task({
      title,
      description,
      status: status || 'todo',
      projectId,
      assignedTo: assignedTo || null,
      priority: priority || 'medium',
    });

    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');

    const io = req.app.get('io');
    if (io) {
      io.to(teamId.toString()).emit('task:created', populatedTask);
    }

    // Create notification and emit personal socket event if task is assigned
    if (assignedTo) {
      const notification = await createNotification(
        assignedTo,
        'task_assigned',
        'New Task Assigned',
        `You have been assigned to task: ${title}`,
        `/tasks?taskId=${task._id}`,
        { taskId: task._id, projectId }
      );

      if (io && notification) {
        // emit to a personal room; frontend should join `user:<userId>` room on connect
        io.to(`user:${assignedTo}`).emit('notification:new', notification);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, assignedTo, priority } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Track if assignment changed
    const previousAssignedTo = task.assignedTo?.toString();
    const newAssignedTo = assignedTo?.toString();
    const assignmentChanged = previousAssignedTo !== newAssignedTo;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (priority !== undefined) task.priority = priority;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');

    const teamId = req.user.teamId?._id || req.user.teamId;
    const io = req.app.get('io');
    if (io) {
      io.to(teamId.toString()).emit('task:updated', populatedTask);
    }

    // Create notification if assignment changed and emit personal socket event
    if (assignmentChanged && assignedTo) {
      const notification = await createNotification(
        assignedTo,
        'task_assigned',
        'Task Assigned to You',
        `You have been assigned to task: ${task.title}`,
        `/tasks?taskId=${task._id}`,
        { taskId: task._id, projectId: task.projectId }
      );
      if (io && notification) {
        io.to(`user:${assignedTo}`).emit('notification:new', notification);
      }
    } else if (assignmentChanged && !assignedTo && previousAssignedTo) {
      // Notify user if task was unassigned
      const notification = await createNotification(
        previousAssignedTo,
        'task_updated',
        'Task Unassigned',
        `You have been unassigned from task: ${task.title}`,
        `/tasks`,
        { taskId: task._id, projectId: task.projectId }
      );
      if (io && notification) {
        io.to(`user:${previousAssignedTo}`).emit('notification:new', notification);
      }
    }

    res.json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const teamId = req.user.teamId?._id || req.user.teamId;

    // Prevent MEMBERS from deleting tasks
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Members are not allowed to delete tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.to(teamId.toString()).emit('task:deleted', { taskId: req.params.id });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
