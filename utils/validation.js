import Joi from 'joi';

/**
 * Validation schemas
 */
export const schemas = {
  createRoom: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    password: Joi.string().min(4).max(50).allow(null, ''),
    limit: Joi.number().integer().min(2).max(50).default(10),
    videoEnabled: Joi.boolean().default(true)
  }),

  joinRoom: Joi.object({
    roomId: Joi.string().length(8).required(),
    password: Joi.string().max(50).allow(null, '')
  }),

  sendMessage: Joi.object({
    roomId: Joi.string().length(8).required(),
    message: Joi.string().min(1).max(500).required()
  }),

  changeName: Joi.object({
    roomId: Joi.string().length(8).required(),
    newName: Joi.string().min(1).max(20).required()
  }),

  kickUser: Joi.object({
    roomId: Joi.string().length(8).required(),
    targetUserId: Joi.string().min(1).max(50).required()
  }),

  webrtcSignaling: Joi.object({
    to: Joi.string().min(1).max(50).required(),
    roomId: Joi.string().length(8).required(),
    offer: Joi.object().optional(),
    answer: Joi.object().optional(),
    candidate: Joi.object().optional()
  })
};

/**
 * Validate data against schema
 */
export const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(d => d.message).join(', ');
    return { valid: false, errors, value: null };
  }

  return { valid: true, errors: null, value };
};
