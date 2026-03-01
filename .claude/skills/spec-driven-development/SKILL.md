---
name: spec-driven-development
description: Enforces specification-driven development by requiring clear requirements, design artifacts, and acceptance criteria before implementation. Use when starting new features, refactoring, or making architectural changes.
---

# Spec-Driven Development

## Instructions

Follow this workflow before writing or modifying production code.

1. Clarify the problem.
   - Restate the feature or change request.
   - Identify stakeholders and affected components.
   - Define explicit goals and non-goals.

2. Define functional requirements.
   - List observable behaviors.
   - Describe inputs, outputs, and edge cases.
   - Specify error handling expectations.

3. Define non-functional requirements.
   - Performance constraints.
   - Security considerations.
   - Reliability and availability expectations.
   - Maintainability constraints.

4. Produce a technical design.
   - Describe architecture changes.
   - Identify new modules, interfaces, and data models.
   - Explain integration points with existing code.
   - Document trade-offs and rejected alternatives.

5. Define acceptance criteria.
   - Provide testable conditions.
   - Express them in Given/When/Then or equivalent format.
   - Ensure criteria are measurable and unambiguous.

6. Validate the specification.
   - Check for missing edge cases.
   - Ensure consistency with existing conventions.
   - Confirm backward compatibility if required.

7. Only after the specification is complete:
   - Generate an implementation plan.
   - Break work into incremental steps.
   - Then produce code.

If any requirement is unclear, stop and request clarification instead of making assumptions.

## Examples

### Example 1: New API Endpoint

Request: Add endpoint to export user activity.

Specification:

Functional requirements:
- GET /users/{id}/activity/export
- Returns CSV file.
- Supports date range filtering.
- Returns 404 if user does not exist.

Non-functional requirements:
- Must handle up to 1M records.
- Response time under 3 seconds for 100k records.

Acceptance criteria:
- Given a valid user and date range, when export is requested, then a valid CSV is returned.
- Given an invalid user ID, when requested, then 404 is returned.

Only after this specification is defined should code be generated.

### Example 2: Refactoring Module

Request: Improve payment processing module maintainability.

Specification:

Goals:
- Separate validation, orchestration, and gateway communication.

Non-goals:
- No change to public API behavior.

Acceptance criteria:
- All existing tests pass unchanged.
- Cyclomatic complexity of main function reduced by at least 30%.

Implementation proceeds only after design is approved.

## Quick start

1. Write a structured specification document in Markdown.
2. Validate completeness using the Instructions checklist.
3. Confirm acceptance criteria are testable.
4. Then begin implementation.

## Requirements

- All new features must include written functional and non-functional requirements.
- All changes must include explicit acceptance criteria.
- No production code is written before specification approval.
- Specifications must be stored alongside the codebase.

## Best practices

- Keep requirements atomic and testable.
- Avoid ambiguous terms such as "fast" or "user-friendly".
- Prefer measurable constraints.
- Document assumptions explicitly.
- Link specifications to related tickets or issues.
- Treat the specification as the single source of truth.