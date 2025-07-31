import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon,
  Users,
  AlertCircle,
  RefreshCw,
  Settings,
  ChevronRight
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import api from '../services/api';
import { cn } from '@/lib/utils';

// Time slot component
const TimeSlotCard = ({ slot, onEdit, onDelete, service }) => {
  const isBooked = slot.is_booked || slot.current_bookings > 0;
  const availableSlots = slot.max_capacity - (slot.current_bookings || 0);
  
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all duration-200",
      isBooked && slot.current_bookings >= slot.max_capacity
        ? "bg-gray-50 border-gray-200"
        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
    )}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">
              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {slot.current_bookings || 0} / {slot.max_capacity} booked
            </span>
          </div>
          
          <div className="flex gap-2">
            {availableSlots > 0 ? (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                {availableSlots} slots available
              </Badge>
            ) : (
              <Badge className="bg-red-50 text-red-700 border-red-200">
                Fully booked
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(slot)}
            className="h-8 w-8 hover:bg-gray-100"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(slot)}
            disabled={isBooked}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Service selection card
const ServiceSelectionCard = ({ service, selected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(service)}
      className={cn(
        "w-full p-4 rounded-xl border text-left transition-all duration-200",
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      )}
    >
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-gray-900">{service.name}</h4>
          <p className="text-sm text-gray-500 mt-1">
            {service.has_time_slots ? 'Time slots enabled' : 'No time slots'}
          </p>
        </div>
        <ChevronRight className={cn(
          "h-5 w-5 transition-colors",
          selected ? "text-blue-600" : "text-gray-400"
        )} />
      </div>
    </button>
  );
};

