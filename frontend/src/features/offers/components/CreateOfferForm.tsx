import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { Select } from '@/shared/ui/Select';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Description is required'),
  type: z.enum(['PFA', 'PFE', 'Intership', 'Job']),
  start: z.string().optional(),
  end: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateOfferFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const offerTypes = [
  { value: 'PFA', label: 'PFA (End of Year Project)' },
  { value: 'PFE', label: 'PFE (Final Year Project)' },
  { value: 'Intership', label: 'Internship' },
  { value: 'Job', label: 'Job' },
];

export function CreateOfferForm({ onSubmit, onCancel, isLoading }: CreateOfferFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'Intership',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('title')}
        label="Title"
        placeholder="e.g., Full Stack Developer Internship"
        error={errors.title?.message}
      />

      <Textarea
        {...register('content')}
        label="Description"
        placeholder="Describe the position, requirements, and responsibilities..."
        rows={5}
        error={errors.content?.message}
      />

      <Select
        {...register('type')}
        label="Type"
        options={offerTypes}
        error={errors.type?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register('start')}
          type="date"
          label="Start Date"
          error={errors.start?.message}
        />
        <Input
          {...register('end')}
          type="date"
          label="End Date"
          error={errors.end?.message}
        />
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading} className="flex-1">
          Create Offer
        </Button>
      </div>
    </form>
  );
}
