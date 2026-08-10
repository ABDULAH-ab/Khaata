import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import {
  findCustomer,
  updateLedger,
  getOverdueCustomers,
  createCustomer,
  deleteCustomer,
} from "@/lib/tools";
import type {
  ChatMessage,
  Plan,
  TaskResult,
  FindCustomerResult,
  UpdateLedgerResult,
  OverdueCustomerResult,
  CreateCustomerResult,
  DeleteCustomerResult,
  Customer,
} from "@/lib/types";

// ============================================
// AGENT STATE
// ============================================

const AgentState = Annotation.Root({
  // User's current message
  userMessage: Annotation<string>,
  // Full conversation history
  conversationHistory: Annotation<ChatMessage[]>,
  // The plan produced by the planner
  plan: Annotation<Plan | null>,
  // Index of the current task being executed
  currentTaskIndex: Annotation<number>,
  // Map of resolved customers (taskId → customer)
  resolvedCustomers: Annotation<Record<string, Customer>>,
  // Results of completed tasks
  completedResults: Annotation<TaskResult[]>,
  // If set, executor needs to ask user for clarification
  pendingClarification: Annotation<string | null>,
  // Final response text from responder
  response: Annotation<string | null>,
});

type AgentStateType = typeof AgentState.State;

// ============================================
// LLM INSTANCE
// ============================================

function getLLM() {
  const apiKey = process.env.OPENAI_API_KEY;
  return new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || "openai/gpt-oss-120b",
    temperature: 0.1,
    apiKey: apiKey,
    openAIApiKey: apiKey,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
  });
}

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `You are a ledger assistant for a small shop owner (khata/tab system). Customers buy on credit and pay it off later. You work in Rupees (Rs.) as the currency.

CRITICAL RULES:
1. LANGUAGE MATCHING: You MUST respond in the EXACT SAME LANGUAGE as the user's current message!
   - If the user's input is in English (e.g. "abdullah paid 100", "who owes me money?", "create new customer"), you MUST respond strictly in plain English!
   - If the user's input is in Roman Urdu / Urdu (e.g. "abdullah ne 100 de diye", "record delete krdo"), respond in Roman Urdu!
2. LEDGER MATH DEFINITIONS:
   - Positive balance (e.g. Rs 150) = Customer owes money to the shopkeeper (Debt).
   - Zero balance (Rs 0) = Tab is completely settled.
   - Negative balance (e.g. -Rs 150) = Customer deposited advance credit or overpaid (the shopkeeper holds Rs 150 advance credit for the customer, OR owes Rs 150 change to customer).
3. PLAIN TEXT ONLY: Do NOT use markdown bold headers, bullet lists (- **Customer:**), or code blocks. Write short, friendly 1-2 sentence replies.`;

// ============================================
// PLANNER NODE
// ============================================

async function plannerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const llm = getLLM();

  const plannerPrompt = `${SYSTEM_PROMPT}

You are the PLANNER. Your job is to analyze the user's message alongside the conversation history and break it down into an ordered list of tasks.

Available tools:
1. find_customer(name) — look up a customer by name
2. update_ledger(customer_id, type, amount, description, raw_input) — record a charge or payment
3. get_overdue_customers(days_threshold) — find customers with overdue balances
4. create_customer(name) — create a new customer
5. delete_customer(customer_id) — permanently remove a customer and their records from the system
6. clarify(question) — ask the user a clarifying question

IMPORTANT RULES:
- Read both the Conversation History AND current user message.
- A message can contain MULTIPLE transactions (e.g. "Ali took milk 150, Sara paid her tab"). Break each into separate tasks.
- For ANY transaction (charge or payment) on a customer who might already exist, you MUST first find_customer, then update_ledger. NEVER use create_customer for payment/charge transactions!
- create_customer is ONLY for when the user EXPLICITLY asks to create/add a new customer (e.g. "Create customer Kamran", "Add new customer Tariq"). Do NOT use it for recording payments or charges.
- For NEW customer creation (e.g. "Create customer Kamran", "Yes create account for Kamran", "Add customer Tariq"):
  1. Use task type "create_customer" with args: { "name": "Kamran" }.
  2. If there is also a transaction for the new customer, add an update_ledger task that dependsOn the create_customer task.
- For DELETING / REMOVING a customer from the system (e.g. "ahmed ka record delete krdo", "remove krna hai", "system se remove krna hai", "delete customer"):
  1. Look up the customer name from the current message OR previous conversation context (e.g. "Ahmed").
  2. Create a task "find_customer" with args: { "name": "Ahmed" }.
  3. Create a task "delete_customer" that dependsOn the find_customer task.
- For "paid off" / "cleared" / "settled" / "0 krdo" / "zero krdo" / "clear krdo" / "set to zero" phrasing:
  1. Identify customer name from current message or previous conversation context (e.g. "Abdullah").
  2. Create task "find_customer" with args: { "name": "Abdullah" }.
  3. Create task "update_ledger" with args: { "type": "settle", "amount": "SET_TO_ZERO", "description": "Balance cleared to zero" }.
- For QUESTIONS or EXPLANATIONS about a customer's balance or status (e.g. "how is it settled?", "what is Abdullah's balance?", "why does it show negative?", "explain Abdullah's record"):
  1. Look up the customer name from the current message OR previous conversation context (e.g. "Abdullah").
  2. Create a task "find_customer" with args: { "name": "Abdullah" }.
- For queries like "who owes me money?" or "show overdue", use get_overdue_customers.
- If the message is completely unclear and cannot be inferred from context, create a clarify task.
- Each update_ledger OR delete_customer task must depend on a preceding find_customer OR create_customer task.

Respond with ONLY valid JSON in this exact format:
{
  "reasoning": "brief explanation of what you understood",
  "tasks": [
    {
      "id": 1,
      "type": "find_customer",
      "args": { "name": "Ahmed" },
      "description": "Look up Ahmed"
    },
    {
      "id": 2,
      "type": "delete_customer",
      "dependsOn": 1,
      "args": {},
      "description": "Delete Ahmed from the system"
    }
  ]
}

Conversation so far:
${state.conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}

Current user message: ${state.userMessage}

Respond with ONLY the JSON plan:`;

  const response = await llm.invoke(plannerPrompt);
  const content =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  let plan: Plan;
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
    plan = JSON.parse(jsonStr);
  } catch {
    plan = {
      reasoning: "Could not parse the message into specific tasks",
      tasks: [
        {
          id: 1,
          type: "clarify",
          args: {
            question:
              "I didn't quite understand that. Could you specify the customer name and what you would like me to update?",
          },
          description: "Ask for clarification",
        },
      ],
    };
  }

  return {
    plan,
    currentTaskIndex: 0,
    resolvedCustomers: {},
    completedResults: [],
    pendingClarification: null,
    response: null,
  };
}

