# PARABELLUM OS ARCHITECTURE

Parabellum OS is an autonomous AI-driven system designed to coordinate product development, token infrastructure, marketing operations, and deployment pipelines.

The system operates as a modular command structure controlled by the **Brain API** and visualized through **Mission Control**.

---

# CORE SYSTEM

## Brain API

The Brain API acts as the central orchestration engine.

Responsibilities:
- system state management
- command execution
- automation pipelines
- module coordination

Brain API endpoints:

/brain
/internal/state/demo
/internal/state/contracts
/internal/state/marketing
/internal/state/launch

---

# USER INTERFACE

## Mission Control

Mission Control is the monitoring dashboard.

Purpose:
- visualize system status
- run operational commands
- monitor progress

Key modules displayed:

Demo
Contracts
Marketing
Launch
Operations

Operations include:

RUN DEMO
SYNC CENTRAL
RUN REWARDS
RUN MARKETING
RUN CONTRACT

---

# COMMAND CENTER

## Central Control

Central Control is the task management system.

Responsibilities:

- manage development tasks
- coordinate modules
- feed tasks to the Brain
- maintain execution logs

Central Control interacts with Brain through API commands.

---

# AUTOMATION ENGINE

Automation scripts allow the system to execute operations autonomously.

Examples:

demo cycle  
contract deployment cycle  
marketing campaign cycle  
launch preparation cycle  

Automation processes run continuously using **PM2 process manager**.

---

# TOKEN SYSTEM

Token: PRBL  
Network: Polygon Amoy (testnet)

Contracts:

PRBL Token  
Rewards Distributor  

Deployment pipeline handled by the contracts module.

Contract deployment status tracked through Brain state engine.

---

# MARKETING ENGINE

The marketing module controls:

Atahualpa campaign engine  
Waitlist acquisition  
Referral distribution  
Campaign orchestration  

Marketing automation feeds the launch pipeline.

---

# LAUNCH PIPELINE

Launch readiness requires:

demo_ready  
contracts_ready  
rewards_ready  
marketing_ready  
kickstarter_ready  

These states are evaluated by the Brain before launch activation.

---

# PROCESS MANAGEMENT

All services are maintained using PM2.

Typical services:

parabellum-brain-api  
parabellum-web  
parabellum-central-control  
parabellum-overnight  

PM2 ensures services restart automatically and run continuously.

---

# PROJECT STRUCTURE

/root/workspace/parabellum-os

apps/
brain/
contracts/
scripts/
automation/

---

# DEVELOPMENT MODEL

AI-assisted development through Cursor.

AI agents should:

analyze repository structure  
propose improvements  
implement changes safely  
maintain architecture integrity  

AI must avoid creating duplicate systems.

Existing architecture must remain the single source of truth.

---

# LONG TERM VISION

Parabellum OS evolves into a fully autonomous operational system capable of:

self-managing development tasks  
running marketing operations  
deploying smart contracts  
coordinating launch processes  

All monitored through Mission Control.

