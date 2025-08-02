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
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Copy, 
  Check, 
  ChevronLeft,
  Upload,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  CreditCard,
  User2,
  Phone,
  MapPin,
  Building2
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { cn } from '@/lib/utils';
import api from '../services/api';

// Utility function untuk format harga
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
};

// Modern Progress Component
const ModernProgress = ({ currentStep, totalSteps }) => {
  return (
    <div className="relative mb-12">
      {/* Progress Line */}
      <div className="absolute top-2.5 left-0 right-0 h-0.5 bg-gray-100">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      
      {/* Steps */}
      <div className="relative flex justify-between">
        {[...Array(totalSteps)].map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 bg-white border-2",
              index + 1 <= currentStep 
                ? "border-blue-600 text-blue-600" 
                : "border-gray-200 text-gray-400"
            )}>
              {index + 1 < currentStep ? (
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Service Selection Card
const ServiceCard = ({ service, selected, onSelect, packages, onPackageSelect, selectedPackageId }) => {
  return (
    <div className="mb-4">
      <div
        className={cn(
          "p-6 rounded-2xl border cursor-pointer transition-all duration-300 bg-white",
          selected 
            ? "border-blue-500 shadow-lg shadow-blue-100" 
            : "border-gray-100 hover:border-gray-200 hover:shadow-md"
        )}
        onClick={() => onSelect(service.id.toString())}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h4>
            <p className="text-sm text-gray-500 mb-3">{service.description}</p>
            {service.has_time_slots && (
              <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                Time slot booking
              </div>
            )}
          </div>
          <div className="text-right ml-4">
            <p className="text-xs text-gray-500 mb-1">Starting from</p>
            <p className="text-xl font-bold text-gray-900">
              Rp {formatPrice(service.base_price)}
            </p>
            {service.discount_percentage > 0 && (
              <Badge className="mt-2 bg-emerald-50 text-emerald-700 border-0">
                {service.discount_percentage}% OFF
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Package Selection */}
      {selected && packages.length > 0 && (
        <div className="mt-4 pl-4 border-l-2 border-blue-100 ml-3 animate-in slide-in-from-top duration-300">
          <p className="text-sm font-medium text-gray-700 mb-3">Choose your package</p>
          <div className="grid gap-3">
            {packages.map(pkg => (
              <label
                key={pkg.id}
                className={cn(
                  "relative p-4 rounded-xl border cursor-pointer transition-all duration-200",
                  selectedPackageId === pkg.id.toString()
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onPackageSelect(pkg.id.toString());
                }}
              >
                <input
                  type="radio"
                  name="package"
                  value={pkg.id}
                  className="sr-only"
                />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{pkg.package_name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{pkg.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    {service.discount_percentage > 0 ? (
                      <div>
                        <p className="text-lg font-bold text-blue-600">
                          Rp {formatPrice(pkg.price * (1 - service.discount_percentage / 100))}
                        </p>
                        <p className="text-ss text-gray-400 line-through">
                          Rp {formatPrice(pkg.price)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        Rp {formatPrice(pkg.price)}
                      </p>
                    )}
                  </div>
                </div>
                {selectedPackageId === pkg.id.toString() && (
                  <div className="absolute inset-0 border-2 border-blue-600 rounded-xl pointer-events-none"></div>
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Time Slot Selection
const TimeSlotGrid = ({ slots, selected, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
      {slots.map(slot => {
        // Calculate available slots
        const availableSlots = slot.max_capacity - (slot.current_bookings || 0);
        const isAvailable = availableSlots > 0;
        
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => isAvailable && onSelect(slot.id.toString())}
            disabled={!isAvailable}
            className={cn(
              "p-2.5 sm:p-3 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200",
              selected === slot.id.toString()
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : isAvailable
                  ? "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                  : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
            )}
          >
            <div className="text-center">
              <p className="font-semibold">
                {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
              </p>
              <p className="text-xs mt-0.5 sm:mt-1 opacity-75">
                {isAvailable ? `${availableSlots} slots left` : 'Fully booked'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// Modern Input Component
const ModernInput = ({ label, icon: Icon, error, required, ...props }) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
        <Input
          className={cn(
            "h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all",
            Icon && "pl-10",
            error && "border-red-300"
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

// Payment Method Card
const PaymentMethodCard = ({ method, selected, onSelect }) => {
  const icons = {
    qris: '🔲',
    transfer: '🏦',
    cash: '💵'
  };
  
  const labels = {
    qris: 'QRIS',
    transfer: 'Bank Transfer',
    cash: 'Cash'
  };
  
  const descriptions = {
    qris: 'Scan and pay instantly',
    transfer: 'Transfer to our bank account',
    cash: 'Pay when you arrive'
  };
  
  return (
    <label
      className={cn(
        "relative flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200",
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      )}
    >
      <input
        type="radio"
        name="paymentMethod"
        value={method}
        className="sr-only"
        onChange={() => onSelect(method)}
      />
      <div className="flex items-center flex-1">
        <span className="text-2xl mr-3">{icons[method]}</span>
        <div>
          <p className="font-medium text-gray-900">{labels[method]}</p>
          <p className="text-sm text-gray-500">{descriptions[method]}</p>
        </div>
      </div>
      {selected && (
        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </label>
  );
};

// Thank You Page Component
const ThankYouPage = ({ bookingDetails }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Booking Confirmed!</h1>
          <p className="text-gray-600">Thank you for choosing Thirtys Studio</p>
        </div>
        
        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">Kode booking kamu!</p>
              <p className="text-2xl font-bold text-blue-600 font-mono bg-blue-50 py-3 px-4 rounded-lg">
                {bookingDetails.bookingCode}
              </p>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer</span>
                <span className="font-medium">{bookingDetails.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Service</span>
                <span className="font-medium">{bookingDetails.serviceName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Package</span>
                <span className="font-medium">{bookingDetails.packageName}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm font-medium">Total Payment</span>
                <span className="text-xl font-bold text-blue-600">
                  Rp {formatPrice(bookingDetails.totalAmount)}
                </span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                Screenshot kode booking ini untuk di perlihatkan saat sesi foto berlangsung dan juga kami akan menghubungi via WhatsApp untuk konfirmasi sesi foto kamu. Terima kasih!
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Button
          onClick={() => navigate('/')}
          className="w-full mt-6 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg shadow-blue-200"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

// Dynamic schema
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
    baseSchema.faculty = z.string().min(1, 'Faculty is required');
    baseSchema.university = z.string().min(1, 'University is required');
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
  const [bookingDetails, setBookingDetails] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState(''); // NEW
  const [promoValidation, setPromoValidation] = useState(null); // NEW
  const [isValidatingPromo, setIsValidatingPromo] = useState(false); // NEW

  const steps = 4;

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
    clearErrors,
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

  //  Tambahkan function untuk validate promo code
// Update fungsi validatePromoCode di BookingPage.jsx

const validatePromoCode = async () => {
  if (!promoCode.trim()) {
    setPromoValidation(null);
    return;
  }

  setIsValidatingPromo(true);
  try {
    // Debug log
    console.log('Validating promo code:', {
      code: promoCode,
      service_id: watchService,
      phone_number: watch('phoneNumber'),
      booking_date: watch('bookingDate') // Add booking date
    });

    const response = await api.post('/promo-codes/validate', {
      code: promoCode.toUpperCase(),
      service_id: watchService,
      phone_number: watch('phoneNumber'),
      booking_date: watch('bookingDate') ? format(watch('bookingDate'), 'yyyy-MM-dd') : null // Send booking date
    });

    console.log('Promo validation response:', response.data);

    if (response.data.success) {
      setPromoValidation({
        valid: true,
        data: response.data.promoCode,
        message: `Promo applied! You get ${
          response.data.promoCode.discount_type === 'percentage' 
            ? `${response.data.promoCode.discount_value}% off` 
            : `Rp ${formatPrice(response.data.promoCode.discount_value)} off`
        }`
      });
    }
  } catch (error) {
    console.error('Promo validation error:', error.response?.data);
    setPromoValidation({
      valid: false,
      message: error.response?.data?.error || 'Invalid promo code'
    });
  } finally {
    setIsValidatingPromo(false);
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
        let discountedPrice = originalPrice;
        
        // Apply service discount
        if (selectedService?.discount_percentage) {
          discountedPrice = originalPrice * (1 - selectedService.discount_percentage / 100);
        }
        
        // Apply promo code discount
        let promoDiscountAmount = 0;
        if (promoValidation?.valid) {
          if (promoValidation.data.discount_type === 'percentage') {
            promoDiscountAmount = discountedPrice * (promoValidation.data.discount_value / 100);
          } else {
            promoDiscountAmount = Math.min(promoValidation.data.discount_value, discountedPrice);
          }
          discountedPrice -= promoDiscountAmount;
        }
        
        let paymentAmount = discountedPrice;
        if (watchPaymentType === 'down_payment') {
          paymentAmount = discountedPrice * 0.5;
        }
        
        setTotalPrice({
          originalPrice,
          discountedPrice,
          paymentAmount,
          promoDiscountAmount, // NEW
          paymentType: watchPaymentType,
          discountPercentage: selectedService?.discount_percentage || 0
        });
      }
    }
  }, [watchPackage, watchPaymentType, packages, selectedService, promoValidation]);

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
      
      // Data should include max_capacity and current_bookings for each slot
      console.log('Time slots loaded:', data);
      setTimeSlots(data);
    } catch (error) {
      console.error('Failed to load time slots:', error);
      setTimeSlots([]);
    }
  };

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
      
      // Manual validation for payment proof
      const paymentMethod = watch('paymentMethod');
      const paymentProof = watch('paymentProof');
      
      if ((paymentMethod === 'transfer' || paymentMethod === 'qris')) {
        if (!paymentProof || paymentProof.length === 0) {
          toast({
            title: 'Payment Proof Required',
            description: 'Please upload payment proof for your transaction',
            variant: 'destructive',
          });
          return;
        }
        
        // Validate file size and type
        const file = paymentProof[0];
        if (file.size > 5000000) {
          toast({
            title: 'File too large',
            description: 'File size must be less than 5MB',
            variant: 'destructive',
          });
          return;
        }
        
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
          toast({
            title: 'Invalid file type',
            description: 'Only JPG, JPEG & PNG files are accepted',
            variant: 'destructive',
          });
          return;
        }
      }
      break;
  }
  
  const isValid = await trigger(fieldsToValidate);
  if (isValid) {
    if (currentStep === steps) {
      handleSubmit(onSubmit)();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps));
    }
  }
};

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    if (loading) return;

    setLoading(true);
  
      try {
        const formData = new FormData();
        
        formData.append('customerName', data.customerName);
        formData.append('phoneNumber', data.phoneNumber);
        formData.append('serviceId', data.serviceId);
        formData.append('packageId', data.packageId);
        formData.append('bookingDate', format(data.bookingDate, 'yyyy-MM-dd'));
        formData.append('paymentType', data.paymentType);
        formData.append('paymentMethod', data.paymentMethod);
        
        // Add promo code if valid
        if (promoValidation?.valid) {
              formData.append('promoCode', promoCode);
            }

        if (data.timeSlotId) formData.append('timeSlotId', data.timeSlotId);
        if (data.faculty) formData.append('faculty', data.faculty);
        if (data.university) formData.append('university', data.university);
        if (data.selectedBank) formData.append('selectedBank', data.selectedBank);
        
        // Payment proof required for QRIS and transfer
        if ((data.paymentMethod === 'transfer' || data.paymentMethod === 'qris') && data.paymentProof && data.paymentProof[0]) {
          formData.append('paymentProof', data.paymentProof[0]);
        }

        const response = await bookingService.createBooking(formData);
        
        if (response.success) {
          const details = {
            bookingCode: response.bookingCode,
            customerName: data.customerName,
            serviceName: selectedService?.name,
            packageName: packages.find(p => p.id.toString() === data.packageId)?.package_name,
            totalAmount: totalPrice.paymentAmount
          };
          setBookingDetails(details);
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
    return <ThankYouPage bookingDetails={bookingDetails} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Thirtys Studio</h1>
            <div className="w-16" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="px-4 sm:px-0">
          <ModernProgress currentStep={currentStep} totalSteps={steps} />
        </div>
        
        {/* Form Container */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Hi Thirtys!</h2>
                  <p className="text-gray-600 mt-2">Silahkan mengisi data diri untuk melakukan booking foto ya</p>
                </div>
                
                <div className="space-y-4 mt-8">
                  <ModernInput
                    label="Full Name"
                    icon={User2}
                    required
                    {...register('customerName')}
                    placeholder="Enter your full name"
                    error={errors.customerName?.message}
                  />
                  
                  <ModernInput
                    label="WhatsApp Number"
                    icon={Phone}
                    required
                    {...register('phoneNumber')}
                    placeholder="+62 812 3456 7890"
                    error={errors.phoneNumber?.message}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Service Selection */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pilih Service</h2>
                  <p className="text-gray-600 mt-2">Silahkan pilih service dan paket sesuai kebutuhan kamu</p>
                </div>
                
                <div className="mt-8">
                  {services.map(service => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      selected={watchService === service.id.toString()}
                      onSelect={(id) => setValue('serviceId', id)}
                      packages={packages}
                      selectedPackageId={watchPackage}
                      onPackageSelect={(id) => setValue('packageId', id)}
                    />
                  ))}
                  {errors.serviceId && (
                    <p className="text-sm text-red-500 mt-2">{errors.serviceId.message}</p>
                  )}
                  {errors.packageId && watchService && (
                    <p className="text-sm text-red-500 mt-2">{errors.packageId.message}</p>
                  )}
                </div>

                {/* Graduation Fields */}
                {isGraduationPhotography && watchPackage && (
                  <div className="space-y-4 p-6 bg-blue-50 rounded-xl animate-in slide-in-from-bottom duration-300">
                    <p className="text-sm font-medium text-blue-900">Additional information required</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="faculty" className="text-sm font-medium text-gray-700 mb-2 block">
                          Faculty <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="faculty"
                            {...register('faculty')}
                            placeholder="e.g., Faculty of Engineering"
                            className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pl-10 bg-white"
                          />
                        </div>
                        {errors.faculty && (
                          <p className="text-sm text-red-500 mt-1">{errors.faculty.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="university" className="text-sm font-medium text-gray-700 mb-2 block">
                          University <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="university"
                            {...register('university')}
                            placeholder="e.g., University of Indonesia"
                            className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pl-10 bg-white"
                          />
                        </div>
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
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pilih tanggalnya</h2>
                  <p className="text-gray-600 mt-2">Kapan pelaksanaan sesi foto kamu?</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-2 mt-8">
                  {/* Date Selection */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Select Date
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <Calendar
                        mode="single"
                        selected={watchDate}
                        onSelect={(date) => setValue('bookingDate', date)}
                        disabled={(date) => date < new Date()}
                        className="rounded-md w-full"
                      />
                    </div>
                    {errors.bookingDate && (
                      <p className="text-sm text-red-500 mt-2">{errors.bookingDate.message}</p>
                    )}
                  </div>

                  {/* Time Slot Selection */}
                  {selectedService?.has_time_slots && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Select Time
                      </h3>
                      {timeSlots.length > 0 ? (
                        <TimeSlotGrid
                          slots={timeSlots}
                          selected={watch('timeSlotId')}
                          onSelect={(id) => setValue('timeSlotId', id)}
                        />
                      ) : watchDate ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                          <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-gray-500">No time slots available</p>
                          <p className="text-sm text-gray-400 mt-1">Please select another date</p>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-gray-500">Select a date first</p>
                        </div>
                      )}
                      {errors.timeSlotId && (
                        <p className="text-sm text-red-500 mt-2">{errors.timeSlotId.message}</p>
                      )}
                    </div>
                  )}
                </div>

                {watchDate && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-center">
                      <span className="font-medium text-blue-900">Selected Date:</span>{' '}
                      <span className="text-blue-700">{format(watchDate, 'EEEE, dd MMMM yyyy')}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment details</h2>
                  <p className="text-gray-600 mt-2">Pilih metode pembayaran</p>
                </div>

                {/* Payment Type */}
                {!isSelfPhoto && (
                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Payment Type</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label
                        className={cn(
                          "relative flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200",
                          watchPaymentType === 'down_payment'
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        <input
                          type="radio"
                          {...register('paymentType')}
                          value="down_payment"
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Down Payment</p>
                          <p className="text-sm text-gray-500">Pay 50% now, 50% later</p>
                        </div>
                        <Badge variant="secondary" className="ml-3">50%</Badge>
                        {watchPaymentType === 'down_payment' && (
                          <div className="absolute top-4 right-4 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </label>
                      
                      <label
                        className={cn(
                          "relative flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200",
                          watchPaymentType === 'full_payment'
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        <input
                          type="radio"
                          {...register('paymentType')}
                          value="full_payment"
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Full Payment</p>
                          <p className="text-sm text-gray-500">Pay 100% now</p>
                        </div>
                        <Badge variant="secondary" className="ml-3">100%</Badge>
                        {watchPaymentType === 'full_payment' && (
                          <div className="absolute top-4 right-4 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </label>
                    </div>
                    {errors.paymentType && (
                      <p className="text-sm text-red-500 mt-2">{errors.paymentType.message}</p>
                    )}
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Payment Method</h3>
                  <div className="grid gap-3">
                    <PaymentMethodCard
                      method="qris"
                      selected={watchPaymentMethod === 'qris'}
                      onSelect={(method) => setValue('paymentMethod', method)}
                    />
                    <PaymentMethodCard
                      method="transfer"
                      selected={watchPaymentMethod === 'transfer'}
                      onSelect={(method) => setValue('paymentMethod', method)}
                    />
                    <PaymentMethodCard
                      method="cash"
                      selected={watchPaymentMethod === 'cash'}
                      onSelect={(method) => setValue('paymentMethod', method)}
                    />
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-sm text-red-500 mt-2">{errors.paymentMethod.message}</p>
                  )}
                </div>

                {/* Promo Code Section - tambahkan setelah payment method */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Promo Code (Optional)</h3>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoValidation(null);
                        }}
                        placeholder="Enter promo code"
                        className={cn(
                          "h-12 rounded-xl pr-10",
                          promoValidation?.valid && "border-green-500 focus:border-green-500",
                          promoValidation?.valid === false && "border-red-500 focus:border-red-500"
                        )}
                      />
                      {promoValidation && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {promoValidation.valid ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={validatePromoCode}
                      disabled={!promoCode.trim() || isValidatingPromo || !watchService}
                      className="h-12 px-6 rounded-xl"
                    >
                      {isValidatingPromo ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  {promoValidation?.message && (
                    <p className={cn(
                      "text-sm",
                      promoValidation.valid ? "text-green-600" : "text-red-600"
                    )}>
                      {promoValidation.message}
                    </p>
                  )}
                </div>

                {/* QRIS Payment Info */}
                {watchPaymentMethod === 'qris' && watchPaymentType && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">QRIS Payment</h3>
                    
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <div className="text-center">
                        {/* QRIS Image */}
                        <div className="inline-block p-4 bg-gray-50 rounded-xl mb-4">
                          <img 
                            src="https://res.cloudinary.com/dtv63pzsn/image/upload/v1753463191/thirtys-qris_yuv0db.jpg" 
                            alt="QRIS Payment Code" 
                            className="w-48 h-48 object-contain" 
                          />
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">Scan with any e-wallet or mobile banking app</p>
                        <p className="text-xs text-gray-500">GoPay, OVO, DANA, LinkAja, ShopeePay, etc.</p>
                        
                        {/* Payment Amount Display */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Amount to pay</p>
                          <p className="text-2xl font-bold text-blue-600">
                            Rp {formatPrice(totalPrice.paymentAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Payment Instructions */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800 font-medium mb-2">Instruksi pembayaran:</p>
                      <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                        <li>Buka aplikasi e-wallet atau m-banking kamu</li>
                        <li>Scan QR code diatas </li>
                        <li>Pastikan jumlahnya sesuai: Rp {formatPrice(totalPrice.paymentAmount)}</li>
                        <li>Selesaikan pembayarannya</li>
                        <li>Screenshot bukti pembayaran berhasil</li>
                        <li>Upload screenshot dibawah ini</li>
                      </ol>
                    </div>
                    
                    {/* Payment Proof Upload for QRIS */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-4">
                        Payment Confirmation <span className="text-red-500">*</span>
                      </h3>
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
                          className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
                        >
                          {paymentProofPreview ? (
                            <div className="relative w-full h-full p-2">
                              <img
                                src={paymentProofPreview}
                                alt="Payment proof"
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                                <p className="text-white text-sm font-medium">Click to change</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-600">Upload payment screenshot</p>
                              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                      {errors.paymentProof && (
                        <p className="text-sm text-red-500 mt-2">{errors.paymentProof.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank Account Info */}
                {watchPaymentMethod === 'transfer' && watchPaymentType && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Bank Account Information</h3>
                    <div className="space-y-3">
                      {bankAccounts.map((account) => (
                        <div
                          key={account.bank}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold",
                              account.bank === 'BCA' ? "bg-blue-600" :
                              account.bank === 'BRI' ? "bg-blue-500" : "bg-purple-600"
                            )}>
                              {account.bank}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{account.name}</p>
                              <p className="text-sm text-gray-600 font-mono">{account.number}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(account.number, account.bank)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {copiedAccount === account.bank ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800">
                        Harap untuk menyimpan bukti pembayaran
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Proof Upload */}
                {watchPaymentMethod === 'transfer' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      Payment Proof <span className="text-red-500">*</span>
                    </h3>
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
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
                      >
                        {paymentProofPreview ? (
                          <div className="relative w-full h-full p-2">
                            <img
                              src={paymentProofPreview}
                              alt="Payment proof"
                              className="w-full h-full object-contain rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                              <p className="text-white text-sm font-medium">Click to change</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600">Click to upload payment proof</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                    {errors.paymentProof && (
                      <p className="text-sm text-red-500 mt-2">{errors.paymentProof.message}</p>
                    )}
                  </div>
                )}

                {/* Cash Payment Notice */}
                {watchPaymentMethod === 'cash' && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-800">
                      <strong>Cash Payment:</strong> Harap bawa jumlah yang tepat pada hari sesi Anda. Kami akan memberikan tanda terima setelah pembayaran.
                    </p>
                  </div>
                )}

                {/* Payment Summary */}
                {totalPrice.paymentAmount > 0 && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Package Price</span>
                        <span className="font-medium">Rp {formatPrice(totalPrice.originalPrice)}</span>
                      </div>
                      
                      {totalPrice.discountPercentage > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-600">Service Discount ({totalPrice.discountPercentage}%)</span>
                          <span className="font-medium text-emerald-600">
                            -Rp {formatPrice(totalPrice.originalPrice * (totalPrice.discountPercentage / 100))}
                          </span>
                        </div>
                      )}
                      
                      {totalPrice.promoDiscountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-600">Promo Code Discount</span>
                          <span className="font-medium text-blue-600">
                            -Rp {formatPrice(totalPrice.promoDiscountAmount)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm pt-3 border-t">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">Rp {formatPrice(totalPrice.discountedPrice)}</span>
                      </div>
                      
                      <div className="flex justify-between pt-3 border-t">
                        {totalPrice.paymentType === 'down_payment' ? (
                          <>
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900">Down Payment (50%)</p>
                              <p className="text-xs text-gray-500">
                                Remaining: Rp {formatPrice(totalPrice.discountedPrice - totalPrice.paymentAmount)}
                              </p>
                            </div>
                            <p className="text-xl font-bold text-blue-600">
                              Rp {formatPrice(totalPrice.paymentAmount)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-900">Total Payment</p>
                            <p className="text-xl font-bold text-blue-600">
                              Rp {formatPrice(totalPrice.paymentAmount)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base px-3 sm:px-4"
              >
                <ChevronLeft className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                Back
              </Button>
              
              <Button
                type="button"
                onClick={handleNext}
                disabled={currentStep === steps && loading}
                className="gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 rounded-lg sm:rounded-xl shadow-lg shadow-blue-200 text-sm sm:text-base"
              >
                {currentStep === steps ? (
                  loading ? (
                    <>
                      <div className="h-3.5 sm:h-4 w-3.5 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <Check className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    </>
                  )
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}