import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { bookingService } from '../services/bookingService';

const bookingSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  serviceId: z.string().min(1, 'Please select a service'),
  packageId: z.string().min(1, 'Please select a package'),
  bookingDate: z.date(),
  timeSlotId: z.string().optional(),
  faculty: z.string().optional(),
  university: z.string().optional(),
  paymentType: z.enum(['down_payment', 'full_payment']),
  paymentProof: z.any(),
});

export default function BookingPage() {
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
  });

  const watchService = watch('serviceId');
  const watchPackage = watch('packageId');
  const watchDate = watch('bookingDate');
  const watchPaymentType = watch('paymentType');

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (watchService) {
      const service = services.find(s => s.id.toString() === watchService);
      setSelectedService(service);
      setPackages(service?.packages || []);
    }
  }, [watchService, services]);

  useEffect(() => {
    if (watchService && watchDate && selectedService?.has_time_slots) {
      loadTimeSlots(watchService, format(watchDate, 'yyyy-MM-dd'));
    }
  }, [watchService, watchDate, selectedService]);

  useEffect(() => {
    if (watchPackage && watchPaymentType) {
      const pkg = packages.find(p => p.id.toString() === watchPackage);
      if (pkg) {
        let price = pkg.price;
        if (selectedService?.discount_percentage) {
          price = price * (1 - selectedService.discount_percentage / 100);
        }
        if (watchPaymentType === 'down_payment') {
          price = price * 0.5;
        }
        setTotalPrice(price);
      }
    }
  }, [watchPackage, watchPaymentType, packages, selectedService]);

  const loadServices = async () => {
    try {
      const data = await bookingService.getServices();
      setServices(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive',
      });
    }
  };

  const loadTimeSlots = async (serviceId, date) => {
    try {
      const data = await bookingService.getTimeSlots(serviceId, date);
      setTimeSlots(data);
    } catch (error) {
      console.error('Failed to load time slots:', error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (key === 'bookingDate') {
        formData.append(key, format(data[key], 'yyyy-MM-dd'));
      } else if (key === 'paymentProof') {
        if (data[key] && data[key][0]) {
          formData.append(key, data[key][0]);
        }
      } else if (data[key]) {
        formData.append(key, data[key]);
      }
    });

    try {
      await bookingService.createBooking(formData);
      toast({
        title: 'Booking Successful!',
        description: 'We will contact you via WhatsApp soon.',
      });
      // Reset form or redirect
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create booking',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isGraduationPhotography = selectedService?.name === 'Graduation Photography';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Book Your Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Name */}
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input
                  id="customerName"
                  {...register('customerName')}
                  placeholder="Enter your full name"
                />
                {errors.customerName && (
                  <p className="text-sm text-red-500">{errors.customerName.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  {...register('phoneNumber')}
                  placeholder="+62 xxx xxxx xxxx"
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                )}
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <Label>Service</Label>
                <Select onValueChange={(value) => setValue('serviceId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name}
                        {service.discount_percentage > 0 && (
                          <span className="text-green-600 ml-2">
                            ({service.discount_percentage}% OFF)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.serviceId && (
                  <p className="text-sm text-red-500">{errors.serviceId.message}</p>
                )}
              </div>

              {/* Package Selection */}
              {packages.length > 0 && (
                <div className="space-y-2">
                  <Label>Package</Label>
                  <Select onValueChange={(value) => setValue('packageId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map(pkg => (
                        <SelectItem key={pkg.id} value={pkg.id.toString()}>
                          {pkg.package_name} - Rp {pkg.price.toLocaleString('id-ID')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.packageId && (
                    <p className="text-sm text-red-500">{errors.packageId.message}</p>
                  )}
                </div>
              )}

              {/* Graduation Fields */}
              {isGraduationPhotography && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty</Label>
                    <Input
                      id="faculty"
                      {...register('faculty')}
                      placeholder="Enter your faculty"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Input
                      id="university"
                      {...register('university')}
                      placeholder="Enter your university"
                    />
                  </div>
                </>
              )}

              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Booking Date</Label>
                <Calendar
                  mode="single"
                  selected={watchDate}
                  onSelect={(date) => setValue('bookingDate', date)}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
                {errors.bookingDate && (
                  <p className="text-sm text-red-500">{errors.bookingDate.message}</p>
                )}
              </div>

              {/* Time Slot Selection */}
              {timeSlots.length > 0 && (
                <div className="space-y-2">
                  <Label>Time Slot</Label>
                  <Select onValueChange={(value) => setValue('timeSlotId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {slot.start_time} - {slot.end_time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Payment Type */}
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select onValueChange={(value) => setValue('paymentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="down_payment">Down Payment (50%)</SelectItem>
                    <SelectItem value="full_payment">Full Payment</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentType && (
                  <p className="text-sm text-red-500">{errors.paymentType.message}</p>
                )}
              </div>

              {/* Payment Proof */}
              <div className="space-y-2">
                <Label htmlFor="paymentProof">Payment Proof</Label>
                <Input
                  id="paymentProof"
                  type="file"
                  {...register('paymentProof')}
                  accept="image/*"
                />
                {errors.paymentProof && (
                  <p className="text-sm text-red-500">{errors.paymentProof.message}</p>
                )}
              </div>

              {/* Total Price */}
              {totalPrice > 0 && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-lg font-semibold">
                    Total Price: Rp {totalPrice.toLocaleString('id-ID')}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : 'Submit Booking'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}