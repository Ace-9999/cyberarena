# Security guidance for challenge deployment

If you plan to let users interact with challenge containers, keep the deployment model narrow and controlled.

## Recommended approach

- Run challenge containers on a separate backend/server you control.
- Expose only the challenge service port to users.
- Do not give participants access to the Docker daemon, Docker Desktop, or the host shell.
- Avoid mounting host folders into challenge containers unless absolutely necessary.
- Keep flags and sensitive files inside the container runtime rather than exposing them through shared directories.

## What to avoid

- Do not let users directly start or inspect containers from the host.
- Do not expose the Docker socket or container management tools to untrusted users.
- Do not place flags in a plainly readable path such as `/flags` unless the path is protected and inaccessible.

## Why this matters

A challenge should be solvable through the intended vulnerability, not by reading files or inspecting the runtime environment. A container should behave like a black box: users can interact with the challenge service, but they should not be able to inspect the host or the container internals.

## Practical rule of thumb

If a participant can reach Docker, the host filesystem, or a mounted folder, the challenge is no longer isolated. Keep the challenge boundary at the exposed network service and nothing more.
