import { useMemo, useState } from 'react';
import {
  ExternalLink,
  Folder,
  FileText,
  User,
  Pencil,
  Trash2,
  RefreshCw,
  Clock,
  ChevronRight,
  Share2,
  Eye,
  History,
} from 'lucide-react';
import type { AdminDocument } from '@/entities/document/types';
import {
  useBulkDeleteAdminDocuments,
  useBulkDownloadAdminDocuments,
  useBulkMoveAdminDocuments,
  useDeleteAdminDocument,
  useReplaceAdminDocumentFile,
  useUpdateAdminDocument,
} from '@/entities/document/hooks';
import { getApiErrorMessage, truncate } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog, Dialog, DialogFooter } from '@/shared/ui/Dialog';
import { BulkActionsBar } from '@/features/admin-documents/BulkActionsBar';
import { DocumentSharePanel } from '@/features/admin-documents/DocumentSharePanel';
import { DocumentPreviewDialog } from '@/features/admin-documents/DocumentPreviewDialog';
import { DocumentVersionsDialog } from '@/features/admin-documents/DocumentVersionsDialog';

type Props = {
  documents: AdminDocument[];
  isLoading?: boolean;
  folderOptions: Array<{ value: string; label: string }>;
  onOpenFolder: (path: string) => void;
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
};

