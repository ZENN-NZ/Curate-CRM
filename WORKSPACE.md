# WORKSPACE.md (Layer 0: Global Identity)

## Workspace Overview
- **Project**: Curate - Curated Relationship & Contact Management Application
- **Methodology**: Interpretable Context Methodology (ICM - arXiv:2603.16021v2)
- **Primary Objective**: Deliver a high-fidelity, responsive contact and relationship management application backed by a local SQLite database (`leads.db`) with formatted, formula-sanitized Excel export capability (`exceljs`) and PWA installation support.
- **Security Baseline**: Formula injection mitigation (CWE-1236), SQL injection prevention via parameterized LibSQL queries, input validation via Zod schemas, HTTP rate limiting, and secure error isolation.

## Context Layers Directory
- **Layer 0**: `WORKSPACE.md` (This file - Workspace Identity)
- **Layer 1**: `ROUTING.md` (Stage Routing and Execution Map)
- **Layer 2**: `[01-05]_stage_name/CONTEXT.md` (Stage-Specific Contracts)
- **Layer 3**: `_config/` (Persistent Reference Material - Security, Architecture, Schemas)
- **Layer 4**: `[01-05]_stage_name/output/` (Per-run intermediate deliverables)

## Operational Rules
1. **Separation of Concerns**: Each numbered stage folder (`01_` through `05_`) handles exactly one phase in the lifecycle.
2. **Plain-Text State & Contracts**: All stage inputs, outputs, and review gates are plain-text markdown and JSON files.
3. **Review Gates**: Before advancing between stages, outputs in each stage's `output/` folder are inspected and validated.
4. **Configure the Factory**: Core policies, schemas, and architecture contracts reside in `_config/` to guide all stages deterministically.
