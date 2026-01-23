import { useMemo, useState } from 'react';
import { Download, Trash2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

type FolderOption = { value: string; label: string };

type Props = {
  selectedCount: number;
  folderOptions: FolderOption[];
  isBusy?: boolean;
  onBulkDelete: () => void;
  onBulkDownload: () => void;
  onBulkMove: (targetPath: string) => void;
  onClearSelection: () => void;
};

export function BulkActionsBar({
  selectedCount,
  folderOptions,
  isBusy,
  onBulkDelete,
  onBulkDownload,
  onBulkMove,
  onClearSelection,
}: Props) {
  const [targetPath, setTargetPath] = useState('root');
  const moveOptions = useMemo(() => folderOptions.length ? folderOptions : [{ value: 'root', label: 'Root' }], [folderOptions]);

  return (
    <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{selectedCount}</span> selected
        </p>
        <Button variant="outline" size="sm" onClick={onClearSelection} disabled={isBusy}>
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onBulkDownload}
          disabled={isBusy || selectedCount === 0}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Download ZIP
        </Button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              disabled={isBusy || selectedCount === 0}
            >
              {moveOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkMove(targetPath)}
            disabled={isBusy || selectedCount === 0}
            leftIcon={<ArrowRightLeft className="w-4 h-4" />}
          >
            Move
          </Button>
        </div>

        <Button
          size="sm"
          variant="danger"
          onClick={onBulkDelete}
          disabled={isBusy || selectedCount === 0}
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

