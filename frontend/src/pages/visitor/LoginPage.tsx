import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Building2, Shield, Eye, EyeOff, LogIn, ArrowRight, GraduationCap } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import enitLogo from '@/assets/img/ENIT.png';
import bgImage from '@/assets/img/Acceuil.BG.jpg';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type UserType = 'student' | 'company' | 'admin';

export function LoginPage() {
  const [selectedType, setSelectedType] = useState<UserType>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object') {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      const message = response?.data?.message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(selectedType, data);
      
      const redirects = {
        student: '/user/home',
        company: '/company/home',
        admin: '/admin/home',
      };
      navigate(redirects[selectedType]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const typeOptions = [
    { type: 'student' as UserType, label: 'Student', icon: User, gradient: 'from-blue-500 to-indigo-600' },
    { type: 'company' as UserType, label: 'Company', icon: Building2, gradient: 'from-emerald-500 to-teal-600' },
    { type: 'admin' as UserType, label: 'Admin', icon: Shield, gradient: 'from-purple-500 to-violet-600' },
  ];

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      {/* Animated Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-accent-900/95" />
        {/* Floating orbs for visual interest */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 xl:p-16">
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
            <h2 className="text-4xl sm:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight">
              Your gateway to
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-accent-300 to-yellow-300">
                career success
              </span>
            </h2>
            <p className="mt-8 text-xl text-white/70 max-w-lg leading-relaxed">
              Connect with Tunisia's top engineering talent and leading companies. Build your future with ENIT's premier career platform.
            </p>
          </div>

          <div className="flex items-center gap-10">
            {[
              { value: '500+', label: 'Students' },
              { value: '50+', label: 'Companies' },
              { value: '200+', label: 'Opportunities' },
            ].map((stat, i) => (
              <div key={i} className="text-center group cursor-default">
                <div className="text-4xl xl:text-5xl font-bold text-white group-hover:text-accent-400 transition-colors duration-300">{stat.value}</div>
                <div className="text-white/50 text-sm font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-white/40 text-sm">
          <GraduationCap className="w-5 h-5" />
          <span className="font-medium">École Nationale d'Ingénieurs de Tunis</span>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <Link to="/visitor/news" className="inline-flex flex-col items-center gap-3">
              <img src={enitLogo} alt="ENIT" className="w-14 h-14 object-contain drop-shadow-lg" />
              <span className="text-xl font-bold text-white">ENIT-Connect</span>
            </Link>
          </div>

          {/* Glassmorphism Form Card */}
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/30 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
            
            <div className="relative">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
                <p className="text-gray-500 mt-2">Sign in to continue your journey</p>
              </div>

              {/* User Type Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  I am a:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {typeOptions.map(({ type, label, icon: Icon, gradient }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        'relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 border-2',
                        selectedType === type
                          ? `bg-gradient-to-br ${gradient} text-white shadow-lg shadow-primary-500/25 scale-105 border-transparent`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <Icon className={cn('w-6 h-6', selectedType === type && 'drop-shadow-md')} />
                      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <Alert variant="danger" className="text-sm rounded-xl">
                    {error}
                  </Alert>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="you@enit.utm.tn"
                    className={cn(
                      'w-full px-4 py-3.5 rounded-xl border-2 bg-gray-50/50 text-gray-900 placeholder:text-gray-400',
                      'focus:outline-none focus:ring-0 focus:border-primary-500 focus:bg-white',
                      'transition-all duration-200 font-medium',
                      errors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-100'
                    )}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={cn(
                        'w-full px-4 py-3.5 pr-12 rounded-xl border-2 bg-gray-50/50 text-gray-900 placeholder:text-gray-400',
                        'focus:outline-none focus:ring-0 focus:border-primary-500 focus:bg-white',
                        'transition-all duration-200 font-medium',
                        errors.password ? 'border-red-300 bg-red-50/50' : 'border-gray-100'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold text-base shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <LogIn className="w-5 h-5" />
                      <span>Sign In</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-400 font-medium">New to ENIT-Connect?</span>
                </div>
              </div>

              {/* Register Link */}
              <Link to="/register" className="block">
                <button className="w-full py-4 px-6 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2 group">
                  Create an Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link 
              to="/visitor/news" 
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
