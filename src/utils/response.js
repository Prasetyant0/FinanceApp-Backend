const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../constants/response');

class ResponseHelper {
  static success(res, data = null, message = RESPONSE_MESSAGES.SUCCESS.RETRIEVED, status = HTTP_STATUS.OK) {
    return res.status(status).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER, status = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) {
    return res.status(status).json({
      success: false,
      message,
      errors
    });
  }

  static paginated(res, data, pagination, message = RESPONSE_MESSAGES.SUCCESS.RETRIEVED) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message,
      data,
      pagination
    });
  }
}

module.exports = ResponseHelper;
