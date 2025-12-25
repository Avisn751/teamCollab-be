const { Task, Project, User } = require('../models');

const parseCommand = (input) => {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('create') && lowerInput.includes('task')) {
    return { action: 'create_task', input };
  }
  if (lowerInput.includes('assign') && lowerInput.includes('task')) {
    return { action: 'assign_task', input };
  }
  if ((lowerInput.includes('move') || lowerInput.includes('update') || lowerInput.includes('change')) && 
      (lowerInput.includes('status') || lowerInput.includes('progress') || lowerInput.includes('done') || lowerInput.includes('todo'))) {
    return { action: 'update_status', input };
  }
  if (lowerInput.includes('list') || lowerInput.includes('show') || lowerInput.includes('get')) {
    if (lowerInput.includes('task')) {
      return { action: 'list_tasks', input };
    }
    if (lowerInput.includes('project')) {
      return { action: 'list_projects', input };
    }
  }
  if (lowerInput.includes('delete') && lowerInput.includes('task')) {
    return { action: 'delete_task', input };
  }
  
  return { action: 'unknown', input };
};

const extractTaskDetails = (input) => {
  const titleMatch = input.match(/(?:called|named|titled?)\s+["']?([^"'\n]+)["']?/i) ||
                     input.match(/task\s+["']?([^"'\n]+)["']?/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  
  let status = 'todo';
  if (input.toLowerCase().includes('in progress') || input.toLowerCase().includes('in-progress')) {
    status = 'in-progress';
  } else if (input.toLowerCase().includes('done') || input.toLowerCase().includes('complete')) {
    status = 'done';
  }

  let priority = 'medium';
  if (input.toLowerCase().includes('high priority') || input.toLowerCase().includes('urgent')) {
    priority = 'high';
  } else if (input.toLowerCase().includes('low priority')) {
    priority = 'low';
  }

  return { title, status, priority };
};

const processCommand = async (req, res, next) => {
  try {
    const { message, projectId } = req.body;
    const teamId = req.user.teamId?._id || req.user.teamId;

    const { action, input } = parseCommand(message);
    let response = '';
    let data = null;

    switch (action) {
      case 'create_task': {
        const { title, status, priority } = extractTaskDetails(input);
        
        if (!title) {
          response = "I couldn't understand the task title. Try saying 'Create a task called [task name]'";
          break;
        }

        let targetProjectId = projectId;
        if (!targetProjectId) {
          const project = await Project.findOne({ teamId }).sort({ createdAt: -1 });
          if (!project) {
            response = "No project found. Please create a project first or specify a project.";
            break;
          }
          targetProjectId = project._id;
        }

        const task = new Task({
          title,
          status,
          priority,
          projectId: targetProjectId,
        });
        await task.save();
        
        const populatedTask = await Task.findById(task._id)
          .populate('assignedTo', 'name email')
          .populate('projectId', 'name');

        data = populatedTask;
        response = `Created task "${title}" with ${priority} priority in ${status} status.`;

        const io = req.app.get('io');
        if (io) {
          io.to(teamId.toString()).emit('task:created', populatedTask);
        }
        break;
      }

      case 'assign_task': {
        const taskMatch = input.match(/task\s+["']?([^"'\n]+?)["']?\s+to/i);
        const userMatch = input.match(/to\s+(\w+)/i);

        if (!taskMatch || !userMatch) {
          response = "I couldn't understand. Try 'Assign task [task name] to [user name]'";
          break;
        }

        const taskTitle = taskMatch[1].trim();
        const userName = userMatch[1].trim();

        const task = await Task.findOne({ 
          title: { $regex: taskTitle, $options: 'i' } 
        });

        if (!task) {
          response = `Couldn't find a task matching "${taskTitle}"`;
          break;
        }

        const user = await User.findOne({ 
          teamId,
          name: { $regex: userName, $options: 'i' } 
        });

        if (!user) {
          response = `Couldn't find a team member named "${userName}"`;
          break;
        }

        task.assignedTo = user._id;
        await task.save();

        const populatedTask = await Task.findById(task._id)
          .populate('assignedTo', 'name email')
          .populate('projectId', 'name');

        data = populatedTask;
        response = `Assigned "${task.title}" to ${user.name}`;

        const io = req.app.get('io');
        if (io) {
          io.to(teamId.toString()).emit('task:updated', populatedTask);
        }
        break;
      }

      case 'update_status': {
        let newStatus = 'todo';
        if (input.toLowerCase().includes('in progress') || input.toLowerCase().includes('in-progress')) {
          newStatus = 'in-progress';
        } else if (input.toLowerCase().includes('done') || input.toLowerCase().includes('complete')) {
          newStatus = 'done';
        }

        const taskMatch = input.match(/(?:task\s+)?["']?([^"'\n]+?)["']?\s+(?:to|as)/i) ||
                         input.match(/move\s+["']?([^"'\n]+?)["']?/i);

        if (!taskMatch) {
          response = "I couldn't understand the task name. Try 'Move [task name] to done'";
          break;
        }

        const taskTitle = taskMatch[1].trim();
        const task = await Task.findOne({ 
          title: { $regex: taskTitle, $options: 'i' } 
        });

        if (!task) {
          response = `Couldn't find a task matching "${taskTitle}"`;
          break;
        }

        task.status = newStatus;
        await task.save();

        const populatedTask = await Task.findById(task._id)
          .populate('assignedTo', 'name email')
          .populate('projectId', 'name');

        data = populatedTask;
        response = `Moved "${task.title}" to ${newStatus}`;

        const io = req.app.get('io');
        if (io) {
          io.to(teamId.toString()).emit('task:updated', populatedTask);
        }
        break;
      }

      case 'list_tasks': {
        let query = {};
        if (projectId) {
          query.projectId = projectId;
        } else {
          const projects = await Project.find({ teamId });
          query.projectId = { $in: projects.map(p => p._id) };
        }

        const tasks = await Task.find(query)
          .populate('assignedTo', 'name email')
          .populate('projectId', 'name')
          .limit(10);

        data = tasks;
        if (tasks.length === 0) {
          response = "No tasks found.";
        } else {
          response = `Found ${tasks.length} task(s):\n${tasks.map(t => `• ${t.title} (${t.status})`).join('\n')}`;
        }
        break;
      }

      case 'list_projects': {
        const projects = await Project.find({ teamId });
        data = projects;
        if (projects.length === 0) {
          response = "No projects found.";
        } else {
          response = `Found ${projects.length} project(s):\n${projects.map(p => `• ${p.name}`).join('\n')}`;
        }
        break;
      }

      case 'delete_task': {
        const taskMatch = input.match(/delete\s+task\s+["']?([^"'\n]+)["']?/i);
        
        if (!taskMatch) {
          response = "I couldn't understand. Try 'Delete task [task name]'";
          break;
        }

        const taskTitle = taskMatch[1].trim();
        const task = await Task.findOne({ 
          title: { $regex: taskTitle, $options: 'i' } 
        });

        if (!task) {
          response = `Couldn't find a task matching "${taskTitle}"`;
          break;
        }

        const taskId = task._id;
        await Task.findByIdAndDelete(taskId);
        
        response = `Deleted task "${task.title}"`;

        const io = req.app.get('io');
        if (io) {
          io.to(teamId.toString()).emit('task:deleted', { taskId });
        }
        break;
      }

      default:
        response = "I can help you with:\n• Create a task called [name]\n• Assign task [name] to [user]\n• Move [task name] to done/in-progress/todo\n• List tasks\n• List projects\n• Delete task [name]";
    }

    res.json({
      success: true,
      data: {
        action,
        response,
        data,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { processCommand };
