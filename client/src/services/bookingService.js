import api from './api';

export const bookingService = {
  getServices: async () => {
    const response = await api.get('/services');
    return response.data;
  },
  
  getTimeSlots: async (serviceId, date) => {
    const response = await api.get(`/services/${serviceId}/time-slots?date=${date}`);
    return response.data;
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