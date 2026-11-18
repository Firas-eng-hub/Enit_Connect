import i18next from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Copy,
  Clock,
  ChevronRight,
  Download,
  Eye,
  File,
  FileText,
  Folder,
  FolderPlus,
  Link as LinkIcon,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  Replace,
  Search,
  Send,
  Star,
  Trash2,
  Upload,
  X,
  History,
} from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import { Dialog, DialogFooter } from '@/shared/ui/Dialog';
import { cn, formatFileSize, getApiErrorMessage, validateFile } from '@/shared/lib/utils';

type DocumentItem = {
  id: string;
  _id?: string;
  title: string;
  description?: string | null;
  tags: string[];
  type: string;
  accessLevel?: string | null;
  pinned?: boolean;
  lastOpenedAt?: string | null;
  version?: number;
  link?: string | null;
  thumbnailUrl?: string | null;
  extension?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  size?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  emplacement?: string | null;
  scanStatus?: string | null;
  scanCheckedAt?: string | null;
  scanError?: string | null;
  quarantined?: boolean;
};

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'paused' | 'error' | 'done';
  error?: string;
  controller?: AbortController;
};

type DocumentRequest = {
  id: string;
  title: string;
  message?: string | null;
  status: string;
  due_date?: string | null;
  created_at?: string | null;
  requester_id?: string | null;
  requester_type?: string | null;
};

type DocumentVersion = {
  id: string;
  version: number;
  link: string;
  extension?: string | null;
  sizeBytes?: number | null;
  createdAt?: string | null;
};

const DOCUMENT_MAX_MB = 10;
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];
const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];

const ROOT_EMPLACEMENT = 'root';

const getDocId = (doc: DocumentItem) => doc.id || doc._id || '';

const isPreviewable = (doc: DocumentItem) => {
  const ext = (doc.extension || '').toLowerCase();
  return ['pdf', 'png', 'jpg', 'jpeg'].includes(ext) || Boolean(doc.mimeType?.startsWith('image/'));
};

const formatTags = (tags: string[]) => tags.join(', ');

const parseTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

type FolderNode = {
  name: string;
  path: string;
  children: FolderNode[];
};

const buildFolderTree = (folders: DocumentItem[]): FolderNode => {
  const root: FolderNode = { name: i18next.t('documents.root'), path: ROOT_EMPLACEMENT, children: [] };

  folders.forEach((folder) => {
    // Build the full path for this folder
    const parentPath = folder.emplacement || ROOT_EMPLACEMENT;
    const fullPath = parentPath === ROOT_EMPLACEMENT 
      ? folder.title 
      : `${parentPath}/${folder.title}`;
    
    // Split into segments, filtering out 'root' since it's our root node
    const segments = fullPath.split('/').filter((s) => s && s !== ROOT_EMPLACEMENT);
    let current = root;

    segments.forEach((segment, index) => {
      const nodePath = segments.slice(0, index + 1).join('/');
      let child = current.children.find((node) => node.path === nodePath);
      if (!child) {
        child = {
          name: segment,
          path: nodePath,
          children: [],
        };
        current.children.push(child);
      }
      current = child;
    });
  });

  return root;
};

const flattenFolderTree = (node: FolderNode, depth = 0): Array<{ node: FolderNode; depth: number }> => {
  const items: Array<{ node: FolderNode; depth: number }> = [{ node, depth }];
  node.children.forEach((child) => {
    items.push(...flattenFolderTree(child, depth + 1));
  });
  return items;
};

