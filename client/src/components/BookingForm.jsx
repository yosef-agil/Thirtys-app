// client/src/components/BookingForm.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';

const bookingSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  serviceId: z.string(),
  packageId: z.string().optional(),
  bookingDate: z.date(),
  timeSlotId: z.string().optional(),
  faculty: z.string().optional(),
  university: z.string().optional(),
  paymentType: z.enum(['down_payment', 'full_payment']),
  paymentProof: z.any()
});

export default function BookingForm() {
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(bookingSchema)
  });

  const selectedService = watch('serviceId');
  const isGraduationPhotography = services.find(s => s.id === selectedService)?.name === 'Graduation Photography';

  const onSubmit = async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'paymentProof') {
        formData.append(key, data[key][0]);
      } else {
        formData.append(key, data[key]);
      }
    });

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        toast({
          title: "Booking Successful!",
          description: "We'll contact you via WhatsApp soon."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Book Your Session</h2>
        
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <Input {...register('customerName')} placeholder="Your full name" />
          {errors.customerName && <p className="text-sm text-red-500 mt-1">{errors.customerName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <Input {...register('phoneNumber')} placeholder="+62 xxx xxxx xxxx" />
          {errors.phoneNumber && <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Service</label>
          <Select onValueChange={(value) => setValue('serviceId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {services.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isGraduationPhotography && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Faculty</label>
              <Input {...register('faculty')} placeholder="Your faculty" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">University</label>
              <Input {...register('university')} placeholder="Your university" />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Booking Date</label>
          <Calendar
            mode="single"
            selected={watch('bookingDate')}
            onSelect={(date) => setValue('bookingDate', date)}
            className="rounded-md border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Payment Type</label>
          <Select onValueChange={(value) => setValue('paymentType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="down_payment">Down Payment (50%)</SelectItem>
              <SelectItem value="full_payment">Full Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Payment Proof</label>
          <Input type="file" {...register('paymentProof')} accept="image/*" />
        </div>

        <div className="pt-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-lg font-semibold">Total Price: Rp {totalPrice.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <Button type="submit" className="w-full">
          Submit Booking
        </Button>
      </div>
    </form>
  );
}