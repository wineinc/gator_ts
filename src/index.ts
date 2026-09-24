import {setUser, readConfig } from "./config.js"
import {
  CommandsRegistry, registerCommand, handlerLogin, handlerRegister,
  handlerReset, handlerListUsers, runCommand
} from "./commandHandler.js";


async function main() {
  try {
    let cfg = readConfig();
    const cmdRegistry: CommandsRegistry = {};

    registerCommand(cmdRegistry, "login", handlerLogin);
    registerCommand(cmdRegistry, "register", handlerRegister);
    registerCommand(cmdRegistry, "reset", handlerReset);
    registerCommand(cmdRegistry, "users", handlerListUsers);

    const args = process.argv.slice(2);

    if (!args.length) {
      console.log("no arguments given. exiting");
      process.exit(1);
    }
    const cmdName = args[0];
    const cmdArgs = args.slice(1);

    await runCommand(cmdRegistry, cmdName, ...cmdArgs);
    process.exit(0);
  }
  catch (error) {
    console.log("exception caught in main");
    let msg = "";
    if (error instanceof Error) {
      msg = error.message;
      if (error.cause instanceof Error) {
        msg += `\nCause: ${error.cause.message}`;
        msg += `\nStack Trace: ${error.stack}`;
      }
    }
    else {
      msg = String(error);
    }
    console.log(msg);
    process.exit(1);
  }
}

main();
