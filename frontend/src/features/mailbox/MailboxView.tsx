import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MailPlus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useMailbox } from './hooks/useMailbox';
import { useCompose } from './hooks/useCompose';
import { useAttachmentPreview } from './hooks/useAttachmentPreview';
import { ComposePanel } from './ui/ComposePanel';
import { FolderToolbar } from './ui/FolderToolbar';
import { MailList } from './ui/MailList';
import { MessageDetail } from './ui/MessageDetail';
import { MessageAttachments } from './ui/MessageAttachments';
import { AttachmentPreviewDialog } from './ui/AttachmentPreviewDialog';
import type { MailRole } from './model/types';

interface MailboxViewProps {
  title: string;
  subtitle: string;
  canModerate?: boolean;
  supportInboxPath?: string;
}

/** Internal mailbox shared by the student, company and admin areas. */
export function MailboxView({ title, subtitle, canModerate = false, supportInboxPath }: MailboxViewProps) {
  const { t } = useTranslation();
  const { userType } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const feedback = { setError: setActionError, setSuccess: setActionSuccess };

  const mailbox = useMailbox(feedback);
  const attachmentPreview = useAttachmentPreview();
  const compose = useCompose({
    ...feedback,
    open: showCompose,
    userType: (userType as MailRole | null) ?? null,
    onDone: (savedTo) => {
      setShowCompose(false);
      if (mailbox.folder === savedTo) mailbox.fetchFolder();
    },
  });

  const toggleCompose = () => {
    if (showCompose) compose.reset();
    setShowCompose((open) => !open);
  };

  const selected = mailbox.selectedItem;
  const attachments = selected?.extra?.attachments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={subtitle}
        className="mb-0"
        actions={
          <>
            <Button variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={mailbox.fetchFolder}>
              {t('mailbox.refresh')}
            </Button>
            <Button leftIcon={<MailPlus className="h-4 w-4" />} onClick={toggleCompose} aria-expanded={showCompose}>
              {showCompose ? t('mailbox.closeCompose') : t('mailbox.compose')}
            </Button>
          </>
        }
      />

      {mailbox.loadError && <Alert variant="danger" onClose={mailbox.clearLoadError}>{mailbox.loadError}</Alert>}
      {actionError && <Alert variant="danger" onClose={() => setActionError(null)}>{actionError}</Alert>}
      {actionSuccess && <Alert variant="success" onClose={() => setActionSuccess(null)}>{actionSuccess}</Alert>}

      {showCompose && <ComposePanel compose={compose} userType={(userType as MailRole | null) ?? null} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <section className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="p-4 pb-3">
            <FolderToolbar
              folder={mailbox.folder}
              onFolderChange={mailbox.setFolder}
              search={mailbox.search}
              onSearchChange={mailbox.setSearch}
              onApplySearch={mailbox.applySearch}
            />
          </div>
          <div className="border-t border-line">
            <MailList
              items={mailbox.items}
              folder={mailbox.folder}
              loading={mailbox.loading}
              selectedId={selected?.id}
              onOpen={mailbox.openItem}
            />
          </div>
        </section>

        <section className="min-h-[420px] rounded-lg border border-line bg-surface p-5" aria-live="polite">
          {selected ? (
            <MessageDetail
              item={selected}
              canModerate={canModerate}
              onPatch={(payload) => mailbox.patchItem(selected.id, payload)}
              onDelete={() => mailbox.deleteItem(selected.id)}
              onSenderLock={mailbox.setSenderLock}
              onHardDelete={mailbox.hardDeleteMessage}
              attachments={
                attachments.length > 0 && (
                  <MessageAttachments
                    attachments={attachments}
                    loadingId={attachmentPreview.loadingId}
                    error={attachmentPreview.error}
                    onPreview={attachmentPreview.open}
                  />
                )
              }
            />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t('mailbox.selectMessage')}
            </p>
          )}
        </section>
      </div>

      {supportInboxPath && (
        <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base">{t('mailbox.publicInbox')}</h2>
            <p className="text-sm text-muted-foreground">{t('mailbox.publicInboxDesc')}</p>
          </div>
          <Link
            to={supportInboxPath}
            className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-4 text-sm font-medium text-ink hover:bg-canvas"
          >
            {t('mailbox.openSupport')}
          </Link>
        </section>
      )}

      <AttachmentPreviewDialog
        preview={attachmentPreview.preview}
        kind={attachmentPreview.kind}
        onClose={attachmentPreview.close}
      />
    </div>
  );
}
