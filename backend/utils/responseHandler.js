class ResponseHandler {
  static success(res, message, data = null, statusCode = 200) {
    const response = {
      success: true,
      message
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  static error(res, message, errors = null, statusCode = 400) {
    const response = {
      success: false,
      message
    };

    if (errors !== null) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  static serverError(res, message = 'Internal server error') {
    return res.status(500).json({
      success: false,
      message
    });
  }

  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message
    });
  }

  static unauthorized(res, message = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  static forbidden(res, message = 'Access forbidden') {
    return res.status(403).json({
      success: false,
      message
    });
  }

  static paginated(res, message, data, pagination) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination
    });
  }
}

module.exports = ResponseHandler;