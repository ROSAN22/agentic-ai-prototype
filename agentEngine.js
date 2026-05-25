/**
 * =================================================================
 *   RAPIDPRO AGENTIC ORCHESTRATOR - STATE & SIMULATION ENGINE
 * =================================================================
 */

// Simulated Agents database
const AGENTS = {
  orchestrator: { id: "orchestrator", name: "Orchestrator Master", role: "Goal Decomposition", avatar: "🧠", color: "#6366f1" },
  discovery: { id: "discovery", name: "Discovery Agent", role: "Metadata Schema Scanner", avatar: "🔍", color: "#14b8a6" },
  mapper: { id: "mapper", name: "Schema Mapper", role: "Attribute Auto-Alignment", avatar: "🗺️", color: "#8b5cf6" },
  tuning: { id: "tuning", name: "Performance Tuner", role: "Batch & Thread Optimizer", avatar: "⚡", color: "#f59e0b" },
  execution: { id: "execution", name: "VM Provisioner", role: "Container & Worker Deployer", avatar: "🚀", color: "#3b82f6" },
  monitoring: { id: "monitoring", name: "Watchdog Monitor", role: "Deadlock & Recovery Handler", avatar: "🛡️", color: "#ef4444" },
  reporting: { id: "reporting", name: "Client Reporter", role: "Metric Summaries & Notification", avatar: "✉️", color: "#10b981" }
};

// Mock Metadata Schemas for visualization
const MOCK_SCHEMAS = {
  source: [
    { key: "item_id", type: "STRING (PK)", sample: "DOC-2026-981" },
    { key: "creator_name", type: "VARCHAR(255)", sample: "J. Doe" },
    { key: "creation_date", type: "TIMESTAMP", sample: "2026-05-23 10:45:00" },
    { key: "document_class", type: "VARCHAR(50)", sample: "Invoices" },
    { key: "content_blob", type: "BLOB (Content)", sample: "0x89504E470A..." },
    { key: "retention_code", type: "INTEGER", sample: "7" }
  ],
  target: [
    { key: "s3_object_key", type: "STRING (UUID)", sample: "us-east-1/docs/DOC-2026-981.json" },
    { key: "author", type: "STRING", sample: "J. Doe" },
    { key: "migrated_at", type: "TIMESTAMP", sample: "2026-05-23 11:29:49" },
    { key: "doc_category", type: "STRING", sample: "Invoices" },
    { key: "storage_uri", type: "STRING", sample: "s3://rapidpro-target-bucket/invoices/" },
    { key: "retention_period_yrs", type: "INTEGER", sample: "7" }
  ]
};

// Default Simulation State
let simState = {
  isRunning: false,
  currentStep: 0,
  progress: 0,
  batchSize: 50000,
  threads: 4,
  throughput: 0,
  totalMigrated: 0,
  totalItems: 350000,
  vms: [
    { id: "VM-1", name: "Node Worker 01", status: "offline", cpu: 0 },
    { id: "VM-2", name: "Node Worker 02", status: "offline", cpu: 0 },
    { id: "VM-3", name: "Node Worker 03", status: "offline", cpu: 0 },
    { id: "VM-4", name: "Node Worker 04", status: "offline", cpu: 0 }
  ],
  activeAgent: null,
  activeFilter: "all",
  deadlockSimulated: false,
  deadlockResolved: false,
  uploadedFileName: null,
  logs: []
};

// Timer hooks to clean up animations
let simulationInterval = null;

// Add a line of log into the trace
function addLog(agentId, type, message) {
  const timestamp = new Date().toLocaleTimeString();
  const agent = AGENTS[agentId] || { name: "System", color: "#94a3b8" };
  const logEntry = {
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    agentId,
    agentName: agent.name,
    agentColor: agent.color,
    type, // 'thought', 'action', 'observation', 'error', 'system'
    message,
    timestamp
  };
  simState.logs.push(logEntry);
  renderConsoleLogs();
  
  // Auto-scroll console
  const consoleBody = document.getElementById("console-body");
  if (consoleBody) {
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }
}

