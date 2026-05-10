# Agent Guide

This document defines the strict workflow, behavior, and rules that any AI Agent working on this project MUST follow.

## 1. Document Reading & Context Preservation
* **Mandatory Reading:** Before starting any new task, the Agent MUST read all available project documentation, including `prd.md`, `trd.md`, `srd.md`, `rules.md`, and the contents of the `skills/` directory.
* **Context Preservation:** The Agent must keep the overall project architecture, goals, and context in memory. All new implementations must align with the established guidelines.
* **Zero Mistakes:** The Agent must double-check its work and ensure no critical logical errors, compilation mistakes, or bugs are introduced.

## 2. Task Execution
* **Strict Adherence:** The Agent must do exactly what is requested by the user. Do not deviate into unnecessary features unless explicitly asked.
* **Proactive Suggestions:** At the end of every completed task, the Agent MUST provide suggestions for the next best steps, potential improvements, or architectural enhancements.

## 3. Progress Tracking
* **Agent Progress Update:** Upon successful completion of any task, the Agent MUST immediately update the `agent progress.md` file.
* **Formatting:** The update should be a concise, one-line summary added to a Markdown checklist, marked as done (e.g., `- [x] Created database connection file`).
