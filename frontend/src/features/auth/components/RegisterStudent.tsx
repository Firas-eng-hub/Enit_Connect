import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, User, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import httpClient from '@/shared/api/httpClient';

const schema = z.object({
  firstname: z.string().min(2, 'First name is required'),
  lastname: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  class: z.string().optional(),
  promotion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const classes = [
  { value: '', label: 'Select class' },
  { value: '1st CS 1', label: '1st CS 1' },
  { value: '1st CS 2', label: '1st CS 2' },
  { value: '1st CS 3', label: '1st CS 3' },
  { value: '2nd CS 1', label: '2nd CS 1' },
  { value: '2nd CS 2', label: '2nd CS 2' },
  { value: '2nd CS 3', label: '2nd CS 3' },
  { value: '3rd CS 1', label: '3rd CS 1' },
  { value: '3rd CS 2', label: '3rd CS 2' },
  { value: '3rd CS 3', label: '3rd CS 3' },
];

export function RegisterStudent() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => ({
    value: (currentYear - 5 + i).toString(),
    label: (currentYear - 5 + i).toString(),
  }));

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await httpClient.post('/api/student/signup', { ...data, type: 'student' });
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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 text-primary-600 mb-4">
        <User className="w-5 h-5" />
        <span className="font-medium">Student Registration</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register('firstname')}
          label="First Name"
          placeholder="John"
          error={errors.firstname?.message}
        />
        <Input
          {...register('lastname')}
          label="Last Name"
          placeholder="Doe"
          error={errors.lastname?.message}
        />
      </div>

      <Input
        {...register('email')}
        type="email"
        label="Email"
        placeholder="student@example.com"
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

      <div className="grid grid-cols-2 gap-4">
        <Select {...register('class')} label="Class" options={classes} />
        <Select {...register('promotion')} label="Year" options={[{ value: '', label: 'Select year' }, ...years]} />
      </div>

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Create Account
      </Button>
    </form>
  );
}
