import { db } from "..";
import { users, feeds } from "../schema";
import { eq, asc, desc } from "drizzle-orm";


export async function createFeed(userId: string, name: string, url: string) {
  const [result] = await db.insert(feeds).values({ userId:userId, url:url, name: name }).returning();
  return result;
}

/**
 * Empties the Users table.
 * @param _ : not used
 * @returns an array of the names of the deleted users
 */
export async function truncateFeeds( _: string) {
  const result = await db.delete(feeds).returning({ id: feeds.id });
  return result;
}

export async function getFeeds() {

  const result = await db
    .select()
      .from(feeds)
      ;

  return result;
}

export async function getFeedsWithUsers() {

  const result = await db.select({ userName: users.name, feedName: feeds.name, url: feeds.url, feedCreateAt: feeds.createdAt })
    .from(feeds)
    .innerJoin(users, eq(users.id, feeds.userId))
    .orderBy(asc(users.name), asc(feeds.name));

  return result;
}

export async function getFeedByUrl(url: string) {
  const [result] = await db.select()
    .from(feeds)
    .where(eq(feeds.url, url));
  return result;
}
