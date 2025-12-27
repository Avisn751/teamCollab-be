const { Task, Project, User } = require('../models');

const GREETINGS = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
const THANKS = ['thank', 'thanks', 'thx', 'appreciate'];
const HELP_WORDS = ['help', 'what can you do', 'commands', 'how do i', 'how to'];

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getRandomResponse = (responses) => responses[Math.floor(Math.random() * responses.length)];

const parseCommand = (input) => {
  const lowerInput = input.toLowerCase().trim();

  if (GREETINGS.some(g => lowerInput.startsWith(g))) {
    return { action: 'greeting', input };
  }

  if (THANKS.some(t => lowerInput.includes(t))) {
    return { action: 'thanks', input };
  }

  if (HELP_WORDS.some(h => lowerInput.includes(h))) {
    return { action: 'help', input };
  }

  if ((lowerInput.includes('create') || lowerInput.includes('add') || lowerInput.includes('new')) && 
      lowerInput.includes('task')) {
    return { action: 'create_task', input };
  }

  if ((lowerInput.includes('assign') || lowerInput.includes('give')) && 
      (lowerInput.includes('task') || lowerInput.includes('to'))) {
    return { action: 'assign_task', input };
  }

  if ((lowerInput.includes('move') || lowerInput.includes('update') || lowerInput.includes('change') || 
       lowerInput.includes('set') || lowerInput.includes('mark')) && 
      (lowerInput.includes('status') || lowerInput.includes('progress') || lowerInput.includes('done') || 
       lowerInput.includes('todo') || lowerInput.includes('complete') || lowerInput.includes('finish'))) {
    return { action: 'update_status', input };
  }

  if ((lowerInput.includes('set') || lowerInput.includes('change') || lowerInput.includes('update')) && 
      lowerInput.includes('priority')) {
    return { action: 'update_priority', input };
  }

  if (lowerInput.includes('list') || lowerInput.includes('show') || lowerInput.includes('get') || 
      lowerInput.includes('display') || lowerInput.includes('what are')) {
    if (lowerInput.includes('my task') || lowerInput.includes('assigned to me')) {
      return { action: 'my_tasks', input };
    }
    if (lowerInput.includes('task')) {
      return { action: 'list_tasks', input };
    }
    if (lowerInput.includes('project')) {
      return { action: 'list_projects', input };
    }
    if (lowerInput.includes('team') || lowerInput.includes('member')) {
      return { action: 'list_members', input };
    }
  }

  if ((lowerInput.includes('delete') || lowerInput.includes('remove')) && lowerInput.includes('task')) {
    return { action: 'delete_task', input };
  }

  if (lowerInput.includes('status') || lowerInput.includes('summary') || lowerInput.includes('overview')) {
    return { action: 'project_status', input };
  }

  if (lowerInput.includes('search') || lowerInput.includes('find')) {
    return { action: 'search_tasks', input };
  }

  return { action: 'unknown', input };
};

