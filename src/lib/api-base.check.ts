import assert from "node:assert/strict";

// Node/tsx no comparte import.meta.env entre módulos: fallback mínimo de prueba
process.env.VITE_API_BASE_URL = "http://localhost:3000/";

const { getApiBaseUrl, resolveApiUrl } = await import("./api-base.ts");

assert.equal(getApiBaseUrl(), "http://localhost:3000");
assert.equal(resolveApiUrl("/api/media/m1"), "http://localhost:3000/api/media/m1");
assert.equal(resolveApiUrl("api/departments"), "http://localhost:3000/api/departments");
assert.equal(resolveApiUrl("https://cdn.example/x"), "https://cdn.example/x");
console.log("api-base checks passed");
