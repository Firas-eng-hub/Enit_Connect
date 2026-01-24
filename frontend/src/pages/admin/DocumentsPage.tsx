import { DocumentUploadForm } from '@/features/admin-documents/DocumentUploadForm';
import { DocumentList } from '@/features/admin-documents/DocumentList';
import { useAdminDocuments } from '@/entities/document/hooks';
import type { AdminDocument } from '@/entities/document/types';
import type { AdminDocumentListParams } from '@/entities/document/types';
import { DocumentFilters } from '@/features/admin-documents/DocumentFilters';
import { FolderTree } from '@/features/admin-documents/FolderTree';
import { useState } from 'react';
import { FileText, FolderOpen } from 'lucide-react';

export function DocumentsPage() {
  const [filters, setFilters] = useState<AdminDocumentListParams>({
    q: '',
    category: '',
    tags: [],
    type: undefined,
    emplacement: 'root',
    from: undefined,
    to: undefined,
    sort: 'createdAt',
    order: 'desc',
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading, error } = useAdminDocuments(filters);
  const payload = data as { data?: AdminDocument[]; total?: number } | undefined;
  const documents = payload?.data ?? [];
  const totalDocuments = payload?.total ?? documents.length;

  const { data: foldersData } = useAdminDocuments({ type: 'folder', pageSize: 500, sort: 'title', order: 'asc' });
  const foldersPayload = foldersData as { data?: AdminDocument[] } | undefined;
  const folders = foldersPayload?.data ?? [];

  const folderOptions = [
    { value: 'root', label: 'Root' },
    ...folders.map((f) => ({
      value: (f.emplacement || 'root') === 'root' ? f.title : `${f.emplacement}/${f.title}`,
      label: (f.emplacement || 'root') === 'root' ? f.title : `${f.emplacement}/${f.title}`,
    })),
  ];

  const onSelectPath = (path: string) =>
    setFilters((prev) => ({
      ...prev,
      emplacement: path || 'root',
      page: 1,
    }));

  const currentFolderName = filters.emplacement === 'root' 
    ? 'Root' 
    : filters.emplacement?.split('/').pop() || 'Root';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Document Management</h1>
            <p className="text-primary-100 mt-1">Manage platform documents, folders, and file sharing</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary-100">
              <FileText className="w-5 h-5" />
              <span className="font-semibold text-white">{totalDocuments}</span>
              <span>Documents</span>
            </div>
            <div className="flex items-center gap-2 text-primary-100">
              <FolderOpen className="w-5 h-5" />
              <span className="font-semibold text-white">{folders.length}</span>
              <span>Folders</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-800">
          Failed to load documents. Please refresh and try again.
        </div>
      )}

      {/* Main Layout - Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Folders & Upload */}
        <div className="lg:col-span-3 space-y-4">
          {/* Folder Navigation */}
          <FolderTree 
            folders={folders} 
            currentPath={filters.emplacement || 'root'} 
            onSelectPath={onSelectPath} 
          />

          {/* Upload Section */}
          <DocumentUploadForm emplacement={filters.emplacement || 'root'} />
        </div>

        {/* Main Content - Filters + Documents */}
        <div className="lg:col-span-9 space-y-4">
          {/* Current Location Indicator */}
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FolderOpen className="w-4 h-4 text-primary-600" />
              <span className="text-gray-500">Current folder:</span>
              <span className="font-semibold text-gray-900">{currentFolderName}</span>
              {filters.emplacement !== 'root' && (
                <span className="text-xs text-gray-400 ml-2">({filters.emplacement})</span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {documents.length} item{documents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Filters */}
          <DocumentFilters value={filters} onChange={setFilters} />

          {/* Document List */}
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            folderOptions={folderOptions}
            onOpenFolder={onSelectPath}
          />
        </div>
      </div>
    </div>
  );
}