// Update an Agent's State badge
function setAgentState(agentId, state) {
  const element = document.getElementById(`status-${agentId}`);
  if (element) {
    element.className = `agent-status-pill ${state}`;
    element.innerText = state;
  }
  
  // Pulse effects on svg nodes
  const svgNode = document.getElementById(`svg-node-${agentId}`);
  if (svgNode) {
    if (state === "planning" || state === "executing") {
      svgNode.classList.add("pulse-node");
      svgNode.setAttribute("stroke", AGENTS[agentId].color);
      svgNode.setAttribute("stroke-width", "4");
    } else if (state === "completed") {
      svgNode.classList.remove("pulse-node");
      svgNode.setAttribute("stroke", "#10b981");
      svgNode.setAttribute("stroke-width", "3");
    } else {
      svgNode.classList.remove("pulse-node");
      svgNode.setAttribute("stroke", "rgba(255,255,255,0.1)");
      svgNode.setAttribute("stroke-width", "1.5");
    }
  }
}

// Helper to simulate asynchronous step processing
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Reset the entire UI & State
function resetSimulation() {
  if (simulationInterval) clearInterval(simulationInterval);
  simState.isRunning = false;
  simState.currentStep = 0;
  simState.progress = 0;
  simState.batchSize = 50000;
  simState.threads = 4;
  simState.throughput = 0;
  simState.totalMigrated = 0;
  simState.deadlockSimulated = false;
  simState.deadlockResolved = false;
  simState.vms.forEach(vm => {
    vm.status = "offline";
    vm.cpu = 0;
  });
  simState.logs = [];
  
  // Reset agents
  Object.keys(AGENTS).forEach(key => {
    setAgentState(key, "idle");
  });
  
  // Redraw SVG path highlights
  document.querySelectorAll(".svg-flow-path").forEach(path => {
    path.setAttribute("stroke", "rgba(255,255,255,0.06)");
    path.classList.remove("animated-flow");
  });

  // Reset UI sliders / monitors
  document.getElementById("batch-size-val").innerText = "50,000";
  document.getElementById("threads-val").innerText = "4";
  document.getElementById("throughput-val").innerText = "0";
  document.getElementById("migrated-val").innerText = "0";
  document.getElementById("progress-bar-fill").style.width = "0%";
  document.getElementById("progress-text").innerText = "0%";
  
  updateVMDashboard();
  renderConsoleLogs();
  
  document.getElementById("email-report-container").style.display = "none";
}

// Highlight interactive paths in SVG
function highlightPath(fromAgent, toAgent, color = "#6366f1") {
  const path = document.getElementById(`path-${fromAgent}-${toAgent}`);
  if (path) {
    path.setAttribute("stroke", color);
    path.classList.add("animated-flow");
  }
}

