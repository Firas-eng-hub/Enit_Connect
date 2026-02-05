import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  GraduationCap, Building2, Handshake, Target, Heart, Globe, Users, 
  Award, CheckCircle, ArrowRight, Mail, MapPin, Phone, Clock,
  Lightbulb, Shield, Zap, Send
} from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import httpClient from '@/shared/api/httpClient';
import { getApiErrorMessage } from '@/shared/lib/utils';
import enitLogo from '@/assets/img/ENIT.png';

export function AboutPage() {
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const contactSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Please enter a valid email'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
  });

  type ContactFormData = z.infer<typeof contactSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitStatus(null);
    try {
      await httpClient.post('/api/admin/message', {
        name: data.name,
        email: data.email,
        message: data.message,
        date: new Date().toISOString(),
      });
      setSubmitStatus({ type: 'success', message: 'Message sent! Our team will get back to you soon.' });
      reset();
    } catch (err) {
      setSubmitStatus({
        type: 'error',
        message: getApiErrorMessage(err, 'Failed to send message. Please try again.'),
      });
    }
  };

  const features = [
    {
      icon: GraduationCap,
      title: 'For Students',
      description: 'Browse internship and job opportunities, build your professional profile, and connect directly with companies looking for talented engineers.',
      gradient: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: Building2,
      title: 'For Companies',
      description: 'Post job offers, search for qualified candidates, and manage applications from ENIT\'s top engineering students all in one place.',
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      icon: Handshake,
      title: 'Easy Matching',
      description: 'Our platform streamlines the recruitment process, making it easy for students and companies to find the perfect match.',
      gradient: 'from-purple-500 to-violet-600',
      bgLight: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: Target,
      title: 'Career Growth',
      description: 'Access opportunities for PFA, PFE, internships, and full-time positions to kickstart your engineering career.',
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  const values = [
    { icon: Heart, title: 'Student-First', description: 'Everything we do is centered around student success' },
    { icon: Shield, title: 'Trust', description: 'Building trusted connections between students and employers' },
    { icon: Lightbulb, title: 'Innovation', description: 'Continuously improving our platform and services' },
    { icon: Zap, title: 'Efficiency', description: 'Streamlining the job search and hiring process' },
  ];

  const stats = [
    { value: '2020', label: 'Founded' },
    { value: '500+', label: 'Students' },
    { value: '50+', label: 'Companies' },
    { value: '95%', label: 'Success Rate' },
  ];

  return (
    <div className="space-y-16">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-4">
          <Heart className="w-4 h-4" />
          About Us
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">About ENIT Connect</h2>
        <p className="text-xl text-gray-500 leading-relaxed">
          Bridging the gap between talented engineering students and leading companies. 
          Your career journey starts here.
        </p>
      </div>

      {/* Mission Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 lg:p-14 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary-50 to-accent-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              ENIT Connect is the official career platform of the National School of Engineers of Tunis (ENIT). 
              Our mission is to bridge the gap between talented engineering students and leading companies, 
              facilitating internships, job placements, and professional development opportunities.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              We believe that every ENIT student deserves access to the best career opportunities, 
              and every company deserves access to Tunisia's brightest engineering talent.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl flex items-center justify-center">
                <img src={enitLogo} alt="ENIT" className="w-40 h-40 object-contain" />
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">500+</div>
                  <div className="text-xs text-gray-500">Students</div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">95%</div>
                  <div className="text-xs text-gray-500">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">What We Offer</h3>
          <p className="text-gray-500">Comprehensive features for students and companies</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.title}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bgLight} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-3xl p-6 sm:p-8 lg:p-14 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-3">Our Values</h3>
            <p className="text-white/70">The principles that guide everything we do</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/15 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-accent-400" />
                  </div>
                  <h4 className="font-bold text-white mb-2">{value.title}</h4>
                  <p className="text-white/60 text-sm">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid gap-6 md:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl font-bold text-primary-900 mb-2">{stat.value}</div>
            <div className="text-gray-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Why Choose Us */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 lg:p-14">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Why Choose ENIT Connect?</h3>
          <p className="text-gray-500">The advantages that set us apart</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { text: 'Direct access to ENIT\'s talent pool', icon: Users },
            { text: 'Verified student profiles and company listings', icon: Shield },
            { text: 'Streamlined application process', icon: Zap },
            { text: 'Real-time notifications for new opportunities', icon: Clock },
            { text: 'Professional networking features', icon: Globe },
            { text: 'Dedicated support for users', icon: Heart },
          ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.text}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Get in Touch</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                <p className="text-gray-600">
                  École Nationale d'Ingénieurs de Tunis<br />
                  BP 37, Le Belvédère<br />
                  1002 Tunis, Tunisia
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                <a href="mailto:contact@enit-connect.tn" className="text-primary-600 hover:text-primary-700 transition-colors">
                  contact@enit-connect.tn
                </a>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                <p className="text-gray-600">+216 71 874 700</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <Send className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Contact Form</h3>
              <p className="text-sm text-gray-500">We usually reply within 1-2 business days.</p>
            </div>
          </div>

          {submitStatus && (
            <Alert
              variant={submitStatus.type === 'success' ? 'success' : 'danger'}
              className="mb-5"
              onClose={() => setSubmitStatus(null)}
            >
              {submitStatus.message}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                {...register('name')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="Your full name"
              />
              {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
              <textarea
                {...register('message')}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                placeholder="Tell us how we can help..."
              />
              {errors.message && <p className="mt-2 text-sm text-red-600">{errors.message.message}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full">
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