export function DocumentList({ documents, isLoading, folderOptions, onOpenFolder }: Props) {
  const update = useUpdateAdminDocument();
  const replaceFile = useReplaceAdminDocumentFile();
  const del = useDeleteAdminDocument();
  const bulkDelete = useBulkDeleteAdminDocuments();
  const bulkMove = useBulkMoveAdminDocuments();
  const bulkDownload = useBulkDownloadAdminDocuments();

  const [editOpen, setEditOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<AdminDocument | null>(null);
  const [shareDoc, setShareDoc] = useState<AdminDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null);
  const [versionsDoc, setVersionsDoc] = useState<AdminDocument | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [replaceSelectedFile, setReplaceSelectedFile] = useState<File | null>(null);

  const isBusy =
    update.isPending ||
    replaceFile.isPending ||
    del.isPending ||
    bulkDelete.isPending ||
    bulkMove.isPending ||
    bulkDownload.isPending;

  const parseTags = useMemo(
    () => (value: string) =>
      value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    []
  );

  const openEdit = (doc: AdminDocument) => {
    setSelected(doc);
    setEditTitle(doc.title || '');
    setEditDescription(doc.description || '');
    setEditCategory(doc.category || '');
    setEditTags((doc.tags || []).join(', '));
    setReplaceSelectedFile(null);
    setActionError(null);
    setEditOpen(true);
  };

  const openReplace = (doc: AdminDocument) => {
    setSelected(doc);
    setReplaceSelectedFile(null);
    setActionError(null);
    setReplaceOpen(true);
  };

  const openShare = (doc: AdminDocument) => {
    setShareDoc(doc);
    setShareOpen(true);
  };

  const openPreview = (doc: AdminDocument) => {
    setPreviewDoc(doc);
    setPreviewOpen(true);
  };

  const openVersions = (doc: AdminDocument) => {
    setVersionsDoc(doc);
    setVersionsOpen(true);
  };

  const openDelete = (doc: AdminDocument) => {
    setSelected(doc);
    setActionError(null);
    setDeleteOpen(true);
  };

  const onSaveEdit = async () => {
    if (!selected) return;
    setActionError(null);
    if (!editTitle.trim()) return setActionError('Title is required.');
    try {
      await update.mutateAsync({
        id: selected.id,
        payload: {
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          category: editCategory.trim() || null,
          tags: parseTags(editTags),
          updatedAt: selected.updatedAt || null,
        },
      });
      setEditOpen(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to update document.'));
    }
  };

  const onReplaceFile = async () => {
    if (!selected) return;
    setActionError(null);
    if (!replaceSelectedFile) return setActionError('Please choose a file to replace.');
    try {
      await replaceFile.mutateAsync({ id: selected.id, file: replaceSelectedFile });
      setReplaceOpen(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to replace file.'));
    }
  };

  const onConfirmDelete = async () => {
    if (!selected) return;
    setActionError(null);
    try {
      await del.mutateAsync(selected.id);
      setDeleteOpen(false);
      setSelectedIds((prev) => prev.filter((id) => id !== selected.id));
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to delete document.'));
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleSelectAll = () => {
    const visibleIds = documents.map((d) => d.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : visibleIds);
  };

  const onBulkDelete = async () => {
    setActionError(null);
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} selected item(s)?`)) return;
    try {
      await bulkDelete.mutateAsync({ ids: selectedIds });
      setSelectedIds([]);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to delete selected documents.'));
    }
  };

  const onBulkMove = async (targetPath: string) => {
    setActionError(null);
    if (!selectedIds.length) return;
    try {
      await bulkMove.mutateAsync({ ids: selectedIds, targetPath });
      setSelectedIds([]);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to move selected documents.'));
    }
  };

  const onBulkDownload = async () => {
    setActionError(null);
    if (!selectedIds.length) return;
    try {
      const res = await bulkDownload.mutateAsync({ ids: selectedIds });
      const blob = res.data as unknown as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'documents.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to download documents.'));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <p className="text-sm text-gray-500">Loading documents...</p>
      </div>
    );
  }

  if (!documents.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
          <FileText className="w-7 h-7 text-gray-500" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-gray-900">No documents yet</h3>
        <p className="mt-1 text-sm text-gray-500">Upload your first document to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Documents</h2>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={documents.length > 0 && documents.every((d) => selectedIds.includes(d.id))}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-200"
            />
            Select all
          </label>
          <p className="text-sm text-gray-500">{documents.length} item(s)</p>
        </div>
      </div>

      {actionError ? (
        <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {selectedIds.length ? (
        <div className="px-6 pt-4">
          <BulkActionsBar
            selectedCount={selectedIds.length}
            folderOptions={folderOptions}
            isBusy={isBusy}
            onBulkDelete={onBulkDelete}
            onBulkDownload={onBulkDownload}
            onBulkMove={onBulkMove}
            onClearSelection={() => setSelectedIds([])}
          />
        </div>
      ) : null}

      <div className="divide-y divide-gray-100">
        {documents.map((doc) => {
          const isFolder = doc.type === 'folder';
          const Icon = isFolder ? Folder : FileText;
          const href = doc.link || undefined;
          const date = formatDate(doc.updatedAt || doc.createdAt);
          const lastOpened = formatDate(doc.lastOpenedAt);
          const folderPath = (doc.emplacement || 'root') === 'root' ? doc.title : `${doc.emplacement}/${doc.title}`;

          return (
            <div key={doc.id} className="px-6 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex items-start gap-3">
                <div className="pt-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(doc.id)}
                    onChange={() => toggleSelect(doc.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-200"
                  />
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-700" />
                </div>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isFolder) return;
                      // Open the folder by navigating to its full path.
                      onOpenFolder(folderPath);
                    }}
                    className={[
                      'font-semibold text-gray-900 truncate text-left',
                      isFolder ? 'hover:underline inline-flex items-center gap-1' : '',
                    ].join(' ')}
                    title={isFolder ? 'Open folder' : undefined}
                  >
                    {doc.title}
                    {isFolder ? <ChevronRight className="w-4 h-4 text-gray-400" /> : null}
                  </button>
                  <p className="text-sm text-gray-500">
                    {truncate(doc.description || '', 90) || 'No description'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {doc.creatorName || 'Admin'}
                    </span>
                    {doc.category ? (
                      <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200">
                        {doc.category}
                      </span>
                    ) : null}
                    {date ? <span>Updated: {date}</span> : null}
                    {lastOpened ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Opened: {lastOpened}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                ) : isFolder ? (
                  <button
                    type="button"
                    onClick={() => onOpenFolder(folderPath)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <Folder className="w-4 h-4" />
                    Open folder
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 mt-2">No file link</span>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(doc)}
                    disabled={isBusy || isFolder}
                    leftIcon={<Pencil className="w-4 h-4" />}
                    title={isFolder ? 'Rename folders from the folder panel.' : undefined}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openReplace(doc)}
                    disabled={isBusy || isFolder}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    title={isFolder ? 'Folders do not have a file to replace.' : undefined}
                  >
                    Replace
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPreview(doc)}
                    disabled={isBusy || isFolder}
                    leftIcon={<Eye className="w-4 h-4" />}
                    title={isFolder ? 'Preview is available for files only.' : undefined}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openVersions(doc)}
                    disabled={isBusy || isFolder}
                    leftIcon={<History className="w-4 h-4" />}
                    title={isFolder ? 'Version history is available for files only.' : undefined}
                  >
                    Versions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openShare(doc)}
                    disabled={isBusy || isFolder}
                    leftIcon={<Share2 className="w-4 h-4" />}
                    title={isFolder ? 'Share links are available for files only.' : undefined}
                  >
                    Share
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => openDelete(doc)}
                    disabled={isBusy}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={editOpen}
        onClose={() => {
          if (isBusy) return;
          setEditOpen(false);
        }}
        title="Edit document"
        description="Update the document details."
        size="lg"
      >
        {actionError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-gray-700">Title</span>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Category</span>
            <input
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Tags</span>
            <input
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="comma,separated,tags"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-gray-700">Description</span>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200"
              rows={3}
            />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isBusy}>
            Cancel
          </Button>
          <Button onClick={onSaveEdit} isLoading={update.isPending}>
            Save changes
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={replaceOpen}
        onClose={() => {
          if (isBusy) return;
          setReplaceOpen(false);
        }}
        title="Replace file"
        description="Upload a new file to replace the current one."
        size="md"
      >
        {actionError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        <div className="mt-4">
          <input
            type="file"
            onChange={(e) => setReplaceSelectedFile(e.target.files?.[0] || null)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />
          {replaceSelectedFile ? (
            <p className="mt-2 text-xs text-gray-500">
              Selected: <span className="font-semibold text-gray-700">{replaceSelectedFile.name}</span>
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setReplaceOpen(false)} disabled={isBusy}>
            Cancel
          </Button>
          <Button onClick={onReplaceFile} isLoading={replaceFile.isPending}>
            Replace
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          if (isBusy) return;
          setDeleteOpen(false);
        }}
        onConfirm={onConfirmDelete}
        title="Delete document?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={del.isPending}
      />

      <DocumentSharePanel
        open={shareOpen}
        onClose={() => {
          if (isBusy) return;
          setShareOpen(false);
        }}
        document={shareDoc}
      />

      <DocumentPreviewDialog
        open={previewOpen}
        onClose={() => {
          if (isBusy) return;
          setPreviewOpen(false);
        }}
        document={previewDoc}
      />

      <DocumentVersionsDialog
        open={versionsOpen}
        onClose={() => {
          if (isBusy) return;
          setVersionsOpen(false);
        }}
        document={versionsDoc}
      />
    </div>
  );
}
