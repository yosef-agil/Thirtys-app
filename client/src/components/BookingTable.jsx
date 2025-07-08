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
import { format } from 'date-fns';
import api from '../services/api';
import { useToast } from '@/hooks/use-toast';

export default function BookingTable({ bookings, onUpdate }) {
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

  return (
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
  );
}