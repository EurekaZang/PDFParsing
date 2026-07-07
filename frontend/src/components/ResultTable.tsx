import type { ParseResult } from '../types';

interface ResultTableProps {
  results: ParseResult[];
}

export function ResultTable({ results }: ResultTableProps) {
  const rows = results.flatMap((result) =>
    result.line_items.map((item) => ({ result, item }))
  );

  if (!results.length) {
    return <p className="empty-state">No parsed files yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Source File</th>
            <th>PO Number</th>
            <th>PO Date</th>
            <th>Ship To</th>
            <th>Item</th>
            <th>Material</th>
            <th>Description</th>
            <th>U/M</th>
            <th>Total Qty</th>
            <th>Qty Recd</th>
            <th>Qty Retd</th>
            <th>Unit Price</th>
            <th>Item Value</th>
            <th>Due Date</th>
            <th>Status / Warnings</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ result, item }) => (
            <tr key={`${result.source_file}-${item.item}-${item.material}`}>
              <td>{result.source_file}</td>
              <td>{result.po_number}</td>
              <td>{result.po_date}</td>
              <td className="multiline">{result.ship_to}</td>
              <td>{item.item}</td>
              <td>{item.material}</td>
              <td>{item.description}</td>
              <td>{item.uom}</td>
              <td>{item.total_qty}</td>
              <td>{item.qty_recd}</td>
              <td>{item.qty_retd}</td>
              <td>{item.unit_price}</td>
              <td>{item.item_value}</td>
              <td>{item.due_date}</td>
              <td>{[result.status, ...result.warnings, ...item.warnings].filter(Boolean).join('; ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty-state">Files parsed, but no material rows were found.</p>}
    </div>
  );
}
