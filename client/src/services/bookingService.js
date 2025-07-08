import api from './api';

export const bookingService = {
  // Get all services
  getServices: async () => {
    const response = await api.get('/services');
    return response.data;
  },

  // Get available time slots
  getTimeSlots: async (serviceId, date) => {
    const response = await api.get('/services/time-slots', {
      params: { serviceId, date }
    });
    return response.data;
  },

  // Create booking - Updated
  createBooking: async (formData) => {
    try {
      const response = await api.post('/bookings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to create booking');
      }
      throw error;
    }
  },
};