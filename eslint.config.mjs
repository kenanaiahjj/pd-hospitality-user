import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code worktrees under .claude/worktrees/ are full copies of the
    // source tree. Without this, a leftover worktree gets linted as part of
    // the repo and its findings drown out real ones.
    ".claude/**",
    ".worktrees/**",
    // Build output, same problem: `vercel build` writes minified bundles here
    // and every one of them trips no-this-alias and no-unused-expressions.
    // Twenty errors, none of them ours, enough to fail the verification gate.
    ".vercel/**",
  ]),
]);

export default eslintConfig;
