import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Search, Trash2, CheckCircle } from 'lucide-react';
import BookingTable from '../components/BookingTable';
import ServiceManager from '../components/ServiceManager';
import api from '../services/api';

// Utility function untuk format harga
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
};

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    monthlyBookingsCount: 0,
    pendingBookings: 0,
    serviceStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookings, setSelectedBookings] = useState([]);
  const { toast } = useToast();

  // Filtered bookings based on search
  const filteredBookings = bookings.filter(booking => {
    const query = searchQuery.toLowerCase();
    return (
      booking.booking_code.toLowerCase().includes(query) ||
      booking.customer_name.toLowerCase().includes(query) ||
      booking.phone_number.includes(query) ||
      booking.service_name?.toLowerCase().includes(query) ||
      booking.package_name?.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        setLoading(true);
        
        // Check localStorage first
        const token = localStorage.getItem('token');
        const admin = localStorage.getItem('admin');
        
        if (!token || !admin) {
          console.log('No token or admin found, redirecting to login');
          window.location.href = '/admin/login';
          return;
        }
        
        // Set authenticated state
        setIsAuthenticated(true);
        
        // Load dashboard data
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
      setSelectedBookings(filteredBookings.map(b => b.id));
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
        // Bulk confirm
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
        // Bulk delete
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

  // Don't render anything if not authenticated (prevent flash)
  if (!isAuthenticated) {
    return null;
  }

  // Show error state but keep dashboard structure
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

        {/* Error Banner (if error but data exists) */}
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>Recent Bookings</CardTitle>
                  
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                {/* Quick Actions */}
                {selectedBookings.length > 0 && (
                  <div className="flex gap-2 mt-4">
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
              </CardHeader>
              <CardContent>
                <BookingTable 
                  bookings={filteredBookings} 
                  onUpdate={loadDashboardData}
                  selectedBookings={selectedBookings}
                  onSelectBooking={handleSelectBooking}
                  onSelectAll={handleSelectAll}
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