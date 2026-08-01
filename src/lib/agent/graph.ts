import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import {
  findCustomer,
  updateLedger,
  getOverdueCustomers,
  createCustomer,
} from "@/lib/tools";
import type {
  ChatMessage,
  Plan,
  TaskResult,
  FindCustomerResult,
  UpdateLedgerResult,
  OverdueCustomerResult,
  CreateCustomerResult,
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
    modelName: process.env.OPENAI_MODEL || "gpt-4o",
    temperature: 0.1,
    apiKey: apiKey,
    openAIApiKey: apiKey,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
  });
}

// ============================================
// SYSTEM PROMPT (from plan.md §6)
// ============================================

const SYSTEM_PROMPT = `You are a ledger assistant for a small shop owner (khata/tab system). Customers buy on credit and pay it off later. Your job is to accurately record what the shopkeeper tells you in plain language, using your tools — never update balances without calling a tool. If a customer name is ambiguous, ask before acting. If someone says they "paid off" or "cleared" their tab, look up their current balance first and record a payment for that exact amount. Always confirm back what you recorded in plain language.

You work in Rupees (Rs.) as the currency.`;

// ============================================
// PLANNER NODE
// ============================================

async function plannerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const llm = getLLM();

  const plannerPrompt = `${SYSTEM_PROMPT}

You are the PLANNER. Your job is to analyze the user's message and break it down into an ordered list of tasks.

Available tools:
1. find_customer(name) — look up a customer by name
2. update_ledger(customer_id, type, amount, description, raw_input) — record a charge or payment
3. get_overdue_customers(days_threshold) — find customers with overdue balances
4. create_customer(name) — create a new customer
5. clarify(question) — ask the user a clarifying question

IMPORTANT RULES:
- A message can contain MULTIPLE transactions (e.g. "Ali took milk 150, Sara paid her tab"). Break each into separate tasks.
- For ANY transaction, you must first find_customer, then update_ledger.
- For "paid off" / "cleared" / "settled" phrasing, set amount to "FULL_BALANCE" — the executor will look up the actual balance.
- For queries like "who owes me money?" or "show overdue", use get_overdue_customers.
- If the message is unclear (no amount, no customer), create a clarify task.
- Each update_ledger task must depend on a preceding find_customer task.

Respond with ONLY valid JSON in this exact format:
{
  "reasoning": "brief explanation of what you understood",
  "tasks": [
    {
      "id": 1,
      "type": "find_customer",
      "args": { "name": "Ali" },
      "description": "Look up Ali"
    },
    {
      "id": 2,
      "type": "update_ledger",
      "dependsOn": 1,
      "args": { "type": "charge", "amount": 150, "description": "milk" },
      "description": "Charge Ali 150 for milk"
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
    // Extract JSON from potential markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
    plan = JSON.parse(jsonStr);
  } catch {
    // If parsing fails, create a clarify task
    plan = {
      reasoning: "Could not parse the message into specific tasks",
      tasks: [
        {
          id: 1,
          type: "clarify",
          args: {
            question:
              "I didn't quite understand that. Could you tell me the customer name and what happened (e.g., 'Ali took milk 150' or 'Sara paid 500')?",
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
      // Resolve customer from dependency
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

      // Handle FULL_BALANCE amount (for "paid off" / "cleared" phrasing)
      let amount = Number(task.args.amount);
      if (
        task.args.amount === "FULL_BALANCE" ||
        task.args.amount === "full_balance"
      ) {
        amount = Number(customer.balance);
        if (amount <= 0) {
          result = {
            taskId: task.id,
            toolName: "update_ledger",
            result: {
              status: "error",
              error: `${customer.name}'s balance is already ${customer.balance}. There's nothing to pay off.`,
            } as UpdateLedgerResult,
          };
          break;
        }
      }

      const ledgerResult: UpdateLedgerResult = await updateLedger(
        customer.id,
        task.args.type as "charge" | "payment",
        amount,
        (task.args.description as string) || "",
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
  // If there's a pending clarification, return that directly
  if (state.pendingClarification) {
    return { response: state.pendingClarification };
  }

  // If no completed results, provide a generic response
  if (!state.completedResults || state.completedResults.length === 0) {
    return {
      response:
        "I'm not sure what you'd like me to do. You can tell me things like 'Ali took milk 150' or 'who owes me money?' and I'll handle it.",
    };
  }

  const llm = getLLM();

  const responderPrompt = `${SYSTEM_PROMPT}

You are the RESPONDER. Summarize what was done back to the shopkeeper in plain, friendly language.

The planner broke the message into tasks. Here are the results:

Plan reasoning: ${state.plan?.reasoning || "N/A"}

Task results:
${JSON.stringify(state.completedResults, null, 2)}

RULES:
- Confirm each transaction clearly (customer name, amount, type, new balance).
- Use Rs. for currency.
- For overdue customer queries, list them clearly with their balances and how many days overdue.
- Keep it concise and conversational — this is a shopkeeper, not a bank executive.
- If any errors occurred, explain them simply.
- Do NOT use markdown formatting — plain text only.

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
  // If there's a pending clarification, go to responder
  if (state.pendingClarification) {
    return "responder";
  }

  // If there are more tasks to execute, loop back to executor
  if (
    state.plan &&
    state.plan.tasks &&
    state.currentTaskIndex < state.plan.tasks.length
  ) {
    return "executor";
  }

  // All tasks done, go to responder
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

  // Build updated conversation history
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
