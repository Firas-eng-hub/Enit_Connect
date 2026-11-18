import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '@/shared/api/httpClient';
import { getApiErrorMessage } from '@/shared/lib/utils';
import { resolveAttachmentExtension, resolveFileUrl } from '../lib/mail';
import type { AttachmentPreview, MailAttachment } from '../model/types';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

/** Fetches an attachment as a blob (so auth cookies apply) and exposes it for in-app preview. */
export function useAttachmentPreview() {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<AttachmentPreview | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Release the object URL whenever the preview changes or the view unmounts.
  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const open = async (attachment: MailAttachment) => {
    const sourceUrl = resolveFileUrl(attachment.link);
    if (!sourceUrl) return;
    setLoadingId(attachment.documentId);
    setError(null);
    try {
      const response = await httpClient.get(sourceUrl, { responseType: 'blob' });
      const blob = response.data as Blob;
      setPreview({
        title: attachment.title,
        url: URL.createObjectURL(blob),
        mimeType: blob.type || attachment.mimeType || '',
        extension: resolveAttachmentExtension(attachment),
      });
    } catch (err) {
      setError(getApiErrorMessage(err, t('mailbox.previewFailed')));
    } finally {
      setLoadingId(null);
    }
  };

  const kind: 'image' | 'pdf' | 'other' | null = !preview
    ? null
    : preview.mimeType.startsWith('image/') || IMAGE_EXTENSIONS.includes(preview.extension)
      ? 'image'
      : preview.mimeType.includes('pdf') || preview.extension === 'pdf'
        ? 'pdf'
        : 'other';

  return { preview, kind, loadingId, error, open, close: () => setPreview(null) };
}
