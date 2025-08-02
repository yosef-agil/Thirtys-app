import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
  },
  // Container untuk content
  content: {
    flex: 1,
  },
  // Header styles
  header: {
    marginBottom: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  brandSection: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 62,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  invoiceInfo: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 14,
    color: "#6b7280",
  },
  // Company info
  companyInfo: {
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 1.4,
  },
  // Main content card
  mainCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  // Customer section
  customerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    color: "#1f2937",
    fontWeight: "medium",
  },
  bkinvoice: {
    fontSize: 12,
    color: "#1f2937",
    fontWeight: "bold",
  },
  // Booking code highlight
  bookingCodeContainer: {
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  bookingCodeLabel: {
    fontSize: 11,
    color: "#1e40af",
    marginBottom: 4,
  },
  bookingCode: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e40af",
    letterSpacing: 1,
  },
  // Service details table
  serviceSection: {
    marginBottom: 20,
  },
  table: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    padding: 10,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: 11,
    color: "#1f2937",
  },
  tableCellService: {
    flex: 2,
  },
  tableCellPackage: {
    flex: 2,
  },
  tableCellPrice: {
    flex: 1,
    textAlign: "right",
  },
  // Payment summary
  paymentSummary: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 11,
    color: "#1f2937",
  },
  summaryDivider: {
    borderBottom: "1px solid #d1d5db",
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
  },
  discountText: {
    color: "#10b981",
  },
  // Payment method
  paymentMethod: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentMethodTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 4,
  },
  paymentMethodValue: {
    fontSize: 12,
    color: "#78350f",
  },
  // Footer - Fixed positioning
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    paddingTop: 20,
    borderTop: "1px solid #e5e7eb",
  },
  footerText: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 4,
  },
  footerBold: {
    fontSize: 10,
    color: "#374151",
    textAlign: "center",
    fontWeight: "medium",
  },
  // Date section
  dateInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: "1px solid #e5e7eb",
  },
  dateItem: {
    flex: 1,
  },
});

