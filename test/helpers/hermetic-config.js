import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Loaded before every test file (`--import` in the package.json `test` script).
 *
 * `loadConfig` layers `$XDG_CONFIG_HOME/backpass/config.json` under every run, so a
 * developer's own personal config - custom ladders, hosts, a `user` block - would
 * otherwise change what the suite asserts about defaults and agent selection. Each test
 * process therefore starts from an empty config home of its own. Tests that need a
 * config home still set `XDG_CONFIG_HOME` themselves and restore this value after.
 */
const configHome = fs.mkdtempSync(path.join(os.tmpdir(), "backpass-test-config-"));
process.env.XDG_CONFIG_HOME = configHome;
const removeConfigHome = () => fs.rmSync(configHome, { recursive: true, force: true });
process.on("exit", removeConfigHome);

// A signal skips `exit`, so remove the directory here too, then re-raise the same signal
// so the process still ends with the conventional signal exit.
const signals = ["SIGINT", "SIGTERM"];
const onSignal = (signal) => {
  try {
    removeConfigHome();
  } catch {
    // best-effort
  }
  for (const s of signals) process.removeListener(s, onSignal);
  process.kill(process.pid, signal);
};
for (const signal of signals) process.once(signal, onSignal);
