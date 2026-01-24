import { useMemo, useState } from 'react';
import { Folder, FolderPlus, Pencil, Trash2 } from 'lucide-react';
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
  const root: FolderNode = { id: 'root', title: 'Root', path: 'root', children: [] };
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
  const create = useCreateAdminFolder();
  const rename = useRenameAdminFolder();
  const del = useDeleteAdminFolder();

  const [newName, setNewName] = useState('');
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
    if (!title) return setActionError('Folder name is required.');
    try {
      await create.mutateAsync({ title, parentPath: currentPath || 'root' });
      setNewName('');
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to create folder.'));
    }
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
    if (!title) return setActionError('Folder name is required.');
    try {
      await rename.mutateAsync({ id: activeFolder.id, payload: { title, updatedAt: activeFolder.updatedAt || null } });
      setRenameOpen(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to rename folder.'));
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
      setActionError(getApiErrorMessage(err, 'Failed to delete folder.'));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      {/* Header with Rename/Delete actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-900">Folders</h3>
        </div>

        {currentPath !== 'root' && folderByPath.has(currentPath) && (
          <div className="flex items-center gap-1">
            <button
              onClick={openRename}
              disabled={isBusy}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition disabled:opacity-50"
              title="Rename folder"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={openDelete}
              disabled={isBusy}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
              title="Delete folder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </div>
      )}

      {/* Create new folder */}
      <div className="flex items-center gap-2 mb-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New folder name..."
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          onKeyDown={(e) => e.key === 'Enter' && onCreate()}
        />
        <button
          onClick={onCreate}
          disabled={isBusy || !newName.trim()}
          className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
          title="Add folder"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Folder tree */}
      <div className="max-h-[280px] overflow-auto rounded-lg border border-gray-100">
        {rows.map(({ node, depth }) => {
          const active = node.path === currentPath;
          return (
            <button
              key={node.path}
              type="button"
              onClick={() => onSelectPath(node.path)}
              className={[
                'w-full flex items-center gap-2 px-3 py-2 text-left text-sm border-b border-gray-50 last:border-b-0 transition',
                active ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50 text-gray-700',
              ].join(' ')}
            >
              <span className="shrink-0" style={{ width: depth * 12 }} />
              <Folder className={`w-4 h-4 shrink-0 ${active ? 'text-primary-600' : 'text-amber-500'}`} />
              <span className="truncate">{node.title}</span>
            </button>
          );
        })}
      </div>

      <Dialog
        open={renameOpen}
        onClose={() => {
          if (isBusy) return;
          setRenameOpen(false);
        }}
        title="Rename folder"
        description="Update the folder name. Child items keep their structure."
        size="md"
      >
        {actionError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-gray-700">Folder name</span>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => setRenameOpen(false)} disabled={isBusy}>
            Cancel
          </Button>
          <Button onClick={onConfirmRename} isLoading={rename.isPending}>
            Save
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
        title="Delete folder?"
        description="Folder deletion is blocked unless the folder is empty."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={del.isPending}
      />
    </div>
  );
}

