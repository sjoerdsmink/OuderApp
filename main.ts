import * as path from "jsr:@std/path";
import {login, startBackup} from "./backup.ts";
import {dateFormat} from "./utils.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  let orgSlug: string | null = ""
  let username: string | null = "";
  let password: string | null = null;

  let loggedIn = false
  while (!loggedIn) {
    orgSlug = prompt("What is the organization url name of the daycare (e.g. in case of https://abc.ouderportaal.nl it's abc):", orgSlug ?? "");
    username = prompt("Username:", username ?? "");
    password = prompt("Password:", "");
    if (orgSlug && username && password) {
      loggedIn = (await login(orgSlug, username, password)) !== undefined;
      if (!loggedIn) {
        console.log("Try again or press Ctrl+C to exit.");
      }
    } else {
      console.log("Please fill in all fields");
    }
  }

  if (!orgSlug || !username || !password) {
    console.log("Incorrect orgSlug/username/password");
    Deno.exit(0);
  }

  const suggestedPath = path.join(Deno.cwd(), `ouderapp-${dateFormat(undefined)}`);
  const basePath = prompt("Where do you want to store the files:", suggestedPath) ?? suggestedPath

  const shouldProceed = confirm("Do you want to proceed? Downloading can take half an hour or more.");
  if (!shouldProceed) {
    console.log("Exiting...");
    Deno.exit(0);
  }

  await startBackup(orgSlug, username, password, basePath);
}