export function DocumentsPage() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ title: '', description: '', tags: '' });
  const [shareDoc, setShareDoc] = useState<DocumentItem | null>(null);
  const [shareForm, setShareForm] = useState({
    visibility: 'private',
    studentRecipients: '',
    companyRecipients: '',
    expiresInDays: '7',
    password: '',
    createLink: true,
  });
  const [shareResult, setShareResult] = useState<{ shareUrl?: string; expiresAt?: string; requiresPassword?: boolean } | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [, setRequestsError] = useState<string | null>(null);
  const [versionsDoc, setVersionsDoc] = useState<DocumentItem | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [filters, setFilters] = useState({
    query: '',
    type: 'all',
    from: '',
    to: '',
    minSize: '',
    maxSize: '',
    tags: '',
    emplacement: ROOT_EMPLACEMENT,
  });
  const [folderName, setFolderName] = useState('');
  const [folderError, setFolderError] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  const folderOptions = useMemo(() => {
    const folders = documents.filter((doc) => doc.type === 'folder');
    return [
      { value: ROOT_EMPLACEMENT, label: t('documents.root') },
      ...folders.map((folder) => ({
        value: `${folder.emplacement || ROOT_EMPLACEMENT}/${folder.title}`,
        label: folder.title,
      })),
    ];
  }, [documents, t]);

  const folderTree = useMemo(() => {
    const folders = documents.filter((doc) => doc.type === 'folder');
    return buildFolderTree(folders);
  }, [documents]);

  const flattenedFolders = useMemo(() => flattenFolderTree(folderTree), [folderTree]);

  const pinnedDocuments = useMemo(
    () => documents.filter((doc) => doc.pinned),
    [documents]
  );

  const recentDocuments = useMemo(() => {
    return documents
      .filter((doc) => doc.lastOpenedAt)
      .sort((a, b) => new Date(b.lastOpenedAt || 0).getTime() - new Date(a.lastOpenedAt || 0).getTime())
      .slice(0, 5);
  }, [documents]);

  // Filter documents to show only those in the current folder
  const currentFolderDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const docEmplacement = doc.emplacement || ROOT_EMPLACEMENT;
      return docEmplacement === filters.emplacement;
    });
  }, [documents, filters.emplacement]);

  const fetchDocuments = async (applyFilters = true, targetPage = page, targetPageSize = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const params = applyFilters
        ? {
            q: filters.query || undefined,
            type: filters.type !== 'all' ? filters.type : undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
            minSize: filters.minSize ? Number(filters.minSize) * 1024 : undefined,
            maxSize: filters.maxSize ? Number(filters.maxSize) * 1024 : undefined,
            tags: filters.tags || undefined,
            emplacement: filters.emplacement !== ROOT_EMPLACEMENT ? filters.emplacement : ROOT_EMPLACEMENT,
            page: targetPage,
            pageSize: targetPageSize,
          }
        : { page: targetPage, pageSize: targetPageSize };
      const response = await httpClient.get('/api/student/documents', { params });
      const payload = response.data?.items
        ? response.data
        : {
            items: response.data || [],
            total: response.data?.length || 0,
            page: targetPage,
            pageSize: targetPageSize,
          };
      setDocuments(payload.items || []);
      setTotalDocuments(payload.total || 0);
      setPage(payload.page || targetPage);
      setPageSize(payload.pageSize || targetPageSize);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError(getApiErrorMessage(err, t('documents.fetchFailed')));
      setDocuments([]);
      setTotalDocuments(0);
    } finally {
      setLoading(false);
      setIsApplyingFilters(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when folder changes
  useEffect(() => {
    setPage(1);
    fetchDocuments(true, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.emplacement]);

  const handleUploadFiles = (files: File[]) => {
    const validatedUploads: UploadItem[] = [];

    files.forEach((file) => {
      const validationError = validateFile(file, {
        maxSizeMB: DOCUMENT_MAX_MB,
        allowedMimeTypes: DOCUMENT_MIME_TYPES,
        allowedExtensions: DOCUMENT_EXTENSIONS,
        label: 'document',
      });
      if (validationError) {
        setError(validationError);
        return;
      }

      validatedUploads.push({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: 'queued',
      });
    });

    if (validatedUploads.length) {
      setUploads((prev) => [...validatedUploads, ...prev]);
      validatedUploads.forEach((upload) => startUpload(upload.id, upload.file));
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await httpClient.get('/api/student/document-requests');
      setRequests(response.data || []);
    } catch (err) {
      setRequestsError(getApiErrorMessage(err, t('documents.requestsFailed')));
    }
  };

  const handleRequestStatus = async (requestId: string, status: string) => {
    try {
      const response = await httpClient.patch(`/api/student/document-requests/${requestId}`, { status });
      setRequests((prev) =>
        prev.map((request) => (request.id === requestId ? response.data : request))
      );
    } catch (err) {
      setRequestsError(getApiErrorMessage(err, t('documents.requestUpdateFailed')));
    }
  };

  const handleOpenShare = (doc: DocumentItem) => {
    setShareDoc(doc);
    setShareForm({
      visibility: doc.accessLevel || 'private',
      studentRecipients: '',
      companyRecipients: '',
      expiresInDays: '7',
      password: '',
      createLink: true,
    });
    setShareResult(null);
    setShareError(null);
  };

  const buildRecipients = () => {
    const studentIds = shareForm.studentRecipients
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .map((id) => ({ id, type: 'student' }));
    const companyIds = shareForm.companyRecipients
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .map((id) => ({ id, type: 'company' }));
    return [...studentIds, ...companyIds];
  };

  const handleShareSubmit = async () => {
    if (!shareDoc) return;
    setIsSharing(true);
    setShareError(null);
    setShareResult(null);

    const expiresAt = shareForm.expiresInDays
      ? new Date(Date.now() + Number(shareForm.expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    try {
      const response = await httpClient.post(`/api/student/documents/${getDocId(shareDoc)}/share`, {
        visibility: shareForm.visibility,
        recipients: buildRecipients(),
        expiresAt,
        password: shareForm.password || undefined,
        createLink: shareForm.createLink,
      });

      setShareResult(response.data?.share || null);
      fetchDocuments();
    } catch (err) {
      setShareError(getApiErrorMessage(err, t('documents.shareFailed')));
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShare = async () => {
    if (!shareResult?.shareUrl) return;
    await navigator.clipboard.writeText(shareResult.shareUrl);
  };

  const handleTogglePin = async (doc: DocumentItem) => {
    try {
      const response = await httpClient.patch(`/api/student/documents/${getDocId(doc)}/pin`, {
        pinned: !doc.pinned,
      });
      setDocuments((prev) =>
        prev.map((item) => (getDocId(item) === getDocId(doc) ? response.data : item))
      );
    } catch (err) {
      setError(getApiErrorMessage(err, t('documents.pinFailed')));
    }
  };

  const handleOpenDoc = async (doc: DocumentItem) => {
    if (doc.quarantined || doc.scanStatus === 'infected') {
      setError(t('documents.stillScanning'));
      return;
    }
    if (!doc.link) return;
    try {
      const response = await httpClient.post(`/api/student/documents/${getDocId(doc)}/open`);
      setDocuments((prev) =>
        prev.map((item) => (getDocId(item) === getDocId(doc) ? response.data : item))
      );
    } catch {
      // ignore
    } finally {
      window.open(doc.link || undefined, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenVersions = async (doc: DocumentItem) => {
    setVersionsDoc(doc);
    setVersionsError(null);
    setIsLoadingVersions(true);
    try {
      const response = await httpClient.get(`/api/student/documents/${getDocId(doc)}/versions`);
      setVersions(response.data || []);
    } catch (err) {
      setVersionsError(getApiErrorMessage(err, t('documents.versionsFailed')));
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!versionsDoc) return;
    try {
      const response = await httpClient.post(
        `/api/student/documents/${getDocId(versionsDoc)}/versions/${versionId}/restore`
      );
      setDocuments((prev) =>
        prev.map((item) => (getDocId(item) === getDocId(versionsDoc) ? response.data : item))
      );
      setVersionsDoc(null);
    } catch (err) {
      setVersionsError(getApiErrorMessage(err, t('documents.restoreFailed')));
    }
  };

  const handleReplaceFile = async (doc: DocumentItem, file: File | null) => {
    if (!file) return;
    const validationError = validateFile(file, {
      maxSizeMB: DOCUMENT_MAX_MB,
      allowedMimeTypes: DOCUMENT_MIME_TYPES,
      allowedExtensions: DOCUMENT_EXTENSIONS,
      label: 'document',
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await httpClient.post(`/api/student/documents/${getDocId(doc)}/replace`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocuments((prev) =>
        prev.map((item) => (getDocId(item) === getDocId(doc) ? response.data : item))
      );
    } catch (err) {
      setError(getApiErrorMessage(err, t('documents.replaceFailed')));
    }
  };

  const startUpload = async (uploadId: string, file?: File) => {
    setUploads((prev) =>
      prev.map((item) =>
        item.id === uploadId
          ? {
              ...item,
              status: 'uploading',
              error: undefined,
              controller: new AbortController(),
            }
          : item
      )
    );

    const uploadFile = file || uploads.find((item) => item.id === uploadId)?.file;
    if (!uploadFile) return;

    const controller = new AbortController();
    setUploads((prev) =>
      prev.map((item) => (item.id === uploadId ? { ...item, controller } : item))
    );

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadFile.name);
    formData.append('emplacement', filters.emplacement !== ROOT_EMPLACEMENT ? filters.emplacement : ROOT_EMPLACEMENT);

    try {
      const response = await httpClient.post('/api/student/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
        onUploadProgress: (event) => {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
          setUploads((prev) =>
            prev.map((item) => (item.id === uploadId ? { ...item, progress } : item))
          );
        },
      });

      setDocuments((prev) => [response.data, ...prev]);
      setUploads((prev) =>
        prev.map((item) =>
          item.id === uploadId ? { ...item, status: 'done', progress: 100 } : item
        )
      );
    } catch (err: unknown) {
      if (axios.isCancel(err)) {
        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId ? { ...item, status: 'paused' } : item
          )
        );
        return;
      }

      setUploads((prev) =>
        prev.map((item) =>
          item.id === uploadId
            ? { ...item, status: 'error', error: getApiErrorMessage(err, t('documents.uploadFailed')) }
            : item
        )
      );
    }
  };

  const handlePause = (uploadId: string) => {
    const upload = uploads.find((item) => item.id === uploadId);
    upload?.controller?.abort();
  };

  const handleResume = (uploadId: string) => {
    const upload = uploads.find((item) => item.id === uploadId);
    if (upload) {
      startUpload(uploadId, upload.file);
    }
  };

  const handleRemoveUpload = (uploadId: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== uploadId));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length) {
      handleUploadFiles(Array.from(event.dataTransfer.files));
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      handleUploadFiles(Array.from(event.target.files));
    }
    event.target.value = '';
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentFolderDocuments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentFolderDocuments.map((doc) => getDocId(doc)));
    }
  };

  const toggleSelect = (docId: string) => {
    setSelectedIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleDelete = async (docId: string) => {
    if (!confirm(t('documents.confirmDelete'))) return;
    try {
      await httpClient.delete(`/api/student/documents/${docId}`);
      setDocuments((prev) => prev.filter((doc) => getDocId(doc) !== docId));
      setSelectedIds((prev) => prev.filter((id) => id !== docId));
    } catch (err) {
      setError(getApiErrorMessage(err, t('documents.deleteFailed')));
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length || !confirm(t('documents.confirmDeleteSelected'))) return;
    try {
      await httpClient.post('/api/student/documents/batch-delete', { ids: selectedIds });
      setDocuments((prev) => prev.filter((doc) => !selectedIds.includes(getDocId(doc))));
      setSelectedIds([]);
    } catch (err) {
      setError(getApiErrorMessage(err, t('documents.deleteManyFailed')));
    }
  };

  const handleBatchDownload = async () => {
    if (!selectedIds.length) return;
    try {
      const response = await httpClient.post(
        '/api/student/documents/batch-download',
        { ids: selectedIds },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'documents.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err, t('documents.downloadFailed')));
    }
  };

  const handleMoveToFolder = async (targetEmplacement: string) => {
    if (!selectedIds.length) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          httpClient.patch(`/api/student/documents/${id}`, { emplacement: targetEmplacement })
        )
      );
      setSelectedIds([]);
      fetchDocuments();
    } catch (err) {
      setError(getApiErrorMessage(err, t('documents.moveFailed')));
    }
  };

  const handleStartEdit = (doc: DocumentItem) => {
    setEditingId(getDocId(doc));
    setEditValues({
      title: doc.title,
      description: doc.description || '',
      tags: formatTags(doc.tags || []),
    });
  };

  const handleSaveEdit = async (doc: DocumentItem) => {
    try {
      const response = await httpClient.patch(`/api/student/documents/${getDocId(doc)}`, {
        title: editValues.title,
        description: editValues.description,
        tags: parseTags(editValues.tags),
      });
      setDocuments((prev) =>
        prev.map((item) => (getDocId(item) === getDocId(doc) ? response.data : item))
      );
      setEditingId(null);
    } catch (err) {
      setError(getApiErrorMessage(err, t('documents.updateFailed')));
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setFolderError(t('documents.folderRequired'));
      return;
    }
    setFolderError(null);
    setIsCreatingFolder(true);

    try {
      const response = await httpClient.post('/api/student/documents/folders', {
        title: folderName.trim(),
        emplacement: filters.emplacement !== ROOT_EMPLACEMENT ? filters.emplacement : ROOT_EMPLACEMENT,
      });
      setDocuments((prev) => [response.data, ...prev]);
      setFolderName('');
    } catch (err) {
      setFolderError(getApiErrorMessage(err, t('documents.folderFailed')));
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleApplyFilters = () => {
    setIsApplyingFilters(true);
    setPage(1);
    fetchDocuments(true, 1);
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      type: 'all',
      from: '',
      to: '',
      minSize: '',
      maxSize: '',
      tags: '',
      emplacement: ROOT_EMPLACEMENT,
    });
    setIsApplyingFilters(true);
    setPage(1);
    fetchDocuments(false, 1);
  };

  // Pagination based on current folder documents
  const currentFolderTotal = currentFolderDocuments.length;
  const totalPages = Math.max(1, Math.ceil(currentFolderTotal / pageSize));
  const pageStart = currentFolderTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, currentFolderTotal);
  
  // Get paginated documents for current folder
  const paginatedDocuments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return currentFolderDocuments.slice(start, start + pageSize);
  }, [currentFolderDocuments, page, pageSize]);

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.min(Math.max(1, nextPage), totalPages);
    setPage(safePage);
  };

  const handlePageSizeChange = (value: number) => {
    const safeSize = Math.min(Math.max(5, value), 50);
    setPageSize(safeSize);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-6 pb-5 border-b border-line">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{t('documents.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('documents.subtitle')}</p>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-5 h-5" />
                <span className="font-semibold text-ink">{totalDocuments}</span>
                <span>{t('documents.documentsCount')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-ink">{pinnedDocuments.length}</span>
                <span>{t('documents.pinned')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-ink">{recentDocuments.length}</span>
                <span>{t('documents.recent')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="px-4 py-2 bg-ink text-white rounded-md hover:bg-primary-800 transition-colors font-medium cursor-pointer flex items-center gap-2 justify-center text-sm">
              <Upload className="w-4 h-4" />
              {t('documents.uploadFiles')}
              <input
                type="file"
                onChange={handleFileInput}
                className="hidden"
                multiple
              />
            </label>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {folderError && (
        <Alert variant="danger" className="text-sm rounded-xl">
          {folderError}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="text-sm rounded-xl">
          {error}
        </Alert>
      )}

      {/* Document Requests Banner - Only show if there are open requests */}
      {requests.filter(r => r.status === 'open').length > 0 && (
        <div className="bg-warning-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary-50 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-primary-700">
              <Send className="w-6 h-6 text-primary-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900">You have {requests.filter(r => r.status === 'open').length} document request(s)</h3>
              <p className="text-amber-700 text-sm mt-1">{t('documents.requestsWaiting')}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {requests.filter(r => r.status === 'open').slice(0, 2).map((request) => (
              <div key={request.id} className="bg-white rounded-xl p-4 border border-amber-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{request.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {request.due_date && `Due: ${new Date(request.due_date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRequestStatus(request.id, 'fulfilled')}>
                      {t('documents.markFulfilled')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleRequestStatus(request.id, 'declined')}>
                      {t('documents.decline')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Upload Area */}
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="bg-primary-50 rounded-2xl border-2 border-dashed border-primary-200 p-6 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="bg-primary-50 w-14 h-14 rounded-2xl flex items-center justify-center text-primary-700">
            <Upload className="w-7 h-7 text-primary-700" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-900">{t('documents.dropHere')}</h3>
            <p className="text-sm text-gray-500">
              {t('documents.uploadHint', { max: DOCUMENT_MAX_MB })}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress Queue */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-gray-700">Uploading {uploads.filter(u => u.status === 'uploading').length} file(s)</span>
            </div>
            <button
              type="button"
              onClick={() => setUploads((prev) => prev.filter((item) => item.status !== 'done'))}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              {t('documents.clearCompleted')}
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {uploads.map((upload) => (
              <div key={upload.id} className="px-6 py-3 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{upload.file.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-colors',
                          upload.status === 'error' ? 'bg-red-400' : upload.status === 'done' ? 'bg-emerald-500' : 'bg-primary-500'
                        )}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{upload.progress}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {upload.status === 'uploading' && (
                    <button onClick={() => handlePause(upload.id)} className="p-1.5 rounded-lg hover:bg-gray-100">
                      <Pause className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  {upload.status === 'paused' && (
                    <button onClick={() => handleResume(upload.id)} className="p-1.5 rounded-lg hover:bg-primary-50">
                      <Play className="w-4 h-4 text-primary-600" />
                    </button>
                  )}
                  {upload.status === 'error' && (
                    <button onClick={() => handleResume(upload.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <RefreshCw className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                  <button onClick={() => handleRemoveUpload(upload.id)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Create Folder */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <FolderPlus className="w-4 h-4 text-primary-600" />
              {t('documents.createFolder')}
            </div>
            <div className="space-y-2">
              <input
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                placeholder={t('documents.folderName')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <Button className="w-full" size="sm" onClick={handleCreateFolder} disabled={isCreatingFolder}>
                {isCreatingFolder ? t('documents.creating') : t('documents.create')}
              </Button>
            </div>
          </div>

          {/* Folder Tree */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Folder className="w-4 h-4 text-amber-500" />
              {t('documents.folders')}
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {flattenedFolders.map(({ node, depth }, index) => (
                <button
                  key={`${node.path}-${index}`}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, emplacement: node.path }))}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition',
                    filters.emplacement === node.path 
                      ? 'bg-primary-100 text-primary-700 font-semibold' 
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                  style={{ paddingLeft: `${8 + depth * 16}px` }}
                >
                  <Folder className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{node.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pinned Documents */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Star className="w-4 h-4 text-amber-500" />
              {t('documents.pinned')}
            </div>
            {pinnedDocuments.length === 0 ? (
              <p className="text-xs text-gray-400">{t('documents.noPinned')}</p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {pinnedDocuments.map((doc) => (
                  <button
                    key={getDocId(doc)}
                    type="button"
                    onClick={() => handleOpenDoc(doc)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                  >
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate font-medium">{doc.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Documents */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Clock className="w-4 h-4 text-emerald-500" />
              {t('documents.recent')}
            </div>
            {recentDocuments.length === 0 ? (
              <p className="text-xs text-gray-400">{t('documents.noRecent')}</p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recentDocuments.map((doc) => (
                  <button
                    key={getDocId(doc)}
                    type="button"
                    onClick={() => handleOpenDoc(doc)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
                  >
                    <span className="truncate font-medium">{doc.title}</span>
                    <span className="text-gray-400 flex-shrink-0">
                      {doc.lastOpenedAt ? new Date(doc.lastOpenedAt).toLocaleDateString() : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-gray-500 bg-white rounded-xl px-4 py-2 border border-gray-200">
            {filters.emplacement.split('/').map((segment, index, arr) => {
              const path = arr.slice(0, index + 1).join('/');
              return (
                <div key={path} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, emplacement: path || ROOT_EMPLACEMENT }))}
                    className="px-2 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition"
                  >
                    {!segment || segment === ROOT_EMPLACEMENT ? t('documents.root') : segment}
                  </button>
                  {index < arr.length - 1 && <ChevronRight className="w-3 h-3 text-gray-400" />}
                </div>
              );
            })}
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            {/* Search Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={filters.query}
                  onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                  placeholder={t('documents.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button onClick={handleApplyFilters} disabled={isApplyingFilters}>
                  {isApplyingFilters ? t('documents.searching') : t('documents.search')}
                </Button>
                <Button variant="secondary" onClick={handleResetFilters}>
                  {t('documents.reset')}
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-100">
              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('documents.type')}</label>
                <select
                  value={filters.type}
                  onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">{t('documents.allTypes')}</option>
                  <option value="file">{t('documents.files')}</option>
                  <option value="folder">{t('documents.folders')}</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('documents.fromDate')}</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('documents.toDate')}</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Min Size */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('documents.minSize')}</label>
                <input
                  type="number"
                  value={filters.minSize}
                  onChange={(event) => setFilters((prev) => ({ ...prev, minSize: event.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Max Size */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('documents.maxSize')}</label>
                <input
                  type="number"
                  value={filters.maxSize}
                  onChange={(event) => setFilters((prev) => ({ ...prev, maxSize: event.target.value }))}
                  placeholder="10000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('documents.tags')}</label>
                <input
                  type="text"
                  value={filters.tags}
                  onChange={(event) => setFilters((prev) => ({ ...prev, tags: event.target.value }))}
                  placeholder={t('documents.tagsExample')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Batch Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-primary-50 border border-primary-200 px-4 py-3">
              <span className="text-sm font-semibold text-primary-700">{selectedIds.length} selected</span>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleBatchDownload} leftIcon={<Download className="w-4 h-4" />}>
                  {t('documents.download')}
                </Button>
                <Button size="sm" variant="outline" onClick={handleBatchDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
                  {t('documents.delete')}
                </Button>
                <select
                  defaultValue=""
                  onChange={(event) => handleMoveToFolder(event.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  <option value="" disabled>{t('documents.moveTo')}</option>
                  {folderOptions.map((folder) => (
                    <option key={folder.value} value={folder.value}>{folder.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Documents List */}
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
                <p className="mt-4 text-sm text-gray-500">{t('documents.loading')}</p>
              </div>
            </div>
          ) : currentFolderDocuments.length === 0 ? (
            <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
              <div className="bg-primary-50 w-10 h-10 mx-auto rounded-2xl flex items-center justify-center text-primary-700">
                <FileText className="w-5 h-5 text-primary-700" />
              </div>
              <h3 className="mt-6 text-base font-semibold text-gray-900">
                {filters.emplacement === ROOT_EMPLACEMENT ? t('documents.emptyTitle') : t('documents.folderEmpty')}
              </h3>
              <p className="mt-2 text-gray-600 max-w-sm mx-auto">
                {filters.emplacement === ROOT_EMPLACEMENT 
                  ? t('documents.emptyBody')
                  : t('documents.folderEmptyBody', { name: filters.emplacement.split('/').pop() })}
              </p>
              <label className="bg-ink mt-6 inline-flex items-center gap-2 px-4 py-2 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-800 text-sm">
                <Upload className="w-4 h-4" />
                {filters.emplacement === ROOT_EMPLACEMENT ? t('documents.uploadFirst') : t('documents.uploadToFolder')}
                <input type="file" onChange={handleFileInput} className="hidden" multiple />
              </label>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
                <input
                  type="checkbox"
                  checked={paginatedDocuments.length > 0 && selectedIds.length === paginatedDocuments.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span>{t('documents.document')}</span>
                <span>{t('documents.size')}</span>
                <span className="text-right">{t('documents.actions')}</span>
              </div>

              {/* Document Rows */}
              <div className="divide-y divide-gray-100">
                {paginatedDocuments.map((doc) => {
                  const docId = getDocId(doc);
                  const isBlocked = Boolean(doc.quarantined || doc.scanStatus === 'infected');
                  return (
                    <div
                      key={docId}
                      className={cn(
                        'grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-4 py-3 hover:bg-gray-50 transition-colors',
                        selectedIds.includes(docId) && 'bg-primary-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(docId)}
                        onChange={() => toggleSelect(docId)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          doc.type === 'folder' 
                            ? 'bg-amber-100' 
                            : 'bg-primary-50'
                        )}>
                          {doc.type === 'folder' ? (
                            <Folder className="w-5 h-5 text-amber-600" />
                          ) : doc.thumbnailUrl ? (
                            <img src={doc.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <FileText className="w-5 h-5 text-primary-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {editingId === docId ? (
                            <div className="space-y-2">
                              <input
                                value={editValues.title}
                                onChange={(e) => setEditValues((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder={t('documents.titleField')}
                                className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                              />
                              <input
                                value={editValues.description}
                                onChange={(e) => setEditValues((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder={t('documents.descriptionOptional')}
                                className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                              />
                              <input
                                value={editValues.tags}
                                onChange={(e) => setEditValues((prev) => ({ ...prev, tags: e.target.value }))}
                                placeholder={t('documents.tagsComma')}
                                className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="font-medium text-gray-900 truncate">{doc.title}</div>
                              {doc.description && (
                                <div className="text-xs text-gray-500 truncate">{doc.description}</div>
                              )}
                            </>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            {doc.extension && (
                              <span className="text-xs text-gray-400">{doc.extension}</span>
                            )}
                            {doc.pinned && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                            {isBlocked && (
                              <span className="text-xs text-amber-600 font-medium">{t('documents.scanning')}</span>
                            )}
                            {doc.tags?.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                            {doc.tags && doc.tags.length > 2 && (
                              <span className="text-xs text-gray-400">+{doc.tags.length - 2} more</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500">
                        {doc.sizeBytes ? formatFileSize(doc.sizeBytes) : '—'}
                      </div>

                      <div className="flex items-center gap-1">
                        {editingId === docId ? (
                          <>
                            <Button size="sm" onClick={() => handleSaveEdit(doc)}>{t('documents.save')}</Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>{t('documents.cancel')}</Button>
                          </>
                        ) : (
                          <>
                            {/* Preview button - only for previewable files */}
                            {doc.type === 'file' && isPreviewable(doc) && doc.link && (
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                disabled={isBlocked}
                                className={cn(
                                  'p-2 rounded-lg transition',
                                  isBlocked ? 'text-gray-300' : 'text-indigo-600 hover:bg-indigo-50'
                                )}
                                title={t('documents.preview')}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {doc.link && (
                              <button
                                onClick={() => handleOpenDoc(doc)}
                                disabled={isBlocked}
                                className={cn(
                                  'p-2 rounded-lg transition',
                                  isBlocked ? 'text-gray-300' : 'text-primary-600 hover:bg-primary-50'
                                )}
                                title={t('documents.download')}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleTogglePin(doc)}
                              className={cn(
                                'p-2 rounded-lg transition',
                                doc.pinned ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'
                              )}
                              title={doc.pinned ? t('documents.unpin') : t('documents.pin')}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenShare(doc)}
                              disabled={isBlocked}
                              className={cn(
                                'p-2 rounded-lg transition',
                                isBlocked ? 'text-gray-300' : 'text-emerald-600 hover:bg-emerald-50'
                              )}
                              title={t('documents.share')}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            {/* Replace file button */}
                            {doc.type === 'file' && (
                              <label
                                className={cn(
                                  'p-2 rounded-lg transition cursor-pointer',
                                  isBlocked ? 'text-gray-300' : 'text-orange-500 hover:bg-orange-50'
                                )}
                                title={t('documents.replaceFile')}
                              >
                                <Replace className="w-4 h-4" />
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleReplaceFile(doc, e.target.files?.[0] || null)}
                                  disabled={isBlocked}
                                />
                              </label>
                            )}
                            {doc.type === 'file' && (
                              <button
                                onClick={() => handleOpenVersions(doc)}
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                                title={t('documents.versions')}
                              >
                                <History className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleStartEdit(doc)}
                              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                              title={t('documents.edit')}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(docId)}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                              title={t('documents.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Showing {pageStart}-{pageEnd} of {currentFolderTotal}
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-200 rounded-lg text-sm text-gray-700"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    {t('documents.previous')}
                  </Button>
                  <span className="text-sm text-gray-600 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    {t('documents.next')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(shareDoc)}
        onClose={() => setShareDoc(null)}
        title={t('documents.shareTitle')}
        description={t('documents.shareDesc')}
        size="lg"
      >
        <div className="space-y-4">
          {shareError && (
            <Alert variant="danger" className="text-sm rounded-xl">
              {shareError}
            </Alert>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-gray-700">{t('documents.visibility')}</label>
              <select
                value={shareForm.visibility}
                onChange={(event) => setShareForm((prev) => ({ ...prev, visibility: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
              >
                <option value="private">{t('documents.private')}</option>
                <option value="shared">{t('documents.shared')}</option>
                <option value="public">{t('documents.publicLink')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">{t('documents.expiresDays')}</label>
              <input
                type="number"
                min="1"
                value={shareForm.expiresInDays}
                onChange={(event) => setShareForm((prev) => ({ ...prev, expiresInDays: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
              />
            </div>
          </div>

          {shareForm.visibility === 'shared' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('documents.studentIds')}</label>
                <input
                  value={shareForm.studentRecipients}
                  onChange={(event) => setShareForm((prev) => ({ ...prev, studentRecipients: event.target.value }))}
                  placeholder="id1, id2"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('documents.companyIds')}</label>
                <input
                  value={shareForm.companyRecipients}
                  onChange={(event) => setShareForm((prev) => ({ ...prev, companyRecipients: event.target.value }))}
                  placeholder="id1, id2"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
                />
              </div>
            </div>
          )}

          {(shareForm.visibility === 'public' || shareForm.createLink) && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('documents.passwordOptional')}</label>
                <input
                  type="password"
                  value={shareForm.password}
                  onChange={(event) => setShareForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={shareForm.createLink}
                  onChange={(event) => setShareForm((prev) => ({ ...prev, createLink: event.target.checked }))}
                />
                <span className="text-sm text-gray-600">{t('documents.createLink')}</span>
              </div>
            </div>
          )}

          {shareResult?.shareUrl && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <LinkIcon className="h-4 w-4" />
                  {t('documents.linkReady')}
                </div>
                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  <Copy className="h-4 w-4" />
                  {t('documents.copy')}
                </button>
              </div>
              <p className="mt-2 break-all text-xs text-emerald-700">{shareResult.shareUrl}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShareDoc(null)}>
            {t('documents.close')}
          </Button>
          <Button onClick={handleShareSubmit} isLoading={isSharing}>
            {t('documents.shareTitle')}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={Boolean(versionsDoc)}
        onClose={() => setVersionsDoc(null)}
        title={t('documents.versionsTitle')}
        description={t('documents.versionsDesc')}
        size="md"
      >
        {versionsError && (
          <Alert variant="danger" className="text-sm rounded-xl">
            {versionsError}
          </Alert>
        )}
        {isLoadingVersions ? (
          <div className="py-6 text-center text-sm text-gray-500">{t('documents.loadingVersions')}</div>
        ) : versions.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">{t('documents.noVersions')}</div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div key={version.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Version {version.version}</div>
                    <div className="text-xs text-gray-500">
                      {version.createdAt
                        ? new Date(version.createdAt).toLocaleDateString()
                        : '—'}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleRestoreVersion(version.id)}>
                    {t('documents.restore')}
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {version.extension ? version.extension.toUpperCase() : 'FILE'} ·{' '}
                  {version.sizeBytes ? formatFileSize(version.sizeBytes) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setVersionsDoc(null)}>
            {t('documents.close')}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || t('documents.preview')}
        description={t('documents.previewDesc')}
        size="xl"
      >
        <div className="relative w-full" style={{ minHeight: '60vh' }}>
          {previewDoc?.link && (
            <>
              {previewDoc.mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg'].includes((previewDoc.extension || '').toLowerCase()) ? (
                <img
                  src={previewDoc.link}
                  alt={previewDoc.title}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              ) : (previewDoc.extension || '').toLowerCase() === 'pdf' ? (
                <iframe
                  src={previewDoc.link}
                  className="w-full h-[70vh] rounded-lg border border-gray-200"
                  title={previewDoc.title}
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto" />
                    <p className="mt-4 text-gray-500">{t('documents.noPreview')}</p>
                    <Button className="mt-4" onClick={() => handleOpenDoc(previewDoc)}>
                      {t('documents.downloadToView')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPreviewDoc(null)}>
            {t('documents.close')}
          </Button>
          {previewDoc?.link && (
            <Button onClick={() => handleOpenDoc(previewDoc)}>
              <Download className="w-4 h-4 mr-2" />
              {t('documents.download')}
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}
