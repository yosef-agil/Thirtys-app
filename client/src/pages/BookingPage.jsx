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
import { Copy, Check } from 'lucide-react';
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
  const [totalPrice, setTotalPrice] = useState({
    originalPrice: 0,
    discountedPrice: 0,
    paymentAmount: 0,
    paymentType: '',
    discountPercentage: 0
  });
  const [loading, setLoading] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate(); // TAMBAHKAN INI

  // Bank accounts data
  const bankAccounts = [
    { bank: 'BCA', number: '580201024795533', name: 'Nadhita Crisya' },
    { bank: 'BRI', number: '0132189968', name: 'Nadhita Crisya' },
    { bank: 'JAGO', number: '102328996443', name: 'Yosef Agil' },
  ];

  const copyToClipboard = async (text, accountKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccount(accountKey);
      toast({
        title: 'Copied!',
        description: `Account number ${text} copied to clipboard`,
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedAccount(''), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

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
        let originalPrice = pkg.price;
        console.log('Original price:', originalPrice); // Debug log
        
        // Apply discount if any
        let discountedPrice = originalPrice;
        if (selectedService?.discount_percentage) {
          discountedPrice = originalPrice * (1 - selectedService.discount_percentage / 100);
          console.log('Price after discount:', discountedPrice); // Debug log
        }
        
        // Calculate payment amount based on type
        let paymentAmount = discountedPrice;
        if (watchPaymentType === 'down_payment') {
          paymentAmount = discountedPrice * 0.5;
          console.log('Down payment amount:', paymentAmount); // Debug log
        }
        
        setTotalPrice({
          originalPrice,
          discountedPrice,
          paymentAmount,
          paymentType: watchPaymentType,
          discountPercentage: selectedService?.discount_percentage || 0
        });
        console.log('Final price object:', { originalPrice, discountedPrice, paymentAmount }); // Debug log
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
                    <SelectContent className="animate-none">
                      {timeSlots.map(slot => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          <div className="flex justify-between items-center w-full">
                            <span>{slot.start_time} - {slot.end_time}</span>
                            <span className="text-sm text-gray-500 ml-4">
                              ({slot.available_slots}/{slot.max_capacity} available)
                            </span>
                          </div>
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

              {/* Bank Account Information */}
              {watchPaymentType && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base text-blue-800">Bank Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {bankAccounts.map((account, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{account.bank}</p>
                          <p className="text-xs text-gray-600">{account.number} - {account.name}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(account.number, `${account.bank}-${account.number}`)}
                          className="ml-2"
                        >
                          {copiedAccount === `${account.bank}-${account.number}` ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-blue-600 mt-2 italic">
                      *Wajib mengirimkan bukti pembayaran ke WhatsApp admin setelah transfer
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Debug Panel - Hapus setelah testing */}
              {/* <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <p><strong>Debug Info:</strong></p>
                <p>Services loaded: {services.length}</p>
                <p>Selected service ID: {watchService || 'None'}</p>
                <p>Selected service: {selectedService?.name || 'None'}</p>
                <p>Packages available: {packages.length}</p>
                <p>Selected package ID: {watchPackage || 'None'}</p>
                <p>Payment type: {watchPaymentType || 'None'}</p>
                <p>Total price object: {JSON.stringify(totalPrice)}</p>
                <p>Form errors: {Object.keys(errors).length > 0 ? Object.keys(errors).join(', ') : 'None'}</p>
              </div> */}

              {/* Price Summary */}
              {totalPrice.paymentAmount > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Package Price:</span>
                      <span>Rp {totalPrice.originalPrice.toLocaleString('id-ID')}</span>
                    </div>
                    
                    {totalPrice.discountPercentage > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({totalPrice.discountPercentage}%):</span>
                        <span>-Rp {(totalPrice.originalPrice - totalPrice.discountedPrice).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    
                    {totalPrice.discountPercentage > 0 && (
                      <div className="flex justify-between border-t pt-2">
                        <span>After Discount:</span>
                        <span>Rp {totalPrice.discountedPrice.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      {totalPrice.paymentType === 'down_payment' ? (
                        <>
                          <div className="flex justify-between font-semibold text-lg text-blue-600">
                            <span>Down Payment (50%):</span>
                            <span>Rp {totalPrice.paymentAmount.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mt-1">
                            <span>Remaining Payment:</span>
                            <span>Rp {(totalPrice.discountedPrice - totalPrice.paymentAmount).toLocaleString('id-ID')}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between font-semibold text-lg text-green-600">
                          <span>Full Payment:</span>
                          <span>Rp {totalPrice.paymentAmount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Old Total Price - Keep for backward compatibility */}
              {/* Old Total Price - Keep for backward compatibility */}
              {totalPrice.paymentAmount > 0 && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-lg font-semibold">
                    You Pay Now: Rp {totalPrice.paymentAmount.toLocaleString('id-ID')}
                  </p>
                  {totalPrice.paymentType === 'down_payment' && (
                    <p className="text-sm text-gray-600 mt-1">
                      (Remaining: Rp {(totalPrice.discountedPrice - totalPrice.paymentAmount).toLocaleString('id-ID')})
                    </p>
                  )}
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