// Run the full AI Orchestration Simulation
async function startOrchestration(userPrompt) {
  resetSimulation();
  simState.isRunning = true;
  
  // Parse elements of prompt to tailor the simulation
  const lowercasePrompt = userPrompt.toLowerCase();
  let sourceSystem = "IBM Content Manager (IBM CM)";
  let targetSystem = "Amazon S3 Bucket";
  
  if (lowercasePrompt.includes("filenet")) {
    sourceSystem = "IBM FileNet Repository";
  }
  if (lowercasePrompt.includes("s3")) {
    targetSystem = "AWS S3 Cloud Store";
  } else if (lowercasePrompt.includes("filenet") && !lowercasePrompt.includes("s3")) {
    targetSystem = "FileNet Repository";
  }

  // ----------------------------------------------------
  // PHASE 1: Master Orchestrator Plan & Goal Formulation
  // ----------------------------------------------------
  simState.activeAgent = "orchestrator";
  setAgentState("orchestrator", "planning");
  addLog("orchestrator", "system", "Rapidpro Agentic Orchestration Initiated.");
  await delay(1000);
  addLog("orchestrator", "thought", `Detected query: "${userPrompt}". Objective identified: Automate and execute migration metadata flow from ${sourceSystem} to ${targetSystem}.`);
  await delay(1500);
  addLog("orchestrator", "action", `Decomposing goals into a 6-stage DAG pipeline. Dispatching tasks to specialized local agents via Microservices Gateway.`);
  await delay(1000);
  setAgentState("orchestrator", "executing");
  
  // Send packet to Discovery
  highlightPath("orchestrator", "discovery", "#14b8a6");
  setAgentState("discovery", "planning");
  await delay(1200);

  // ----------------------------------------------------
  // PHASE 2: Repository Discovery & Meta Scan
  // ----------------------------------------------------
  simState.activeAgent = "discovery";
  setAgentState("discovery", "executing");
  addLog("discovery", "thought", `Querying 'discoverserver' microservice at HTTP GET /api/v1/discover/schema for ${sourceSystem}...`);
  await delay(1500);
  addLog("discovery", "action", `Discovered metadata schema for IBM CM Repository source container. Found 6 core document classes.`);
  
  // Populate the UI lists with Source/Target values
  populateMappingSchema();
  
  addLog("discovery", "observation", `Metadata schemas discovered. Schema has 6 target items. Connection latency to target repository is 14ms (Healthy).`);
  await delay(1200);
  setAgentState("discovery", "completed");
  
  // Send data from Discovery to Schema Mapper
  highlightPath("discovery", "mapper", "#8b5cf6");
  setAgentState("mapper", "planning");
  await delay(1000);

  // ----------------------------------------------------
  // PHASE 3: Schema Mapping and Attribute auto-alignment
  // ----------------------------------------------------
  simState.activeAgent = "mapper";
  setAgentState("mapper", "executing");
  if (simState.uploadedFileName) {
    addLog("mapper", "thought", `User provided schema mapping sheet: '${simState.uploadedFileName}'. Parsing attributes and overriding defaults.`);
  } else {
    addLog("mapper", "thought", "No schema file uploaded. Fetching LLM mapping engine models to map IBM CM properties to target JSON metadata schemas.");
  }
  await delay(1500);
  addLog("mapper", "action", `Configuring 'migrationsetservice' mapper mappings: item_id -> s3_object_key, creator_name -> author, creation_date -> migrated_at...`);
  
  // Animate mappings visually
  animateMetadataMappings();
  
  await delay(1800);
  addLog("mapper", "observation", "Mapped successfully. 100% of required schema fields mapped. Attribute mapping configuration written back to config server.");
  setAgentState("mapper", "completed");

  // Send packet to performance tuning agent
  highlightPath("mapper", "tuning", "#f59e0b");
  setAgentState("tuning", "planning");
  await delay(1000);

  // ----------------------------------------------------
  // PHASE 4: Performance Analysis & Tuning Engine
  // ----------------------------------------------------
  simState.activeAgent = "tuning";
  setAgentState("tuning", "executing");
  addLog("tuning", "thought", `Default configuration parameters: BatchSize=50,000, ThreadSize=4. Scanning target cloud API limits...`);
  await delay(1500);
  addLog("tuning", "action", `Analyzing past throughput logs. Dynamic tuner is scaling BatchSize up by 50% and ThreadSize to 8 to optimize network latency.`);
  
  // Set tuned values in UI
  simState.batchSize = 75000;
  simState.threads = 8;
  document.getElementById("batch-size-val").innerText = "75,000";
  document.getElementById("threads-val").innerText = "8";
  
  await delay(1200);
  addLog("tuning", "observation", `Optimal tuning registered: BatchSize set to 75,000, ThreadSize configured to 8. Throughput estimated to increase by ~42%.`);
  setAgentState("tuning", "completed");

  // Send instruction to execution VM Provisioner
  highlightPath("tuning", "execution", "#3b82f6");
  setAgentState("execution", "planning");
  await delay(1000);

  // ----------------------------------------------------
  // PHASE 5: VM Provisioning & Container Orchestration
  // ----------------------------------------------------
  simState.activeAgent = "execution";
  setAgentState("execution", "executing");
  addLog("execution", "thought", `Provisioning 4 parallel Node Worker VMs in AWS subnet to support batch processing chunks...`);
  
  // Start up VM nodes in dashboard
  for (let i = 0; i < simState.vms.length; i++) {
    simState.vms[i].status = "tuning";
    updateVMDashboard();
    await delay(500);
  }
  
  await delay(1000);
  addLog("execution", "action", "Containers deployed to all 4 Worker VMs. Initializing migration job workers in detached mode.");
  
  for (let i = 0; i < simState.vms.length; i++) {
    simState.vms[i].status = "active";
    simState.vms[i].cpu = Math.floor(Math.random() * 20) + 40;
    updateVMDashboard();
  }
  
  await delay(1000);
  addLog("execution", "observation", "All 4 Worker VMs are active, healthy, and communicating telemetry with 'gateway' service.");
  setAgentState("execution", "completed");

  // Shift to Watchdog monitoring and progress run
  highlightPath("execution", "monitoring", "#ef4444");
  setAgentState("monitoring", "planning");
  await delay(1000);

  // ----------------------------------------------------
  // PHASE 6: Migration Progress Run & Deadlock Healing
  // ----------------------------------------------------
  simState.activeAgent = "monitoring";
  setAgentState("monitoring", "executing");
  addLog("monitoring", "system", "Real-time telemetry trace attached. Job migration pipeline started!");
  
  // Switch to monitor tab so they see progress
  switchTab("monitor");
  
  let currentPercentage = 0;
  simulationInterval = setInterval(async () => {
    if (currentPercentage >= 100) {
      clearInterval(simulationInterval);
      simState.vms.forEach(vm => {
        vm.cpu = 0;
        vm.status = "offline";
      });
      updateVMDashboard();
      completeMigration();
      return;
    }
    
    // Simulate deadlock at ~45%
    if (currentPercentage === 45 && !simState.deadlockSimulated) {
      clearInterval(simulationInterval);
      triggerDeadlockEvent();
      return;
    }

    currentPercentage += 5;
    simState.progress = currentPercentage;
    simState.totalMigrated = Math.min(simState.totalItems, Math.round((currentPercentage / 100) * simState.totalItems));
    
    // Speed adjustments
    simState.throughput = Math.floor(Math.random() * 500) + 3800; // ~4000 docs/sec
    
    // Update VM CPU usage
    simState.vms.forEach(vm => {
      if (vm.status === "active") {
        vm.cpu = Math.floor(Math.random() * 30) + 60; // 60-90% load
      }
    });

    updateMigrationStats();
  }, 1000);
}

