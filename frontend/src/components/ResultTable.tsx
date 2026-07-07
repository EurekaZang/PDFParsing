import type { ParseResult } from '../types';

interface ResultTableProps {
  results: ParseResult[];
}

export function ResultTable({ results }: ResultTableProps) {
  const rows = results.flatMap((result) =>
    result.line_items.map((item) => ({ result, item }))
  );

  if (!results.length) {
    return (
      <div className="empty-state">
        <strong>No parsed files yet.</strong>
        <span>Select PDFs above, then parse them to preview material lines here.</span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Source file</th>
            <th>PO number</th>
            <th>PO date</th>
            <th>Ship to</th>
            <th>Item</th>
            <th>Material</th>
            <th>Description</th>
            <th>Manufacturer part number</th>
            <th>U/M</th>
            <th>Total qty</th>
            <th>Qty recd</th>
            <th>Qty retd</th>
            <th>Unit price</th>
            <th>Item value</th>
            <th>Due date</th>
            <th>Status / warnings</th>
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
              <td>{item.manufacturer_part_number}</td>
              <td>{item.uom}</td>
              <td>{item.total_qty}</td>
              <td>{item.qty_recd}</td>
              <td>{item.qty_retd}</td>
              <td>{item.unit_price}</td>
              <td>{item.item_value}</td>
              <td>{item.due_date}</td>
              <td>
                <span className={`status-pill ${result.status}`}>{result.status}</span>
                {[...result.warnings, ...item.warnings].filter(Boolean).join('; ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="empty-state inline">
          <strong>Files parsed, but no material rows were found.</strong>
          <span>Check the source PDFs or warnings before exporting.</span>
        </div>
      )}
    </div>
  );
}
