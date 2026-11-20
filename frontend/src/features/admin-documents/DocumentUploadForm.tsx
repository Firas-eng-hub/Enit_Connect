import { useRef, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, FileText, FileImage, X, ChevronDown } from 'lucide-react';
import { useCreateAdminDocument } from '@/entities/document/hooks';
import { cn, getApiErrorMessage } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { DialogFooter } from '@/shared/ui/Dialog';

const MAX_MB = 10;
const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
const IMAGE_EXT = ['png', 'jpg', 'jpeg'];

type Props = {
  defaultCategory?: string;
  emplacement?: string;
  onUploaded?: () => void;
  onCancel?: () => void;
};

const parseTags = (value: string) =>
  value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '');

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const inputCls =
  'mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400';

export function DocumentUploadForm({ defaultCategory, emplacement, onUploaded, onCancel }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(defaultCategory || '');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [dragging, setDragging] = useState(false);

  const create = useCreateAdminDocument();

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    setError(null);
    if (f.size > MAX_MB * 1024 * 1024) return setError(t('adminDocs.tooLarge', { max: MAX_MB }));
    if (!ALLOWED_EXT.includes(extOf(f.name))) {
      return setError(t('adminDocs.unsupported', { types: ALLOWED_EXT.join(', ') }));
    }
    setFile(f);
    setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const clearFile = () => {
    setFile(null);
    setTitle('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError(t('adminDocs.chooseUpload'));
    if (!title.trim()) return setError(t('adminDocs.titleRequired'));

    try {
      await create.mutateAsync({
        file,
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        tags: parseTags(tags),
        emplacement: emplacement || 'root',
      });
      clearFile();
      setDescription('');
      setCategory(defaultCategory || '');
      setTags('');
      setShowDetails(false);
      onUploaded?.();
    } catch (err) {
      setError(getApiErrorMessage(err, t('adminDocs.uploadFailed')));
    }
  };

  const FileIcon = file && IMAGE_EXT.includes(extOf(file.name)) ? FileImage : FileText;

  return (
    <form onSubmit={onSubmit} noValidate>
      {!file ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition',
            'focus-within:ring-2 focus-within:ring-primary-200',
            dragging ? 'border-primary-500 bg-primary-50' : 'border-line hover:border-primary-300 hover:bg-canvas'
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="mt-3 text-sm text-ink">
            {t('adminDocs.dropHere')}{' '}
            <span className="font-semibold text-primary-700 underline-offset-2 hover:underline">{t('adminDocs.browse')}</span>
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            {t('adminDocs.fileHint', { types: 'PDF, DOC, DOCX, PNG, JPG', max: MAX_MB })}
          </span>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-3 py-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface text-primary-700 border border-line">
              <FileIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {extOf(file.name).toUpperCase()} · {formatSize(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="rounded-md p-1.5 text-neutral-500 hover:bg-surface hover:text-red-600"
              aria-label={t('adminDocs.removeFile')}
              title={t('adminDocs.removeFile')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-ink">
              {t('adminDocs.titleLabel')} <span className="text-red-600">*</span>
            </span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required />
          </label>

          <div>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', showDetails && 'rotate-180')} aria-hidden="true" />
              {showDetails ? t('adminDocs.hideDetails') : t('adminDocs.addDetails')}
            </button>
            {showDetails && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-ink">{t('adminDocs.category')}</span>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-ink">{t('adminDocs.tags')}</span>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className={inputCls}
                    placeholder={t('adminDocs.tagsHint')}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-ink">{t('adminDocs.descriptionLabel')}</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputCls}
                    rows={3}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={create.isPending}>
          {t('adminDocs.cancel')}
        </Button>
        <Button type="submit" isLoading={create.isPending} disabled={!file || !title.trim()}>
          {create.isPending ? t('adminDocs.uploading') : t('adminDocs.upload')}
        </Button>
      </DialogFooter>
    </form>
  );
}
