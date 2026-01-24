import { useMemo, useState } from 'react';
import { Upload, FileText, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useCreateAdminDocument } from '@/entities/document/hooks';
import { getApiErrorMessage } from '@/shared/lib/utils';

const MAX_MB = 10;
const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];

type Props = {
  defaultCategory?: string;
  emplacement?: string;
};

const parseTags = (value: string) =>
  value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

export function DocumentUploadForm({ defaultCategory, emplacement }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(defaultCategory || '');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const create = useCreateAdminDocument();

  const fileHint = useMemo(() => `Max ${MAX_MB}MB. Allowed: ${ALLOWED_EXT.join(', ')}`, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) return setError('Please choose a file to upload.');
    if (!title.trim()) return setError('Title is required.');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`File is too large. Max size is ${MAX_MB}MB.`);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext && !ALLOWED_EXT.includes(ext)) {
      return setError(`Unsupported file type. Allowed: ${ALLOWED_EXT.join(', ')}.`);
    }

    try {
      await create.mutateAsync({
        file,
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        tags: parseTags(tags),
        emplacement: emplacement || 'root',
      });
      setFile(null);
      setTitle('');
      setDescription('');
      setCategory(defaultCategory || '');
      setTags('');
      setShowDetails(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to upload document. Please try again.'));
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle('');
    setError(null);
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Upload className="w-4 h-4 text-primary-600" />
        <h3 className="text-sm font-bold text-gray-900">Upload Document</h3>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* File input area */}
      {!file ? (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-primary-300 hover:bg-primary-50/30 transition">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">Click to select file</p>
            <p className="text-xs text-gray-400 mt-1">{fileHint}</p>
          </div>
          <input
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                setTitle(f.name.replace(/\.[^/.]+$/, ''));
              }
            }}
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />
        </label>
      ) : (
        <div className="space-y-3">
          {/* Selected file */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FileText className="w-8 h-8 text-primary-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title - required */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder="Document title *"
          />

          {/* Toggle additional fields */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showDetails ? 'Hide details' : 'Add description, category, tags'}
          </button>

          {/* Additional fields - collapsible */}
          {showDetails && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Category (optional)"
              />
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Tags, comma separated (optional)"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                rows={2}
                placeholder="Description (optional)"
              />
            </div>
          )}

          {/* Upload button */}
          <button
            type="submit"
            disabled={create.isPending || !title.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 transition"
          >
            <Upload className="w-4 h-4" />
            {create.isPending ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      )}
    </form>
  );
}
