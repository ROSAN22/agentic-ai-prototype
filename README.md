# Rapidpro Agentic AI Migration Orchestrator Prototype

A state-of-the-art, high-fidelity multi-agent AI dashboard designed to automate, tune, execute, and recover metadata and content migrations (e.g., IBM CM, FileNet to AWS S3) for **Rapidpro**.

This interactive prototype demonstrates how a collaborative network of **7 specialized AI agents** can orchestrate and automate what was previously a tedious manual operational process.

---

## 🧠 The AI Agent Team & Alignment

In your existing architecture, you operate a microservice framework (`discoverserver`, `gateway`, `config`, `migrationsetservice`, `source` & `target` services). 
Here is how the AI Agent network integrates with and coordinates these backend services to eliminate manual tasks:

1. **🧠 Orchestrator Master (Master Mind)**:
   - **Manual Task Replaced**: Decomposing user goals, logging onto separate portals, manually editing config servers.
   - **AI Operation**: Takes natural language prompts and splits them into a step-by-step directed acyclic graph (DAG) pipeline. Co-ordinates specialized agents and routes data packets through the microservice gateway.
   
2. **🔍 Discovery Agent**:
   - **Manual Task Replaced**: Logging into IBM CM or FileNet source databases and target systems to manually extract database schemas.
   - **AI Operation**: Communicates directly with the `discoverserver` to fetch and validate metadata schemas in milliseconds.

3. **🗺️ Schema Mapper**:
   - **Manual Task Replaced**: Manually drafting mapping sheets and typing attribute rules line by line.
   - **AI Operation**: Suggests and auto-aligns metadata attributes (e.g. `item_id` ➔ `s3_object_key`) based on LLM semantics. Accepts CSV/Excel/JSON schema uploads to instantly override and map parameters.

4. **⚡ Performance Tuner**:
   - **Manual Task Replaced**: Spending days analyzing charts, editing thread sizes (e.g., from 4 to 8) or batch sizes (e.g., 50k) manually inside the configuration server.
   - **AI Operation**: Analyzes historical metrics dynamically and tunes ingestion jobs (adjusts batches to 75k and threads to 8) to maximize target cloud S3 write speeds.

5. **🚀 VM Provisioner**:
   - **Manual Task Replaced**: Manually logging onto distinct virtual machines (VMs), copying jar/container runtimes, and executing the startup scripts.
   - **AI Operation**: Automated virtual machine scaling. Provisions parallel worker VM nodes in your cloud VPC, deploys the batch ingestion container jobs, and monitors boot statuses.

6. **🛡️ Watchdog Monitor**:
   - **Manual Task Replaced**: Manually monitoring standard-out terminals for row-level database locks, transactional writing deadlocks, and system crashes.
   - **AI Operation**: Attaches active telemetry loops. At 45% completion, **automatically detects database deadlocks** on worker nodes, rolls back metadata transactions to stable checkpoints, and triggers clean container hot-reboots automatically.

7. **✉️ Client Reporter**:
   - **Manual Task Replaced**: Drafting, formatting, and emailing daily performance and completion statistics (e.g. documents migrated, throughput rates) to clients.
   - **AI Operation**: Compiles live progress statistics and synthesizes a highly professional HTML Daily Status Email report, ready to preview and dispatch.

---

## 📂 Project Structure

```
C:\Users\aniru\.gemini\antigravity\scratch\rapidpro-agent-ui/
├── index.html        # Modern glassmorphic dashboard UI with SVG agent graph
├── style.css         # Rich dark-mode HSL styles, animations, progress bar metrics
├── agentEngine.js    # Stateful multi-agent simulation engine
└── README.md         # Documentation & architecture alignment (This file)
```

---

## 🚀 How to Run the Prototype (No Server Required!)

Since Node/NPM is not on your shell path, this prototype is **fully self-contained** and runs immediately on your local machine with **zero dependencies**:

1. **Open the project folder** in your file explorer:
   [rapidpro-agent-ui](file:///C:/Users/aniru/.gemini/antigravity/scratch/rapidpro-agent-ui/)
2. **Double-click `index.html`** (or right-click and open it in Google Chrome, Microsoft Edge, or any modern web browser).
3. **Press the "⚡ Run Agent Flow" button** in the sidebar.
4. **Sit back and watch the agents in action!**
   - Watch the SVG **Orchestration Graph** glow and route particles as each agent activates.
   - Watch the **Reasoning Console** log out thoughts, actions, and observations (`Thought ➔ Action ➔ Observation`) in real time.
   - Watch the **Attribute Auto-Mapper** dynamically connect keys.
   - Watch the **Live Job Monitor** scale VM CPU loads and throughput rates.
   - **Watch the self-healing in action!** At 45% completion, Watchdog Monitor will automatically isolate, heal, and reboot a deadlocked worker VM (VM-3), resume peak ingestion throughput, and output a perfect Client Status Email report at completion.

---

## 💡 Things to Try in the UI

* **Drag-and-Drop Uploader**: Drop a CSV/Excel mapping sheet into the upload area before running, and notice the Mapper Agent adjust its log output!
* **Filter Logs**: Click on individual agent tags (e.g., `Discovery`, `Tuner`, `Deadlocks`) in the Console controls to filter and view exactly what that specific agent is thinking and executing.
* **Inspect Client Report**: When the simulation finishes (100%), review the highly formatted client status report. You can trigger an alert simulating sending it directly through your mailer gateway.