// Perform VM UI update
function updateVMDashboard() {
  simState.vms.forEach((vm, index) => {
    const nodeEl = document.getElementById(`vm-node-${index}`);
    if (nodeEl) {
      nodeEl.className = `vm-node ${vm.status}`;
      
      const statusTxtEl = nodeEl.querySelector(".vm-status-txt");
      statusTxtEl.innerText = vm.status;
      statusTxtEl.className = `vm-status-txt ${vm.status}`;
      
      const loadValEl = nodeEl.querySelector(".vm-cpu-load");
      if (vm.status === "active") {
        loadValEl.innerText = `${vm.cpu}% CPU`;
      } else if (vm.status === "deadlocked") {
        loadValEl.innerText = `ERR (100% LOCK)`;
      } else if (vm.status === "tuning") {
        loadValEl.innerText = `BOOTING`;
      } else {
        loadValEl.innerText = `OFFLINE`;
      }
    }
  });
}

// Update standard statistics in UI
function updateMigrationStats() {
  document.getElementById("progress-bar-fill").style.width = `${simState.progress}%`;
  document.getElementById("progress-text").innerText = `${simState.progress}%`;
  document.getElementById("throughput-val").innerText = simState.throughput.toLocaleString();
  document.getElementById("migrated-val").innerText = simState.totalMigrated.toLocaleString();
}

