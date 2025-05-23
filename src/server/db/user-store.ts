import { db } from '.'
import { users, type UserInsert } from './schema'
const userStore = {
  async getUserById(id: string) {
    return db.query.users.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    })
  },

  async getUserByExternalId(externalId: string) {
    return db.query.users.findFirst({
      where: (user, { eq }) => eq(user.externalId, externalId),
    })
  },

  async createUser(user: UserInsert) {
    return db.insert(users).values(user)
  },
}

export default userStore
