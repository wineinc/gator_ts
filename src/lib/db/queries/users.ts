import { db } from "..";
import { users } from "../schema";
import { eq } from "drizzle-orm";


export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}

export async function getUserByName(name: string) {
  //console.log(`getUserByName: calling using ${name}`);

  const result = await db
      .select()
      .from(users)
      .where(eq(users.name, name));

  const ret =  result.length ? result[0]: undefined;
  //console.log(`getUserByName: ${ret}`);
  return ret;
}

/**
 * Empties the Users table.
 * @param _ : not used
 * @returns an array of the names of the deleted users
 */
export async function truncateUsers( _: string) {
  const result = await db.delete(users).returning({ name: users.name });
  return result;
}

export async function getUsers() {

  const result = await db
    .select({user_name: users.name })
      .from(users)
      ;

  return result;
}
