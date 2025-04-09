const axios = require('axios');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

// This is a simulation of the external Ministry of Industry and Trade API
class MinistryService {
  static async verifyCompany(nationalId) {
    try {
      // In a real-world scenario, this would make an API call to the ministry's system
      // For this simulation, we'll create a mock function
      
      // Mock data - in a real implementation, this would come from an external API
      const mockVerifiedCompanies = [
        '1234567890',
        '9876543210',
        '5555555555',
        '1111111111',
        '9999999999'
      ];
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isVerified = mockVerifiedCompanies.includes(nationalId);
      
      logger.info(`Company verification check: ${nationalId} - ${isVerified ? 'Verified' : 'Not verified'}`);
      
      return {
        verified: isVerified,
        message: isVerified 
          ? 'Company is verified by the Ministry of Industry and Trade' 
          : 'Company is not registered or verified by the Ministry of Industry and Trade'
      };
    } catch (error) {
      logger.error(`Error verifying company with ID: ${nationalId}`, error);
      throw new ApiError(500, 'Error connecting to the Ministry of Industry and Trade service');
    }
  }
}

module.exports = MinistryService;