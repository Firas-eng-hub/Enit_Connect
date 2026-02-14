import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ExternalLink, ImagePlus, Link2, Plus, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import { useCreatePartner, useDeletePartner, usePartners, useUploadPartnerLogo } from '@/entities/partner';
import { getApiErrorMessage } from '@/shared/lib/utils';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

const partnerSchema = z.object({
  name: z.string().trim().min(2, 'Partner name is required'),
  logoUrl: z.string().trim().optional(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

export function PartnersPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: partners = [], isLoading, isError, refetch } = usePartners();
  const createPartner = useCreatePartner();
  const deletePartner = useDeletePartner();
  const uploadLogo = useUploadPartnerLogo();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
    },
  });

  const watchedLogoUrl = useWatch({ control, name: 'logoUrl' });

  useEffect(() => {
    return () => {
      if (filePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const previewUrl = useMemo(() => {
    if (filePreviewUrl) return filePreviewUrl;
    const typedLogoUrl = String(watchedLogoUrl || '').trim();
    return typedLogoUrl || null;
  }, [filePreviewUrl, watchedLogoUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      if (filePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
      return;
    }

    if (filePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(filePreviewUrl);
    const nextPreview = URL.createObjectURL(file);
    setSelectedFile(file);
    setFilePreviewUrl(nextPreview);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
  };

  const onSubmit = async (values: PartnerFormData) => {
    setFormError(null);
    setFormSuccess(null);

    try {
      let logoUrl = String(values.logoUrl || '').trim();

      if (selectedFile) {
        const formData = new FormData();
        formData.append('logo', selectedFile);
        logoUrl = await uploadLogo.mutateAsync(formData);
      }

      if (!logoUrl) {
        setFormError('Please upload a logo image or provide a logo URL.');
        return;
      }

      await createPartner.mutateAsync({
        name: values.name.trim(),
        logoUrl,
      });

      reset({ name: '', logoUrl: '' });
      clearSelectedFile();
      setFormSuccess('Partner logo added successfully.');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to add partner logo.'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this partner logo?')) return;
    setDeletingId(id);
    try {
      await deletePartner.mutateAsync(id);
      setFormSuccess('Partner deleted successfully.');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to delete partner.'));
    } finally {
      setDeletingId(null);
    }
  };

  const isSubmitting = createPartner.isPending || uploadLogo.isPending;

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Partners</h1>
            <p className="text-primary-100 mt-1">
              Manage the logos shown in the visitor marquee and keep your trusted partners visible.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary-100">
              <Building2 className="w-5 h-5" />
              <span className="font-semibold text-white">{partners.length}</span>
              <span>Partners</span>
            </div>
          </div>
        </div>
      </section>

      {formError && (
        <Alert variant="danger" title="Action failed" onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      {formSuccess && (
        <Alert variant="success" title="Success" onClose={() => setFormSuccess(null)}>
          {formSuccess}
        </Alert>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-5 h-5 text-primary-700" />
            <h2 className="text-lg font-semibold text-primary-900">Add New Partner</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Partner Name"
              placeholder="e.g. Acme Corp"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Logo Image Upload</label>
              <div className="rounded-2xl border border-dashed border-primary-300 bg-primary-50/60 p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-200 bg-white hover:bg-primary-50 cursor-pointer text-sm font-medium text-primary-800 transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    Choose File
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {selectedFile && (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm text-gray-700 border border-gray-200">
                        {selectedFile.name}
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={clearSelectedFile}>
                        Remove
                      </Button>
                    </>
                  )}
                </div>
                <p className="mt-3 text-xs text-gray-600">Accepted formats: PNG, JPG, WEBP, SVG (max 3MB).</p>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                label="Logo URL"
                placeholder="https://example.com/logo.png"
                error={errors.logoUrl?.message}
                {...register('logoUrl')}
              />
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Paste a direct logo URL.
              </p>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<ImagePlus className="w-4 h-4" />}
              className="min-w-[180px]"
            >
              Add Partner Logo
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 sm:p-6">
            <p className="text-sm font-semibold text-primary-800">Live Preview</p>
            <div className="mt-3 h-48 rounded-2xl border border-gray-200 bg-[radial-gradient(circle_at_top_right,rgba(26,58,92,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(212,168,75,0.18),transparent_55%),#ffffff] p-4 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Partner logo preview"
                  className="max-h-24 w-auto object-contain drop-shadow-sm"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <UploadCloud className="w-7 h-7 mx-auto mb-2 text-primary-500" />
                  <p className="text-sm">Upload or paste a logo URL to preview</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-2 text-gray-800">
              <ShieldCheck className="w-4 h-4 text-primary-700" />
              <p className="text-sm font-semibold text-primary-900">Quality Tips</p>
            </div>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <p>Use logos with transparent backgrounds for best visual integration.</p>
              <p>Keep width-to-height ratios balanced to avoid stretching in the marquee.</p>
              <p>Prefer SVG or high-resolution PNG for crisp rendering on large screens.</p>
              <p>Use the refresh button below to verify newly added logos in the list.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-700" />
            <h2 className="text-lg font-semibold text-primary-900">Partners</h2>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
              {partners.length} items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              Refresh
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="py-8 text-sm text-gray-500">Loading partner logos...</div>
        )}

        {isError && (
          <Alert
            variant="danger"
            title="Failed to load partners"
            action={{ label: 'Retry', onClick: () => refetch() }}
          >
            Could not fetch partner logos. Please try again.
          </Alert>
        )}

        {!isLoading && !isError && partners.length === 0 && (
          <div className="py-12 text-center text-gray-500 border border-dashed border-gray-300 rounded-xl">
            No partner logos yet.
          </div>
        )}

        {!isLoading && !isError && partners.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {partners.map((partner) => (
              <article
                key={partner._id}
                className="group rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                    <Building2 className="w-3 h-3 text-primary-600" />
                    Partner
                  </span>
                  <a
                    href={partner.logoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-700"
                  >
                    Open
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="h-28 rounded-xl border border-gray-100 bg-white flex items-center justify-center mb-3 overflow-hidden">
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="h-16 w-auto object-contain group-hover:scale-[1.02] transition-transform"
                    loading="lazy"
                  />
                </div>
                <p className="font-semibold text-primary-900 truncate">{partner.name}</p>
                <p className="text-xs text-gray-500 truncate mt-1">{partner.logoUrl}</p>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="mt-3 w-full"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => handleDelete(partner._id)}
                  isLoading={deletingId === partner._id && deletePartner.isPending}
                  disabled={deletePartner.isPending && deletingId !== partner._id}
                >
                  Remove Logo
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
