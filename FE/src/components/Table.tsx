import { useState, type ReactNode } from 'react';
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

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/60">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-slate-700">
                    {column.isImg ? (
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
                                title: column.label,
                              });
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1 transition hover:border-sky-300 hover:shadow-sm"
                            aria-label={`Preview ${column.label}`}
                          >
                            <img
                              src={imageSrc}
                              alt={column.label}
                              className="h-16 w-16 rounded-md object-cover"
                            />
                          </button>
                        );
                      })()
                    ) : (
                      column.render(row)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
