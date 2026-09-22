---
name: icm
description: >-
  Interpretable Context Methodology (ICM): orchestrate multi-step AI agent workflows
  and software projects using folder structure as architecture. Use whenever designing,
  scaffolding, or executing staged pipelines with plain-text contracts, layered context loading,
  and human-in-the-loop review gates.
---

# Interpretable Context Methodology (ICM)

A filesystem-first architecture for AI agent workflows based on the research paper *Interpretable Context Methodology: Folder Structure as Agent Architecture* (arXiv:2603.16021v2).

ICM replaces opaque code orchestration frameworks with a transparent, observable, and editable directory hierarchy.

---

## The 5 Core Principles

1. **One Stage, One Job**:
   - Each stage in a workflow is a numbered folder (`01_...`, `02_...`).
   - Each stage executes a single responsibility and writes its deliverables exclusively to its own `output/` directory.

2. **Plain Text as the Universal Interface**:
   - All state, instructions, contracts, and handoffs use markdown (`.md`) and `.json`.
   - No proprietary binary serialization or hidden databases between stages. Any human with a text editor can inspect, audit, or edit intermediate state.

3. **Layered Context Loading**:
   - Deliver only the minimal, relevant context needed for each stage:
     - **Layer 0 (Workspace Identity)**: Root identity (`WORKSPACE.md`).
     - **Layer 1 (Task Routing)**: Workflow map and stage directory (`ROUTING.md`).
     - **Layer 2 (Stage Contract)**: `CONTEXT.md` in each stage with Inputs, Process, and Outputs.
     - **Layer 3 (Reference Material / The Factory)**: Persistent rules, style guides, domain models, and security standards in `_config/` or `references/`.
     - **Layer 4 (Working Artifacts / The Product)**: Dynamic per-run inputs loaded from prior stage `output/` folders.

4. **Every Output is an Edit Surface**:
   - Stage outputs are human-reviewable breakpoints. Humans can modify files in `output/` before the subsequent stage executes.

5. **Configure the Factory, Not the Product**:
   - Set up the rules, templates, and constraints once in Layer 3. The pipeline can then reliably produce deliverables repeatedly.

---

## Workspace Directory Structure

```text
workspace_root/
├── WORKSPACE.md                 # Layer 0: Workspace identity and overview
├── ROUTING.md                   # Layer 1: Stage catalog and execution flow
├── _config/                     # Layer 3: Persistent reference material
│   ├── security_policy.md       # Security baselines, OWASP rules, validation rules
│   ├── architecture_spec.md     # Architecture decisions and boundaries
│   └── data_schema.json         # Core data schema and industry presets
├── 01_stage_name/
│   ├── CONTEXT.md               # Layer 2: Stage contract (Inputs, Process, Outputs)
│   ├── references/              # Layer 3: Stage-specific reference docs
│   └── output/                  # Layer 4: Deliverables produced by this stage
├── 02_stage_name/
│   ├── CONTEXT.md
│   └── output/
└── scripts/                     # Deterministic helper scripts (lint, test, build)
```

---

## Anatomy of a Stage Contract (`CONTEXT.md`)

Every stage MUST contain a `CONTEXT.md` file following this exact structure:

```markdown
# Stage [XX]: [Stage Name]

## Inputs
| Layer | Source Path | Description |
| :--- | :--- | :--- |
| Layer 3 (Reference) | `../../_config/security_policy.md` | Security and validation constraints |
| Layer 4 (Working)   | `../01_stage/output/spec.md`       | Deliverable from previous stage |

## Process
1. Step-by-step instructions for the agent.
2. Specific constraints, models, or algorithms to apply.
3. Quality checklists and error-handling conditions.

## Outputs
- `output/deliverable_name.ext`: Specific description of what to produce.
- Review Gate: Instructions for human review and sign-off criteria.
```

---

## Executing an ICM Workflow

1. **Initialize Stage**: Read Layer 0 (`WORKSPACE.md`), Layer 1 (`ROUTING.md`), and the target stage's Layer 2 (`CONTEXT.md`).
2. **Load Stage Context**: Read only the files explicitly listed in the stage's `## Inputs` table. Do not pollute the context window with unrelated stage data.
3. **Execute Process**: Carry out the instructions defined in `## Process`.
4. **Generate Output**: Write all output artifacts directly into the stage's `output/` folder.
5. **Human Review Gate**: Pause for human inspection. Allow the human to edit files in `output/` directly.
6. **Advance to Next Stage**: Subsequent stages consume the verified files from the previous stage's `output/`.
