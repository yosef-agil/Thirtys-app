import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Calendar, 
  Users, 
  Star, 
  ChevronRight,
  Check,
  Clock,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Award,
  Heart,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">Thirtys Studio</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-600 hover:text-gray-900 transition-colors">Services</a>
              <a href="#gallery" className="text-gray-600 hover:text-gray-900 transition-colors">Gallery</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
              <Link to="/booking">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Gallery Style */}
      <section className="relative min-h-screen pt-16 overflow-hidden bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
                  Professional Photography Studio
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Capture Your
                  <span className="block text-blue-600">Perfect Moments</span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                  From graduation photos to wedding memories, we help you preserve life's most precious moments with professional photography services.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/booking">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 text-base gap-2">
                    Book Your Session
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-xl px-8 h-12 text-base"
                  onClick={() => document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' })}
                >
                  View Our Work
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t">
                <div>
                  <p className="text-3xl font-bold text-gray-900">500+</p>
                  <p className="text-sm text-gray-600">Happy Clients</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">1000+</p>
                  <p className="text-sm text-gray-600">Photos Taken</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">5.0</p>
                  <p className="text-sm text-gray-600">Rating Score</p>
                </div>
              </div>
            </div>

            {/* Right Gallery Grid */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* Top Left - Tall Image */}
                <div className="row-span-2">
                  <img 
                    src="https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400&h=600&fit=crop" 
                    alt="Graduation photo"
                    className="w-full h-full object-cover rounded-2xl shadow-xl"
                  />
                </div>
                {/* Top Right */}
                <div>
                  <img 
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=290&fit=crop" 
                    alt="Wedding photo"
                    className="w-full h-full object-cover rounded-2xl shadow-xl"
                  />
                </div>
                {/* Bottom Right */}
                <div>
                  <img 
                    src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=290&fit=crop" 
                    alt="Self photo"
                    className="w-full h-full object-cover rounded-2xl shadow-xl"
                  />
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-amber-100 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Our Services
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Photography Services We Offer
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional photography services for every special moment in your life
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon={<Camera className="w-8 h-8" />}
              title="Self Photo"
              description="Professional self-portrait sessions with studio lighting and various backdrops"
              features={["30-60 min session", "10+ edited photos", "Props included"]}
              price="Starting from Rp 50,000"
            />
            <ServiceCard
              icon={<Users className="w-8 h-8" />}
              title="Graduation Photography"
              description="Capture your academic milestone with professional graduation photos"
              features={["Indoor & outdoor", "Group packages", "Gown rental available"]}
              price="Starting from Rp 300,000"
              popular
            />
            <ServiceCard
              icon={<Heart className="w-8 h-8" />}
              title="Wedding & Prewedding"
              description="Beautiful moments captured for your special day"
              features={["Full day coverage", "2 photographers", "Video available"]}
              price="Starting from Rp 3,000,000"
            />
          </div>
        </div>
      </section>

      {/* Gallery Preview Section */}
      <section id="gallery" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Portfolio
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Recent Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Take a look at some of our best photography work
            </p>
          </div>

          {/* Masonry Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className={cn(
                  "relative overflow-hidden rounded-xl group cursor-pointer",
                  image.size === 'tall' && "md:row-span-2",
                  image.size === 'wide' && "md:col-span-2"
                )}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <p className="text-white font-medium">{image.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Makes Us Different
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Award className="w-8 h-8" />}
              title="Professional Team"
              description="Experienced photographers with years of expertise"
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Fast Delivery"
              description="Get your edited photos within 3-5 business days"
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Premium Quality"
              description="High-resolution photos with professional editing"
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Satisfaction Guarantee"
              description="100% satisfaction or we'll reshoot for free"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Testimonials
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
          </div>

          <div className="relative">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8 md:p-12">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xl text-gray-700 mb-6 italic">
                    "{testimonials[activeTestimonial].content}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonials[activeTestimonial].name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {testimonials[activeTestimonial].service}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === activeTestimonial
                      ? "w-8 bg-blue-600"
                      : "bg-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Pricing
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple & Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the perfect package for your photography needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              title="Self Photo Basic"
              price="50,000"
              features={[
                "30 minutes session",
                "10 edited photos",
                "1 backdrop choice",
                "Basic props included"
              ]}
            />
            <PricingCard
              title="Graduation Premium"
              price="500,000"
              features={[
                "2 hours session",
                "30 edited photos",
                "Indoor & outdoor",
                "Gown rental included",
                "Group photo session"
              ]}
              popular
            />
            <PricingCard
              title="Wedding Full Day"
              price="8,000,000"
              features={[
                "Full day coverage",
                "200+ edited photos",
                "2 photographers",
                "Pre-wedding consultation",
                "Online gallery"
              ]}
            />
          </div>

          <div className="text-center mt-12">
            <Link to="/booking">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8">
                View All Packages
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold mb-6">Get In Touch</h2>
              <p className="text-gray-300 mb-8">
                Ready to book your photography session? Contact us today and let's create beautiful memories together.
              </p>
              
              <div className="space-y-4">
                <ContactItem
                  icon={<MapPin className="w-5 h-5" />}
                  text="Jakarta, Indonesia"
                />
                <ContactItem
                  icon={<Phone className="w-5 h-5" />}
                  text="+62 812-3456-7890"
                />
                <ContactItem
                  icon={<Mail className="w-5 h-5" />}
                  text="hello@thirtysstudio.com"
                />
                <ContactItem
                  icon={<Instagram className="w-5 h-5" />}
                  text="@thirtysstudio"
                />
              </div>

              <div className="mt-8">
                <Link to="/booking">
                  <Button 
                    size="lg" 
                    className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl"
                  >
                    Book Your Session Now
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Studio Hours</h3>
              <div className="space-y-3">
                <HoursItem day="Monday - Friday" hours="09:00 - 18:00" />
                <HoursItem day="Saturday" hours="09:00 - 17:00" />
                <HoursItem day="Sunday" hours="10:00 - 16:00" />
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-700">
                <p className="text-gray-400 text-sm">
                  Special appointments available outside regular hours. Contact us for more information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2025 Thirtys Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Component Definitions
function ServiceCard({ icon, title, description, features, price, popular }) {
  return (
    <Card className={cn(
      "relative border-0 shadow-lg hover:shadow-xl transition-all duration-300",
      popular && "ring-2 ring-blue-600"
    )}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-4">Most Popular</Badge>
        </div>
      )}
      <CardContent className="p-6">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">Starting from</p>
          <p className="text-lg font-bold text-gray-900">{price}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({ title, price, features, popular }) {
  return (
    <Card className={cn(
      "relative border-0 shadow-lg hover:shadow-xl transition-all duration-300",
      popular && "ring-2 ring-blue-600 scale-105"
    )}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-4">Recommended</Badge>
        </div>
      )}
      <CardContent className="p-8">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <div className="mb-6">
          <p className="text-3xl font-bold text-gray-900">
            Rp {price}
            <span className="text-sm font-normal text-gray-500">/session</span>
          </p>
        </div>
        
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start text-gray-600">
              <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              {feature}
            </li>
          ))}
        </ul>
        
        <Link to="/booking">
          <Button 
            className={cn(
              "w-full rounded-xl",
              popular 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            )}
          >
            Choose This Package
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ContactItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <span className="text-gray-300">{text}</span>
    </div>
  );
}

function HoursItem({ day, hours }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{day}</span>
      <span className="text-white font-medium">{hours}</span>
    </div>
  );
}

// Data
const galleryImages = [
  { url: "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=400&h=400&fit=crop", alt: "Graduation", category: "Graduation", size: "normal" },
  { url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=600&fit=crop", alt: "Wedding", category: "Wedding", size: "tall" },
  { url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&h=400&fit=crop", alt: "Prewedding", category: "Prewedding", size: "wide" },
  { url: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop", alt: "Self Photo", category: "Self Photo", size: "normal" },
  { url: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400&h=400&fit=crop", alt: "Graduation", category: "Graduation", size: "normal" },
  { url: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=400&fit=crop", alt: "Wedding", category: "Wedding", size: "normal" },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    service: "Graduation Photography",
    content: "Thirtys Studio made my graduation day extra special! The photographers were professional and captured every precious moment perfectly."
  },
  {
    name: "Michael & Emma",
    service: "Wedding Photography",
    content: "We couldn't be happier with our wedding photos! The team was amazing and the results exceeded our expectations."
  },
  {
    name: "Lisa Chen",
    service: "Self Photo Session",
    content: "Had an amazing self photo session! The studio setup was perfect and the staff helped me feel comfortable throughout."
  }
];