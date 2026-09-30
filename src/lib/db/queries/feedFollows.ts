import { db } from "..";
import { users, feeds, feedFollows } from "../schema";
import { eq, asc, desc } from "drizzle-orm";


export async function createFeedFollow(userId: string, feedId: string) {
  const [newFeedFollow] = await db.insert(feedFollows).values({ userId: userId, feedId: feedId }).returning();

  const [result] = await db.select({
    feedFollowsId: feedFollows.id, userName: users.name, feedName: feeds.name,
    feedFollowsCreateAt: feedFollows.createdAt, feedFollowsUpdatedAt: feedFollows.updatedAt
  })
    .from(feedFollows)
    .innerJoin(users, eq(users.id, feedFollows.userId))
    .innerJoin(feeds, eq(feeds.id, feedFollows.feedId))
    .where(eq(feedFollows.id, newFeedFollow.id));
  return result;
}

export async function getFeedFollowsForUser(userId: string) {
  const result = await db.select({
    feedFollowsId: feedFollows.id, userName: users.name, feedName: feeds.name, feedId:feeds.id
  })
    .from(feedFollows)
    .innerJoin(users, eq(users.id, feedFollows.userId))
    .innerJoin(feeds, eq(feeds.id, feedFollows.feedId))
    .where(eq(users.id, userId));
  return result;
}
