// services/bookingService.js
import api from './api';

export const bookingService = {
  getServices: async () => {
    const response = await api.get('/services');
    return response.data;
  },
  
  getPackagesByService: async (serviceId) => {
    const response = await api.get(`/services/${serviceId}/packages`);
    return response.data;
  },
  
getTimeSlots: async (serviceId, date) => {
    try {
      // Use public endpoint for booking page
      const response = await api.get('/time-slots/public', {
        params: { serviceId, date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching time slots:', error);
      return [];
    }
  },
  
  createBooking: async (formData) => {
    const response = await api.post('/bookings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};