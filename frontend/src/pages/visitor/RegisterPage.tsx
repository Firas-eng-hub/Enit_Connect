import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Building2, Eye, EyeOff, CheckCircle, UserPlus, ArrowLeft, Mail, Lock, Briefcase, GraduationCap, Sparkles, Globe, MapPin, Phone } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import enitLogo from '@/assets/img/ENIT.png';
import bgImage from '@/assets/img/Acceuil.BG.jpg';

const studentSchema = z.object({
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  class: z.string().optional(),
  promotion: z.string().optional(),
});

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  website: z.string().min(1, 'Website is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(1, 'Phone is required'),
  about: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;
type CompanyFormData = z.infer<typeof companySchema>;
type UserType = 'student' | 'company';

const classes = [
  '1st CS 1', '1st CS 2', '1st CS 3',
  '2nd CS 1', '2nd CS 2', '2nd CS 3',
  '3rd CS 1', '3rd CS 2', '3rd CS 3',
  '1st Tel 1', '1st Tel 2', '1st Tel 3',
  '2nd Tel 1', '2nd Tel 2', '2nd Tel 3',
  '3rd Tel 1', '3rd Tel 2', '3rd Tel 3',
];

export function RegisterPage() {
  const [selectedType, setSelectedType] = useState<UserType>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2000 + 5 }, (_, i) => (2000 + i).toString());

  const onSubmitStudent = async (data: StudentFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await httpClient.post('/api/student/signup', { ...data, type: 'student' });
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitCompany = async (data: CompanyFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await httpClient.post('/api/company/signup', data);
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success State
  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-primary-800/90 to-primary-900/95" />
        </div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 text-center border border-white/30">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 mb-6 shadow-xl shadow-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">You're all set!</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              We've sent a 6-digit verification code to your inbox. Enter it to activate your account.
            </p>
            <div className="space-y-3">
              <Link to={`/verify?type=${selectedType}`}>
                <Button className="w-full py-4 rounded-xl font-bold shadow-lg shadow-primary-500/30" size="lg">
                  Enter Verification Code
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="w-full py-4 rounded-xl font-bold" size="lg">
                  Continue to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = (hasError: boolean) => cn(
    'w-full px-4 py-3.5 rounded-xl border-2 bg-gray-50/50 text-gray-900 placeholder:text-gray-400',
    'focus:outline-none focus:ring-0 focus:border-primary-500 focus:bg-white',
    'transition-all duration-200 font-medium',
    hasError ? 'border-red-300 bg-red-50/50' : 'border-gray-100'
  );

  const selectClass = cn(
    'w-full px-4 py-3.5 rounded-xl border-2 bg-gray-50/50 text-gray-900',
    'focus:outline-none focus:ring-0 focus:border-primary-500 focus:bg-white',
    'transition-all duration-200 font-medium border-gray-100 cursor-pointer'
  );

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      {/* Animated Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-accent-900/95" />
        {/* Floating orbs */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 relative z-10 flex-col justify-between p-12 xl:p-16">
        <div>
          <Link to="/visitor/news" className="inline-flex items-center gap-3 group">
            <img src={enitLogo} alt="ENIT" className="w-14 h-14 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">ENIT-Connect</h1>
              <p className="text-white/60 text-sm font-medium">Career Platform</p>
            </div>
          </Link>
        </div>

        <div className="space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-accent-400" />
              Join our growing community
            </div>
            <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight">
              Start your
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-accent-300 to-yellow-300">
                success story
              </span>
            </h2>
            <p className="mt-8 text-xl text-white/70 max-w-lg leading-relaxed">
              Create your account and unlock access to exclusive internship opportunities, career resources, and a network of industry professionals.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              { icon: Briefcase, text: 'Access to exclusive job opportunities' },
              { icon: GraduationCap, text: 'Connect with ENIT alumni network' },
              { icon: Mail, text: 'Get notified about new positions' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 text-white/70">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-accent-400" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-white/40 text-sm">
          <GraduationCap className="w-5 h-5" />
          <span className="font-medium">École Nationale d'Ingénieurs de Tunis</span>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-7/12 relative z-10 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/visitor/news" className="inline-flex flex-col items-center gap-3">
              <img src={enitLogo} alt="ENIT" className="w-14 h-14 object-contain drop-shadow-lg" />
              <span className="text-xl font-bold text-white">ENIT-Connect</span>
            </Link>
          </div>

          {/* Back link */}
          <Link
            to="/visitor/news"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Glassmorphism Form Card */}
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/30 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-accent-100 to-primary-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
            
            <div className="relative">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create your account</h2>
                <p className="text-gray-500 mt-2">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>

              {/* User Type Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  I want to register as:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedType('student')}
                    className={cn(
                      'relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border-2',
                      selectedType === 'student'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border-transparent'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      selectedType === 'student' ? 'bg-white/20' : 'bg-white'
                    )}>
                      <User className={cn('w-6 h-6', selectedType === 'student' ? 'text-white' : 'text-blue-600')} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold">Student</div>
                      <div className={cn('text-xs', selectedType === 'student' ? 'text-white/70' : 'text-gray-400')}>
                        Find opportunities
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedType('company')}
                    className={cn(
                      'relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border-2',
                      selectedType === 'company'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 border-transparent'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      selectedType === 'company' ? 'bg-white/20' : 'bg-white'
                    )}>
                      <Building2 className={cn('w-6 h-6', selectedType === 'company' ? 'text-white' : 'text-emerald-600')} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold">Company</div>
                      <div className={cn('text-xs', selectedType === 'company' ? 'text-white/70' : 'text-gray-400')}>
                        Hire top talent
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="danger" className="text-sm rounded-xl mb-6">
                  {error}
                </Alert>
              )}

              {/* Student Form */}
              {selectedType === 'student' && (
                <form onSubmit={studentForm.handleSubmit(onSubmitStudent)} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">First name</label>
                      <input
                        {...studentForm.register('firstname')}
                        placeholder="John"
                        className={inputClass(!!studentForm.formState.errors.firstname)}
                      />
                      {studentForm.formState.errors.firstname && (
                        <p className="mt-1.5 text-sm text-red-600">{studentForm.formState.errors.firstname.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Last name</label>
                      <input
                        {...studentForm.register('lastname')}
                        placeholder="Doe"
                        className={inputClass(!!studentForm.formState.errors.lastname)}
                      />
                      {studentForm.formState.errors.lastname && (
                        <p className="mt-1.5 text-sm text-red-600">{studentForm.formState.errors.lastname.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1.5 text-gray-400" />
                      Email Address
                    </label>
                    <input
                      {...studentForm.register('email')}
                      type="email"
                      placeholder="john.doe@enit.utm.tn"
                      className={inputClass(!!studentForm.formState.errors.email)}
                    />
                    {studentForm.formState.errors.email && (
                      <p className="mt-1.5 text-sm text-red-600">{studentForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-1.5 text-gray-400" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...studentForm.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={inputClass(!!studentForm.formState.errors.password)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {studentForm.formState.errors.password && (
                      <p className="mt-1.5 text-sm text-red-600">{studentForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                      <select {...studentForm.register('class')} className={selectClass}>
                        <option value="">Select class</option>
                        {classes.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Promotion</label>
                      <select {...studentForm.register('promotion')} className={selectClass}>
                        <option value="">Select year</option>
                        {years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold text-base shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 mt-6"
                    size="lg"
                    disabled={isLoading}
                    leftIcon={!isLoading && <UserPlus className="w-5 h-5" />}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      'Create Student Account'
                    )}
                  </Button>
                </form>
              )}

              {/* Company Form */}
              {selectedType === 'company' && (
                <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Building2 className="w-4 h-4 inline mr-1.5 text-gray-400" />
                      Company Name
                    </label>
                    <input
                      {...companyForm.register('name')}
                      placeholder="Acme Corporation"
                      className={inputClass(!!companyForm.formState.errors.name)}
                    />
                    {companyForm.formState.errors.name && (
                      <p className="mt-1.5 text-sm text-red-600">{companyForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1.5 text-gray-400" />
                      Business Email
                    </label>
                    <input
                      {...companyForm.register('email')}
                      type="email"
                      placeholder="contact@company.com"
                      className={inputClass(!!companyForm.formState.errors.email)}
                    />
                    {companyForm.formState.errors.email && (
                      <p className="mt-1.5 text-sm text-red-600">{companyForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-1.5 text-gray-400" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...companyForm.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={inputClass(!!companyForm.formState.errors.password)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {companyForm.formState.errors.password && (
                      <p className="mt-1.5 text-sm text-red-600">{companyForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-1.5 text-gray-400" />
                      Website
                    </label>
                    <input
                      {...companyForm.register('website')}
                      type="url"
                      placeholder="https://www.company.com"
                      className={inputClass(!!companyForm.formState.errors.website)}
                    />
                    {companyForm.formState.errors.website && (
                      <p className="mt-1.5 text-sm text-red-600">{companyForm.formState.errors.website.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1.5 text-gray-400" />
                      Phone Number
                    </label>
                    <input
                      {...companyForm.register('phone')}
                      type="tel"
                      placeholder="+216 XX XXX XXX"
                      className={inputClass(!!companyForm.formState.errors.phone)}
                    />
                    {companyForm.formState.errors.phone && (
                      <p className="mt-1.5 text-sm text-red-600">{companyForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1.5 text-gray-400" />
                      Address
                    </label>
                    <input
                      {...companyForm.register('address')}
                      placeholder="123 Business Street"
                      className={inputClass(!!companyForm.formState.errors.address)}
                    />
                    {companyForm.formState.errors.address && (
                      <p className="mt-1.5 text-sm text-red-600">{companyForm.formState.errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <input
                        {...companyForm.register('city')}
                        placeholder="Tunis"
                        className={inputClass(!!companyForm.formState.errors.city)}
                      />
                      {companyForm.formState.errors.city && (
                        <p className="mt-1.5 text-sm text-red-600">{companyForm.formState.errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                      <input
                        {...companyForm.register('country')}
                        placeholder="Tunisia"
                        className={inputClass(!!companyForm.formState.errors.country)}
                      />
                      {companyForm.formState.errors.country && (
                        <p className="mt-1.5 text-sm text-red-600">{companyForm.formState.errors.country.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">About Company (Optional)</label>
                    <textarea
                      {...companyForm.register('about')}
                      rows={3}
                      placeholder="Tell us about your company..."
                      className={cn(inputClass(false), 'resize-none')}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold text-base shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 mt-6"
                    size="lg"
                    disabled={isLoading}
                    leftIcon={!isLoading && <UserPlus className="w-5 h-5" />}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      'Create Company Account'
                    )}
                  </Button>
                </form>
              )}

              {/* Terms */}
              <p className="text-center text-xs text-gray-400 mt-6">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