const extractTaskDetails = (input) => {
  const titleMatch = input.match(/(?:called|named|titled?|")\s*["']?([^"'\n]+?)["']?(?:\s+with|\s+as|\s*$)/i) ||
                     input.match(/task\s+["']([^"']+)["']/i) ||
                     input.match(/task\s+(\w+(?:\s+\w+)*?)(?:\s+with|\s+as|\s+to|\s*$)/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/["']/g, '') : null;
  
  let status = 'todo';
  if (input.toLowerCase().includes('in progress') || input.toLowerCase().includes('in-progress') ||
      input.toLowerCase().includes('started')) {
    status = 'in-progress';
  } else if (input.toLowerCase().includes('done') || input.toLowerCase().includes('complete') ||
             input.toLowerCase().includes('finished')) {
    status = 'done';
  }

  let priority = 'medium';
  if (input.toLowerCase().includes('high priority') || input.toLowerCase().includes('urgent') ||
      input.toLowerCase().includes('critical') || input.toLowerCase().includes('important')) {
    priority = 'high';
  } else if (input.toLowerCase().includes('low priority') || input.toLowerCase().includes('minor')) {
    priority = 'low';
  }

  const descMatch = input.match(/(?:description|desc|details?):\s*["']?([^"'\n]+)["']?/i);
  const description = descMatch ? descMatch[1].trim() : null;

  return { title, status, priority, description };
};

const formatStatus = (status) => {
  const statusMap = {
    'todo': '📋 To Do',
    'in-progress': '🔄 In Progress',
    'done': '✅ Done'
  };
  return statusMap[status] || status;
};

const formatPriority = (priority) => {
  const priorityMap = {
    'high': '🔴 High',
    'medium': '🟡 Medium',
    'low': '🟢 Low'
  };
  return priorityMap[priority] || priority;
};

const processCommand = async (req, res, next) => {
  try {
    const { message, projectId } = req.body;
    const teamId = req.user.teamId?._id || req.user.teamId;
    const userName = req.user.name || 'there';

    const { action, input } = parseCommand(message);
    let response = '';
    let data = null;
    let suggestions = [];

    switch (action) {
      case 'greeting': {
        const greetings = [
          `${getTimeBasedGreeting()}, ${userName}! How can I help you manage your tasks today?`,
          `Hey ${userName}! Ready to be productive? I'm here to help with your tasks and projects.`,
          `Hi ${userName}! What would you like to accomplish today?`
        ];
        response = getRandomResponse(greetings);
        suggestions = ['Show my tasks', 'Create a new task', 'Project overview'];
        break;
      }

      case 'thanks': {
        const replies = [
          `You're welcome, ${userName}! Let me know if you need anything else.`,
          `Happy to help! Is there anything else you'd like me to do?`,
          `Anytime! I'm here if you need more assistance.`
        ];
        response = getRandomResponse(replies);
        break;
      }

      case 'help': {
        response = `Here's what I can help you with, ${userName}:\n\n` +
          '**📝 Task Management**\n' +
          '• "Create a task called [name]" - Add a new task\n' +
          '• "Assign [task] to [person]" - Delegate work\n' +
          '• "Move [task] to done" - Update task status\n' +
          '• "Set [task] priority to high" - Change priority\n' +
          '• "Delete task [name]" - Remove a task\n\n' +
          '**📋 Viewing & Search**\n' +
          '• "Show my tasks" - See tasks assigned to you\n' +
          '• "List all tasks" - View all team tasks\n' +
          '• "Search for [keyword]" - Find specific tasks\n' +
          '• "Project overview" - Get a status summary\n\n' +
          '**💡 Tips:** You can use natural language - I\'ll understand variations like "add", "new", "give", etc.';
        suggestions = ['Show my tasks', 'Create a task', 'Project overview'];
        break;
      }

      case 'create_task': {
        const { title, status, priority, description } = extractTaskDetails(input);
        
        if (!title) {
          response = "I'd love to create a task for you! Could you tell me what to call it?\n\n" +
            '**Try something like:**\n' +
            '• "Create a task called Review PR #42"\n' +
            '• "Add new task \'Update documentation\' with high priority"';
          suggestions = ['Create task "Example task"', 'Add new urgent task'];
          break;
        }

        let targetProjectId = projectId;
        let projectName = 'your project';
        if (!targetProjectId) {
          const project = await Project.findOne({ teamId }).sort({ createdAt: -1 });
          if (!project) {
            response = "I noticed you don't have any projects yet. Let's create one first, or you can specify which project this task belongs to.";
            suggestions = ['List projects'];
            break;
          }
          targetProjectId = project._id;
          projectName = project.name;
        } else {
          const project = await Project.findById(targetProjectId);
          if (project) projectName = project.name;
        }

        const task = new Task({
          title,
          status,
          priority,
          description: description || '',
          projectId: targetProjectId,
        });
        await task.save();
        
        const populatedTask = await Task.findById(task._id)
          .populate('assignedTo', 'name email')
          .populate('projectId', 'name');

        data = populatedTask;
        response = `Great! I've created the task **"${title}"** in ${projectName}.\n\n` +
          `• **Status:** ${formatStatus(status)}\n` +
          `• **Priority:** ${formatPriority(priority)}\n\n` +
          'Would you like to assign it to someone?';
        suggestions = [`Assign "${title}" to`, 'Create another task', 'Show all tasks'];

        const io = req.app.get('io');
        if (io) {
          io.to(teamId.toString()).emit('task:created', populatedTask);
        }
        break;
      }

      case 'assign_task': {
        const taskMatch = input.match(/(?:assign|give)\s+(?:task\s+)?["']?([^"'\n]+?)["']?\s+to/i) ||
                          input.match(/["']([^"']+)["']\s+to/i);
        const userMatch = input.match(/to\s+["']?(\w+(?:\s+\w+)?)["']?/i);

        if (!taskMatch || !userMatch) {
          response = "I can help you assign a task! Just tell me which task and who should work on it.\n\n" +
            '**Example:**\n' +
            '• "Assign task \'Fix login bug\' to Sarah"\n' +
            '• "Give the API integration task to John"';
          
          const recentTasks = await Task.find({}).limit(3).select('title');
          if (recentTasks.length > 0) {
            suggestions = recentTasks.map(t => `Assign "${t.title}" to`);
          }
          break;
        }

        const taskTitle = taskMatch[1].trim();
        const userNameToAssign = userMatch[1].trim();

        const task = await Task.findOne({ 
          title: { $regex: taskTitle, $options: 'i' } 
        });

        if (!task) {
          const similarTasks = await Task.find({
            title: { $regex: taskTitle.split(' ')[0], $options: 'i' }
          }).limit(3);
          
          response = `I couldn't find a task matching "${taskTitle}".`;
          if (similarTasks.length > 0) {
            response += '\n\n**Did you mean one of these?**\n' +
              similarTasks.map(t => `• ${t.title}`).join('\n');
            suggestions = similarTasks.map(t => `Assign "${t.title}" to ${userNameToAssign}`);
          }
          break;
        }

        const user = await User.findOne({ 
          teamId,
          name: { $regex: userNameToAssign, $options: 'i' } 
        });

        if (!user) {
          const teamMembers = await User.find({ teamId }).limit(5).select('name');
          response = `I couldn't find anyone named "${userNameToAssign}" on your team.`;
          if (teamMembers.length > 0) {
            response += '\n\n**Team members:**\n' +
              teamMembers.map(m => `• ${m.name}`).join('\n');
            suggestions = teamMembers.map(m => `Assign "${task.title}" to ${m.name}`);
          }
          break;
        }

        task.assignedTo = user._id;
        await task.save();

        const populatedTask = await Task.findById(task._id)
          .populate('assignedTo', 'name email')
          .populate('projectId', 'name');

        data = populatedTask;
        response = `Done! I've assigned **"${task.title}"** to **${user.name}**. They'll be able to see it in their task list now.`;
        suggestions = ['Show all tasks', `Move "${task.title}" to in-progress`];

        const io = req.app.get('io');
        if (io) {
          io.to(teamId.toString()).emit('task:updated', populatedTask);
        }
        break;
      }

      case 'update_status': {
        let newStatus = 'todo';
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes('in progress') || lowerInput.includes('in-progress') || 
            lowerInput.includes('start') || lowerInput.includes('working')) {
          newStatus = 'in-progress';
        } else if (lowerInput.includes('done') || lowerInput.includes('complete') || 
                   lowerInput.includes('finish') || lowerInput.includes('close')) {
          newStatus = 'done';
        } else if (lowerInput.includes('todo') || lowerInput.includes('to do') || 
                   lowerInput.includes('reopen') || lowerInput.includes('reset')) {
          newStatus = 'todo';
        }

        const taskMatch = input.match(/(?:move|update|change|set|mark)\s+(?:task\s+)?["']?([^"'\n]+?)["']?\s+(?:to|as)/i) ||
                         input.match(/["']([^"']+)["']/i);

        if (!taskMatch) {
          response = "Which task would you like to update?\n\n" +
            '**Try:**\n' +
            '• "Move \'Design review\' to done"\n' +
            '• "Mark task \'API setup\' as in-progress"';
          
          const recentTasks = await Task.find({}).limit(3).select('title status');
          if (recentTasks.length > 0) {
            suggestions = recentTasks.map(t => `Move "${t.title}" to ${t.status === 'done' ? 'todo' : 'done'}`);
          }
          break;
        }

        const taskTitle = taskMatch[1].trim();
        const task = await Task.findOne({ 
          title: { $regex: taskTitle, $options: 'i' } 
        });

        if (!task) {
          response = `I couldn't find a task matching "${taskTitle}". Could you check the name?`;
          suggestions = ['Show all tasks'];
          break;
        }

        const oldStatus = task.status;
        task.status = newStatus;
        await task.save();

        const populatedTask = await Task.findById(task._id)
          .populate('assignedTo', 'name email')
          .populate('projectId', 'name');

        data = populatedTask;
        
        let celebrationMsg = '';
        if (newStatus === 'done') {
          celebrationMsg = ' 🎉 Great job!';
        } else if (newStatus === 'in-progress') {
          celebrationMsg = ' Let\'s get it done!';
        }
        
        response = `Updated **"${task.title}"** from ${formatStatus(oldStatus)} → ${formatStatus(newStatus)}.${celebrationMsg}`;

        const io = req.app.get('io');
        if (io) {
          io.to(teamId.toString()).emit('task:updated', populatedTask);
        }
        break;
      }

      case 'update_priority': {
        let newPriority = 'medium';
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes('high') || lowerInput.includes('urgent') || lowerInput.includes('critical')) {
          newPriority = 'high';
        } else if (lowerInput.includes('low') || lowerInput.includes('minor')) {
          newPriority = 'low';
        }

        const taskMatch = input.match(/(?:set|change|update)\s+["']?([^"'\n]+?)["']?\s+priority/i) ||
                          input.match(/priority\s+(?:of|for)\s+["']?([^"'\n]+?)["']?/i);

        if (!taskMatch) {
          response = "Which task's priority would you like to change?\n\n" +
            '**Example:** "Set \'Bug fix\' priority to high"';
          break;
        }

        const taskTitle = taskMatch[1].trim();
        const task = await Task.findOne({ 
          title: { $regex: taskTitle, $options: 'i' } 
        });

        if (!task) {
          response = `I couldn't find a task matching "${taskTitle}".`;
          suggestions = ['Show all tasks'];
          break;
        }

        const oldPriority = task.priority;
        task.priority = newPriority;
        await task.save();

        const populatedTask = await Task.findById(task._id)
          .populate('assignedTo', 'name email')
          .populate('projectId', 'name');

        data = populatedTask;
        response = `Updated **"${task.title}"** priority: ${formatPriority(oldPriority)} → ${formatPriority(newPriority)}`;

        const io = req.app.get('io');
        if (io) {
          io.to(teamId.toString()).emit('task:updated', populatedTask);
        }
        break;
      }

      case 'my_tasks': {
        const tasks = await Task.find({ assignedTo: req.user._id })
          .populate('assignedTo', 'name email')
          .populate('projectId', 'name')
          .sort({ priority: -1, createdAt: -1 });

        data = tasks;
        if (tasks.length === 0) {
          response = `You don't have any tasks assigned to you yet, ${userName}. Time to relax... or pick up some work!`;
          suggestions = ['Show all tasks', 'Create a task'];
        } else {
          const todoCount = tasks.filter(t => t.status === 'todo').length;
          const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
          const doneCount = tasks.filter(t => t.status === 'done').length;
          
          response = `Here are your ${tasks.length} task(s), ${userName}:\n\n` +
            `📊 **Overview:** ${todoCount} to do, ${inProgressCount} in progress, ${doneCount} done\n\n` +
            tasks.slice(0, 10).map(t => 
              `• **${t.title}** - ${formatStatus(t.status)} ${t.priority === 'high' ? '🔴' : ''}`
            ).join('\n');
          
          if (tasks.length > 10) {
            response += `\n\n_...and ${tasks.length - 10} more tasks_`;
          }
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
          .sort({ priority: -1, createdAt: -1 })
          .limit(15);

        data = tasks;
        if (tasks.length === 0) {
          response = "No tasks found. Ready to create the first one?";
          suggestions = ['Create a task'];
        } else {
          const todoTasks = tasks.filter(t => t.status === 'todo');
          const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
          const doneTasks = tasks.filter(t => t.status === 'done');

          let taskList = '';
          
          if (inProgressTasks.length > 0) {
            taskList += '**🔄 In Progress:**\n' + 
              inProgressTasks.map(t => `• ${t.title}${t.assignedTo ? ` _(${t.assignedTo.name})_` : ''}`).join('\n') + '\n\n';
          }
          if (todoTasks.length > 0) {
            taskList += '**📋 To Do:**\n' + 
              todoTasks.map(t => `• ${t.title}${t.assignedTo ? ` _(${t.assignedTo.name})_` : ''}`).join('\n') + '\n\n';
          }
          if (doneTasks.length > 0) {
            taskList += '**✅ Done:**\n' + 
              doneTasks.map(t => `• ${t.title}`).join('\n');
          }

          response = `Found ${tasks.length} task(s):\n\n${taskList}`;
        }
        break;
      }

      case 'list_projects': {
        const projects = await Project.find({ teamId });
        data = projects;
        if (projects.length === 0) {
          response = "No projects found yet. Create one to get started!";
        } else {
          response = `You have ${projects.length} project(s):\n\n` +
            projects.map(p => `📁 **${p.name}**${p.description ? ` - ${p.description}` : ''}`).join('\n');
          suggestions = projects.map(p => `Show tasks in ${p.name}`);
        }
        break;
      }

      case 'list_members': {
        const members = await User.find({ teamId }).select('name email');
        data = members;
        if (members.length === 0) {
          response = "No team members found.";
        } else {
          response = `Your team has ${members.length} member(s):\n\n` +
            members.map(m => `👤 **${m.name}** - ${m.email}`).join('\n');
        }
        break;
      }

      case 'project_status': {
        const projects = await Project.find({ teamId });
        if (projects.length === 0) {
          response = "No projects found to show status for.";
          break;
        }

        const projectIds = projects.map(p => p._id);
        const tasks = await Task.find({ projectId: { $in: projectIds } });
        
        const total = tasks.length;
        const todoCount = tasks.filter(t => t.status === 'todo').length;
        const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
        const doneCount = tasks.filter(t => t.status === 'done').length;
        const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

        const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done');

        response = `**📊 Project Overview**\n\n` +
          `• **Total Tasks:** ${total}\n` +
          `• **Completion Rate:** ${completionRate}%\n\n` +
          `**Status Breakdown:**\n` +
          `📋 To Do: ${todoCount}\n` +
          `🔄 In Progress: ${inProgressCount}\n` +
          `✅ Done: ${doneCount}\n`;

        if (highPriorityTasks.length > 0) {
          response += `\n**⚠️ High Priority Items (${highPriorityTasks.length}):**\n` +
            highPriorityTasks.slice(0, 5).map(t => `• ${t.title}`).join('\n');
        }

        data = { total, todoCount, inProgressCount, doneCount, completionRate, highPriorityTasks };
        break;
      }

      case 'search_tasks': {
        const searchMatch = input.match(/(?:search|find)\s+(?:for\s+)?["']?([^"'\n]+)["']?/i);
        
        if (!searchMatch) {
          response = "What would you like to search for?\n\n" +
            '**Example:** "Search for login bug"';
          break;
        }

        const searchTerm = searchMatch[1].trim();
        const projects = await Project.find({ teamId });
        
        const tasks = await Task.find({
          projectId: { $in: projects.map(p => p._id) },
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
          ]
        })
        .populate('assignedTo', 'name email')
        .populate('projectId', 'name')
        .limit(10);

        data = tasks;
        if (tasks.length === 0) {
          response = `No tasks found matching "${searchTerm}". Try a different search term.`;
          suggestions = ['Show all tasks'];
        } else {
          response = `Found ${tasks.length} task(s) matching "${searchTerm}":\n\n` +
            tasks.map(t => `• **${t.title}** - ${formatStatus(t.status)}${t.assignedTo ? ` _(${t.assignedTo.name})_` : ''}`).join('\n');
        }
        break;
      }

      case 'delete_task': {
        const taskMatch = input.match(/(?:delete|remove)\s+(?:task\s+)?["']?([^"'\n]+)["']?/i);
        
        if (!taskMatch) {
          response = "Which task would you like to delete?\n\n" +
            '**Example:** "Delete task \'Old feature\'"';
          break;
        }

        const taskTitle = taskMatch[1].trim();
        const task = await Task.findOne({ 
          title: { $regex: taskTitle, $options: 'i' } 
        });

        if (!task) {
          response = `I couldn't find a task matching "${taskTitle}".`;
          suggestions = ['Show all tasks'];
          break;
        }

        const taskId = task._id;
        const deletedTitle = task.title;
        await Task.findByIdAndDelete(taskId);
        
        response = `Deleted task **"${deletedTitle}"**. It's gone for good!`;

        const io = req.app.get('io');
        if (io) {
          io.to(teamId.toString()).emit('task:deleted', { taskId });
        }
        break;
      }

      default: {
        const helpMessages = [
          `I'm not quite sure what you mean, ${userName}. Here's what I can help with:`,
          `Hmm, I didn't catch that. Let me show you what I can do:`,
          `I'd love to help! Here are some things you can ask me:`
        ];
        
        response = getRandomResponse(helpMessages) + '\n\n' +
          '**Quick Commands:**\n' +
          '• "Create a task called [name]" - Add a new task\n' +
          '• "Show my tasks" - See your assigned tasks\n' +
          '• "Move [task] to done" - Update task status\n' +
          '• "Project overview" - See project summary\n\n' +
          'Type **"help"** for the full list of commands!';
        suggestions = ['Help', 'Show my tasks', 'Project overview'];
      }
    }

    res.json({
      success: true,
      data: {
        action,
        response,
        data,
        suggestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { processCommand };
