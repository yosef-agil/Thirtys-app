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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Eye, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '@/hooks/use-toast';

export default function BookingTable({ bookings, onUpdate }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

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

  const closeDetails = () => {
    setSelectedBooking(null);
    setDetailsOpen(false);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
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
                  Rp {booking.total_price.toLocaleString('id-ID')}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Booking Details
              <Button
                variant="ghost"
                size="sm"
                onClick={closeDetails}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-sm">{selectedBooking.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm">{selectedBooking.phone_number}</p>
                    </div>
                    {selectedBooking.faculty && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Faculty</p>
                        <p className="text-sm">{selectedBooking.faculty}</p>
                      </div>
                    )}
                    {selectedBooking.university && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">University</p>
                        <p className="text-sm">{selectedBooking.university}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Booking Code</p>
                      <p className="text-sm font-mono">{selectedBooking.booking_code}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Service</p>
                      <p className="text-sm">{selectedBooking.service_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Package</p>
                      <p className="text-sm">{selectedBooking.package_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-sm">{format(new Date(selectedBooking.booking_date), 'dd MMM yyyy')}</p>
                    </div>
                    {selectedBooking.start_time && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Time</p>
                        <p className="text-sm">{selectedBooking.start_time} - {selectedBooking.end_time}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Price</p>
                      <p className="text-lg font-semibold">Rp {selectedBooking.total_price.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Type</p>
                      <p className="text-sm capitalize">{selectedBooking.payment_type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  {/* Payment Proof */}
                  {selectedBooking.payment_proof && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Payment Proof</p>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <img
                          src={`/uploads/${selectedBooking.payment_proof}`}
                          alt="Payment Proof"
                          className="max-w-full h-auto max-h-96 rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden text-center text-gray-500 py-8">
                          <p>Payment proof image not available</p>
                          <p className="text-sm">File: {selectedBooking.payment_proof}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timestamps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-500">Created</p>
                      <p>{format(new Date(selectedBooking.created_at), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Updated</p>
                      <p>{format(new Date(selectedBooking.updated_at), 'dd MMM yyyy, HH:mm')}</p>
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