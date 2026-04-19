import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Modal } from './Modal';

interface Column<T> {
  key: string;
  label: ReactNode;
  render: (row: T) => ReactNode;
  isImg?: boolean;
  src?: (row: T) => string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
}

export function Table<T>({ columns, rows }: TableProps<T>) {
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const leftRowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const rightRowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const isActionColumn = (key: string) => key.toLowerCase().includes('action');
  const isStatusColumn = (key: string) => key.toLowerCase().includes('status') || key.toLowerCase().includes('condition');

  const rightColumns = columns.filter((column) => isActionColumn(column.key) || isStatusColumn(column.key));
  const leftColumns = columns.filter((column) => !isActionColumn(column.key) && !isStatusColumn(column.key));
  const hasSplitLayout = rightColumns.length > 0 && leftColumns.length > 0;

  useLayoutEffect(() => {
    if (!hasSplitLayout) {
      return;
    }

    const syncRowHeights = () => {
      if (!window.matchMedia('(max-width: 767px)').matches) {
        leftRowRefs.current.forEach((row) => {
          if (row) {
            row.style.height = '';
          }
        });
        rightRowRefs.current.forEach((row) => {
          if (row) {
            row.style.height = '';
          }
        });
        return;
      }

      const rowCount = Math.max(leftRowRefs.current.length, rightRowRefs.current.length);

      for (let i = 0; i < rowCount; i += 1) {
        const leftRow = leftRowRefs.current[i];
        const rightRow = rightRowRefs.current[i];

        if (leftRow) {
          leftRow.style.height = 'auto';
        }
        if (rightRow) {
          rightRow.style.height = 'auto';
        }

        const maxHeight = Math.max(leftRow?.getBoundingClientRect().height ?? 0, rightRow?.getBoundingClientRect().height ?? 0);

        if (leftRow && maxHeight > 0) {
          leftRow.style.height = `${maxHeight}px`;
        }
        if (rightRow && maxHeight > 0) {
          rightRow.style.height = `${maxHeight}px`;
        }
      }
    };

    syncRowHeights();
    const frameId = requestAnimationFrame(syncRowHeights);

    const handleResize = () => {
      syncRowHeights();
    };

    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        syncRowHeights();
      });

      leftRowRefs.current.forEach((row) => {
        if (row) {
          observer?.observe(row);
        }
      });

      rightRowRefs.current.forEach((row) => {
        if (row) {
          observer?.observe(row);
        }
      });
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [hasSplitLayout, rows, leftColumns.length, rightColumns.length]);

  const renderColumnContent = (row: T, column: Column<T>, alignRight: boolean) => {
    const content = column.isImg ? (
      (() => {
        const imageSrc = column.src?.(row);

        if (!imageSrc) {
          return column.render(row);
        }

        return (
          <button
            type="button"
            onClick={() => {
              setPreviewImage({
                src: imageSrc,
                title: String(column.label),
              });
            }}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1 transition hover:border-sky-300 hover:shadow-sm"
            aria-label={`Preview ${String(column.label)}`}
          >
            <img
              src={imageSrc}
              alt={String(column.label)}
              className="h-16 w-16 rounded-md object-cover"
            />
          </button>
        );
      })()
    ) : (
      column.render(row)
    );

    if (!alignRight) {
      return content;
    }

    return <div className="inline-flex flex-wrap items-center justify-end gap-2">{content}</div>;
  };

  const renderPane = (
    paneColumns: Column<T>[],
    alignRight: boolean,
    rowRefs?: React.MutableRefObject<Array<HTMLTableRowElement | null>>,
  ) => (
    <table className="min-w-max w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          {paneColumns.map((column) => (
            <th
              key={column.key}
              className={`px-2 py-2.5 font-semibold sm:px-4 sm:py-3 ${alignRight ? 'text-right' : ''}`}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={idx}
            className="border-t border-slate-100 hover:bg-slate-50/60"
            ref={(element) => {
              if (rowRefs) {
                rowRefs.current[idx] = element;
              }
            }}
          >
            {paneColumns.map((column) => (
              <td
                key={column.key}
                className={`px-2 py-2.5 align-middle text-slate-700 sm:px-4 sm:py-3 ${alignRight ? 'whitespace-nowrap text-right' : ''}`}
              >
                {renderColumnContent(row, column, alignRight)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      {hasSplitLayout ? (
        <>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:hidden">
            <div className="overflow-x-auto">
              {renderPane(leftColumns, false, leftRowRefs)}
            </div>
            <div className="overflow-x-auto border-l border-slate-200">
              {renderPane(rightColumns, true, rightRowRefs)}
            </div>
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            {renderPane(columns, false)}
          </div>
        </>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          {renderPane(columns, false)}
        </div>
      )}

      <Modal
        open={previewImage !== null}
        title={previewImage?.title ?? ''}
        onClose={() => setPreviewImage(null)}
      >
        {previewImage ? (
          <img
            src={previewImage.src}
            alt={previewImage.title}
            className="max-h-[80vh] w-full object-contain"
          />
        ) : null}
      </Modal>
    </>
  );
}
