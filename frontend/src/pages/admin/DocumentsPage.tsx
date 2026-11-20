import { DocumentUploadForm } from '@/features/admin-documents/DocumentUploadForm';
import { DocumentList } from '@/features/admin-documents/DocumentList';
import { useAdminDocuments } from '@/entities/document/hooks';
import type { AdminDocument } from '@/entities/document/types';
import type { AdminDocumentListParams } from '@/entities/document/types';
import { DocumentFilters } from '@/features/admin-documents/DocumentFilters';
import { FolderTree } from '@/features/admin-documents/FolderTree';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, FileText, FolderOpen, Upload } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';

export function DocumentsPage() {
  const { t } = useTranslation();
  const [uploadOpen, setUploadOpen] = useState(false);
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
    { value: 'root', label: t('adminDocs.root') },
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

  const currentPath = filters.emplacement || 'root';
  const crumbs = currentPath === 'root' ? [] : currentPath.split('/');
  const currentFolderName = crumbs.length ? crumbs[crumbs.length - 1] : t('adminDocs.root');

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 pb-5 border-b border-line sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('adminDocs.pageTitle')}</h1>
          <p className="text-muted-foreground mt-1">{t('adminDocs.pageSubtitle')}</p>
          <p className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span className="font-semibold text-ink tabular-nums">{totalDocuments}</span> {t('adminDocs.documents')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4" aria-hidden="true" />
              <span className="font-semibold text-ink tabular-nums">{folders.length}</span> {t('adminDocs.folders')}
            </span>
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} leftIcon={<Upload className="w-4 h-4" />}>
          {t('adminDocs.upload')}
        </Button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {t('adminDocs.loadFailed')}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[calc(var(--topbar-height)+1.5rem)]">
          <FolderTree folders={folders} currentPath={currentPath} onSelectPath={onSelectPath} />
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="bg-surface rounded-xl border border-line">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
              <nav aria-label={t('adminDocs.breadcrumb')} className="min-w-0">
                <ol className="flex flex-wrap items-center gap-1 text-sm">
                  <li>
                    <button
                      type="button"
                      onClick={() => onSelectPath('root')}
                      className={crumbs.length ? 'text-muted-foreground hover:text-ink' : 'font-semibold text-ink'}
                    >
                      {t('adminDocs.root')}
                    </button>
                  </li>
                  {crumbs.map((name, i) => {
                    const path = crumbs.slice(0, i + 1).join('/');
                    const last = i === crumbs.length - 1;
                    return (
                      <li key={path} className="flex items-center gap-1 min-w-0">
                        <ChevronRight className="w-4 h-4 text-neutral-400 rtl:rotate-180" aria-hidden="true" />
                        <button
                          type="button"
                          onClick={() => onSelectPath(path)}
                          aria-current={last ? 'page' : undefined}
                          className={'truncate ' + (last ? 'font-semibold text-ink' : 'text-muted-foreground hover:text-ink')}
                        >
                          {name}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {t('adminDocs.itemsCount', { count: documents.length })}
              </span>
            </div>
            <div className="p-4">
              <DocumentFilters value={filters} onChange={setFilters} />
            </div>
          </div>

          <DocumentList
            documents={documents}
            isLoading={isLoading}
            folderOptions={folderOptions}
            onOpenFolder={onSelectPath}
          />
        </section>
      </div>

      <Dialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title={t('adminDocs.uploadTitle')}
        description={t('adminDocs.uploadDesc', { folder: currentFolderName })}
        size="lg"
      >
        <DocumentUploadForm
          emplacement={currentPath}
          onUploaded={() => setUploadOpen(false)}
          onCancel={() => setUploadOpen(false)}
        />
      </Dialog>
    </div>
  );
}
