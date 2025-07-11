import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  LogOut, 
  Search, 
  Trash2, 
  CheckCircle, 
  Download, 
  FileSpreadsheet,
  Calendar,
  Filter,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import BookingTable from '../components/BookingTable';
import ServiceManager from '../components/ServiceManager';
import api from '../services/api';
import * as XLSX from 'xlsx';

// Utility function untuk format harga
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
};

// Service list
const SERVICES = [
  { id: 1, name: 'Self Photo' },
  { id: 2, name: 'Graduation Photography' },
  { id: 3, name: 'Wedding Photography' },
  { id: 4, name: 'Wedding Videography' },
  { id: 5, name: 'Prewedding Photography' },
  { id: 6, name: 'Prewedding Videography' },
  { id: 7, name: 'Photo Product' }
];

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    monthlyBookingsCount: 0,
    pendingBookings: 0,
    serviceStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Selection states
  const [selectedBookings, setSelectedBookings] = useState([]);
  
  const { toast } = useToast();

  // Apply filters
  useEffect(() => {
    let filtered = [...bookings];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => {
        const displayCode = `THIRTY${String(booking.id).padStart(3, '0')}`.toLowerCase();
        return (
          displayCode.includes(query) ||
          booking.booking_code.toLowerCase().includes(query) ||
          booking.customer_name.toLowerCase().includes(query) ||
          booking.phone_number.includes(query) ||
          booking.service_name?.toLowerCase().includes(query) ||
          booking.package_name?.toLowerCase().includes(query)
        );
      });
    }
    
    // Service filter
    if (selectedService !== 'all') {
      filtered = filtered.filter(booking => 
        booking.service_id === parseInt(selectedService)
      );
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => 
        booking.status === selectedStatus
      );
    }
    
    // Month filter
    if (selectedMonth) {
      filtered = filtered.filter(booking => {
        const bookingMonth = format(new Date(booking.booking_date), 'yyyy-MM');
        return bookingMonth === selectedMonth;
      });
    }
    
    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedService, selectedStatus, selectedMonth, bookings]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        const admin = localStorage.getItem('admin');
        
        if (!token || !admin) {
          console.log('No token or admin found, redirecting to login');
          window.location.href = '/admin/login';
          return;
        }
        
        setIsAuthenticated(true);
        await loadDashboardData();
        
      } catch (error) {
        console.error('Auth check failed:', error);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('admin');
          window.location.href = '/admin/login';
        } else {
          setError('Failed to load dashboard data');
          setIsAuthenticated(true);
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndLoadData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      const [statsRes, bookingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/bookings'),
      ]);
      
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
        return;
      }
      
      setError('Failed to load dashboard data');
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    window.location.href = '/admin/login';
  };

  // Bulk action handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedBookings(currentBookings.map(b => b.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleSelectBooking = (bookingId, checked) => {
    if (checked) {
      setSelectedBookings([...selectedBookings, bookingId]);
    } else {
      setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedBookings.length === 0) {
      toast({
        title: 'No bookings selected',
        description: 'Please select at least one booking',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (action === 'confirm') {
        await Promise.all(
          selectedBookings.map(id => 
            api.patch(`/bookings/${id}/status`, { status: 'confirmed' })
          )
        );
        toast({
          title: 'Success',
          description: `${selectedBookings.length} bookings confirmed`,
        });
      } else if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${selectedBookings.length} bookings?`)) {
          return;
        }
        await Promise.all(
          selectedBookings.map(id => api.delete(`/bookings/${id}`))
        );
        toast({
          title: 'Success',
          description: `${selectedBookings.length} bookings deleted`,
        });
      }
      
      await loadDashboardData();
      setSelectedBookings([]);
      
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} bookings`,
        variant: 'destructive',
      });
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredBookings.map(booking => ({
      'Booking Code': `THIRTY${String(booking.id).padStart(3, '0')}`,
      'Customer Name': booking.customer_name,
      'Phone': booking.phone_number,
      'Service': booking.service_name,
      'Package': booking.package_name,
      'Date': format(new Date(booking.booking_date), 'dd/MM/yyyy'),
      'Time': booking.start_time ? `${booking.start_time} - ${booking.end_time}` : '-',
      'Total Price': booking.total_price,
      'Payment Type': booking.payment_type?.replace('_', ' '),
      'Payment Method': booking.payment_method || '-',
      'Status': booking.status,
      'Created At': format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    
    // Generate filename with date
    const fileName = `bookings_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: 'Success',
      description: 'Bookings exported to Excel',
    });
  };

  const exportToCSV = () => {
    const dataToExport = filteredBookings.map(booking => ({
      'Booking Code': `THIRTY${String(booking.id).padStart(3, '0')}`,
      'Customer Name': booking.customer_name,
      'Phone': booking.phone_number,
      'Service': booking.service_name,
      'Package': booking.package_name,
      'Date': format(new Date(booking.booking_date), 'dd/MM/yyyy'),
      'Time': booking.start_time ? `${booking.start_time} - ${booking.end_time}` : '-',
      'Total Price': booking.total_price,
      'Payment Type': booking.payment_type?.replace('_', ' '),
      'Payment Method': booking.payment_method || '-',
      'Status': booking.status,
      'Created At': format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Success',
      description: 'Bookings exported to CSV',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedService('all');
    setSelectedStatus('all');
    setSelectedMonth('');
  };

  const hasActiveFilters = searchQuery || selectedService !== 'all' || selectedStatus !== 'all' || selectedMonth;

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          
          <div className="text-center py-12">
            <p className="text-red-600 mb-4 text-lg">{error}</p>
            <Button onClick={loadDashboardData}>Retry Loading Data</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Error Banner */}
        {error && bookings.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={loadDashboardData} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.monthlyBookingsCount}</p>
              <p className="text-sm text-gray-500">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pendingBookings}</p>
              <p className="text-sm text-gray-500">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                Rp {formatPrice(stats.monthlyRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings">
          <TabsList className="mb-4">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <CardTitle>Recent Bookings</CardTitle>
                    
                    {/* Export Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToExcel}
                        disabled={filteredBookings.length === 0}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        disabled={filteredBookings.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                  
                  {/* Filters Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search Bar */}
                    <div className="relative lg:col-span-2">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search bookings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    
                    {/* Service Filter */}
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Services" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Services</SelectItem>
                        {SERVICES.map(service => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Status Filter */}
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Month Filter */}
                    <div className="relative">
                      <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  {/* Active Filters & Clear Button */}
                  {hasActiveFilters && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Active filters:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear filters
                      </Button>
                    </div>
                  )}
                  
                  {/* Quick Actions */}
                  {selectedBookings.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('confirm')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm ({selectedBookings.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleBulkAction('delete')}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete ({selectedBookings.length})
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <BookingTable 
                  bookings={currentBookings} 
                  onUpdate={loadDashboardData}
                  selectedBookings={selectedBookings}
                  onSelectBooking={handleSelectBooking}
                  onSelectAll={handleSelectAll}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalBookings={filteredBookings.length}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <ServiceManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}