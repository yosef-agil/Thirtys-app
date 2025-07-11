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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Eye, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Utility function untuk format booking code
const formatBookingCode = (booking) => {
  // If already formatted as THIRTY format, return as is
  if (booking.display_code) {
    return booking.display_code;
  }
  
  // Generate display code based on ID
  const paddedId = String(booking.id).padStart(3, '0');
  return `THIRTY${paddedId}`;
};

export default function BookingTable({ 
  bookings = [], 
  onUpdate, 
  selectedBookings = [], 
  onSelectBooking = () => {}, 
  onSelectAll = () => {},
  currentPage = 1,
  totalPages = 1,
  totalBookings = 0,
  onPageChange = () => {},
  itemsPerPage = 10
}) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const { toast } = useToast();

  // Calculate display range
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalBookings);

  // Check if all bookings are selected
  const isAllSelected = bookings.length > 0 && selectedBookings.length === bookings.length;

  // Convert booking data to invoice format
  const convertToInvoiceData = (booking) => {
    if (!booking) return null;

    return {
      inv_id: formatBookingCode(booking),
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

  const handleDeleteClick = (booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookingToDelete) return;
    
    try {
      await api.delete(`/bookings/${bookingToDelete.id}`);
      toast({
        title: 'Success',
        description: 'Booking deleted',
      });
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
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

  // Mobile Card View Component
  const BookingCard = ({ booking }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-semibold text-lg">{formatBookingCode(booking)}</p>
            <p className="text-sm text-gray-600">{booking.customer_name}</p>
          </div>
          {getStatusBadge(booking.status)}
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-600">Service:</span>
            <p className="font-medium">{booking.service_name} - {booking.package_name}</p>
          </div>
          
          <div>
            <span className="text-gray-600">Date:</span>
            <p className="font-medium">
              {format(new Date(booking.booking_date), 'dd MMM yyyy')}
              {booking.start_time && ` (${booking.start_time} - ${booking.end_time})`}
            </p>
          </div>
          
          <div>
            <span className="text-gray-600">Total:</span>
            <p className="font-medium">Rp {formatPrice(booking.total_price)}</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDetails(booking)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Details
          </Button>
          <Select
            defaultValue={booking.status}
            onValueChange={(value) => updateBookingStatus(booking.id, value)}
          >
            <SelectTrigger className="flex-1">
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
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteClick(booking)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
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
                <TableHead className="w-32">Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBookings.includes(booking.id)}
                        onCheckedChange={(checked) => onSelectBooking(booking.id, checked)}
                        aria-label={`Select booking ${formatBookingCode(booking)}`}
                        className="translate-y-[2px]"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatBookingCode(booking)}
                    </TableCell>
                    <TableCell>{booking.customer_name}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate">{booking.service_name}</p>
                        <p className="text-sm text-gray-500 truncate">{booking.package_name}</p>
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
                    <TableCell className="text-right">
                      Rp {formatPrice(booking.total_price)}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {/* Status Dropdown */}
                        <Select
                          defaultValue={booking.status}
                          onValueChange={(value) => updateBookingStatus(booking.id, value)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* View Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetails(booking)}
                          className="h-8 w-8"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(booking)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete Booking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No bookings found
          </div>
        ) : (
          bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        )}
      </div>

      {/* Pagination Info & Controls */}
      {totalBookings > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <p className="text-sm text-gray-600">
            Showing {startItem}-{endItem} of {totalBookings} bookings
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the booking for {bookingToDelete?.customer_name}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Modal - Same as before but with formatted code */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Booking Details</DialogTitle>
              
              {selectedBooking && (
                <PDFDownloadLink
                  document={<PDFInvoice invoice={convertToInvoiceData(selectedBooking)} />}
                  fileName={`Invoice-${formatBookingCode(selectedBooking)}.pdf`}
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
                      <p className="text-sm font-mono">{formatBookingCode(selectedBooking)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Original Code</p>
                      <p className="text-sm font-mono text-gray-500">{selectedBooking.booking_code}</p>
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