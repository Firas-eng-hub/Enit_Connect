import i18next from 'i18next';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Folder, FolderOpen, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import type { AdminDocument } from '@/entities/document/types';
import { useCreateAdminFolder, useDeleteAdminFolder, useRenameAdminFolder } from '@/entities/document/hooks';
import { getApiErrorMessage } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog, Dialog, DialogFooter } from '@/shared/ui/Dialog';

type Props = {
  folders: AdminDocument[];
  currentPath: string;
  onSelectPath: (path: string) => void;
};

type FolderNode = {
  id: string;
  title: string;
  path: string;
  children: FolderNode[];
};

const getFolderPath = (folder: AdminDocument) => {
  const parent = folder.emplacement || 'root';
  return parent === 'root' ? folder.title : `${parent}/${folder.title}`;
};

const buildTree = (folders: AdminDocument[]) => {
  const root: FolderNode = { id: 'root', title: i18next.t('adminDocs.root'), path: 'root', children: [] };
  const nodes = new Map<string, FolderNode>();
  nodes.set('root', root);

  const sorted = [...folders].sort((a, b) => getFolderPath(a).localeCompare(getFolderPath(b)));
  sorted.forEach((folder) => {
    const path = getFolderPath(folder);
    nodes.set(path, { id: folder.id, title: folder.title, path, children: [] });
  });

  sorted.forEach((folder) => {
    const path = getFolderPath(folder);
    const parentPath = folder.emplacement || 'root';
    const parent = nodes.get(parentPath) || root;
    const node = nodes.get(path);
    if (!node) return;
    parent.children.push(node);
  });

  return root;
};

const flattenTree = (node: FolderNode, depth = 0): Array<{ node: FolderNode; depth: number }> => {
  const rows: Array<{ node: FolderNode; depth: number }> = [{ node, depth }];
  node.children
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach((child) => rows.push(...flattenTree(child, depth + 1)));
  return rows;
};