export default function TimeSlotManager() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotFormOpen, setSlotFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [slotForm, setSlotForm] = useState({
    start_time: '',
    end_time: '',
    max_capacity: 1
  });

  // Bulk create form state
  const [bulkForm, setBulkForm] = useState({
    start_date: new Date(),
    end_date: addDays(new Date(), 7),
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: 60,
    break_duration: 0,
    max_capacity: 1,
    days_of_week: [1, 2, 3, 4, 5] // Monday to Friday
  });

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedService && selectedService.has_time_slots) {
      loadTimeSlots();
    }
  }, [selectedService, selectedDate]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      console.log('Services response:', response.data); // Debug log
      
      // Ensure we have an array
      let servicesData = [];
      if (Array.isArray(response.data)) {
        servicesData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object with numeric keys, convert to array
        servicesData = Object.values(response.data);
      }
      
      const servicesWithTimeSlots = servicesData.filter(s => s && s.has_time_slots === 1);
      console.log('Services with time slots:', servicesWithTimeSlots); // Debug log
      
      setServices(servicesWithTimeSlots);
      
      if (servicesWithTimeSlots.length > 0) {
        setSelectedService(servicesWithTimeSlots[0]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

const loadTimeSlots = async () => {
  if (!selectedService) return;
  
  try {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Gunakan query parameter sesuai dengan backend
    const response = await api.get('/time-slots', {
      params: { 
        serviceId: selectedService.id,
        date: dateStr 
      }
    });
    
    console.log('Time slots response:', response.data);
    setTimeSlots(response.data || []);
  } catch (error) {
    console.error('Failed to load time slots:', error);
    setTimeSlots([]);
  }
};

  const handleSlotSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // Hanya kirim data yang diperlukan
    const payload = {
      start_time: slotForm.start_time + ':00',
      end_time: slotForm.end_time + ':00',
      max_capacity: parseInt(slotForm.max_capacity)
    };

    if (editingSlot) {
      // PUT hanya mengirim 3 field
      await api.put(`/time-slots/${editingSlot.id}`, payload);
      toast({ title: 'Success', description: 'Time slot updated' });
    } else {
      // POST tetap mengirim semua field
      await api.post('/time-slots', {
        service_id: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        ...payload
      });
      toast({ title: 'Success', description: 'Time slot created' });
    }

    setSlotFormOpen(false);
    resetSlotForm();
    loadTimeSlots();
  } catch (error) {
    toast({
      title: 'Error',
      description: error.response?.data?.message || 'Failed to save time slot',
      variant: 'destructive',
    });
  }
};

  const handleBulkCreate = async () => {
    try {
      const slots = [];
      const currentDate = new Date(bulkForm.start_date);
      const endDate = new Date(bulkForm.end_date);

      while (currentDate <= endDate) {
        // Check if current day is in selected days of week
        if (bulkForm.days_of_week.includes(currentDate.getDay())) {
          // Create slots for this day
          const dayStart = new Date(currentDate);
          const [startHour, startMin] = bulkForm.start_time.split(':').map(Number);
          const [endHour, endMin] = bulkForm.end_time.split(':').map(Number);
          
          dayStart.setHours(startHour, startMin, 0, 0);
          const dayEnd = new Date(currentDate);
          dayEnd.setHours(endHour, endMin, 0, 0);

          let slotStart = new Date(dayStart);
          
          while (slotStart < dayEnd) {
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + bulkForm.slot_duration);
            
            if (slotEnd <= dayEnd) {
              slots.push({
                service_id: selectedService.id,
                date: format(currentDate, 'yyyy-MM-dd'),
                start_time: format(slotStart, 'HH:mm:ss'),
                end_time: format(slotEnd, 'HH:mm:ss'),
                max_capacity: parseInt(bulkForm.max_capacity)
              });
            }
            
            // Add break time
            slotStart = new Date(slotEnd);
            slotStart.setMinutes(slotStart.getMinutes() + bulkForm.break_duration);
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Send bulk create request
      await api.post('/time-slots/bulk', { slots });
      
      toast({
        title: 'Success',
        description: `Created ${slots.length} time slots`,
      });
      
      setBulkCreateOpen(false);
      loadTimeSlots();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create time slots',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    setSlotForm({
      start_time: slot.start_time.slice(0, 5),
      end_time: slot.end_time.slice(0, 5),
      max_capacity: slot.max_capacity
    });
    setSlotFormOpen(true);
  };

  const handleDeleteClick = (slot) => {
    setSlotToDelete(slot);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return;
    
    try {
      await api.delete(`/time-slots/${slotToDelete.id}`);
      toast({ title: 'Success', description: 'Time slot deleted' });
      setDeleteDialogOpen(false);
      setSlotToDelete(null);
      loadTimeSlots();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete time slot',
        variant: 'destructive',
      });
    }
  };

  const resetSlotForm = () => {
    setSlotForm({
      start_time: '',
      end_time: '',
      max_capacity: 1
    });
    setEditingSlot(null);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading time slots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Time Slot Management</h2>
              <p className="text-gray-600 mt-1">Manage available time slots for services</p>
            </div>
            
            <Button
              onClick={() => setBulkCreateOpen(true)}
              disabled={!selectedService}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200"
            >
              <Settings className="h-4 w-4 mr-2" />
              Bulk Create Slots
            </Button>
          </div>
        </CardContent>
      </Card>

      {services.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">No services with time slots</p>
            <p className="text-gray-600">Enable time slots for services in the Services tab first</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Service Selection */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Select Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {services.map(service => (
                  <ServiceSelectionCard
                    key={service.id}
                    service={service}
                    selected={selectedService?.id === service.id}
                    onSelect={setSelectedService}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="border-0 shadow-sm mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md"
                />
              </CardContent>
            </Card>
          </div>

          {/* Time Slots */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">
                      Time Slots - {format(selectedDate, 'EEEE, dd MMMM yyyy')}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedService?.name || 'Select a service'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadTimeSlots}
                      className="rounded-lg"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSlotFormOpen(true)}
                      disabled={!selectedService}
                      className="rounded-lg bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Slot
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedService ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Select a service to view time slots</p>
                  </div>
                ) : !Array.isArray(timeSlots) ? (
                  <div className="text-center py-12 bg-red-50 rounded-xl">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-300" />
                    <p className="text-red-600 font-medium">Error loading time slots</p>
                    <p className="text-sm text-red-500 mt-1">Invalid data format received</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadTimeSlots}
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No time slots for this date</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Add Slot" to create one</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {timeSlots.map(slot => (
                      <TimeSlotCard
                        key={slot.id}
                        slot={slot}
                        service={selectedService}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add/Edit Slot Dialog */}
      <Dialog open={slotFormOpen} onOpenChange={setSlotFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSlotSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={slotForm.start_time}
                  onChange={(e) => setSlotForm({...slotForm, start_time: e.target.value})}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={slotForm.end_time}
                  onChange={(e) => setSlotForm({...slotForm, end_time: e.target.value})}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Max Capacity</Label>
              <Input
                type="number"
                min="1"
                value={slotForm.max_capacity}
                onChange={(e) => setSlotForm({...slotForm, max_capacity: e.target.value})}
                required
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-gray-500">
                Maximum number of bookings allowed for this time slot
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                {editingSlot ? 'Update' : 'Create'} Slot
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSlotFormOpen(false);
                  resetSlotForm();
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={bulkCreateOpen} onOpenChange={setBulkCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Create Time Slots</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={format(bulkForm.start_date, 'yyyy-MM-dd')}
                  onChange={(e) => setBulkForm({...bulkForm, start_date: new Date(e.target.value)})}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={format(bulkForm.end_date, 'yyyy-MM-dd')}
                  onChange={(e) => setBulkForm({...bulkForm, end_date: new Date(e.target.value)})}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Start Time</Label>
                <Input
                  type="time"
                  value={bulkForm.start_time}
                  onChange={(e) => setBulkForm({...bulkForm, start_time: e.target.value})}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Daily End Time</Label>
                <Input
                  type="time"
                  value={bulkForm.end_time}
                  onChange={(e) => setBulkForm({...bulkForm, end_time: e.target.value})}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Slot Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Slot Duration (min)</Label>
                <Input
                  type="number"
                  min="15"
                  step="15"
                  value={bulkForm.slot_duration}
                  onChange={(e) => setBulkForm({...bulkForm, slot_duration: parseInt(e.target.value)})}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Break Between (min)</Label>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  value={bulkForm.break_duration}
                  onChange={(e) => setBulkForm({...bulkForm, break_duration: parseInt(e.target.value)})}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  value={bulkForm.max_capacity}
                  onChange={(e) => setBulkForm({...bulkForm, max_capacity: parseInt(e.target.value)})}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Days of Week */}
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex gap-2">
                {dayNames.map((day, index) => (
                  <label
                    key={index}
                    className={cn(
                      "flex-1 p-3 text-center rounded-lg border cursor-pointer transition-all",
                      bulkForm.days_of_week.includes(index)
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={bulkForm.days_of_week.includes(index)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkForm({
                            ...bulkForm,
                            days_of_week: [...bulkForm.days_of_week, index].sort()
                          });
                        } else {
                          setBulkForm({
                            ...bulkForm,
                            days_of_week: bulkForm.days_of_week.filter(d => d !== index)
                          });
                        }
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleBulkCreate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Create Time Slots
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setBulkCreateOpen(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle>Delete Time Slot?</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  This will permanently delete the time slot. This action cannot be undone.
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
              Delete Slot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      
    </div>
  );
}