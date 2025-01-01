export interface Transaction {
  id: number;
  description: string;
  date: string;
  categoryId?: number;
  amount: number;
  type: string;
  paymentMethodId?: number;
  userId: string;
}

export interface TransactionCreate {
  description: string;
  date: string;
  categoryId?: number;
  amount: number;
  type: string;
  paymentMethodId?: number;
  userId: string;
}
export interface ApiResponseTransactions<T> {
  data: T | null;
  error: string | null;
}