// ============================================
// EXECUTOR NODE
// ============================================

async function executorNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const plan = state.plan;
  if (!plan || !plan.tasks || state.currentTaskIndex >= plan.tasks.length) {
    return {};
  }

  const task = plan.tasks[state.currentTaskIndex];
  const resolvedCustomers = { ...state.resolvedCustomers };
  const completedResults = [...state.completedResults];

  // Handle clarify tasks
  if (task.type === "clarify") {
    return {
      pendingClarification: (task.args.question as string) || "Could you provide more details?",
      currentTaskIndex: state.currentTaskIndex + 1,
    };
  }

  // Execute based on tool type
  let result: TaskResult;

  switch (task.type) {
    case "find_customer": {
      const findResult: FindCustomerResult = await findCustomer(
        task.args.name as string
      );

      if (findResult.status === "found" && findResult.customer) {
        resolvedCustomers[String(task.id)] = findResult.customer;
      } else if (findResult.status === "ambiguous" && findResult.candidates) {
        const names = findResult.candidates
          .map((c) => c.name)
          .join(" or ");
        return {
          pendingClarification: `Did you mean ${names}? Please specify which customer.`,
          currentTaskIndex: state.currentTaskIndex + 1,
          resolvedCustomers,
          completedResults: [
            ...completedResults,
            { taskId: task.id, toolName: "find_customer", result: findResult },
          ],
        };
      } else if (findResult.status === "not_found") {
        return {
          pendingClarification: `I don't have a customer named "${task.args.name}". Would you like me to create a new account for them?`,
          currentTaskIndex: state.currentTaskIndex + 1,
          resolvedCustomers,
          completedResults: [
            ...completedResults,
            { taskId: task.id, toolName: "find_customer", result: findResult },
          ],
        };
      }

      result = {
        taskId: task.id,
        toolName: "find_customer",
        result: findResult,
      };
      break;
    }

    case "update_ledger": {
      const depId = task.dependsOn;
      const customer = depId ? resolvedCustomers[String(depId)] : null;

      if (!customer) {
        result = {
          taskId: task.id,
          toolName: "update_ledger",
          result: {
            status: "error",
            error: "Could not resolve customer for this transaction",
          } as UpdateLedgerResult,
        };
        break;
      }

      let type = (task.args.type as "charge" | "payment") || "payment";
      let amount = Number(task.args.amount);
      const currentBal = Number(customer.balance);

      const isZeroRequest =
        task.args.amount === "FULL_BALANCE" ||
        task.args.amount === "full_balance" ||
        task.args.amount === "SET_TO_ZERO" ||
        task.args.amount === "set_to_zero" ||
        task.args.type === "settle";

      if (isZeroRequest) {
        if (currentBal === 0) {
          result = {
            taskId: task.id,
            toolName: "update_ledger",
            result: {
              status: "success",
              newBalance: 0,
              customerName: customer.name,
            } as UpdateLedgerResult,
          };
          break;
        } else if (currentBal > 0) {
          type = "payment";
          amount = currentBal;
        } else {
          // Negative balance (e.g. -350): charge Math.abs(currentBal) to bring balance to 0
          type = "charge";
          amount = Math.abs(currentBal);
        }
      }

      const ledgerResult: UpdateLedgerResult = await updateLedger(
        customer.id,
        type,
        amount,
        (task.args.description as string) || (isZeroRequest ? "Balance cleared to zero" : ""),
        state.userMessage
      );

      result = { taskId: task.id, toolName: "update_ledger", result: ledgerResult };
      break;
    }

    case "get_overdue_customers": {
      const overdueResult: OverdueCustomerResult = await getOverdueCustomers(
        (task.args.days_threshold as number) || 14
      );
      result = {
        taskId: task.id,
        toolName: "get_overdue_customers",
        result: overdueResult,
      };
      break;
    }

    case "create_customer": {
      const createResult: CreateCustomerResult = await createCustomer(
        task.args.name as string
      );
      if (createResult.status === "created" && createResult.customer) {
        resolvedCustomers[String(task.id)] = createResult.customer;
      }
      result = {
        taskId: task.id,
        toolName: "create_customer",
        result: createResult,
      };
      break;
    }

    case "delete_customer": {
      const depId = task.dependsOn;
      const customer = depId ? resolvedCustomers[String(depId)] : null;

      if (!customer) {
        result = {
          taskId: task.id,
          toolName: "delete_customer",
          result: {
            status: "error",
            error: "Could not resolve customer to delete",
          } as DeleteCustomerResult,
        };
        break;
      }

      const delResult: DeleteCustomerResult = await deleteCustomer(customer.id);
      result = {
        taskId: task.id,
        toolName: "delete_customer",
        result: delResult,
      };
      break;
    }

    default: {
      result = {
        taskId: task.id,
        toolName: task.type,
        result: {
          status: "error",
          error: `Unknown tool: ${task.type}`,
        } as UpdateLedgerResult,
      };
    }
  }

  return {
    currentTaskIndex: state.currentTaskIndex + 1,
    resolvedCustomers,
    completedResults: [...completedResults, result],
  };
}

