import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, Calendar, Users, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Capture Your Perfect Moments
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Professional photo studio for all your special occasions
          </p>
          <Link to="/booking">
            <Button size="lg" className="text-lg px-8 py-6">
              Book Your Session
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon={<Camera className="w-12 h-12" />}
              title="Self Photo"
              description="Professional self-portrait sessions with studio lighting"
            />
            <ServiceCard
              icon={<Users className="w-12 h-12" />}
              title="Graduation Photography"
              description="Capture your academic milestone with style"
            />
            <ServiceCard
              icon={<Star className="w-12 h-12" />}
              title="Wedding & Prewedding"
              description="Beautiful moments for your special day"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book?</h2>
          <p className="text-xl mb-8">Choose your perfect package and schedule your session today</p>
          <Link to="/booking">
            <Button size="lg" variant="secondary">
              Book Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}