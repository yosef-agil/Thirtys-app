import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';
import BookingTable from '../components/BookingTable';
import ServiceManager from '../components/ServiceManager';
import api from '../services/api';

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
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const admin = localStorage.getItem('admin');
    
    if (!token || !admin) {
      window.location.replace('/admin/login');
      return;
    }
    
    setIsAuthenticated(true);
    setLoading(false);
    loadDashboardData();
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
      
      // If auth error during data loading, redirect
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
        return;
      }
      
      // For other errors, show error but keep user logged in
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
                Rp {stats.monthlyRevenue?.toLocaleString('id-ID') || 0}
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
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingTable bookings={bookings} onUpdate={loadDashboardData} />
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