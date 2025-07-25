import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  ChevronDown, 
  ChevronRight,
  Clock,
  Percent,
  Search,
  DollarSign,
  FileText,
  Sparkles,
  Save,
  X
} from 'lucide-react';
import api from '../services/api';
import { cn } from '@/lib/utils';

// Utility function untuk format harga
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
};

// Modern Input Component
const ModernInput = ({ label, icon: Icon, error, required, prefix, ...props }) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {prefix}
          </span>
        )}
        <Input
          className={cn(
            "h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all",
            Icon && "pl-10",
            prefix && "pl-10",
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

// Service Card Component
const ServiceCard = ({ service, packages, onEditService, onDeleteService, onEditPackage, onDeletePackage, onAddPackage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const servicePackages = packages.filter(pkg => pkg.service_id === service.id);
  
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CollapsibleTrigger className="flex items-center gap-3 hover:text-gray-700 transition-colors text-left group">
              <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-600 mt-0.5">{service.description}</p>
              </div>
            </CollapsibleTrigger>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Service Info Badges */}
              <Badge variant="outline" className="gap-1.5 border-gray-200">
                <DollarSign className="h-3 w-3" />
                Rp {formatPrice(service.base_price)}
              </Badge>
              
              {service.discount_percentage > 0 && (
                <Badge className="gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                  <Percent className="h-3 w-3" />
                  {service.discount_percentage}% OFF
                </Badge>
              )}
              
              {service.has_time_slots && (
                <Badge className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                  <Clock className="h-3 w-3" />
                  Time Slots
                </Badge>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditService(service)}
                  className="rounded-lg hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteService(service.id)}
                  className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-700">
                  Packages ({servicePackages.length})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddPackage(service.id)}
                  className="rounded-lg hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Package
                </Button>
              </div>
              
              {servicePackages.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No packages yet</p>
                  <p className="text-sm text-gray-500 mt-1">Create your first package for this service</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {servicePackages.map((pkg) => (
                    <div key={pkg.id} className="group border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-semibold text-gray-900 pr-2">{pkg.package_name}</h5>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditPackage(pkg)}
                            className="h-7 w-7 hover:bg-gray-100"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeletePackage(pkg.id)}
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{pkg.description}</p>
                      <div className="pt-3 border-t">
                        <p className="text-xl font-bold text-blue-600">
                          Rp {formatPrice(pkg.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default function ServiceManager() {
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [packageFormOpen, setPackageFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: '',
    base_price: '',
    description: '',
    has_time_slots: false,
    discount_percentage: 0,
  });

  // Package form state
  const [packageForm, setPackageForm] = useState({
    service_id: '',
    package_name: '',
    price: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesRes, packagesRes] = await Promise.all([
        api.get('/services'),
        api.get('/services/packages'),
      ]);
      setServices(servicesRes.data);
      setPackages(packagesRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Service CRUD
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, serviceForm);
        toast({ title: 'Success', description: 'Service updated successfully' });
      } else {
        await api.post('/services', serviceForm);
        toast({ title: 'Success', description: 'Service created successfully' });
      }
      
      resetServiceForm();
      setServiceFormOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save service',
        variant: 'destructive',
      });
    }
  };

  const handleServiceEdit = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      base_price: service.base_price,
      description: service.description || '',
      has_time_slots: service.has_time_slots || false,
      discount_percentage: service.discount_percentage || 0,
    });
    setServiceFormOpen(true);
  };

  const handleServiceDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service? All packages will also be deleted.')) return;
    
    try {
      await api.delete(`/services/${serviceId}`);
      toast({ title: 'Success', description: 'Service deleted successfully' });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete service. It may have existing bookings.',
        variant: 'destructive',
      });
    }
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      base_price: '',
      description: '',
      has_time_slots: false,
      discount_percentage: 0,
    });
    setEditingService(null);
  };

  // Package CRUD
  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        await api.put(`/services/packages/${editingPackage.id}`, packageForm);
        toast({ title: 'Success', description: 'Package updated successfully' });
      } else {
        await api.post('/services/packages', packageForm);
        toast({ title: 'Success', description: 'Package created successfully' });
      }
      
      resetPackageForm();
      setPackageFormOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save package',
        variant: 'destructive',
      });
    }
  };

  const handlePackageEdit = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      service_id: pkg.service_id,
      package_name: pkg.package_name,
      price: pkg.price,
      description: pkg.description || '',
    });
    setPackageFormOpen(true);
  };

  const handlePackageDelete = async (packageId) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    
    try {
      await api.delete(`/services/packages/${packageId}`);
      toast({ title: 'Success', description: 'Package deleted successfully' });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete package. It may have existing bookings.',
        variant: 'destructive',
      });
    }
  };

  const handleAddPackage = (serviceId) => {
    resetPackageForm();
    setSelectedServiceId(serviceId);
    setPackageForm({ ...packageForm, service_id: serviceId });
    setPackageFormOpen(true);
  };

  const resetPackageForm = () => {
    setPackageForm({
      service_id: '',
      package_name: '',
      price: '',
      description: '',
    });
    setEditingPackage(null);
    setSelectedServiceId(null);
  };

  // Filter services based on search
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Package className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading services...</p>
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
              <h2 className="text-2xl font-bold text-gray-900">Services & Packages</h2>
              <p className="text-gray-600 mt-1">Manage your photography services and pricing</p>
            </div>
            
            <Dialog open={serviceFormOpen} onOpenChange={setServiceFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetServiceForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? 'Edit Service' : 'Create New Service'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleServiceSubmit} className="space-y-4 mt-4">
                  <ModernInput
                    label="Service Name"
                    icon={FileText}
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                    placeholder="e.g., Wedding Photography"
                    required
                  />
                  
                  <ModernInput
                    label="Base Price"
                    icon={DollarSign}
                    prefix="Rp"
                    type="number"
                    value={serviceForm.base_price}
                    onChange={(e) => setServiceForm({...serviceForm, base_price: e.target.value})}
                    placeholder="5000000"
                    required
                  />
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <Textarea
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                      placeholder="Brief description of the service"
                      rows={3}
                      className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  
                  <ModernInput
                    label="Discount Percentage"
                    icon={Percent}
                    type="number"
                    min="0"
                    max="100"
                    value={serviceForm.discount_percentage}
                    onChange={(e) => setServiceForm({...serviceForm, discount_percentage: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <Label htmlFor="has_time_slots" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Enable time slot booking
                      </Label>
                    </div>
                    <Switch
                      id="has_time_slots"
                      checked={serviceForm.has_time_slots}
                      onCheckedChange={(checked) => setServiceForm({...serviceForm, has_time_slots: checked})}
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingService ? 'Update' : 'Create'} Service
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setServiceFormOpen(false)}
                      className="flex-1 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search Bar */}
          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No services found' : 'No services yet'}
            </p>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first service to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              packages={packages}
              onEditService={handleServiceEdit}
              onDeleteService={handleServiceDelete}
              onEditPackage={handlePackageEdit}
              onDeletePackage={handlePackageDelete}
              onAddPackage={handleAddPackage}
            />
          ))}
        </div>
      )}

      {/* Package Form Dialog */}
      <Dialog open={packageFormOpen} onOpenChange={setPackageFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Create New Package'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePackageSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Service</Label>
              <Select
                value={packageForm.service_id.toString()}
                onValueChange={(value) => setPackageForm({...packageForm, service_id: value})}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <ModernInput
              label="Package Name"
              icon={Package}
              value={packageForm.package_name}
              onChange={(e) => setPackageForm({...packageForm, package_name: e.target.value})}
              placeholder="e.g., Premium Package"
              required
            />
            
            <ModernInput
              label="Price"
              icon={DollarSign}
              prefix="Rp"
              type="number"
              value={packageForm.price}
              onChange={(e) => setPackageForm({...packageForm, price: e.target.value})}
              placeholder="8000000"
              required
            />
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <Textarea
                value={packageForm.description}
                onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
                placeholder="What's included in this package"
                rows={3}
                className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingPackage ? 'Update' : 'Create'} Package
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPackageFormOpen(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}