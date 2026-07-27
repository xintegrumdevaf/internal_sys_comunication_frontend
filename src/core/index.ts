/**
 * Core hexagonal barrel — domain & application only.
 * Adapters live under src/adapters and src/routes.
 */
export { getContainer } from "@/core/composition/container";
export type { AppContainer } from "@/core/composition/container";
