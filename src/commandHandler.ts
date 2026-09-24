import { readConfig, setUser } from "./config.js";
import { createUser, getUserByName, truncateUsers, getUsers } from "./lib/db/queries/users.js"

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

function requireUsername(args: string[]): string {
  if (args.length === 0 || args[0].trim().length === 0) {
    throw new Error("expected a single argument, the username");
  }
  return args[0].trim();
}

export async function handlerLogin(cmdName: string, ...args: string[]) {
  const name = requireUsername(args);
  let user = await getUserByName(name);
  if (user === undefined) {
    throw new Error(`Cannot log in with username "${name} as it not exist in the database.`);
  }
  setUserAndConfirm(name);
}

function setUserAndConfirm(name: string): void
{
  setUser(name);
  console.log(`user has been set to "${name}"`);
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
  const name = requireUsername(args);
  console.log(`name is ${name}`);

    //Verify the user does not yet exist.
    const existingUser = await getUserByName(name);
    if (existingUser !== undefined) {
      throw new Error(`User ${name} already exists.`)
    }
    console.log(`no existing user found`);

    const createdUser = await createUser(name);
    if (createdUser === undefined) {
      console.log("unable to create user");
      throw new Error(`unable to create user "${name}"`);
    }

    console.log("user created");
    console.log(`user has been set to ${createdUser.name}`);

    setUserAndConfirm(createdUser.name)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

export async function handlerReset(_: string)
{
  const deletedUsers = await truncateUsers(_);

  console.log(`Deleted ${deletedUsers.length} users.`);
}

export async function handlerListUsers(_: string)
{
  const users = await getUsers();

  const currentUser = readConfig().currentUserName ?? "";
  //console.log(`users; ${JSON.stringify(users)}`);
  //console.log(`users.map: ${JSON.stringify(users.map((e)=> e.user_name))}`);
  for (const user of users.map((e)=> e.user_name)) {
    console.log(`* ${user==currentUser ? (user + " (current)"): user}`);
  }

}


export type CommandsRegistry = Record<string, CommandHandler>;

export async function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler): Promise<void>{
  if (!registry || !cmdName || ! handler) {
    throw new Error("invalid argument supplied");
  }

  registry[cmdName] = handler;
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[])
{
  const cmd = registry[cmdName];
  if (cmdName && cmdName in registry) {
    await (registry[cmdName])(cmdName,...args);
  }
}
