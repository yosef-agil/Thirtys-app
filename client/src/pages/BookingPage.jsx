import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // HANYA TAMBAHKAN INI
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
  const navigate = useNavigate(); // TAMBAHKAN INI

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
      console.log('Service changed to:', watchService); // Debug log
      const service = services.find(s => s.id.toString() === watchService);
      console.log('Found service:', service); // Debug log
      
      setSelectedService(service);
      
      if (service?.packages) {
        console.log('Setting packages:', service.packages); // Debug log
        setPackages(service.packages);
      } else {
        // Fallback: load packages separately
        loadPackagesForService(watchService);
      }
    }
  }, [watchService, services]);

  const loadPackagesForService = async (serviceId) => {
    try {
      const packages = await bookingService.getPackagesByService(serviceId);
      console.log('Loaded packages for service:', packages); // Debug log
      setPackages(packages);
    } catch (error) {
      console.error('Failed to load packages for service:', error);
      setPackages([]);
    }
  };

  useEffect(() => {
    if (watchService && watchDate && selectedService?.has_time_slots) {
      loadTimeSlots(watchService, format(watchDate, 'yyyy-MM-dd'));
    }
  }, [watchService, watchDate, selectedService]);

  useEffect(() => {
    if (watchPackage && watchPaymentType) {
      console.log('Calculating price for package:', watchPackage, 'payment type:', watchPaymentType); // Debug log
      const pkg = packages.find(p => p.id.toString() === watchPackage);
      console.log('Found package:', pkg); // Debug log
      
      if (pkg) {
        let price = pkg.price;
        console.log('Base price:', price); // Debug log
        
        if (selectedService?.discount_percentage) {
          price = price * (1 - selectedService.discount_percentage / 100);
          console.log('Price after discount:', price); // Debug log
        }
        
        if (watchPaymentType === 'down_payment') {
          price = price * 0.5;
          console.log('Price after down payment:', price); // Debug log
        }
        
        setTotalPrice(price);
        console.log('Final total price:', price); // Debug log
      }
    }
  }, [watchPackage, watchPaymentType, packages, selectedService]);

  const loadServices = async () => {
    try {
      const data = await bookingService.getServices();
      console.log('Loaded services:', data); // Debug log
      
      // Pastikan services memiliki packages
      const servicesWithPackages = await Promise.all(
        data.map(async (service) => {
          try {
            const packages = await bookingService.getPackagesByService(service.id);
            return { ...service, packages };
          } catch (error) {
            console.error(`Failed to load packages for service ${service.id}:`, error);
            return { ...service, packages: [] };
          }
        })
      );
      
      console.log('Services with packages:', servicesWithPackages); // Debug log
      setServices(servicesWithPackages);
    } catch (error) {
      console.error('Failed to load services:', error);
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
  
  try {
    const formData = new FormData();
    
    // Add all fields to FormData
    formData.append('customerName', data.customerName);
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('serviceId', data.serviceId);
    formData.append('packageId', data.packageId);
    formData.append('bookingDate', format(data.bookingDate, 'yyyy-MM-dd'));
    formData.append('paymentType', data.paymentType);
    
    // Optional fields
    if (data.timeSlotId) formData.append('timeSlotId', data.timeSlotId);
    if (data.faculty) formData.append('faculty', data.faculty);
    if (data.university) formData.append('university', data.university);
    
    // File upload
    if (data.paymentProof && data.paymentProof[0]) {
      formData.append('paymentProof', data.paymentProof[0]);
    }

    const response = await bookingService.createBooking(formData);
    
    if (response.success) {
      toast({
        title: 'Booking Successful!',
        description: `Your booking code is ${response.bookingCode}. We will contact you via WhatsApp soon.`,
      });
      
      // Reset form or redirect
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
    } catch (error) {
        console.error('Booking error:', error);
        toast({
        title: 'Error',
        description: error.message || 'Failed to create booking',
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

              {/* Debug Panel - Hapus setelah testing */}
              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <p><strong>Debug Info:</strong></p>
                <p>Services loaded: {services.length}</p>
                <p>Selected service ID: {watchService || 'None'}</p>
                <p>Selected service: {selectedService?.name || 'None'}</p>
                <p>Packages available: {packages.length}</p>
                <p>Selected package ID: {watchPackage || 'None'}</p>
                <p>Payment type: {watchPaymentType || 'None'}</p>
                <p>Total price: {totalPrice}</p>
                <p>Form errors: {Object.keys(errors).length > 0 ? Object.keys(errors).join(', ') : 'None'}</p>
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