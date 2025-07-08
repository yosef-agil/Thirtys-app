import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Textarea diganti dengan textarea HTML biasa
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import api from '../services/api';

export default function ServiceManager() {
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [packageFormOpen, setPackageFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [loading, setLoading] = useState(true);
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
      description: service.description,
      has_time_slots: service.has_time_slots,
      discount_percentage: service.discount_percentage,
    });
    setServiceFormOpen(true);
  };

  const handleServiceDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await api.delete(`/services/${serviceId}`);
      toast({ title: 'Success', description: 'Service deleted successfully' });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete service',
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
      description: pkg.description,
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
        description: 'Failed to delete package',
        variant: 'destructive',
      });
    }
  };

  const resetPackageForm = () => {
    setPackageForm({
      service_id: '',
      package_name: '',
      price: '',
      description: '',
    });
    setEditingPackage(null);
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Services Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Services</CardTitle>
            <Dialog open={serviceFormOpen} onOpenChange={setServiceFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetServiceForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="base_price">Base Price</Label>
                    <Input
                      id="base_price"
                      type="number"
                      value={serviceForm.base_price}
                      onChange={(e) => setServiceForm({...serviceForm, base_price: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                      rows="3"
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
                    <Label htmlFor="has_time_slots">Has Time Slots</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingService ? 'Update' : 'Create'} Service
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setServiceFormOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Time Slots</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>Rp {service.base_price?.toLocaleString('id-ID')}</TableCell>
                  <TableCell>{service.discount_percentage}%</TableCell>
                  <TableCell>{service.has_time_slots ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleServiceEdit(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleServiceDelete(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Packages Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Service Packages</CardTitle>
            <Dialog open={packageFormOpen} onOpenChange={setPackageFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetPackageForm}>
                  <Package className="h-4 w-4 mr-2" />
                  Add Package
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPackage ? 'Edit Package' : 'Add New Package'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePackageSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="service_id">Service</Label>
                    <select
                      id="service_id"
                      value={packageForm.service_id}
                      onChange={(e) => setPackageForm({...packageForm, service_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="package_name">Package Name</Label>
                    <Input
                      id="package_name"
                      value={packageForm.package_name}
                      onChange={(e) => setPackageForm({...packageForm, package_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={packageForm.price}
                      onChange={(e) => setPackageForm({...packageForm, price: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pkg_description">Description</Label>
                    <textarea
                      id="pkg_description"
                      value={packageForm.description}
                      onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingPackage ? 'Update' : 'Create'} Package
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setPackageFormOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Package Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>{getServiceName(pkg.service_id)}</TableCell>
                  <TableCell className="font-medium">{pkg.package_name}</TableCell>
                  <TableCell>Rp {pkg.price?.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="max-w-xs truncate">{pkg.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePackageEdit(pkg)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handlePackageDelete(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}