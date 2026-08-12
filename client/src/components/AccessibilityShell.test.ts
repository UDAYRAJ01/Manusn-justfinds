import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const pageFrame = readFileSync(resolve(root, "components/PageFrame.tsx"), "utf8");
const workspaceShell = readFileSync(resolve(root, "components/WorkspaceShell.tsx"), "utf8");
const styles = readFileSync(resolve(root, "index.css"), "utf8");

describe("Phase 1 keyboard navigation contract", () => {
  it("provides a skip link and focusable public main landmark", () => {
    expect(pageFrame).toContain('href="#main-content"');
    expect(pageFrame).toContain('id="main-content"');
    expect(pageFrame).toContain("tabIndex={-1}");
  });

  it("provides a skip link and focusable protected workspace landmark", () => {
    expect(workspaceShell).toContain('href="#workspace-main"');
    expect(workspaceShell).toContain('id="workspace-main"');
    expect(workspaceShell).toContain("tabIndex={-1}");
  });

  it("keeps the global visible-focus and skip-link rules in the stylesheet", () => {
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain(".skip-link");
    expect(styles).toContain('.skip-link:focus, .skip-link[data-focused="true"] { top: 1rem; }');
  });
});
