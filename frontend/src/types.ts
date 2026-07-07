export type ParseStatus = 'parsed' | 'warning' | 'failed';

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface LineItem {
  item: string;
  material: string;
  description: string;
  manufacturer_part_number: string;
  uom: string;
  total_qty: string;
  qty_recd: string;
  qty_retd: string;
  unit_price: string;
  item_value: string;
  due_date: string;
  warnings: string[];
}

export interface ParseResult {
  source_file: string;
  po_number: string;
  po_date: string;
  ship_to: string;
  status: ParseStatus;
  warnings: string[];
  error: string | null;
  line_items: LineItem[];
}

export interface ParseBatchResponse {
  results: ParseResult[];
}
