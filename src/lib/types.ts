// Database types matching Supabase schema

export interface Customer {
  id: string;
  name: string;
  aliases: string[];
  balance: number;
  created_at: string;
  last_transaction_at: string | null;
}

export interface Transaction {
  id: string;
  customer_id: string;
  type: "charge" | "payment";
  amount: number;
  description: string | null;
  raw_input: string | null;
  created_at: string;
}

// Tool result types
export interface FindCustomerResult {
  status: "found" | "ambiguous" | "not_found";
  customer?: Customer;
  candidates?: Customer[];
  searchedName?: string;
}

export interface UpdateLedgerResult {
  status: "success" | "error";
  transaction?: Transaction;
  newBalance?: number;
  customerName?: string;
  error?: string;
}

export interface OverdueCustomerResult {
  status: "success";
  customers: Customer[];
  daysThreshold: number;
}

export interface CreateCustomerResult {
  status: "created" | "error";
  customer?: Customer;
  error?: string;
}

export interface DeleteCustomerResult {
  status: "success" | "error";
  customerName?: string;
  error?: string;
}

// Agent types
export interface PlanTask {
  id: number;
  type:
    | "find_customer"
    | "update_ledger"
    | "get_overdue_customers"
    | "create_customer"
    | "delete_customer"
    | "clarify";
  args: Record<string, unknown>;
  dependsOn?: number;
  description: string;
}

export interface Plan {
  tasks: PlanTask[];
  reasoning: string;
}

export interface TaskResult {
  taskId: number;
  toolName: string;
  result:
    | FindCustomerResult
    | UpdateLedgerResult
    | OverdueCustomerResult
    | CreateCustomerResult
    | DeleteCustomerResult;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
