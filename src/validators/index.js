const Joi = require('joi');

const projectSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().max(500).allow(''),
});

const projectUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().max(500).allow(''),
});

const taskSchema = Joi.object({
  title: Joi.string().required().min(1).max(200),
  description: Joi.string().max(1000).allow(''),
  status: Joi.string().valid('todo', 'in-progress', 'done'),
  projectId: Joi.string().required(),
  assignedTo: Joi.string().allow(null, ''),
  priority: Joi.string().valid('low', 'medium', 'high'),
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().max(1000).allow(''),
  status: Joi.string().valid('todo', 'in-progress', 'done'),
  assignedTo: Joi.string().allow(null, ''),
  priority: Joi.string().valid('low', 'medium', 'high'),
});

const messageSchema = Joi.object({
  content: Joi.string().required().min(1).max(2000),
});

const teamSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().max(500).allow(''),
});

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required().min(1).max(100),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'MEMBER'),
  teamId: Joi.string(),
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors 
      });
    }
    next();
  };
};

module.exports = {
  projectSchema,
  projectUpdateSchema,
  taskSchema,
  taskUpdateSchema,
  messageSchema,
  teamSchema,
  userSchema,
  validate,
};
