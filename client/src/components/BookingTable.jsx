import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Eye, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFInvoice from './PDFInvoice';
import api from '../services/api';
import { useToast } from '@/hooks/use-toast';

// Utility function untuk format harga
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
};

export default function BookingTable({ 
  bookings, 
  onUpdate, 
  selectedBookings = [], 
  onSelectBooking = () => {}, 
  onSelectAll = () => {} 
}) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Check if all bookings are selected
  const isAllSelected = bookings.length > 0 && selectedBookings.length === bookings.length;
  const isIndeterminate = selectedBookings.length > 0 && selectedBookings.length < bookings.length;

  // Convert booking data to invoice format
  const convertToInvoiceData = (booking) => {
    if (!booking) return null;

    return {
      inv_id: booking.booking_code,
      customer: booking.customer_name,
      due_date: booking.booking_date,
      discount: 0,
      downpayment: booking.payment_type === 'down_payment' ? booking.total_price * 0.5 : 0,
      note: `${booking.service_name} - ${booking.package_name}${booking.faculty ? ` | ${booking.faculty} - ${booking.university}` : ''}`,
      items: [
        {
          description: `${booking.service_name} - ${booking.package_name}`,
          price: booking.total_price.toString(),
        }
      ]
    };
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      toast({
        title: 'Success',
        description: 'Booking status updated',
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    try {
      await api.delete(`/bookings/${bookingId}`);
      toast({
        title: 'Success',
        description: 'Booking deleted',
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete booking',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'success',
      cancelled: 'destructive',
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const openDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead>Booking Code</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedBookings.includes(booking.id)}
                    onCheckedChange={(checked) => onSelectBooking(booking.id, checked)}
                    aria-label={`Select booking ${booking.booking_code}`}
                    className="translate-y-[2px]"
                  />
                </TableCell>
                <TableCell className="font-medium">{booking.booking_code}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{booking.customer_name}</p>
                    <p className="text-sm text-gray-500">{booking.phone_number}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{booking.service_name}</p>
                    <p className="text-sm text-gray-500">{booking.package_name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(booking.booking_date), 'dd MMM yyyy')}
                  {booking.start_time && (
                    <p className="text-sm text-gray-500">
                      {booking.start_time} - {booking.end_time}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  Rp {formatPrice(booking.total_price)}
                </TableCell>
                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetails(booking)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Select
                      defaultValue={booking.status}
                      onValueChange={(value) => updateBookingStatus(booking.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteBooking(booking.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Booking Details</DialogTitle>
              
              {/* PDF Download Button */}
              {selectedBooking && (
                <PDFDownloadLink
                  document={<PDFInvoice invoice={convertToInvoiceData(selectedBooking)} />}
                  fileName={`Invoice-${selectedBooking.booking_code}.pdf`}
                >
                  {({ blob, url, loading, error }) => (
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={loading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {loading ? 'Generating...' : 'Download Invoice'}
                    </Button>
                  )}
                </PDFDownloadLink>
              )}
            </div>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Name</p>
                      <p className="text-sm">{selectedBooking.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Phone</p>
                      <p className="text-sm">{selectedBooking.phone_number}</p>
                    </div>
                    {selectedBooking.faculty && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Faculty</p>
                        <p className="text-sm">{selectedBooking.faculty}</p>
                      </div>
                    )}
                    {selectedBooking.university && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">University</p>
                        <p className="text-sm">{selectedBooking.university}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Booking Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Booking Code</p>
                      <p className="text-sm font-mono">{selectedBooking.booking_code}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Service</p>
                      <p className="text-sm">{selectedBooking.service_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Package</p>
                      <p className="text-sm">{selectedBooking.package_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Date</p>
                      <p className="text-sm">{format(new Date(selectedBooking.booking_date), 'dd MMM yyyy')}</p>
                    </div>
                    {selectedBooking.start_time && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Time</p>
                        <p className="text-sm">{selectedBooking.start_time} - {selectedBooking.end_time}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Payment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Total Price</p>
                        <p className="text-lg font-semibold">Rp {formatPrice(selectedBooking.total_price)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Payment Type</p>
                        <p className="text-sm capitalize">{selectedBooking.payment_type?.replace('_', ' ')}</p>
                      </div>
                      {selectedBooking.payment_method && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Payment Method</p>
                          <p className="text-sm capitalize">{selectedBooking.payment_method}</p>
                        </div>
                      )}
                      {selectedBooking.selected_bank && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Bank</p>
                          <p className="text-sm">{selectedBooking.selected_bank}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Timestamps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Created</p>
                        <p className="text-sm">{format(new Date(selectedBooking.created_at), 'dd MMM yyyy, HH:mm')}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Updated</p>
                        <p className="text-sm">{format(new Date(selectedBooking.updated_at), 'dd MMM yyyy, HH:mm')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Proof - Full Width */}
              {selectedBooking.payment_proof && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Payment Proof</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img
                        src={`https://thirtys-code-production.up.railway.app/uploads/${selectedBooking.payment_proof}`}
                        alt="Payment Proof"
                        className="max-w-full h-auto max-h-96 rounded mx-auto block border"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden text-center text-gray-500 py-8">
                        <p className="mb-2">Payment proof image not available</p>
                        <p className="text-sm mb-4">File: {selectedBooking.payment_proof}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}