// ============================================
// RESPONDER NODE
// ============================================

async function responderNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  if (state.pendingClarification) {
    return { response: state.pendingClarification };
  }

  if (!state.completedResults || state.completedResults.length === 0) {
    return {
      response:
        "I'm not sure what you'd like me to do. You can tell me things like 'Ali took milk 150', 'remove Ahmed from system', or 'who owes me money?' and I'll handle it.",
    };
  }

  const llm = getLLM();

  const responderPrompt = `${SYSTEM_PROMPT}

You are the RESPONDER. Summarize what was done back to the shopkeeper in plain, friendly language (in English or Roman Urdu matching the user's style).

The planner broke the message into tasks. Here are the results:

Plan reasoning: ${state.plan?.reasoning || "N/A"}

Task results:
${JSON.stringify(state.completedResults, null, 2)}

RULES:
- MATCH USER LANGUAGE: Check current user message "${state.userMessage}". If it is in English, reply strictly in plain English! If it is in Roman Urdu, reply in Roman Urdu!
- NO MARKDOWN BULLETS OR HEADERS: Write a clean 1-2 sentence conversational paragraph. Do NOT use markdown headers (**Customer:**), bold key-value pairs, or dash bullet lists (- **Transaction type:**).
- EXPLAIN LEDGER MATH ACCURATELY:
  - If new balance is positive (e.g. Rs 150): state clearly that the customer owes Rs 150.
  - If new balance is zero (Rs 0): state clearly that the tab is completely settled.
  - If new balance is negative (e.g. -Rs 50): state clearly that the customer has deposited Rs 50 advance credit (or overpaid by Rs 50). Do NOT say the store needs to collect money when balance is negative!
- For delete_customer results, confirm that the customer and their records have been removed.
- Use Rs. for currency.

Write your response:`;

  const response = await llm.invoke(responderPrompt);
  const content =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return { response: content };
}

// ============================================
// ROUTING LOGIC
// ============================================

function shouldContinueExecuting(state: AgentStateType): string {
  if (state.pendingClarification) {
    return "responder";
  }

  if (
    state.plan &&
    state.plan.tasks &&
    state.currentTaskIndex < state.plan.tasks.length
  ) {
    return "executor";
  }

  return "responder";
}

// ============================================
// BUILD THE GRAPH
// ============================================

export function buildAgentGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("planner", plannerNode)
    .addNode("executor", executorNode)
    .addNode("responder", responderNode)
    .addEdge(START, "planner")
    .addEdge("planner", "executor")
    .addConditionalEdges("executor", shouldContinueExecuting, {
      executor: "executor",
      responder: "responder",
    })
    .addEdge("responder", END);

  return graph.compile();
}

// ============================================
// PUBLIC API: Run the agent
// ============================================

export async function runAgent(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ response: string; conversationHistory: ChatMessage[] }> {
  const graph = buildAgentGraph();

  const result = await graph.invoke({
    userMessage,
    conversationHistory,
    plan: null,
    currentTaskIndex: 0,
    resolvedCustomers: {},
    completedResults: [],
    pendingClarification: null,
    response: null,
  });

  const agentResponse =
    result.response || "Something went wrong. Please try again.";

  const updatedHistory: ChatMessage[] = [
    ...conversationHistory,
    { role: "user", content: userMessage },
    { role: "assistant", content: agentResponse },
  ];

  return {
    response: agentResponse,
    conversationHistory: updatedHistory,
  };
}
