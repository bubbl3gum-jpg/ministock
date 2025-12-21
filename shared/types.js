// shared/types.js

// API Response types
export const ResponseStatus = {
  OK: 'ok',
  ERROR: 'error'
};

// Item type
export const ItemSchema = {
  id: 'string', // UUID
  name: 'string',
  category: 'string',
  stock_quantity: 'number',
  restock_level: 'number',
  last_updated: 'string' // ISO date
};

// API Response wrapper
export const ApiResponseSchema = {
  status: 'string', // 'ok' or 'error'
  message: 'string?', // optional
  data: 'any' // the actual data
};

// User type
export const UserSchema = {
  id: 'number',
  email: 'string'
};

// Auth response
export const AuthResponseSchema = {
  status: 'string',
  token: 'string?',
  user: 'UserSchema?'
};