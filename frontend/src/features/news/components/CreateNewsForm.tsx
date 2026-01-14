import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Image } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

type FormData = z.infer<typeof schema>;

interface CreateNewsFormProps {
  onSubmit: (data: FormData, image?: File) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CreateNewsForm({ onSubmit, onCancel, isLoading }: CreateNewsFormProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data, selectedImage || undefined);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        {...register('title')}
        label="Title"
        placeholder="News title"
        error={errors.title?.message}
      />

      <Textarea
        {...register('content')}
        label="Content"
        placeholder="Write the news content..."
        rows={5}
        error={errors.content?.message}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <Image className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {selectedImage ? selectedImage.name : 'Choose image'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading} className="flex-1">
          Create News
        </Button>
      </div>
    </form>
  );
}
