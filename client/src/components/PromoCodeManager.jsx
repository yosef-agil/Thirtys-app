import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Percent,
  DollarSign,
  Users,
  Package,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { Calendar as CalendarIcon } from 'lucide-react';


export default function PromoCodeManager() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [selectedPromoCodes, setSelectedPromoCodes] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    service_id: 'all',
    usage_limit: '',
    valid_from: '',
    valid_until: ''
  });

  const [bulkFormData, setBulkFormData] = useState({
    prefix: '',
    count: '10',
    discount_type: 'percentage',
    discount_value: '',
    service_id: 'all',
    usage_limit: '',
    valid_from: '',
    valid_until: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadPromoCodes();
    loadServices();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      loadPromoCodes();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadPromoCodes = async () => {
    try {
      const response = await api.get('/promo-codes/all');
      setPromoCodes(response.data);
    } catch (error) {
      console.error('Failed to load promo codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load promo codes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        service_id: formData.service_id === 'all' ? null : formData.service_id
      };

      if (editingPromo) {
        await api.put(`/promo-codes/update/${editingPromo.id}`, payload);
        toast({
          title: 'Success',
          description: 'Promo code updated successfully',
        });
      } else {
        await api.post('/promo-codes/create', payload);
        toast({
          title: 'Success',
          description: 'Promo code created successfully',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadPromoCodes();
    } catch (error) {
      console.error('Save promo code error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save promo code',
        variant: 'destructive',
      });
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...bulkFormData,
        count: parseInt(bulkFormData.count),
        discount_value: parseFloat(bulkFormData.discount_value),
        usage_limit: bulkFormData.usage_limit ? parseInt(bulkFormData.usage_limit) : null,
        service_id: bulkFormData.service_id === 'all' ? null : bulkFormData.service_id
      };

      const response = await api.post('/promo-codes/bulk-create', payload);
      
      toast({
        title: 'Success',
        description: response.data.message,
      });

      setIsBulkDialogOpen(false);
      resetBulkForm();
      loadPromoCodes();
      
      // Show created codes
      if (response.data.createdCodes && response.data.createdCodes.length > 0) {
        const codesList = response.data.createdCodes.map(c => c.code).join(', ');
        toast({
          title: 'Created Codes',
          description: codesList,
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Bulk create error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create promo codes',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPromoCodes.length === 0) {
      toast({
        title: 'No selection',
        description: 'Please select promo codes to delete',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPromoCodes.length} promo codes?`)) {
      return;
    }

    try {
      const response = await api.post('/promo-codes/bulk-delete', {
        ids: selectedPromoCodes
      });

      toast({
        title: 'Success',
        description: response.data.message,
      });

      setSelectedPromoCodes([]);
      setIsSelectionMode(false);
      loadPromoCodes();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete promo codes',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      service_id: promo.service_id?.toString() || 'all',
      usage_limit: promo.usage_limit?.toString() || '',
      valid_from: promo.valid_from ? format(new Date(promo.valid_from), 'yyyy-MM-dd') : '',
      valid_until: promo.valid_until ? format(new Date(promo.valid_until), 'yyyy-MM-dd') : ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this promo code?')) {
      return;
    }

    try {
      const response = await api.delete(`/promo-codes/delete/${id}`);
      
      if (response.data.softDeleted) {
        toast({
          title: 'Info',
          description: 'Promo code has been deactivated since it has been used',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Promo code deleted successfully',
        });
      }
      
      loadPromoCodes();
    } catch (error) {
      console.error('Delete promo code error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete promo code',
        variant: 'destructive',
      });
    }
  };

  const togglePromoStatus = async (promo) => {
    try {
      await api.put(`/promo-codes/update/${promo.id}`, {
        is_active: !promo.is_active
      });
      
      toast({
        title: 'Success',
        description: `Promo code ${!promo.is_active ? 'activated' : 'deactivated'} successfully`,
      });
      
      loadPromoCodes();
    } catch (error) {
      console.error('Toggle promo status error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update promo status',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
      toast({
        title: 'Copied!',
        description: `Promo code ${code} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await api.get('/promo-codes/export');
      const data = response.data;

      const ws = XLSX.utils.json_to_sheet(data.map(promo => ({
        'Code': promo.code,
        'Discount Type': promo.discount_type,
        'Discount Value': promo.discount_value,
        'Service': promo.service_name || 'All Services',
        'Usage Limit': promo.usage_limit || 'Unlimited',
        'Used Count': promo.used_count,
        'Valid From': format(new Date(promo.valid_from), 'dd/MM/yyyy'),
        'Valid Until': promo.valid_until ? format(new Date(promo.valid_until), 'dd/MM/yyyy') : 'No expiry',
        'Status': promo.is_active ? 'Active' : 'Inactive',
        'Created At': format(new Date(promo.created_at), 'dd/MM/yyyy HH:mm')
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Promo Codes');
      
      const fileName = `promo_codes_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: 'Success',
        description: 'Promo codes exported to Excel',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export promo codes',
        variant: 'destructive',
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedPromoCodes.length === promoCodes.length) {
      setSelectedPromoCodes([]);
    } else {
      setSelectedPromoCodes(promoCodes.map(p => p.id));
    }
  };

  const toggleSelectPromo = (id) => {
    if (selectedPromoCodes.includes(id)) {
      setSelectedPromoCodes(selectedPromoCodes.filter(pid => pid !== id));
    } else {
      setSelectedPromoCodes([...selectedPromoCodes, id]);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      service_id: 'all',
      usage_limit: '',
      valid_from: '',
      valid_until: ''
    });
    setEditingPromo(null);
  };

  const resetBulkForm = () => {
    setBulkFormData({
      prefix: '',
      count: '10',
      discount_type: 'percentage',
      discount_value: '',
      service_id: 'all',
      usage_limit: '',
      valid_from: '',
      valid_until: ''
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading promo codes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Promo Codes</CardTitle>
            <div className="flex gap-2">
              {isSelectionMode && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedPromoCodes([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={selectedPromoCodes.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedPromoCodes.length})
                  </Button>
                </>
              )}
              {!isSelectionMode && (
                <>
                  <Button 
                    variant="outline"
                    onClick={exportToExcel}
                    disabled={promoCodes.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsSelectionMode(true)}
                    disabled={promoCodes.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Select
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsBulkDialogOpen(true)}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Bulk Create
                  </Button>
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Promo Code
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Percent className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No promo codes yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first promo code</p>
            </div>
          ) : (
            <div className="space-y-4">
              {isSelectionMode && (
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                  <Checkbox
                    checked={selectedPromoCodes.length === promoCodes.length && promoCodes.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
              )}
              {promoCodes.map((promo) => (
                <div
                  key={promo.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {isSelectionMode && (
                        <Checkbox
                          checked={selectedPromoCodes.includes(promo.id)}
                          onCheckedChange={() => toggleSelectPromo(promo.id)}
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-mono text-lg font-semibold">{promo.code}</h3>
                          <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {promo.service_name && (
                            <Badge variant="outline">{promo.service_name}</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Discount</p>
                            <p className="font-medium flex items-center gap-1">
                              {promo.discount_type === 'percentage' ? (
                                <><Percent className="h-3 w-3" /> {promo.discount_value}%</>
                              ) : (
                                <><DollarSign className="h-3 w-3" /> Rp {formatPrice(promo.discount_value)}</>
                              )}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500">Usage</p>
                            <p className="font-medium">
                              {promo.used_count || 0} / {promo.usage_limit || '∞'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500">Valid From</p>
                            <p className="font-medium">
                              {format(new Date(promo.valid_from), 'dd MMM yyyy')}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500">Valid Until</p>
                            <p className="font-medium">
                              {promo.valid_until ? format(new Date(promo.valid_until), 'dd MMM yyyy') : 'No expiry'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {!isSelectionMode && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(promo.code)}
                        >
                          {copiedCode === promo.code ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Switch
                          checked={promo.is_active}
                          onCheckedChange={() => togglePromoStatus(promo)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(promo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(promo.id)}
                          disabled={promo.used_count > 0}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="promo-code">Promo Code</Label>
                <Input
                  id="promo-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., THIRTY5K"
                  disabled={editingPromo}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                  >
                    <SelectTrigger id="discount-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5}>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-value">Discount Value</Label>
                  <Input
                    id="discount-value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service (Optional)</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="all">All services</SelectItem>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage-limit">Usage Limit (Optional)</Label>
                <Input
                  id="usage-limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid-from">Valid From</Label>
                  <Input
                    id="valid-from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="block w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid-until">Valid Until (Optional)</Label>
                  <Input
                    id="valid-until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    min={formData.valid_from || format(new Date(), 'yyyy-MM-dd')}
                    className="block w-full"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingPromo ? 'Update' : 'Create'} Promo Code
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Create Promo Codes</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleBulkSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-prefix">Code Prefix</Label>
                  <Input
                    id="bulk-prefix"
                    value={bulkFormData.prefix}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g., PROMO"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-count">Number of Codes</Label>
                  <Input
                    id="bulk-count"
                    type="number"
                    min="1"
                    max="100"
                    value={bulkFormData.count}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, count: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-discount-type">Discount Type</Label>
                  <Select
                    value={bulkFormData.discount_type}
                    onValueChange={(value) => setBulkFormData({ ...bulkFormData, discount_type: value })}
                  >
                    <SelectTrigger id="bulk-discount-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5}>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-discount-value">Discount Value</Label>
                  <Input
                    id="bulk-discount-value"
                    type="number"
                    value={bulkFormData.discount_value}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, discount_value: e.target.value })}
                    placeholder={bulkFormData.discount_type === 'percentage' ? '10' : '50000'}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-service">Service (Optional)</Label>
                <Select
                  value={bulkFormData.service_id}
                  onValueChange={(value) => setBulkFormData({ ...bulkFormData, service_id: value })}
                >
                  <SelectTrigger id="bulk-service">
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="all">All services</SelectItem>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-usage-limit">Usage Limit per Code (Optional)</Label>
                <Input
                  id="bulk-usage-limit"
                  type="number"
                  value={bulkFormData.usage_limit}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, usage_limit: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-valid-from">Valid From</Label>
                  <Input
                    id="bulk-valid-from"
                    type="date"
                    value={bulkFormData.valid_from}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, valid_from: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="block w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-valid-until">Valid Until (Optional)</Label>
                  <Input
                    id="bulk-valid-until"
                    type="date"
                    value={bulkFormData.valid_until}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, valid_until: e.target.value })}
                    min={bulkFormData.valid_from || format(new Date(), 'yyyy-MM-dd')}
                    className="block w-full"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This will create {bulkFormData.count || 0} unique promo codes with prefix "{bulkFormData.prefix || 'PREFIX'}" 
                  (e.g., {bulkFormData.prefix || 'PREFIX'}A1B2, {bulkFormData.prefix || 'PREFIX'}X7Y9)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsBulkDialogOpen(false);
                  resetBulkForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create {bulkFormData.count} Codes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}