export function FolderTree({ folders, currentPath, onSelectPath }: Props) {
  const { t } = useTranslation();
  const create = useCreateAdminFolder();
  const rename = useRenameAdminFolder();
  const del = useDeleteAdminFolder();

  const [newName, setNewName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [activeFolder, setActiveFolder] = useState<AdminDocument | null>(null);

  const folderByPath = useMemo(() => {
    const map = new Map<string, AdminDocument>();
    folders.forEach((f) => map.set(getFolderPath(f), f));
    return map;
  }, [folders]);

  const tree = useMemo(() => buildTree(folders), [folders]);
  const rows = useMemo(() => flattenTree(tree), [tree]);

  const isBusy = create.isPending || rename.isPending || del.isPending;

  const onCreate = async () => {
    setActionError(null);
    const title = newName.trim();
    if (!title) return setActionError(t('adminDocs.folderRequired'));
    try {
      await create.mutateAsync({ title, parentPath: currentPath || 'root' });
      setNewName('');
      setCreateOpen(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err, t('adminDocs.createFolderFailed')));
    }
  };

  const openCreate = () => {
    setNewName('');
    setActionError(null);
    setCreateOpen(true);
  };

  const openRename = () => {
    const folder = folderByPath.get(currentPath);
    if (!folder) return;
    setActiveFolder(folder);
    setRenameValue(folder.title);
    setActionError(null);
    setRenameOpen(true);
  };

  const openDelete = () => {
    const folder = folderByPath.get(currentPath);
    if (!folder) return;
    setActiveFolder(folder);
    setActionError(null);
    setDeleteOpen(true);
  };

  const onConfirmRename = async () => {
    if (!activeFolder) return;
    setActionError(null);
    const title = renameValue.trim();
    if (!title) return setActionError(t('adminDocs.folderRequired'));
    try {
      await rename.mutateAsync({ id: activeFolder.id, payload: { title, updatedAt: activeFolder.updatedAt || null } });
      setRenameOpen(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err, t('adminDocs.renameFailed')));
    }
  };

  const onConfirmDelete = async () => {
    if (!activeFolder) return;
    setActionError(null);
    try {
      await del.mutateAsync(activeFolder.id);
      if (currentPath === getFolderPath(activeFolder)) onSelectPath('root');
      setDeleteOpen(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err, t('adminDocs.deleteFolderFailed')));
    }
  };

  const currentLabel = currentPath === 'root' ? t('adminDocs.root') : currentPath.split('/').pop() || currentPath;
  const canEditCurrent = currentPath !== 'root' && folderByPath.has(currentPath);
  const iconBtn = 'p-1.5 rounded-md text-neutral-500 hover:text-ink hover:bg-canvas transition disabled:opacity-50';

  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
        <h2 className="text-sm font-semibold text-ink">{t('adminDocs.folders')}</h2>
        <div className="flex items-center gap-0.5">
          {canEditCurrent && (
            <>
              <button type="button" onClick={openRename} disabled={isBusy} className={iconBtn}
                title={t('adminDocs.renameFolder')} aria-label={t('adminDocs.renameFolder')}>
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={openDelete} disabled={isBusy}
                className={iconBtn + ' hover:!text-red-600 hover:!bg-red-50'}
                title={t('adminDocs.deleteFolder')} aria-label={t('adminDocs.deleteFolder')}>
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
          <button type="button" onClick={openCreate} disabled={isBusy} className={iconBtn}
            title={t('adminDocs.addFolder')} aria-label={t('adminDocs.addFolder')}>
            <FolderPlus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {actionError && !renameOpen && !createOpen && (
        <div className="mx-3 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </div>
      )}

      <nav aria-label={t('adminDocs.folders')} className="max-h-[60vh] overflow-auto p-2">
        {rows.map(({ node, depth }) => {
          const active = node.path === currentPath;
          return (
            <button
              key={node.path}
              type="button"
              onClick={() => onSelectPath(node.path)}
              aria-current={active ? 'true' : undefined}
              className={[
                'w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-start text-sm transition',
                active ? 'bg-primary-50 text-ink font-medium' : 'text-body hover:bg-canvas hover:text-ink',
              ].join(' ')}
            >
              <span className="shrink-0" style={{ width: depth * 14 }} />
              {active ? (
                <FolderOpen className="w-4 h-4 shrink-0 text-primary-600" aria-hidden="true" />
              ) : (
                <Folder className="w-4 h-4 shrink-0 text-neutral-400" aria-hidden="true" />
              )}
              <span className="truncate">{node.title}</span>
            </button>
          );
        })}
      </nav>

      <Dialog
        open={createOpen}
        onClose={() => {
          if (isBusy) return;
          setCreateOpen(false);
        }}
        title={t('adminDocs.newFolderTitle')}
        description={t('adminDocs.newFolderDesc', { folder: currentLabel })}
        size="md"
      >
        {actionError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
        ) : null}
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-gray-700">{t('adminDocs.folderName')}</span>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCreate()}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isBusy}>
            {t('adminDocs.cancel')}
          </Button>
          <Button onClick={onCreate} isLoading={create.isPending} disabled={!newName.trim()}>
            {t('adminDocs.create')}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={renameOpen}
        onClose={() => {
          if (isBusy) return;
          setRenameOpen(false);
        }}
        title={t('adminDocs.renameFolder')}
        description={t('adminDocs.renameDesc')}
        size="md"
      >
        {actionError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-gray-700">{t('adminDocs.folderName')}</span>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => setRenameOpen(false)} disabled={isBusy}>
            {t('adminDocs.cancel')}
          </Button>
          <Button onClick={onConfirmRename} isLoading={rename.isPending}>
            {t('adminDocs.save')}
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
        title={t('adminDocs.deleteFolderTitle')}
        description={t('adminDocs.deleteFolderDesc')}
        confirmLabel={t('adminDocs.delete')}
        cancelLabel={t('adminDocs.cancel')}
        variant="danger"
        isLoading={del.isPending}
      />
    </div>
  );
}

