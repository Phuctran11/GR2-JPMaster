export interface Purchase {
  purchase_id: number;
  user_id: number;
  course_id: number;
  purchase_date: Date;
  price_paid: number;
  status: "pending" | "completed" | "canceled";
}

export type PurchaseStatus = Purchase["status"];

export const formatPurchase = (row: any): Purchase => ({
  purchase_id: row.purchase_id,
  user_id: row.user_id,
  course_id: row.course_id,
  purchase_date: row.purchase_date,
  price_paid: Number(row.price_paid),
  status: row.status,
});
