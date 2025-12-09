import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertEmergencyContactSchema, 
  insertJourneySchema, 
  insertAlertSchema 
} from "@shared/schema";
import {
  sendSOSAlertSMS,
  sendJourneyStartSMS,
  sendJourneyCompletedSMS,
  sendJourneyOverdueSMS,
  sendOTP,
  verifyOTP
} from "./vonage";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Failed to get user:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const user = await storage.createUser(parsed.data);
      res.status(201).json(user);
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // OTP verification routes
  app.post("/api/otp/send", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      
      const result = await sendOTP(phone);
      if (result.success) {
        res.json({ success: true, message: "Verification code sent" });
      } else {
        res.status(500).json({ success: false, error: result.error || "Failed to send verification code" });
      }
    } catch (error) {
      console.error("Failed to send OTP:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post("/api/otp/verify", async (req, res) => {
    try {
      const { phone, code } = req.body;
      if (!phone || !code) {
        return res.status(400).json({ error: "Phone and code are required" });
      }
      
      const result = verifyOTP(phone, code);
      if (result.valid) {
        res.json({ valid: true, message: "Phone verified successfully" });
      } else {
        res.status(400).json({ valid: false, error: result.error });
      }
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  // Emergency contacts routes
  app.get("/api/users/:userId/contacts", async (req, res) => {
    try {
      const contacts = await storage.getEmergencyContacts(req.params.userId);
      res.json(contacts);
    } catch (error) {
      console.error("Failed to get contacts:", error);
      res.status(500).json({ error: "Failed to get contacts" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const parsed = insertEmergencyContactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const contact = await storage.createEmergencyContact(parsed.data);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Failed to create contact:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.updateEmergencyContact(req.params.id, req.body);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Failed to update contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEmergencyContact(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Journey routes
  app.get("/api/users/:userId/journeys", async (req, res) => {
    try {
      const journeysData = await storage.getJourneys(req.params.userId);
      res.json(journeysData);
    } catch (error) {
      console.error("Failed to get journeys:", error);
      res.status(500).json({ error: "Failed to get journeys" });
    }
  });

  app.get("/api/users/:userId/journeys/active", async (req, res) => {
    try {
      const journey = await storage.getActiveJourney(req.params.userId);
      res.json(journey || null);
    } catch (error) {
      console.error("Failed to get active journey:", error);
      res.status(500).json({ error: "Failed to get active journey" });
    }
  });

  app.get("/api/journeys/:id", async (req, res) => {
    try {
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Journey not found" });
      }
      res.json(journey);
    } catch (error) {
      console.error("Failed to get journey:", error);
      res.status(500).json({ error: "Failed to get journey" });
    }
  });

  app.post("/api/journeys", async (req, res) => {
    try {
      const parsed = insertJourneySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const journey = await storage.createJourney(parsed.data);
      
      // Send SMS notifications to emergency contacts
      const user = await storage.getUser(parsed.data.userId);
      const contacts = await storage.getEmergencyContacts(parsed.data.userId);
      
      if (user && contacts.length > 0) {
        const expectedArrival = new Date(String(parsed.data.expectedArrival));
        
        for (const contact of contacts) {
          try {
            await sendJourneyStartSMS(
              contact.phone,
              contact.name,
              user.name,
              parsed.data.startLocation,
              parsed.data.destination,
              parsed.data.estimatedDuration,
              expectedArrival
            );
          } catch (smsError) {
            console.error(`Failed to send journey start SMS to ${contact.name}:`, smsError);
          }
        }
      }
      
      res.status(201).json(journey);
    } catch (error) {
      console.error("Failed to create journey:", error);
      res.status(500).json({ error: "Failed to create journey" });
    }
  });

  app.patch("/api/journeys/:id", async (req, res) => {
    try {
      const journey = await storage.updateJourney(req.params.id, req.body);
      if (!journey) {
        return res.status(404).json({ error: "Journey not found" });
      }
      
      // If journey is completed, notify contacts
      if (req.body.status === "completed") {
        const user = await storage.getUser(journey.userId);
        const contacts = await storage.getEmergencyContacts(journey.userId);
        
        if (user && contacts.length > 0) {
          for (const contact of contacts) {
            try {
              await sendJourneyCompletedSMS(
                contact.phone,
                contact.name,
                user.name,
                journey.destination
              );
            } catch (smsError) {
              console.error(`Failed to send journey completed SMS to ${contact.name}:`, smsError);
            }
          }
        }
      }
      
      res.json(journey);
    } catch (error) {
      console.error("Failed to update journey:", error);
      res.status(500).json({ error: "Failed to update journey" });
    }
  });

  // Alert routes
  app.get("/api/users/:userId/alerts", async (req, res) => {
    try {
      const alertsData = await storage.getAlerts(req.params.userId);
      res.json(alertsData);
    } catch (error) {
      console.error("Failed to get alerts:", error);
      res.status(500).json({ error: "Failed to get alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const parsed = insertAlertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const alert = await storage.createAlert(parsed.data);
      
      // Send SOS SMS to all emergency contacts
      if (parsed.data.type === "sos") {
        const user = await storage.getUser(parsed.data.userId);
        const contacts = await storage.getEmergencyContacts(parsed.data.userId);
        
        if (user && contacts.length > 0) {
          for (const contact of contacts) {
            try {
              await sendSOSAlertSMS(
                contact.phone,
                contact.name,
                user.name,
                parsed.data.latitude ?? undefined,
                parsed.data.longitude ?? undefined
              );
            } catch (smsError) {
              console.error(`Failed to send SOS SMS to ${contact.name}:`, smsError);
            }
          }
        }
      }
      
      // Send journey overdue alert
      if (parsed.data.type === "overdue" && parsed.data.journeyId) {
        const user = await storage.getUser(parsed.data.userId);
        const contacts = await storage.getEmergencyContacts(parsed.data.userId);
        const journey = await storage.getJourney(parsed.data.journeyId);
        
        if (user && contacts.length > 0 && journey) {
          for (const contact of contacts) {
            try {
              await sendJourneyOverdueSMS(
                contact.phone,
                contact.name,
                user.name,
                journey.destination,
                journey.startLocation,
                parsed.data.latitude ?? undefined,
                parsed.data.longitude ?? undefined
              );
            } catch (smsError) {
              console.error(`Failed to send overdue SMS to ${contact.name}:`, smsError);
            }
          }
        }
      }
      
      res.status(201).json(alert);
    } catch (error) {
      console.error("Failed to create alert:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const alert = await storage.updateAlert(req.params.id, req.body);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Failed to update alert:", error);
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
