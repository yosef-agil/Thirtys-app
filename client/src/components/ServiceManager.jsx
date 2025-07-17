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
} from 'lucide-react';
import api from '../services/api';

// Utility function untuk format harga
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
};

// Service Card Component
const ServiceCard = ({ service, packages, onEditService, onDeleteService, onEditPackage, onDeletePackage, onAddPackage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const servicePackages = packages.filter(pkg => pkg.service_id === service.id);
  
  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-gray-700 transition-colors">
              {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              <div className="text-left">
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
            </CollapsibleTrigger>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Service Info Badges */}
              <Badge variant="outline" className="gap-1">
                Rp {formatPrice(service.base_price)}
              </Badge>
              
              {service.discount_percentage > 0 && (
                <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                  <Percent className="h-3 w-3" />
                  {service.discount_percentage}% OFF
                </Badge>
              )}
              
              {service.has_time_slots && (
                <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                  <Clock className="h-3 w-3" />
                  Time Slots
                </Badge>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditService(service)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Edit</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteService(service.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-700">Packages ({servicePackages.length})</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddPackage(service.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Package
                </Button>
              </div>
              
              {servicePackages.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No packages yet. Add your first package!</p>
              ) : (
                <div className="space-y-3">
                  {servicePackages.map((pkg) => (
                    <div key={pkg.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex-1">
                          <h5 className="font-medium">{pkg.package_name}</h5>
                          <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                          <p className="text-lg font-semibold text-blue-600 mt-2">
                            Rp {formatPrice(pkg.price)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditPackage(pkg)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeletePackage(pkg.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Services & Packages</h2>
          <p className="text-gray-600">Manage your photography services and pricing packages</p>
        </div>
        
        <Dialog open={serviceFormOpen} onOpenChange={setServiceFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetServiceForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                  placeholder="e.g., Wedding Photography"
                  required
                />
              </div>
              <div>
                <Label htmlFor="base_price">Base Price (Rp)</Label>
                <Input
                  id="base_price"
                  type="number"
                  value={serviceForm.base_price}
                  onChange={(e) => setServiceForm({...serviceForm, base_price: e.target.value})}
                  placeholder="e.g., 5000000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                  placeholder="Brief description of the service"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="discount_percentage">Discount (%)</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={serviceForm.discount_percentage}
                  onChange={(e) => setServiceForm({...serviceForm, discount_percentage: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="has_time_slots"
                  checked={serviceForm.has_time_slots}
                  onCheckedChange={(checked) => setServiceForm({...serviceForm, has_time_slots: checked})}
                />
                <Label htmlFor="has_time_slots">Enable time slot booking</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingService ? 'Update' : 'Create'} Service
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setServiceFormOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery ? 'No services found matching your search.' : 'No services yet. Create your first service!'}
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
              {editingPackage ? 'Edit Package' : 'Add New Package'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePackageSubmit} className="space-y-4">
            <div>
              <Label htmlFor="service_id">Service</Label>
              <Select
                value={packageForm.service_id.toString()}
                onValueChange={(value) => setPackageForm({...packageForm, service_id: value})}
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="package_name">Package Name</Label>
              <Input
                id="package_name"
                value={packageForm.package_name}
                onChange={(e) => setPackageForm({...packageForm, package_name: e.target.value})}
                placeholder="e.g., Premium Package"
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price (Rp)</Label>
              <Input
                id="price"
                type="number"
                value={packageForm.price}
                onChange={(e) => setPackageForm({...packageForm, price: e.target.value})}
                placeholder="e.g., 8000000"
                required
              />
            </div>
            <div>
              <Label htmlFor="pkg_description">Description</Label>
              <Textarea
                id="pkg_description"
                value={packageForm.description}
                onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
                placeholder="What's included in this package"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingPackage ? 'Update' : 'Create'} Package
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPackageFormOpen(false)}
                className="flex-1"
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