import { useEffect, useState } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus(data.message);
      })
      .catch(() => {
        setBackendStatus("Backend unavailable");
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          RecoverAI
        </h1>

        <p className="mt-3 text-slate-400">
          AI Revenue Recovery Platform
        </p>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 px-6 py-4">
          <p className="text-sm text-slate-400">
            Backend Status
          </p>

          <p className="mt-1 text-green-400">
            {backendStatus}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;