// Trigger database deadlock simulation
async function triggerDeadlockEvent() {
  simState.deadlockSimulated = true;
  addLog("monitoring", "error", "[CRITICAL ALERT] Row-level database deadlock detected on Worker node 03 (VM-3) while writing chunk 1845. Thread lock blocking transactional write pipeline.");
  
  // Visual VM deadlock changes
  simState.vms[2].status = "deadlocked";
  simState.vms[2].cpu = 100;
  updateVMDashboard();
  
  simState.throughput = Math.floor(simState.throughput / 4); // Throughput drops to 25%
  updateMigrationStats();
  
  await delay(1500);
  addLog("monitoring", "thought", "Initiating self-healing protocol: Watchdog analyzes error logs and traces blocking threads.");
  await delay(1800);
  addLog("monitoring", "action", "Orchestrated recovery steps: 1) Paused transactional ingestion on chunk 1845. 2) Rolled back partial metadata writes to checkpoint. 3) Restarting Node Worker 03 VM docker container with dynamic backoff delay.");
  
  // Restarting VM status
  simState.vms[2].status = "tuning";
  updateVMDashboard();
  await delay(1500);
  
  simState.vms[2].status = "active";
  simState.vms[2].cpu = 45;
  updateVMDashboard();
  
  simState.deadlockResolved = true;
  addLog("monitoring", "observation", "Auto-recovery successful! Deadlocked row lock cleared. Transactional ingestion resumed. Worker 03 is executing normally.");
  
  // Resume progress interval
  let currentPercentage = simState.progress;
  simulationInterval = setInterval(() => {
    if (currentPercentage >= 100) {
      clearInterval(simulationInterval);
      simState.vms.forEach(vm => {
        vm.cpu = 0;
        vm.status = "offline";
      });
      updateVMDashboard();
      completeMigration();
      return;
    }
    
    currentPercentage += 5;
    simState.progress = currentPercentage;
    simState.totalMigrated = Math.min(simState.totalItems, Math.round((currentPercentage / 100) * simState.totalItems));
    simState.throughput = Math.floor(Math.random() * 500) + 4100; // recover speed
    
    simState.vms.forEach(vm => {
      if (vm.status === "active") {
        vm.cpu = Math.floor(Math.random() * 20) + 70;
      }
    });
    
    updateMigrationStats();
  }, 1000);
}

// Complete migration execution
async function completeMigration() {
  simState.progress = 100;
  simState.totalMigrated = simState.totalItems;
  simState.throughput = 0;
  updateMigrationStats();
  
  setAgentState("monitoring", "completed");
  
  // Trigger Reporting Agent
  highlightPath("monitoring", "reporting", "#10b981");
  setAgentState("reporting", "planning");
  await delay(1200);
  
  simState.activeAgent = "reporting";
  setAgentState("reporting", "executing");
  addLog("reporting", "thought", "Gathering final migration statistics from microservice gateways...");
  await delay(1200);
  addLog("reporting", "action", "Drafting Daily Migration Completion Status report. Compiling charts, speed throughput, and resolved error histories.");
  await delay(1500);
  addLog("reporting", "observation", "Status Report synthesized. Draft Email generated for review and notification.");
  setAgentState("reporting", "completed");
  
  highlightPath("reporting", "orchestrator", "#6366f1");
  setAgentState("orchestrator", "completed");
  addLog("orchestrator", "system", "[SUCCESS] Full metadata and content migration flow automated and verified. Orchestration completed successfully.");
  
  // Display client email report card
  generateClientEmail();
  document.getElementById("email-report-container").style.display = "block";
  switchTab("report");
}

// Populate schemas in Mapping Interface
function populateMappingSchema() {
  const sourceList = document.getElementById("source-schema-list");
  const targetList = document.getElementById("target-schema-list");
  
  if (!sourceList || !targetList) return;
  
  sourceList.innerHTML = "";
  targetList.innerHTML = "";
  
  MOCK_SCHEMAS.source.forEach((col, idx) => {
    sourceList.innerHTML += `
      <div class="mapping-node" id="src-node-${idx}">
        <span>${col.key}</span>
        <span style="color: var(--text-muted); font-size: 0.6rem;">${col.type}</span>
      </div>
    `;
  });
  
  MOCK_SCHEMAS.target.forEach((col, idx) => {
    targetList.innerHTML += `
      <div class="mapping-node" id="tgt-node-${idx}">
        <span>${col.key}</span>
        <span style="color: var(--text-muted); font-size: 0.6rem;">${col.type}</span>
      </div>
    `;
  });
}