const PDFInvoice = ({ invoice }) => {
  // Debug log to see what data we're receiving
  console.log('Full Invoice data:', invoice);
  console.log('All Invoice Keys:', Object.keys(invoice || {}));
  
  // Format currency
  const formatPrice = (price) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : parseFloat(price || 0);
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice);
  };

  // Parse data with new structure understanding
  let serviceName = '';
  let packageName = '';
  let originalPrice = 0;
  let discountPercentage = 0;
  let discountAmount = 0;
  let phoneNumber = '';
  
  // Check if this is the old structure or new structure
  if (invoice?.items && invoice.items.length > 0) {
    // Old structure with items array
    const item = invoice.items[0];
    const description = item.description || '';
    
    // Parse service and package from description
    if (description.includes(' - ')) {
      const parts = description.split(' - ');
      serviceName = parts[0] || '';
      packageName = parts.slice(1).join(' - ') || '';
    } else {
      serviceName = description;
    }
    
    originalPrice = parseFloat(item.price || 0);
    
    // Check for discount in percentage
    if (invoice.discount) {
      discountPercentage = parseFloat(invoice.discount);
      discountAmount = (discountPercentage / 100) * originalPrice;
    }
    
    // Try to find phone number in various places
    phoneNumber = invoice.phone || invoice.phone_number || invoice.contact || invoice.mobile || '';
    
    // If still no phone, check if it's embedded in customer info
    if (!phoneNumber && invoice.customer) {
      // Try to extract phone from customer string if it contains it
      const phoneMatch = invoice.customer.match(/\d{10,}/);
      if (phoneMatch) {
        phoneNumber = phoneMatch[0];
      }
    }
  } else {
    // New structure from booking data
    serviceName = invoice?.service_name || '';
    packageName = invoice?.package_name || '';
    phoneNumber = invoice?.phone || invoice?.phone_number || invoice?.contact || invoice?.mobile || '';
    
    // Calculate original price and discount
    const totalPrice = parseFloat(invoice?.total_price || 0);
    discountAmount = parseFloat(invoice?.discount_amount || 0);
    originalPrice = totalPrice + discountAmount;
    
    // Calculate discount percentage
    if (originalPrice > 0 && discountAmount > 0) {
      discountPercentage = Math.round((discountAmount / originalPrice) * 100);
    }
  }
  
  // Extract other data
  const customerName = invoice?.customer || invoice?.customer_name || '';
  const bookingDate = invoice?.booking_date || invoice?.due_date || new Date();
  const bookingCode = invoice?.display_code || invoice?.booking_code || invoice?.inv_id || '';
  const paymentMethod = invoice?.payment_method || '';
  const paymentType = invoice?.payment_type || 'full_payment';
  
  // Calculate final price after discount
  const finalPrice = originalPrice - discountAmount;
  const isDownPayment = paymentType === 'down_payment';
  const paymentAmount = isDownPayment ? (finalPrice / 2) : finalPrice;
  const remainingAmount = isDownPayment ? (finalPrice / 2) : 0;
  
  // Log for debugging
  console.log('Parsed data:', {
    serviceName,
    packageName,
    phoneNumber,
    originalPrice,
    discountPercentage,
    discountAmount,
    finalPrice,
    paymentType,
    isDownPayment
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.brandSection}>
                <Image  
                  src="https://res.cloudinary.com/dtv63pzsn/image/upload/v1754092731/Thirtyone_Logo_New_tcrlx7.png" 
                  style={styles.logo}
                />
                <View style={styles.companyInfo}>
                  <Text style={styles.companyDetails}>Jl. Cungkup No. 466, Sidorejo</Text>
                  <Text style={styles.companyDetails}>Salatiga 50711</Text>
                  <Text style={styles.companyDetails}>082371097483</Text>
                </View>
              </View>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceTitle}>INVOICE</Text>
                <Text style={styles.invoiceNumber}>#{bookingCode}</Text>
              </View>
            </View>
          </View>

          {/* Date Information */}
          <View style={styles.dateInfo}>
            <View style={styles.dateItem}>
              <Text style={styles.infoLabel}>Invoice Date</Text>
              <Text style={styles.infoValue}>{new Date().toLocaleDateString("id-ID", { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.infoLabel}>Event Date</Text>
              <Text style={styles.infoValue}>
                {bookingDate ? new Date(bookingDate).toLocaleDateString("id-ID", { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                }) : '-'}
              </Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.infoLabel}>Booking Code</Text>
              <Text style={styles.bkinvoice}>{bookingCode}</Text>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.mainCard}>
            {/* Customer Information */}
            <View style={styles.customerSection}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{customerName || '-'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{phoneNumber || '-'}</Text>
                </View>
                {invoice?.faculty && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Faculty</Text>
                    <Text style={styles.infoValue}>{invoice.faculty}</Text>
                  </View>
                )}
                {invoice?.university && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>University</Text>
                    <Text style={styles.infoValue}>{invoice.university}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Service Details */}
            <View style={styles.serviceSection}>
              <Text style={styles.sectionTitle}>Service Details</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.tableCellService]}>Service</Text>
                  <Text style={[styles.tableHeaderText, styles.tableCellPackage]}>Package</Text>
                  <Text style={[styles.tableHeaderText, styles.tableCellPrice]}>Price</Text>
                </View>
                
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellService]}>{serviceName || '-'}</Text>
                  <Text style={[styles.tableCell, styles.tableCellPackage]}>{packageName || '-'}</Text>
                  <Text style={[styles.tableCell, styles.tableCellPrice]}>Rp {formatPrice(originalPrice)}</Text>
                </View>
              </View>
            </View>

            {/* Payment Summary */}
            <View style={styles.paymentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>Rp {formatPrice(originalPrice)}</Text>
              </View>
              
              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.discountText]}>
                    Discount {discountPercentage > 0 ? `(${discountPercentage}%)` : ''}
                  </Text>
                  <Text style={[styles.summaryValue, styles.discountText]}>
                    - Rp {formatPrice(discountAmount)}
                  </Text>
                </View>
              )}
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {isDownPayment ? 'Down Payment (50%)' : 'Total Amount'}
                </Text>
                <Text style={styles.totalValue}>Rp {formatPrice(paymentAmount)}</Text>
              </View>
              
              {isDownPayment && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Remaining Payment</Text>
                  <Text style={styles.summaryValue}>Rp {formatPrice(remainingAmount)}</Text>
                </View>
              )}
            </View>

            {/* Payment Method */}
            {paymentMethod && (
              <View style={styles.paymentMethod}>
                <Text style={styles.paymentMethodTitle}>Payment Method</Text>
                <Text style={styles.paymentMethodValue}>
                  {paymentMethod === 'transfer' ? 'Bank Transfer' : 
                   paymentMethod === 'qris' ? 'QRIS' : 
                   paymentMethod === 'cash' ? 'Cash' : paymentMethod}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer - Positioned at bottom */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing Thirtys Studio!
          </Text>
          <Text style={styles.footerText}>
            Please bring this invoice on your session date.
          </Text>
          <Text style={styles.footerBold}>
            thirtyone.studio@gmail.com | www.thirtyone.studio
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PDFInvoice;