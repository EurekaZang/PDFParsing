import type { LineItem, ParseResult } from '../types';

interface ResultTableProps {
  results: ParseResult[];
}

interface ResultRow {
  result: ParseResult;
  item: LineItem | null;
}

export function ResultTable({ results }: ResultTableProps) {
  const rows: ResultRow[] = [];
  for (const result of results) {
    if (!result.line_items.length) {
      rows.push({ result, item: null });
      continue;
    }
    for (const item of result.line_items) {
      rows.push({ result, item });
    }
  }

  if (!results.length) {
    return (
      <div className="empty-state">
        <strong>还没有解析结果</strong>
        <span>选择 PDF 后点击「解析 PDF」，物料行会显示在这里。</span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>状态</th>
            <th>文件</th>
            <th>PO</th>
            <th>日期</th>
            <th>物料</th>
            <th>描述</th>
            <th>厂牌料号</th>
            <th>数量</th>
            <th>单价</th>
            <th>交期</th>
            <th>收货地址</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ result, item }, index) => {
            const warnings = [...result.warnings, ...(item?.warnings ?? [])].filter(Boolean);
            const key = item
              ? `${result.source_file}-${item.item}-${item.material}`
              : `${result.source_file}-empty-${index}`;

            return (
              <tr key={key}>
                <td>
                  <span className={`status-pill ${result.status}`}>{result.status}</span>
                </td>
                <td className="cell-file" title={result.source_file}>
                  {result.source_file}
                </td>
                <td className="cell-mono">{result.po_number || '—'}</td>
                <td className="cell-mono">{result.po_date || '—'}</td>
                <td className="cell-mono">{item?.material ?? '—'}</td>
                <td className="cell-desc">{item?.description || '—'}</td>
                <td className="cell-mono">{item?.manufacturer_part_number || '—'}</td>
                <td className="cell-num">{item?.total_qty ?? '—'}</td>
                <td className="cell-num">{item?.unit_price ?? '—'}</td>
                <td className="cell-mono">{item?.due_date ?? '—'}</td>
                <td className="cell-ship" title={result.ship_to}>
                  {result.ship_to || '—'}
                </td>
                <td className="cell-warn">
                  {result.error || warnings.join('; ') || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
