import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Copy, 
  Check, 
  ChevronLeft,
  User,
  Phone,
  Camera,
  CalendarDays,
  CreditCard,
  Upload,
  Sparkles,
  Clock,
  Package,
  CheckCircle
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { cn } from '@/lib/utils';

// Utility function untuk format harga
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
};

// Progress Steps Component
const ProgressSteps = ({ currentStep, steps }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        
        {/* Steps */}
        {steps.map((step, index) => (
          <div key={index} className="relative flex flex-col items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 z-10 bg-white",
              index + 1 <= currentStep 
                ? "bg-blue-600 text-white shadow-lg scale-110 border-0" 
                : "bg-white text-gray-500 border-2 border-gray-300"
            )}>
              {index + 1 < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>
            <span className={cn(
              "text-xs mt-2 text-center hidden sm:block transition-colors duration-300",
              index + 1 <= currentStep ? "text-gray-900 font-medium" : "text-gray-400"
            )}>
              {step}
            </span>
          </div>
        ))}
      </div>
      
      {/* Mobile Step Indicator */}
      <div className="mt-4 text-center sm:hidden">
        <span className="text-sm font-medium text-gray-900">
          Step {currentStep}: {steps[currentStep - 1]}
        </span>
      </div>
    </div>
  );
};

// Package Card Component
const PackageCard = ({ pkg, selected, onSelect, discountPercentage }) => {
  const discountedPrice = discountPercentage > 0 
    ? pkg.price * (1 - discountPercentage / 100)
    : pkg.price;
    
  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
        selected 
          ? "border-blue-600 bg-blue-50 shadow-lg scale-[1.02]" 
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      )}
      onClick={() => onSelect(pkg.id.toString())}
    >
      {/* Selected Indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
      
      <h4 className="font-semibold text-gray-900">{pkg.package_name}</h4>
      <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
      
      <div className="mt-3">
        {discountPercentage > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">
              Rp {formatPrice(discountedPrice)}
            </span>
            <span className="text-sm text-gray-400 line-through">
              Rp {formatPrice(pkg.price)}
            </span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {discountPercentage}% OFF
            </Badge>
          </div>
        ) : (
          <span className="text-lg font-bold text-gray-900">
            Rp {formatPrice(pkg.price)}
          </span>
        )}
      </div>
    </div>
  );
};

// Time Slot Component
const TimeSlotCard = ({ slot, selected, onSelect }) => {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-300",
        selected
          ? "border-blue-600 bg-blue-50 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      )}
      onClick={() => onSelect(slot.id.toString())}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
        </div>
        <Badge 
          variant={slot.available_slots > 2 ? "secondary" : "destructive"}
          className={slot.available_slots > 2 ? "bg-green-100 text-green-700" : ""}
        >
          {slot.available_slots} left
        </Badge>
      </div>
    </div>
  );
};

// Bank Account Card Component
const BankAccountCard = ({ account, onCopy, copied }) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white",
          account.bank === 'BCA' ? "bg-blue-600" :
          account.bank === 'BRI' ? "bg-blue-500" : "bg-purple-600"
        )}>
          {account.bank}
        </div>
        <div>
          <p className="font-medium">{account.name}</p>
          <p className="text-sm text-gray-600 font-mono">{account.number}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onCopy(account.number, `${account.bank}-${account.number}`)}
      >
        {copied === `${account.bank}-${account.number}` ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

// Thank You Page Component
const ThankYouPage = ({ bookingCode }) => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Booking Confirmed!</h2>
      <p className="text-gray-600 mb-6">Thank you for choosing Thirtys Studio</p>
      
      <div className="bg-gray-50 rounded-xl p-6 max-w-sm mx-auto mb-8">
        <p className="text-sm text-gray-600 mb-2">Your booking code is</p>
        <p className="text-2xl font-bold text-blue-600 font-mono">{bookingCode}</p>
        <p className="text-sm text-gray-600 mt-3">
          We will contact you via WhatsApp within 24 hours to confirm your session.
        </p>
      </div>
      
      <Button
        onClick={() => navigate('/')}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Back to Home
      </Button>
    </div>
  );
};

// Dynamic schema remains the same
const createBookingSchema = (isGraduationPhoto) => {
  const baseSchema = {
    customerName: z.string().min(2, 'Name must be at least 2 characters'),
    phoneNumber: z.string().min(10, 'Valid phone number required'),
    serviceId: z.string().min(1, 'Please select a service'),
    packageId: z.string().min(1, 'Please select a package'),
    bookingDate: z.date(),
    timeSlotId: z.string().optional(),
    paymentType: z.enum(['down_payment', 'full_payment']),
    paymentMethod: z.enum(['qris', 'transfer', 'cash']),
    selectedBank: z.string().optional(),
    paymentProof: z.any().optional(),
  };

  if (isGraduationPhoto) {
    baseSchema.faculty = z.string().min(1, 'Faculty is required for graduation photography');
    baseSchema.university = z.string().min(1, 'University is required for graduation photography');
  } else {
    baseSchema.faculty = z.string().optional();
    baseSchema.university = z.string().optional();
  }

  return z.object(baseSchema);
};

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(1);
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
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const steps = ['Personal Info', 'Service', 'Schedule', 'Payment', 'Review'];

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
      
      setTimeout(() => setCopiedAccount(''), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const isGraduationPhotography = selectedService?.name === 'Graduation Photography';
  const isSelfPhoto = selectedService?.name === 'Self Photo';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: zodResolver(createBookingSchema(isGraduationPhotography)),
  });

  const watchService = watch('serviceId');
  const watchPackage = watch('packageId');
  const watchDate = watch('bookingDate');
  const watchPaymentType = watch('paymentType');
  const watchPaymentMethod = watch('paymentMethod');
  const watchPaymentProof = watch('paymentProof');

  useEffect(() => {
    loadServices();
  }, []);

  // Auto-set payment type for Self Photo
  useEffect(() => {
    if (isSelfPhoto) {
      setValue('paymentType', 'full_payment');
    }
  }, [isSelfPhoto, setValue]);

  useEffect(() => {
    if (watchService) {
      const service = services.find(s => s.id.toString() === watchService);
      setSelectedService(service);
      
      if (service?.packages) {
        setPackages(service.packages);
      } else {
        loadPackagesForService(watchService);
      }
    }
  }, [watchService, services]);

  const loadPackagesForService = async (serviceId) => {
    try {
      const packages = await bookingService.getPackagesByService(serviceId);
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
      const pkg = packages.find(p => p.id.toString() === watchPackage);
      
      if (pkg) {
        let originalPrice = pkg.price;
        
        // Apply discount if any
        let discountedPrice = originalPrice;
        if (selectedService?.discount_percentage) {
          discountedPrice = originalPrice * (1 - selectedService.discount_percentage / 100);
        }
        
        // Calculate payment amount based on type
        let paymentAmount = discountedPrice;
        if (watchPaymentType === 'down_payment') {
          paymentAmount = discountedPrice * 0.5;
        }
        
        setTotalPrice({
          originalPrice,
          discountedPrice,
          paymentAmount,
          paymentType: watchPaymentType,
          discountPercentage: selectedService?.discount_percentage || 0
        });
      }
    }
  }, [watchPackage, watchPaymentType, packages, selectedService]);

  // Handle payment proof preview
  useEffect(() => {
    if (watchPaymentProof && watchPaymentProof[0]) {
      const file = watchPaymentProof[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPaymentProofPreview(null);
    }
  }, [watchPaymentProof]);

  const loadServices = async () => {
    try {
      const data = await bookingService.getServices();
      
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

  // Navigation handlers
  const handleNext = async () => {
    let fieldsToValidate = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['customerName', 'phoneNumber'];
        break;
      case 2:
        fieldsToValidate = ['serviceId', 'packageId'];
        if (isGraduationPhotography) {
          fieldsToValidate.push('faculty', 'university');
        }
        break;
      case 3:
        fieldsToValidate = ['bookingDate'];
        if (selectedService?.has_time_slots) {
          fieldsToValidate.push('timeSlotId');
        }
        break;
      case 4:
        fieldsToValidate = ['paymentType', 'paymentMethod'];
        if (watch('paymentMethod') === 'transfer') {
          fieldsToValidate.push('paymentProof');
        }
        break;
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
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
      formData.append('paymentMethod', data.paymentMethod);
      
      // Optional fields
      if (data.timeSlotId) formData.append('timeSlotId', data.timeSlotId);
      if (data.faculty) formData.append('faculty', data.faculty);
      if (data.university) formData.append('university', data.university);
      if (data.selectedBank) formData.append('selectedBank', data.selectedBank);
      
      // File upload - only for transfer payments
      if (data.paymentMethod === 'transfer' && data.paymentProof && data.paymentProof[0]) {
        formData.append('paymentProof', data.paymentProof[0]);
      }

      const response = await bookingService.createBooking(formData);
      
      if (response.success) {
        setBookingCode(response.bookingCode);
        setShowThankYou(true);
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

  if (showThankYou) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6">
            <ThankYouPage bookingCode={bookingCode} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-blue-600">
              Thirtys Studio
            </h1>
            <div className="w-20" /> {/* Spacer for center alignment */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-0">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Book Your Session</h2>
              <p className="text-gray-600">Complete your booking in just a few steps</p>
            </div>
            
            {/* Progress Steps */}
            <ProgressSteps currentStep={currentStep} steps={steps} />
          </CardHeader>
          
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Let's get to know you</h3>
                    <p className="text-gray-600 mt-2">We'll need some basic information to get started</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customerName" className="text-base">Full Name</Label>
                      <Input
                        id="customerName"
                        {...register('customerName')}
                        placeholder="John Doe"
                        className="mt-2 h-12"
                      />
                      {errors.customerName && (
                        <p className="text-sm text-red-500 mt-1">{errors.customerName.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber" className="text-base">Phone Number</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <Input
                          id="phoneNumber"
                          {...register('phoneNumber')}
                          placeholder="+62 812 3456 7890"
                          className="pl-10 h-12"
                        />
                      </div>
                      {errors.phoneNumber && (
                        <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Choose Your Service</h3>
                    <p className="text-gray-600 mt-2">Select the perfect package for your needs</p>
                  </div>

                  {/* Service Selection */}
                  <div>
                    <Label className="text-base mb-3 block">Select Service</Label>
                    <div className="grid gap-3">
                      {services.map(service => (
                        <div key={service.id}>
                          <div
                            className={cn(
                              "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                              watchService === service.id.toString()
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => setValue('serviceId', service.id.toString())}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{service.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Starting from</p>
                                <p className="font-bold text-lg text-gray-900">
                                  Rp {formatPrice(service.base_price)}
                                </p>
                                {service.discount_percentage > 0 && (
                                  <Badge className="mt-1 bg-green-100 text-green-700">
                                    {service.discount_percentage}% OFF
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {service.has_time_slots && (
                              <Badge variant="outline" className="mt-2 gap-1">
                                <Clock className="h-3 w-3" />
                                Time slot booking
                              </Badge>
                            )}
                          </div>
                          
                          {/* Package Selection - Show immediately after service selection */}
                          {watchService === service.id.toString() && packages.length > 0 && (
                            <div className="mt-4 ml-4 animate-in slide-in-from-top duration-300">
                              <Label className="text-sm mb-2 block">Select Package</Label>
                              <div className="grid gap-3 sm:grid-cols-2">
                                {packages.map(pkg => (
                                  <PackageCard
                                    key={pkg.id}
                                    pkg={pkg}
                                    selected={watchPackage === pkg.id.toString()}
                                    onSelect={(id) => setValue('packageId', id)}
                                    discountPercentage={service.discount_percentage || 0}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors.serviceId && (
                      <p className="text-sm text-red-500 mt-1">{errors.serviceId.message}</p>
                    )}
                    {errors.packageId && watchService && (
                      <p className="text-sm text-red-500 mt-1">{errors.packageId.message}</p>
                    )}
                  </div>

                  {/* Graduation Fields */}
                  {isGraduationPhotography && watchPackage && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-xl animate-in slide-in-from-bottom duration-300">
                      <p className="text-sm font-medium text-blue-900">Additional Information Required</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="faculty">Faculty *</Label>
                          <Input
                            id="faculty"
                            {...register('faculty')}
                            placeholder="e.g., Faculty of Engineering"
                            className="mt-2"
                          />
                          {errors.faculty && (
                            <p className="text-sm text-red-500 mt-1">{errors.faculty.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="university">University *</Label>
                          <Input
                            id="university"
                            {...register('university')}
                            placeholder="e.g., University of Indonesia"
                            className="mt-2"
                          />
                          {errors.university && (
                            <p className="text-sm text-red-500 mt-1">{errors.university.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Schedule */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarDays className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Pick Your Date</h3>
                    <p className="text-gray-600 mt-2">When would you like to have your session?</p>
                  </div>

                  {/* Date and Time Slot Selection */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Date Selection */}
                    <div>
                      <Label className="text-base mb-3 block">Select Date</Label>
                      <div className="flex justify-center">
                        <Calendar
                          mode="single"
                          selected={watchDate}
                          onSelect={(date) => setValue('bookingDate', date)}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                      </div>
                      {errors.bookingDate && (
                        <p className="text-sm text-red-500 mt-1 text-center">{errors.bookingDate.message}</p>
                      )}
                    </div>

                    {/* Time Slot Selection - Show on right side for desktop */}
                    {selectedService?.has_time_slots && (
                      <div>
                        <Label className="text-base mb-3 block">Select Time Slot</Label>
                        {timeSlots.length > 0 ? (
                          <div className="grid gap-3">
                            {timeSlots.map(slot => (
                              <TimeSlotCard
                                key={slot.id}
                                slot={slot}
                                selected={watch('timeSlotId') === slot.id.toString()}
                                onSelect={(id) => setValue('timeSlotId', id)}
                              />
                            ))}
                          </div>
                        ) : watchDate ? (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No time slots available for this date</p>
                            <p className="text-sm mt-1">Please select another date</p>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <CalendarDays className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>Please select a date first</p>
                          </div>
                        )}
                        {errors.timeSlotId && (
                          <p className="text-sm text-red-500 mt-1">{errors.timeSlotId.message}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {watchDate && (
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Selected Date:</span>{' '}
                        {format(watchDate, 'EEEE, dd MMMM yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Payment */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Payment Details</h3>
                    <p className="text-gray-600 mt-2">Choose your preferred payment method</p>
                  </div>

                  {/* Payment Type - Conditional for Self Photo */}
                  {!isSelfPhoto && (
                    <div>
                      <Label className="text-base mb-3 block">Payment Type</Label>
                      <RadioGroup
                        value={watchPaymentType}
                        onValueChange={(value) => setValue('paymentType', value)}
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label
                            htmlFor="down_payment"
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                              watchPaymentType === 'down_payment'
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="down_payment" id="down_payment" />
                              <div>
                                <p className="font-medium">Down Payment</p>
                                <p className="text-sm text-gray-600">Pay 50% now</p>
                              </div>
                            </div>
                            <Badge variant="secondary">50%</Badge>
                          </label>
                          
                          <label
                            htmlFor="full_payment"
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                              watchPaymentType === 'full_payment'
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="full_payment" id="full_payment" />
                              <div>
                                <p className="font-medium">Full Payment</p>
                                <p className="text-sm text-gray-600">Pay 100% now</p>
                              </div>
                            </div>
                            <Badge variant="secondary">100%</Badge>
                          </label>
                        </div>
                      </RadioGroup>
                      {errors.paymentType && (
                        <p className="text-sm text-red-500 mt-1">{errors.paymentType.message}</p>
                      )}
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <Label className="text-base mb-3 block">Payment Method</Label>
                    <RadioGroup
                      value={watchPaymentMethod}
                      onValueChange={(value) => setValue('paymentMethod', value)}
                    >
                      <div className="grid gap-3">
                        <label
                          htmlFor="qris"
                          className="flex items-center justify-between p-4 rounded-xl border-2 cursor-not-allowed opacity-50 border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="qris" id="qris" disabled />
                            <div>
                              <p className="font-medium">QRIS</p>
                              <p className="text-sm text-gray-600">Scan and pay instantly</p>
                            </div>
                          </div>
                          <Badge variant="outline">Coming Soon</Badge>
                        </label>
                        
                        <label
                          htmlFor="transfer"
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                            watchPaymentMethod === 'transfer'
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="transfer" id="transfer" />
                            <div>
                              <p className="font-medium">Bank Transfer</p>
                              <p className="text-sm text-gray-600">Transfer to our bank account</p>
                            </div>
                          </div>
                        </label>
                        
                        <label
                          htmlFor="cash"
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                            watchPaymentMethod === 'cash'
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="cash" id="cash" />
                            <div>
                              <p className="font-medium">Cash</p>
                              <p className="text-sm text-gray-600">Pay when you arrive</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </RadioGroup>
                    {errors.paymentMethod && (
                      <p className="text-sm text-red-500 mt-1">{errors.paymentMethod.message}</p>
                    )}
                  </div>

                  {/* Bank Account Info - Show for transfer */}
                  {watchPaymentMethod === 'transfer' && watchPaymentType && (
                    <div>
                      <Label className="text-base mb-3 block">Bank Account Information</Label>
                      <div className="space-y-3">
                        {bankAccounts.map((account, index) => (
                          <BankAccountCard
                            key={index}
                            account={account}
                            onCopy={copyToClipboard}
                            copied={copiedAccount}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-blue-600 mt-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Please send payment proof via WhatsApp after transfer
                      </p>
                    </div>
                  )}

                  {/* Payment Proof Upload */}
                  {watchPaymentMethod === 'transfer' && (
                    <div>
                      <Label htmlFor="paymentProof" className="text-base mb-3 block">
                        Payment Proof *
                      </Label>
                      <div className="relative">
                        <input
                          id="paymentProof"
                          type="file"
                          {...register('paymentProof')}
                          accept="image/*"
                          className="hidden"
                        />
                        <label
                          htmlFor="paymentProof"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors"
                        >
                          {paymentProofPreview ? (
                            <div className="relative w-full h-full">
                              <img
                                src={paymentProofPreview}
                                alt="Payment proof preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                                <p className="text-white text-sm">Click to change</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">Click to upload payment proof</p>
                              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                            </>
                          )}
                        </label>
                      </div>
                      {errors.paymentProof && (
                        <p className="text-sm text-red-500 mt-1">{errors.paymentProof.message}</p>
                      )}
                    </div>
                  )}

                  {/* Cash Payment Notice */}
                  {watchPaymentMethod === 'cash' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm text-yellow-800">
                        <strong>Cash Payment:</strong> Please bring the exact amount on your session day.
                        We'll provide a receipt upon payment.
                      </p>
                    </div>
                  )}

                  {/* Price Summary */}
                  {totalPrice.paymentAmount > 0 && (
                    <Card className="bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Payment Summary</h4>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Package Price</span>
                            <span className="font-medium">Rp {formatPrice(totalPrice.originalPrice)}</span>
                          </div>
                          
                          {totalPrice.discountPercentage > 0 && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-green-600">Discount ({totalPrice.discountPercentage}%)</span>
                                <span className="font-medium text-green-600">
                                  -Rp {formatPrice(totalPrice.originalPrice - totalPrice.discountedPrice)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm pt-2 border-t">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">Rp {formatPrice(totalPrice.discountedPrice)}</span>
                              </div>
                            </>
                          )}
                          
                          <div className="border-t pt-3">
                            {totalPrice.paymentType === 'down_payment' ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="font-semibold">Down Payment (50%)</span>
                                  <span className="font-bold text-lg text-blue-600">
                                    Rp {formatPrice(totalPrice.paymentAmount)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 mt-1">
                                  <span>Remaining balance</span>
                                  <span>Rp {formatPrice(totalPrice.discountedPrice - totalPrice.paymentAmount)}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between">
                                <span className="font-semibold">Total Payment</span>
                                <span className="font-bold text-lg text-blue-600">
                                  Rp {formatPrice(totalPrice.paymentAmount)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Review Your Booking</h3>
                    <p className="text-gray-600 mt-2">Please check all details before confirming</p>
                  </div>

                  {/* Review Cards */}
                  <div className="space-y-4">
                    {/* Personal Info Review */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Name</span>
                          <span className="text-sm font-medium">{watch('customerName')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Phone</span>
                          <span className="text-sm font-medium">{watch('phoneNumber')}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Service Review */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Service Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Service</span>
                          <span className="text-sm font-medium">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Package</span>
                          <span className="text-sm font-medium">
                            {packages.find(p => p.id.toString() === watchPackage)?.package_name}
                          </span>
                        </div>
                        {isGraduationPhotography && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Faculty</span>
                              <span className="text-sm font-medium">{watch('faculty')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">University</span>
                              <span className="text-sm font-medium">{watch('university')}</span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Schedule Review */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Schedule
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Date</span>
                          <span className="text-sm font-medium">
                            {watchDate && format(watchDate, 'dd MMMM yyyy')}
                          </span>
                        </div>
                        {watch('timeSlotId') && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Time</span>
                            <span className="text-sm font-medium">
                              {timeSlots.find(s => s.id.toString() === watch('timeSlotId'))?.start_time} - 
                              {timeSlots.find(s => s.id.toString() === watch('timeSlotId'))?.end_time}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment Review */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Payment Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Type</span>
                          <span className="text-sm font-medium">
                            {watchPaymentType === 'down_payment' ? 'Down Payment (50%)' : 'Full Payment'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Method</span>
                          <span className="text-sm font-medium capitalize">{watchPaymentMethod}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-medium">Total to Pay</span>
                          <span className="font-bold text-lg text-blue-600">
                            Rp {formatPrice(totalPrice.paymentAmount)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-600">
                      By confirming this booking, you agree to our terms and conditions. 
                      We will contact you via WhatsApp to confirm your booking within 24 hours.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                
                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Floating Help Button */}
        <div className="fixed bottom-6 right-6">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-lg h-12 w-12"
            onClick={() => window.open('https://wa.me/6282371097483', '_blank')}
          >
            <Phone className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}