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
  X,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Activity,
  Package,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import BookingTable from '../components/BookingTable';
import ServiceManager from '../components/ServiceManager';
import TimeSlotManager from '../components/TimeSlotManager';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import PromoCodeManager from '../components/PromoCodeManager';
import { trackEvent } from '../lib/utils/analytics';

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

// Modern Stats Card Component
const StatsCard = ({ title, value, subtitle, icon: Icon, trend }) => {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-3 rounded-xl bg-gray-50">
              <Icon className="h-5 w-5 text-gray-600" />
            </div>
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">{trend}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const QuickActions = ({ selectedCount, onBulkAction }) => {
  if (selectedCount === 0) return null;
  
  return (
    <div className="animate-in slide-in-from-bottom duration-300 fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">
          {selectedCount} items selected
        </span>
        <div className="h-4 w-px bg-gray-300" />
        <Button
          size="sm"
          variant="outline"
          onClick={() => onBulkAction('confirm')}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Confirm All
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onBulkAction('delete')}
          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <Trash2 className="h-4 w-4" />
          Delete All
        </Button>
      </div>
    </div>
  );
};

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

  useEffect(() => {
  trackEvent('Admin', 'dashboard_accessed');
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

      trackEvent('Admin', 'dashboard_loaded', 'bookings_count', bookingsRes.data.length);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);

      trackEvent('Admin', 'dashboard_error', error.message);
      
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
      trackEvent('Admin', `bulk_${action}`, 'count', selectedBookings.length);
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
    trackEvent('Admin', 'export_excel', 'count', filteredBookings.length);
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
    trackEvent('Admin', 'export_csv', 'count', filteredBookings.length);
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

  useEffect(() => {
  if (searchQuery) {
    trackEvent('Admin', 'search_used', searchQuery);
  }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedService !== 'all') {
      trackEvent('Admin', 'filter_service', selectedService);
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedStatus !== 'all') {
      trackEvent('Admin', 'filter_status', selectedStatus);
    }
  }, [selectedStatus]);

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
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 animate-pulse">
            <Activity className="h-10 w-10 text-white" />
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Thirtys Admin
            </h1>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="rounded-xl hover:bg-gray-100 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <Card className="max-w-md mx-auto mt-20">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 mb-4 text-lg font-medium">{error}</p>
              <Button 
                onClick={loadDashboardData}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Retry Loading Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate additional stats
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const totalCustomers = new Set(bookings.map(b => b.phone_number)).size;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Thirtys Admin
            </h1>
            <p className="text-gray-600 mt-1">Manage your bookings and services</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {format(new Date(), 'EEEE, dd MMMM yyyy')}
            </span>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="rounded-xl hover:bg-gray-100 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && bookings.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadDashboardData} 
              className="rounded-lg"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Monthly Revenue"
            value={`Rp ${formatPrice(stats.monthlyRevenue || 0)}`}
            subtitle="This month"
            icon={DollarSign}
            trend="+12%"
          />
          <StatsCard
            title="Total Bookings"
            value={stats.monthlyBookingsCount || 0}
            subtitle="This month"
            icon={Activity}
            trend="+8%"
          />
          <StatsCard
            title="Pending Bookings"
            value={stats.pendingBookings || 0}
            subtitle="Awaiting confirmation"
            icon={Clock}
          />
          <StatsCard
            title="Total Customers"
            value={totalCustomers}
            subtitle="Unique customers"
            icon={Users}
          />
        </div>

        {/* Top Services */}
        {stats.serviceStats && stats.serviceStats.length > 0 && stats.serviceStats.some(s => s.service_name) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Services</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {stats.serviceStats
                .filter(service => service.service_name && service.booking_count > 0)
                .slice(0, 3)
                .map((service, index) => (
                  <Card key={index} className="hover:shadow-md transition-all duration-200 border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{service.service_name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {service.booking_count} bookings
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Revenue</p>
                          <p className="font-semibold text-blue-600">
                            Rp {formatPrice(service.total_revenue || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-4" onValueChange={(value) => {trackEvent('Admin', 'tab_changed', value);}}>
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl">
            <TabsTrigger 
              value="bookings" 
              className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Bookings
            </TabsTrigger>
            <TabsTrigger 
              value="services"
              className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Services
            </TabsTrigger>
            <TabsTrigger 
              value="timeslots"
              className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Time Slots
            </TabsTrigger>
            <TabsTrigger 
              value="promocodes"
              className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Promo Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <CardTitle className="text-xl">Recent Bookings</CardTitle>
                    
                    {/* Export Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToExcel}
                        disabled={filteredBookings.length === 0}
                        className="rounded-lg hover:bg-gray-100"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        disabled={filteredBookings.length === 0}
                        className="rounded-lg hover:bg-gray-100"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </div>
                  </div>
                  
                  {/* Filters Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search Bar */}
                    <div className="relative lg:col-span-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search bookings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    
                    {/* Service Filter */}
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200">
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
                      <SelectTrigger className="h-11 rounded-xl border-gray-200">
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
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                      <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  
                  {/* Active Filters & Clear Button */}
                  {hasActiveFilters && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Active filters</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7 rounded-lg hover:bg-gray-100"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear all
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

          <TabsContent value="timeslots">
            <TimeSlotManager />
          </TabsContent>

          <TabsContent value="promocodes">
            <PromoCodeManager />
          </TabsContent>
        </Tabs>
        
        {/* Quick Actions Floating Bar */}
        <QuickActions 
          selectedCount={selectedBookings.length} 
          onBulkAction={handleBulkAction}
        />
      </div>
    </div>
  );
}