// Animate lines and mappings visually in Tab
function animateMetadataMappings() {
  switchTab("mapper");
  let delayTime = 200;
  
  MOCK_SCHEMAS.source.forEach((col, idx) => {
    setTimeout(() => {
      const srcNode = document.getElementById(`src-node-${idx}`);
      const tgtNode = document.getElementById(`tgt-node-${idx}`);
      if (srcNode && tgtNode) {
        srcNode.classList.add("active");
        tgtNode.classList.add("active");
      }
    }, idx * delayTime);
  });
}

// Generate the high-fidelity daily client email text
function generateClientEmail() {
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #334155;">
      <h2 style="color: #6366f1; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">Rapidpro Daily Migration Status</h2>
      <p>Dear Client Operations Team,</p>
      <p>This is an automated status report generated by the <strong>Rapidpro Agentic AI Orchestrator</strong> summarizing the metadata and content migration execution performed during today's ingestion window.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #1e293b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Migration Summary - ${dateStr}</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Source Repository:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">IBM Content Manager (IBM CM)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Target Repository:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">Amazon S3 (US-East-1)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Total Ingested Items:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #10b981;">350,000 / 350,000 (100% Complete)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Average Throughput:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #6366f1;">4,150 docs/sec</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Configured Batch Size:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">75,000 (Auto-Tuned from 50,000)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Threads per Worker VM:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">8 (Auto-Tuned from 4)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Active Worker VMs:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">4 Parallel VMs</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Row-Level Errors / Deadlocks:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #eab308;">1 Detected & Auto-Healed (0% Outstanding)</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-bottom: 20px;">
        <span style="font-weight: bold; color: #166534; font-size: 13px;">✔ Operation Success Alert</span>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #166534;">The self-healing Monitoring Agent detected a transaction lock deadlock on VM-3 at 45% completion. It successfully triggered rollback checkpoints and container restarts, restoring the ingestion rate to peak efficiency within 15 seconds without manual intervention.</p>
      </div>

      <p style="font-size: 12px; color: #64748b;">This notification completes today's migration pipeline. VM assets have been scale-down powered off to optimize server utilization budgets.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Rapidpro AI Agent Operations • Sent via Gateway Microservice</p>
    </div>
  `;
  document.getElementById("email-body-content").innerHTML = emailContent;
}

// Filter the monospaced trace panel
function filterLogs(agentId) {
  simState.activeFilter = agentId;
  
  // Highlight active filter button
  document.querySelectorAll(".filter-badge").forEach(btn => {
    btn.classList.remove("active");
  });
  
  const activeBtn = document.getElementById(`filter-btn-${agentId}`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  
  renderConsoleLogs();
}

// Render trace items based on active filters
function renderConsoleLogs() {
  const consoleBody = document.getElementById("console-body");
  if (!consoleBody) return;
  
  consoleBody.innerHTML = "";
  
  const filtered = simState.logs.filter(log => {
    if (simState.activeFilter === "all") return true;
    if (simState.activeFilter === "error") return log.type === "error";
    return log.agentId === simState.activeFilter;
  });
  
  if (filtered.length === 0) {
    consoleBody.innerHTML = `<div class="console-line system"><span class="timestamp">[${new Date().toLocaleTimeString()}]</span> <span class="agent-tag">[SYSTEM]:</span> Waiting for user inputs to start multi-agent execution flow. Try typing anything related to "Rapidpro" or "IBM CM to S3"...</div>`;
    return;
  }
  
  filtered.forEach(log => {
    consoleBody.innerHTML += `
      <div class="console-line ${log.type}">
        <span class="timestamp">[${log.timestamp}]</span>
        <span class="agent-tag" style="color: ${log.agentColor}">[${log.agentName}]:</span>
        <span>${log.message}</span>
      </div>
    `;
  });
}

// Toggle layout tabs
function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  document.querySelectorAll(".tab-pane").forEach(pane => {
    pane.classList.remove("active");
  });
  
  const tabBtn = document.getElementById(`tab-btn-${tabId}`);
  const tabPane = document.getElementById(`tab-pane-${tabId}`);
  
  if (tabBtn && tabPane) {
    tabBtn.classList.add("active");
    tabPane.classList.add("active");
  }
}
