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

const getRecoveryCases = async (params = "") => {
  return request(
    `/recovery/cases${params}`
  );
};


const getRecoveryCase = async (id) => {
  return request(
    `/recovery/cases/${id}`
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

const runRecoveryWorker = async ({ ignoreSchedule = false, mode = "SIMULATION", limit = 20 } = {}) => {
    return request(
      "/recovery/worker/run",
      {
        method: "POST",
        body: JSON.stringify({
          ignoreSchedule,
          mode,
          limit
        })
      }
    );
  };

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

export {
  getDashboardSummary,
  getRecoveryCases,
  getRecoveryCase,
  processRecoveryCase,
  runRecoveryWorker,
  getRecoveryCaseAudit,
  runSimulation,
  getAgentActivity
};