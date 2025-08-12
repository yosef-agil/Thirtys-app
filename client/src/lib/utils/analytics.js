import ReactGA from 'react-ga4';

const MEASUREMENT_ID = 'G-XV36QN41FV';

export const initGA = () => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.initialize(MEASUREMENT_ID);
  }
};

// Track page views
export const trackPageView = (path) => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.send({ hitType: "pageview", page: path });
  }
};

// Track events
export const trackEvent = (category, action, label, value) => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.event({
      category: category,
      action: action,
      label: label,
      value: value
    });
  }
};

// Track booking events
export const trackBooking = (bookingData) => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.event({
      category: 'Booking',
      action: 'completed',
      label: bookingData.serviceName,
      value: bookingData.totalAmount
    });
  }
};

// Track form steps
export const trackFormStep = (step, formName) => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.event({
      category: 'Form',
      action: `step_${step}`,
      label: formName
    });
  }
};