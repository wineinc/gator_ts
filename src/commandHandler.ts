import { readConfig, setUser } from "./config.js";
import {
  createUser, getUserByName, truncateUsers, getUsers,
} from "./lib/db/queries/users.js";
import {createFeed, getFeedsWithUsers, getFeedByUrl} from "./lib/db/queries/feeds.js";
import { fetchFeed } from "./feed.js";
import {Feed, User} from "./lib/db/schema.js";
import { createFeedFollow , getFeedFollowsForUser} from "./lib/db/queries/feedFollows.js";

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

/**
 * takes a single url argument and creates a new feed follow record
 * for the current user. It should print the name of the feed and the c
 * urrent user once the record is created
 * @param cmdName
 * @param args
 */
export async function handlerFollow(cmdName: string, ...args: string[]) {
  if (!args.length || !args[0]) {
    throw new Error(`handlerFollow requires one argument, the url`);
  }
  const url = args[0];

  console.log(`handlerFollow: top.  cmdName=${cmdName} url=${url}`);
  const feed = await getFeedByUrl(url);
  if(!feed) {
    throw new Error(`handlerFollow: no feed found. url="${url}"`);
  }

  const userName = readConfig().currentUserName;
  const user = await getUserByName(userName ?? "");
  if (!userName ||!user) {
    throw new Error('current user name not found in users table');
  }

  const existingFeedFollows = (await getFeedFollowsForUser(user.id)).filter((rec)=> rec.feedId === feed.id);
  if(existingFeedFollows.length)
  {
    console.log(`user ${user.name} already follows ${url}`);
    throw new Error(`user ${user.name} already follows ${url}`);
  }
  console.log(`existing feeds:`);
  console.table(existingFeedFollows);

  const newFollow = await createFeedFollow(user.id, feed.id);
  if (!newFollow) {
    throw new Error(`Feed Follow not created for url "${url}"`);
  }
  console.log(`feed name="${newFollow.feedName}`);
  console.log(`user name="${newFollow.userName}`);
  //console.table({ "feed name":newFollow.feedName, "user name":newFollow.userName });
}

export async function handlerFollowing(cmdName: string, ...args: string[]) {
  const userName = readConfig().currentUserName;
  const user = await getUserByName(userName ?? "");
  if (!userName ||!user) {
    throw new Error('current user name not found in users table');
  }

  const feedFollows = await getFeedFollowsForUser(user.id);
  console.log(`user ${user.name} follows ${feedFollows.length} feeds.`);
  const displayRecs = feedFollows.map(rec => ({"userName": rec.userName, feedName: rec.feedName}), 1 );
  console.table(displayRecs);
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

export async function handlerAgg(_: string)
{
  const result = await fetchFeed("https://www.wagslane.dev/index.xml");
  console.log(JSON.stringify(result))
}

export async function handlerFeeds(cmdName: string)
{
  const result = await getFeedsWithUsers();

  if (!result.length) {
    console.log(`No feeds found.`);
    return;
  }

  console.table(result);
}

/**
 *
 * @param feedName name of the feed
 * @param url  url of the feed
 */
export async function handlerAddFeed(cmdName: string, feedName: string, url: string)
{
  if (!feedName || !url ) {
    throw new Error(`addfeed needs a feedname and a url`);
  }
  //console.log(`handlerAddFeed: feedName=${feedName}  url=${url}`);
  const config = readConfig();
  const configUser = config.currentUserName;
  if (!configUser) {
    throw new Error(`user is not in the config file`);
  }
  const currentUser = await getUserByName(configUser);
  if (!currentUser) {
    throw new Error(`user ${configUser} not found in database`);
  }
  const feed = await createFeed(currentUser.id, feedName, url);

  if (feed) {
    printFeed(feed, currentUser);
    await createFeedFollow(currentUser.id, feed.id);
  }
  else {
    console.log(`no feed created.`);
  }
}

function printFeed(feed: Feed, user: User) {
  if (!feed || !user) {
    throw new Error(`printFeed: invalid feed or invalid user`);
  }

  let dispValues = [];
  dispValues.push({ attribute:'user name', value : `${user.name}` });
  dispValues.push({ attribute:'feed name', value: `${feed.name}` });
  dispValues.push({ attribute: 'feed url', value: `${feed.url}` });
  dispValues.push({ attribute: 'feed created at', value: `${feed.createdAt}` });

  const dynamicTable = dispValues.reduce((acc, row, index) => {
    acc[index + 1] = row; // index + 1 makes it start from 1
    return acc;
  }, {} as Record<number, any>);
  console.table(dynamicTable);

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
  console.log(`runCommand: cmdName:${cmdName} `);
  if (cmdName && cmdName in registry) {
    console.log(`runCommand: cmdName:${cmdName} ${args}`);
    await (registry[cmdName])(cmdName,...args);
  }
}
