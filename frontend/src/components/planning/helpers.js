export const fieldCls = (err) =>
  `w-full p-2.5 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 ${err ? 'border-rose-400' : 'border-slate-300'}`;

export const btnSecondary =
  'px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1 disabled:opacity-50';

export const moveItem = (list, index, delta) => {
  const j = index + delta;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[index], next[j]] = [next[j], next[index]];
  return next;
};
