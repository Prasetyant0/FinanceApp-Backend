const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

const RESPONSE_MESSAGES = {
  SUCCESS: {
    CREATED: 'Data created successfully',
    RETRIEVED: 'Data retrieved successfully',
    UPDATED: 'Data updated successfully',
    DELETED: 'Data deleted successfully'
  },
  ERROR: {
    VALIDATION: 'Validation error',
    NOT_FOUND: 'Data not found',
    UNAUTHORIZED: 'Unauthorized access',
    INTERNAL_SERVER: 'Internal server error',
    DUPLICATE: 'Data already exists'
  }
};

module.exports = {
  HTTP_STATUS,
  RESPONSE_MESSAGES
};
