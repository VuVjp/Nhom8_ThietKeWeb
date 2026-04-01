import { useMemo, useState } from 'react';
import { Input } from '../components/Input';
import { Table } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { lossSeed } from '../mock/data';
import { formatCurrency } from '../utils/format';
import { paginate, queryIncludes, sortBy } from '../utils/table';
import { StatCard } from '../components/StatCard';

export function LossPage() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [hasImage, setHasImage] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const rows = lossSeed.filter((item) => {
      const matchSearch = queryIncludes(item.id, search) || queryIncludes(item.item, search) || queryIncludes(item.room, search);
      const matchFrom = !dateFrom || item.date >= dateFrom;
      const matchTo = !dateTo || item.date <= dateTo;
      const amount = item.penalty;
      const matchMin = !amountMin || amount >= Number(amountMin);
      const matchMax = !amountMax || amount <= Number(amountMax);
      const matchImage = !hasImage || Boolean(item.evidence);
      return matchSearch && matchFrom && matchTo && matchMin && matchMax && matchImage;
    });

    return sortBy(rows, (row) => row.date, 'desc');
  }, [search, dateFrom, dateTo, amountMin, amountMax, hasImage]);

  const totalPenalty = filtered.reduce((sum, item) => sum + item.penalty, 0);
  const pageSize = 8;
  const paged = paginate(filtered, page, pageSize);

  const columns = [
    { key: 'id', label: 'ID', render: (row: (typeof filtered)[number]) => row.id },
    { key: 'evidence', label: 'Evidence', render: (row: (typeof filtered)[number]) => <img src={row.evidence} alt={row.id} className="h-14 w-20 rounded-lg object-cover" /> },
    { key: 'room', label: 'Room', render: (row: (typeof filtered)[number]) => row.room },
    { key: 'item', label: 'Item', render: (row: (typeof filtered)[number]) => row.item },
    { key: 'quantity', label: 'Quantity', render: (row: (typeof filtered)[number]) => row.quantity },
    { key: 'penalty', label: 'Penalty', render: (row: (typeof filtered)[number]) => formatCurrency(row.penalty) },
    { key: 'description', label: 'Description', render: (row: (typeof filtered)[number]) => row.description },
    { key: 'date', label: 'Date', render: (row: (typeof filtered)[number]) => row.date },
    { key: 'actions', label: 'Actions', render: () => <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs">View</button> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Loss & Compensation</h2>
        <p className="text-sm text-slate-500">Track penalties with evidence, amount and room mapping.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Cases" value={String(filtered.length)} subtitle="Open and archived records" />
        <StatCard title="Penalty Total" value={formatCurrency(totalPenalty)} subtitle="Current filtered range" />
        <StatCard title="Evidence Ratio" value={`${Math.round((filtered.filter((i) => i.evidence).length / Math.max(1, filtered.length)) * 100)}%`} subtitle="Records with images" />
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
        <Input placeholder="Search ID / room / item" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Input type="number" placeholder="Min amount" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} />
        <Input type="number" placeholder="Max amount" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} />
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-600">
          <input type="checkbox" checked={hasImage} onChange={(e) => setHasImage(e.target.checked)} /> Has image
        </label>
      </div>

      <Table columns={columns} rows={paged} />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
