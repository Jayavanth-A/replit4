import { 
  users, emergencyContacts, journeys, alerts,
  type User, type InsertUser,
  type EmergencyContact, type InsertEmergencyContact,
  type Journey, type InsertJourney,
  type Alert, type InsertAlert
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  
  getEmergencyContacts(userId: string): Promise<EmergencyContact[]>;
  getEmergencyContact(id: string): Promise<EmergencyContact | undefined>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  updateEmergencyContact(id: string, data: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined>;
  deleteEmergencyContact(id: string): Promise<boolean>;
  
  getJourneys(userId: string): Promise<Journey[]>;
  getJourney(id: string): Promise<Journey | undefined>;
  getActiveJourney(userId: string): Promise<Journey | undefined>;
  createJourney(journey: InsertJourney): Promise<Journey>;
  updateJourney(id: string, data: Partial<Journey>): Promise<Journey | undefined>;
  
  getAlerts(userId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, data: Partial<Alert>): Promise<Alert | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return db.select().from(emergencyContacts).where(eq(emergencyContacts.userId, userId));
  }

  async getEmergencyContact(id: string): Promise<EmergencyContact | undefined> {
    const [contact] = await db.select().from(emergencyContacts).where(eq(emergencyContacts.id, id));
    return contact || undefined;
  }

  async createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const [newContact] = await db
      .insert(emergencyContacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async updateEmergencyContact(id: string, data: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined> {
    const [contact] = await db
      .update(emergencyContacts)
      .set(data)
      .where(eq(emergencyContacts.id, id))
      .returning();
    return contact || undefined;
  }

  async deleteEmergencyContact(id: string): Promise<boolean> {
    const result = await db
      .delete(emergencyContacts)
      .where(eq(emergencyContacts.id, id))
      .returning();
    return result.length > 0;
  }

  async getJourneys(userId: string): Promise<Journey[]> {
    return db
      .select()
      .from(journeys)
      .where(eq(journeys.userId, userId))
      .orderBy(desc(journeys.createdAt));
  }

  async getJourney(id: string): Promise<Journey | undefined> {
    const [journey] = await db.select().from(journeys).where(eq(journeys.id, id));
    return journey || undefined;
  }

  async getActiveJourney(userId: string): Promise<Journey | undefined> {
    const [journey] = await db
      .select()
      .from(journeys)
      .where(eq(journeys.userId, userId))
      .orderBy(desc(journeys.createdAt))
      .limit(1);
    
    if (journey && journey.status === "active") {
      return journey;
    }
    return undefined;
  }

  async createJourney(journey: InsertJourney): Promise<Journey> {
    const [newJourney] = await db
      .insert(journeys)
      .values(journey)
      .returning();
    return newJourney;
  }

  async updateJourney(id: string, data: Partial<Journey>): Promise<Journey | undefined> {
    const [journey] = await db
      .update(journeys)
      .set(data)
      .where(eq(journeys.id, id))
      .returning();
    return journey || undefined;
  }

  async getAlerts(userId: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async updateAlert(id: string, data: Partial<Alert>): Promise<Alert | undefined> {
    const [alert] = await db
      .update(alerts)
      .set(data)
      .where(eq(alerts.id, id))
      .returning();
    return alert || undefined;
  }
}

export const storage = new DatabaseStorage();
