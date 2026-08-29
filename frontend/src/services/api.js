const API_BASE_URL = "http://localhost:5000/api";

const request = async (endpoint,options = {}) => {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data;
};

const getDashboardSummary =
  async () => {
    return request(
      "/dashboard/summary"
    );
  };

const getAnalytics = async () => {
  return request(
    "/analytics"
  );
};

const getRecoveryCases = async ({
  page = 1,
  limit = 25,
  search = "",
  status = "ALL",
  sort = "priority"
} = {}) => {
  const params =
    new URLSearchParams();

  params.set(
    "page",
    page
  );

  params.set(
    "limit",
    limit
  );

  if (search.trim()) {
    params.set(
      "search",
      search.trim()
    );
  }

  if (
    status &&
    status !== "ALL"
  ) {
    params.set(
      "status",
      status
    );
  }

  params.set(
    "sort",
    sort
  );

  return request(
    `/recovery/cases?${params.toString()}`
  );
};


const getRecoveryCase = async (id) => {
  return request(
    `/recovery/cases/${id}`
  );
};

const getCustomers = async ({
  page = 1,
  limit = 25,
  search = "",
  sort = "ltv"
} = {}) => {
  const params =
    new URLSearchParams();

  params.set("page", page);
  params.set("limit", limit);
  params.set("sort", sort);

  if (search.trim()) {
    params.set("search", search.trim());
  }

  return request(
    `/customers?${params.toString()}`
  );
};

const getCustomer = async (id) => {
  return request(
    `/customers/${id}`
  );
};

const getPayments = async ({
  page = 1,
  limit = 25,
  search = "",
  status = "ALL"
} = {}) => {
  const params =
    new URLSearchParams();

  params.set("page", page);
  params.set("limit", limit);

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (
    status &&
    status !== "ALL"
  ) {
    params.set("status", status);
  }

  return request(
    `/payments?${params.toString()}`
  );
};

const getPayment = async (id) => {
  return request(
    `/payments/${id}`
  );
};

const processRecoveryCase = async (
    id,
    mode = "SIMULATION"
  ) => {
    return request(`/recovery/cases/${id}/process`, {
      method: "POST",
      body: JSON.stringify({
        mode
      })
    });
  };

// const runRecoveryWorker = async ({ ignoreSchedule = false, mode = "SIMULATION", limit = 20 } = {}) => {
//     return request(
//       "/recovery/worker/run",
//       {
//         method: "POST",
//         body: JSON.stringify({
//           ignoreSchedule,
//           mode,
//           limit
//         })
//       }
//     );
//   };

  const getRecoveryCaseAudit =
  async (id) => {
    return request(
      `/recovery/cases/${id}/audit`
    );
  };


const runSimulation = async ({
    batchSize = 10,
    mode = "SIMULATION"
  } = {}) => {
    return request("/simulation/run", {
      method: "POST",
      body: JSON.stringify({
        batchSize,
        mode
      })
    });
  };

const getAgentActivity = async (
    limit = 30
  ) => {
    return request(
      `/agent/activity?limit=${limit}`
    );
  };

const getMerchantPolicy = async () => {
    return request("/policies");
  };

const runSimulationScenario = async (
  scenario
) => {
  return request(
    "/simulation/scenario",
    {
      method: "POST",
      body: JSON.stringify({
        scenario
      })
    }
  );
};

const updateMerchantPolicy = async (
  values
) => {
  return request(
    "/policies",
    {
      method: "PUT",
      body: JSON.stringify(values)
    }
  );
};

const getAuditLogs = async ({
  page = 1,
  limit = 50,
  search = "",
  actor = "ALL",
  eventType = "ALL"
} = {}) => {
  const params =
    new URLSearchParams();

  params.set("page", page);
  params.set("limit", limit);

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (
    actor &&
    actor !== "ALL"
  ) {
    params.set("actor", actor);
  }

  if (
    eventType &&
    eventType !== "ALL"
  ) {
    params.set("eventType", eventType);
  }

  return request(
    `/audit?${params.toString()}`
  );
};

const getWebhookStatus = async () => {
    return request("/webhooks/status");
  };

const approveEscalatedCase = async (id) => {
    return request(
      `/escalations/${id}/approve`,
      {
        method: "POST"
      }
    );
  };

const rejectEscalatedCase = async (id) => {
    return request(
      `/escalations/${id}/reject`,
      {
        method: "POST"
      }
    );
  };

const simulatePaymentFailure = async ({
    email = "amit.singh@example.demo",
    amount = 4999,
    method = "card",
    failureCode = "BANK_TEMPORARY_FAILURE",
    failureReason = "Temporary bank-side payment failure"
  } = {}) => {
    return request(
      "/demo/payment-failure",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          amount,
          method,
          failureCode,
          failureReason
        })
      }
    );
  };

const runRecoveryWorker = async ({
  recoveryCaseId = null,
  limit = 10,
  mode = "SIMULATION",
  ignoreSchedule = true
} = {}) => {

  return request(
    "/recovery/worker/run",
    {
      method: "POST",

      body: JSON.stringify({
        recoveryCaseId,
        limit,
        mode,
        ignoreSchedule
      })
    }
  );
};

export {
  getDashboardSummary,
  getAnalytics,
  getRecoveryCases,
  getRecoveryCase,
  getCustomers,
  getCustomer,
  getPayments,
  getPayment,
  processRecoveryCase,
  runRecoveryWorker,
  getRecoveryCaseAudit,
  runSimulation,
  runSimulationScenario,
  getAgentActivity,
  getMerchantPolicy,
  updateMerchantPolicy,
  getAuditLogs,
  getWebhookStatus,
  approveEscalatedCase,
  rejectEscalatedCase,
  simulatePaymentFailure
};
