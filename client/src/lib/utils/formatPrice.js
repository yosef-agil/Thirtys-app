// client/src/lib/utils/formatPrice.js

/**
 * Format price to Indonesian Rupiah format without decimals
 * @param {number|string} price - The price to format
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  // Convert to number if string
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Return 0 if invalid
  if (isNaN(numPrice)) return '0';
  
  // Format dengan pemisah ribuan tanpa desimal
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
};

export default formatPrice;