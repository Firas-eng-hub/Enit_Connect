import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import httpClient from '@/shared/api/httpClient';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    'Password must include uppercase, lowercase, number, and special character'
  );

const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]{8,20}$/, 'Phone number must be 8-20 digits');

const schema = z.object({
  name: z.string().min(2, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  website: z.string().url('Invalid URL'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  phone: phoneSchema,
  about: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function RegisterCompany() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await httpClient.post('/api/company/signup', data);
      setSuccessEmail(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Registration Successful!</h3>
        <p className="text-gray-500">Please check your email to verify your account.</p>
        <div className="mt-4">
          <a
            href={`/verify?type=company${successEmail ? `&email=${encodeURIComponent(successEmail)}` : ''}`}
            className="text-primary-600 font-semibold hover:text-primary-700"
          >
            Enter verification code
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 text-primary-600 mb-4">
        <Building2 className="w-5 h-5" />
        <span className="font-medium">Company Registration</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
      )}

      <Input
        {...register('name')}
        label="Company Name"
        placeholder="Acme Inc."
        error={errors.name?.message}
      />

      <Input
        {...register('email')}
        type="email"
        label="Email"
        placeholder="contact@company.com"
        error={errors.email?.message}
      />

      <div className="relative">
        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <Input
        {...register('website')}
        label="Website"
        placeholder="https://company.com"
        error={errors.website?.message}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          {...register('phone')}
          label="Phone"
          placeholder="+216 XX XXX XXX"
          error={errors.phone?.message}
        />
        <Input
          {...register('city')}
          label="City"
          placeholder="Tunis"
          error={errors.city?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          {...register('country')}
          label="Country"
          placeholder="Tunisia"
          error={errors.country?.message}
        />
        <Input
          {...register('address')}
          label="Address"
          placeholder="Street, building"
          error={errors.address?.message}
        />
      </div>

      <Textarea
        {...register('about')}
        label="About"
        placeholder="Tell us about your company..."
        rows={3}
      />

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Create Account
      </Button>
    </form>
  );
}
