// client/src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BookingTable from '@/components/BookingTable';
import ServiceManager from '@/components/ServiceManager';

export default function AdminDashboard() {
  const [bookingStats, setBookingStats] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/bookings')
      ]);
      
      const stats = await statsRes.json();
      const bookingsData = await bookingsRes.json();
      
      setBookingStats(stats);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bookings.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {bookings.filter(b => b.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              Rp {bookingStats.monthlyRevenue?.toLocaleString('id-ID') || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Monthly Bookings by Service</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingStats.serviceStats || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings">
          <BookingTable bookings={bookings} onUpdate={fetchDashboardData} />
        </TabsContent>
        
        <TabsContent value="services">
          <ServiceManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}