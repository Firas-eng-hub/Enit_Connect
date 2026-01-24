import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Newspaper, BarChart3, Users, Info, LogIn, UserPlus, Menu, X, GraduationCap, Mail, MapPin, Phone } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import enitLogo from '@/assets/img/ENIT.png';
import bgImage from '@/assets/img/Acceuil.BG.jpg';

const navItems = [
  { path: '/visitor/news', label: 'News', icon: Newspaper },
  { path: '/visitor/statistics', label: 'Statistics', icon: BarChart3 },
  { path: '/visitor/how-it-works', label: 'How It Works', icon: Users },
  { path: '/visitor/about', label: 'About', icon: Info },
];

export function VisitorLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Show hero section only on the news/home page
  const isHomePage = location.pathname === '/visitor/news' || location.pathname === '/visitor' || location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Background */}
      <div className={cn("relative", isHomePage ? "" : "bg-primary-900")}>
        {/* Background Image - only on home page */}
        {isHomePage && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${bgImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary-900/95 via-primary-900/90 to-primary-900/95" />
          </div>
        )}

        {/* Top Navigation */}
        <header className="relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo */}
              <Link to="/visitor/news" className="flex items-center gap-3 group">
                <img src={enitLogo} alt="ENIT Logo" className="w-11 h-11 object-contain drop-shadow-lg" />
                <div>
                  <h1 className="text-xl font-bold text-white">ENIT-Connect</h1>
                  <p className="text-xs text-white/60 font-medium">Career Platform</p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-white/20 text-white backdrop-blur-sm'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Auth buttons */}
              <div className="hidden md:flex items-center gap-3">
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white/80 hover:text-white hover:bg-white/10 border-white/20"
                    leftIcon={<LogIn className="w-4 h-4" />}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    size="sm" 
                    className="bg-white text-primary-900 hover:bg-white/90 shadow-lg"
                    leftIcon={<UserPlus className="w-4 h-4" />}
                  >
                    Register
                  </Button>
                </Link>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute inset-x-0 top-full bg-primary-900/98 backdrop-blur-xl border-t border-white/10 animate-slide-up">
              <nav className="px-4 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="pt-4 border-t border-white/10 mt-4 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-white text-primary-900"
                  >
                    <UserPlus className="w-5 h-5" />
                    Register
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </header>

        {/* Hero Content - only on home page */}
        {isHomePage && (
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4 text-accent-400" />
                École Nationale d'Ingénieurs de Tunis
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                Your gateway to
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-accent-300 to-yellow-300">
                  career success
                </span>
              </h1>
              <p className="mt-6 text-xl text-white/70 max-w-2xl leading-relaxed">
                Connect with Tunisia's top engineering talent and leading companies. Build your future with ENIT's premier career platform.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-primary-900 hover:bg-white/90 shadow-xl px-8">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/visitor/about">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar - only on home page */}
        {isHomePage && (
          <div className="relative z-10 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: '500+', label: 'Students' },
                  { value: '50+', label: 'Partner Companies' },
                  { value: '200+', label: 'Job Opportunities' },
                  { value: '95%', label: 'Success Rate' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-white">{stat.value}</div>
                    <div className="text-white/50 text-sm font-medium mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Outlet />
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="bg-primary-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img src={enitLogo} alt="ENIT Logo" className="w-11 h-11 object-contain" />
                <div>
                  <h3 className="font-bold text-lg text-white">ENIT-Connect</h3>
                  <p className="text-sm text-white/60">Career Platform</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Connecting ENIT's talented engineering students with leading companies and career opportunities since 2020.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-6 text-white/90">Platform</h4>
              <ul className="space-y-3 text-sm">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Users */}
            <div>
              <h4 className="font-semibold mb-6 text-white/90">Get Started</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">For Students</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Companies</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-6 text-white/90">Contact</h4>
              <ul className="space-y-4 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" />
                  <span>École Nationale d'Ingénieurs de Tunis<br />BP 37, Le Belvédère<br />1002 Tunis, Tunisia</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-accent-400 flex-shrink-0" />
                  <a href="mailto:contact@enit.utm.tn" className="hover:text-white transition-colors">contact@enit.utm.tn</a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-accent-400 flex-shrink-0" />
                  <span>+216 71 874 700</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} ENIT Connect. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
