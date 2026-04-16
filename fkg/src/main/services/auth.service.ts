import { eq, isNull, and } from 'drizzle-orm'
import { getDb, getSqlite } from '../db'
import { users, userSessions, type User, type Role } from '../db/schema'
import { hashPassword, verifyPassword, generateToken } from '../utils/crypto'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'

export interface LoginResult {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: Role
  }
}

export class AuthService extends BaseService {
  async login(email: string, password: string): Promise<LoginResult> {
    const db = getDb()
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1)

    if (!user || !user.isActive) {
      this.auditLog({ action: 'LOGIN_FAILED', entityType: 'user', oldValue: { email } })
      throw new Error('Invalid email or password')
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      this.auditLog({ action: 'LOGIN_FAILED', entityType: 'user', entityId: user.id })
      throw new Error('Invalid email or password')
    }

    const token = generateToken()
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

    await db.insert(userSessions).values({
      id: newId(),
      userId: user.id,
      tokenHash: token,
      expiresAt,
      createdAt: new Date()
    })

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id))

    this.auditLog({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entityType: 'user',
      entityId: user.id
    })

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role as Role }
    }
  }

  async verifySession(token: string): Promise<{ id: string; name: string; email: string; role: Role } | null> {
    const db = getDb()
    const [session] = await db
      .select({ session: userSessions, user: users })
      .from(userSessions)
      .innerJoin(users, eq(userSessions.userId, users.id))
      .where(eq(userSessions.tokenHash, token))
      .limit(1)

    if (!session) return null
    if (session.session.expiresAt < new Date()) return null
    if (!session.user.isActive) return null

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role as Role
    }
  }

  async logout(token: string): Promise<void> {
    const db = getDb()
    await db.delete(userSessions).where(eq(userSessions.tokenHash, token))
  }

  async isFirstRun(): Promise<boolean> {
    const db = getDb()
    const result = await db.select().from(users).limit(1)
    return result.length === 0
  }

  async createAdminUser(data: { name: string; email: string; password: string }): Promise<LoginResult> {
    const db = getDb()
    const existingUsers = await db.select({ id: users.id }).from(users).limit(1)
    if (existingUsers.length > 0) {
      throw new Error('Initial setup has already been completed')
    }

    const passwordHash = await hashPassword(data.password)
    const id = newId()
    const now = new Date()

    await db.insert(users).values({
      id,
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'admin',
      isActive: true,
      createdAt: now,
      updatedAt: now
    })

    this.auditLog({ userId: id, userName: data.name, action: 'CREATE', entityType: 'user', entityId: id })
    return this.login(data.email, data.password)
  }

  async getUserById(userId: string): Promise<LoginResult['user'] | null> {
    const db = getDb()
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1)

    if (!user || !user.isActive) return null

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) throw new Error('User not found')

    const valid = await verifyPassword(currentPassword, user.passwordHash)
    if (!valid) throw new Error('Current password is incorrect')

    const hash = await hashPassword(newPassword)
    await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, userId))
  }

  async adminResetPassword(userId: string, newPassword: string): Promise<void> {
    const db = getDb()
    const hash = await hashPassword(newPassword)
    await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, userId))
  }

  async listUsers(): Promise<User[]> {
    const db = getDb()
    return db.select().from(users).where(isNull(users.deletedAt))
  }

  async createUser(data: {
    name: string
    email: string
    password: string
    role: Role
  }): Promise<User> {
    const db = getDb()
    const passwordHash = await hashPassword(data.password)
    const id = newId()
    const now = new Date()

    await db.insert(users).values({
      id,
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      isActive: true,
      createdAt: now,
      updatedAt: now
    })

    const [user] = await db.select().from(users).where(eq(users.id, id))
    return user
  }

  async updateUser(
    id: string,
    data: { name?: string; email?: string; role?: Role; isActive?: boolean }
  ): Promise<void> {
    const db = getDb()
    await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id))
  }
}
