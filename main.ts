import * as path from "jsr:@std/path";
import { promptSecret } from "@std/cli/prompt-secret";
import {login, startBackup} from "./backup.ts";
import {dateFormat} from "./utils.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  let orgSlug: string = ""
  let username: string = "";
  let password: string = "";

  let loggedIn = false
  while (!loggedIn) {
    orgSlug = prompt("What is the organization url name of the daycare (e.g. in case of https://abc.ouderportaal.nl it's abc):", orgSlug) ?? "";
    username = prompt("Username:", username) ?? "";
    password = promptSecret("Password:") ?? "";
    if (orgSlug && username && password) {
      loggedIn = (await login(orgSlug, username, password)) !== undefined;
      if (!loggedIn) {
        console.log("Try again or press Ctrl+C to exit.");
      }
    } else {
      console.log("Please fill in all fields");
    }
  }

  const suggestedPath = path.join(Deno.cwd(), `ouderapp-${dateFormat(undefined)}`);
  const basePath = prompt("Where do you want to store the files:", suggestedPath) ?? suggestedPath

  const shouldProceed = confirm("Do you want to proceed? Downloading can take half an hour (depending on the amount of photos and network speed).");
  if (!shouldProceed) {
    console.log("Exiting...");
    Deno.exit(0);
  }

  // await startBackup(orgSlug, username, password, basePath);
  alert("Backup completed! Press enter to close this window.");
}