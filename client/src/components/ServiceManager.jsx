import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '../services/api';

export default function ServiceManager() {
  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive',
      });
    }
  };

  const updateService = async (serviceId, data) => {
    try {
      await api.put(`/services/${serviceId}`, data);
      toast({
        title: 'Success',
        description: 'Service updated successfully',
      });
      loadServices();
      setEditingService(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update service',
        variant: 'destructive',
      });
    }
  };

  const updatePackage = async (packageId, data) => {
    try {
      await api.put(`/services/package/${packageId}`, data);
      toast({
        title: 'Success',
        description: 'Package updated successfully',
      });
      loadServices();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update package',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {services.map((service) => (
        <Card key={service.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {service.name}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingService(editingService === service.id ? null : service.id)}
              >
                {editingService === service.id ? 'Cancel' : 'Edit'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingService === service.id ? (
              <ServiceEditForm
                service={service}
                onSave={(data) => updateService(service.id, data)}
                onCancel={() => setEditingService(null)}
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Base Price</p>
                  <p className="font-medium">Rp {service.base_price.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Discount</p>
                  <p className="font-medium">{service.discount_percentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{service.description || '-'}</p>
                </div>
                
                {/* Packages */}
                <div>
                  <h4 className="font-semibold mb-2">Packages</h4>
                  <div className="space-y-2">
                    {service.packages.map((pkg) => (
                      <PackageItem
                        key={pkg.id}
                        package={pkg}
                        onUpdate={(data) => updatePackage(pkg.id, data)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ServiceEditForm({ service, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: service.name,
    base_price: service.base_price,
    description: service.description || '',
    discount_percentage: service.discount_percentage || 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Service Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="base_price">Base Price</Label>
        <Input
          id="base_price"
          type="number"
          value={formData.base_price}
          onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="discount">Discount (%)</Label>
        <Input
          id="discount"
          type="number"
          min="0"
          max="100"
          value={formData.discount_percentage}
          onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function PackageItem({ package: pkg, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    package_name: pkg.package_name,
    price: pkg.price,
    description: pkg.description || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="border p-3 rounded space-y-2">
        <Input
          value={formData.package_name}
          onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
          placeholder="Package name"
        />
        <Input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
          placeholder="Price"
        />
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm">Save</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="border p-3 rounded flex justify-between items-center">
      <div>
        <p className="font-medium">{pkg.package_name}</p>
        <p className="text-sm text-gray-500">Rp {pkg.price.toLocaleString('id-ID')}</p>
        {pkg.description && <p className="text-sm text-gray-500">{pkg.description}</p>}
      </div>
      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
        Edit
      </Button>
    </div>
  );
}