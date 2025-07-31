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
import { 
  Eye, 
  Download, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  Phone,
  CreditCard,
  FileText,
  Clock,
  MapPin,
  Building2,
  AlertCircle
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFInvoice from './PDFInvoice';
import api from '../services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  if (booking.display_code) {
    return booking.display_code;
  }
  const paddedId = String(booking.id).padStart(3, '0');
  return `THIRTY${paddedId}`;
};

// Modern Info Row Component
const InfoRow = ({ icon: Icon, label, value, className }) => {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="mt-0.5">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5 break-words">{value || '-'}</p>
      </div>
    </div>
  );
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
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    
    return (
      <Badge 
        variant="outline" 
        className={cn("capitalize font-medium", styles[status] || styles.pending)}
      >
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
    <Card className="mb-4 hover:shadow-md transition-all duration-200">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-semibold text-lg text-gray-900">{formatBookingCode(booking)}</p>
            <p className="text-sm text-gray-600 mt-1">{booking.customer_name}</p>
          </div>
          {getStatusBadge(booking.status)}
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="h-4 w-4" />
            <span className="font-medium">{booking.service_name}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(booking.booking_date), 'dd MMM yyyy')}
              {booking.start_time && ` • ${booking.start_time.slice(0, 5)}`}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-600" />
            <span className="font-semibold text-gray-900">
              Rp {formatPrice(booking.total_price)}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDetails(booking)}
            className="flex-1 rounded-lg"
          >
            <Eye className="h-4 w-4 mr-1" />
            Details
          </Button>
          <Select
            defaultValue={booking.status}
            onValueChange={(value) => updateBookingStatus(booking.id, value)}
          >
            <SelectTrigger className="flex-1 h-9 rounded-lg">
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
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9"
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
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                  />
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Code</TableHead>
                <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                <TableHead className="font-semibold text-gray-700">Service</TableHead>
                <TableHead className="font-semibold text-gray-700">Date & Time</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Amount</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No bookings found</p>
                      <p className="text-sm text-gray-400">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedBookings.includes(booking.id)}
                        onCheckedChange={(checked) => onSelectBooking(booking.id, checked)}
                        aria-label={`Select booking ${formatBookingCode(booking)}`}
                        className="translate-y-[2px]"
                      />
                    </TableCell>
                    <TableCell className="font-medium font-mono text-blue-600">
                      {formatBookingCode(booking)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{booking.customer_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{booking.phone_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{booking.service_name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{booking.package_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-gray-900">{format(new Date(booking.booking_date), 'dd MMM yyyy')}</p>
                        {booking.start_time && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className="font-medium">
                          Rp {formatPrice(booking.total_price)}
                        </p>
                        {booking.discount_amount > 0 && (
                          <p className="text-xs text-green-600">
                            -Rp {formatPrice(booking.discount_amount)} (Promo)
                          </p>
                        )}
                        {booking.payment_type === 'down_payment' && (
                          <Badge variant="outline" className="text-xs">
                            DP 50%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Select
                          defaultValue={booking.status}
                          onValueChange={(value) => updateBookingStatus(booking.id, value)}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs rounded-lg">
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
                          onClick={() => openDetails(booking)}
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
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
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No bookings found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              </div>
            </CardContent>
          </Card>
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
            Showing <span className="font-medium">{startItem}-{endItem}</span> of{' '}
            <span className="font-medium">{totalBookings}</span> bookings
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1.5 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {/* Page Numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={i}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={cn(
                      "w-9 h-9 p-0 rounded-lg",
                      pageNum === currentPage && "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1.5 rounded-lg"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  This will permanently delete the booking for{' '}
                  <span className="font-medium text-gray-900">
                    {bookingToDelete?.customer_name}
                  </span>
                  . This action cannot be undone.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Delete Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <DialogTitle className="text-xl">Booking Details</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedBooking && formatBookingCode(selectedBooking)}
                </p>
              </div>
              
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
                      className="rounded-lg gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {loading ? 'Generating...' : 'Download Invoice'}
                    </Button>
                  )}
                </PDFDownloadLink>
              )}
            </div>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6 mt-6">
              {/* Customer Info */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-0 shadow-sm bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow icon={User} label="Full Name" value={selectedBooking.customer_name} />
                    <InfoRow icon={Phone} label="Phone Number" value={selectedBooking.phone_number} />
                    {selectedBooking.faculty && (
                      <InfoRow icon={Building2} label="Faculty" value={selectedBooking.faculty} />
                    )}
                    {selectedBooking.university && (
                      <InfoRow icon={MapPin} label="University" value={selectedBooking.university} />
                    )}
                  </CardContent>
                </Card>

                {/* Booking Info */}
                <Card className="border-0 shadow-sm bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Booking Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                    <InfoRow icon={FileText} label="Service" value={selectedBooking.service_name} />
                    <InfoRow icon={FileText} label="Package" value={selectedBooking.package_name} />
                    <InfoRow 
                      icon={Calendar} 
                      label="Date" 
                      value={format(new Date(selectedBooking.booking_date), 'EEEE, dd MMMM yyyy')} 
                    />
                    {selectedBooking.start_time && (
                      <InfoRow 
                        icon={Clock} 
                        label="Time Slot" 
                        value={`${selectedBooking.start_time} - ${selectedBooking.end_time}`} 
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payment Details */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">
                        Rp {formatPrice(selectedBooking.total_price)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Payment Type</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {selectedBooking.payment_type?.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {selectedBooking.payment_method || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedBooking.selected_bank && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Bank</p>
                      <p className="font-semibold text-gray-900">{selectedBooking.selected_bank}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Proof */}
              {selectedBooking.payment_proof && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Payment Proof
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                      <img
                        src={`https://thirtys-code-production.up.railway.app/uploads/${selectedBooking.payment_proof}`}
                        alt="Payment Proof"
                        className="max-w-full h-auto max-h-96 rounded-lg mx-auto block"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-2">Payment proof not available</p>
                        <p className="text-sm text-gray-400">File: {selectedBooking.payment_proof}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <Card className="border-0 shadow-sm bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Booking Created</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(selectedBooking.created_at), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(selectedBooking.updated_at), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Original Booking Code</p>
                      <p className="font-medium font-mono text-gray-900">
                        {selectedBooking.booking_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Display Code</p>
                      <p className="font-medium font-mono text-gray-900">
                        {formatBookingCode(selectedBooking)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}