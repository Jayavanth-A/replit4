import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("User"),
  phone: text("phone").notNull(),
  phoneVerified: boolean("phone_verified").default(false),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  height: text("height"),
  weight: text("weight"),
  skinTone: text("skin_tone"),
  eyeColor: text("eye_color"),
  distinguishingFeatures: text("distinguishing_features"),
  medicalInfo: text("medical_info"),
  codeWord: text("code_word"),
  avatarIndex: integer("avatar_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  emergencyContacts: many(emergencyContacts),
  journeys: many(journeys),
  alerts: many(alerts),
}));

export const emergencyContacts = pgTable("emergency_contacts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  relationship: text("relationship").notNull(),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  user: one(users, {
    fields: [emergencyContacts.userId],
    references: [users.id],
  }),
}));

export const journeys = pgTable("journeys", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startLocation: text("start_location").notNull(),
  startLatitude: text("start_latitude"),
  startLongitude: text("start_longitude"),
  destination: text("destination").notNull(),
  estimatedDuration: integer("estimated_duration").notNull(),
  bufferTime: integer("buffer_time").default(10),
  note: text("note"),
  status: text("status").notNull().default("active"),
  expectedArrival: timestamp("expected_arrival").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const journeysRelations = relations(journeys, ({ one, many }) => ({
  user: one(users, {
    fields: [journeys.userId],
    references: [users.id],
  }),
  alerts: many(alerts),
}));

export const alerts = pgTable("alerts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  journeyId: varchar("journey_id").references(() => journeys.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  status: text("status").notNull().default("sent"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  journey: one(journeys, {
    fields: [alerts.journeyId],
    references: [journeys.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  phone: true,
  phoneVerified: true,
  height: true,
  weight: true,
  skinTone: true,
  eyeColor: true,
  distinguishingFeatures: true,
  medicalInfo: true,
  codeWord: true,
  avatarIndex: true,
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).pick({
  userId: true,
  name: true,
  phone: true,
  relationship: true,
  isPrimary: true,
});

export const insertJourneySchema = createInsertSchema(journeys).pick({
  userId: true,
  startLocation: true,
  startLatitude: true,
  startLongitude: true,
  destination: true,
  estimatedDuration: true,
  bufferTime: true,
  note: true,
  status: true,
  expectedArrival: true,
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  userId: true,
  journeyId: true,
  type: true,
  latitude: true,
  longitude: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Journey = typeof journeys.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
