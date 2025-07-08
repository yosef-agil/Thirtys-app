import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/bookings'),
      ]);
      
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

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