class ApiResponse {
    constructor(statusCode, message, data = null) {
      this.status = statusCode >= 200 && statusCode < 300 ? 'success' : 'fail';
      this.message = message;
      if (data) this.data = data;
    }
  
    static success(res, message, data, statusCode = 200) {
      return res.status(statusCode).json({
        status: 'success',
        message,
        data
      });
    }
  
    static error(res, message, statusCode = 400) {
      return res.status(statusCode).json({
        status: 'fail',
        message
      });
    }
  }
  
  module.exports = ApiResponse;