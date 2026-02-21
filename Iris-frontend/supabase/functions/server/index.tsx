import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-ad819ece/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all patient records
app.get("/make-server-ad819ece/patients", async (c) => {
  try {
    const patients = await kv.getByPrefix("patient:");
    
    // Sort by lastVisit date (most recent first)
    const sortedPatients = patients.sort((a: any, b: any) => {
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    });
    
    return c.json({ success: true, data: sortedPatients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return c.json({ success: false, error: "Failed to fetch patient records" }, 500);
  }
});

// Get a single patient by ID
app.get("/make-server-ad819ece/patients/:id", async (c) => {
  try {
    const patientId = c.req.param("id");
    const patient = await kv.get(`patient:${patientId}`);
    
    if (!patient) {
      return c.json({ success: false, error: "Patient not found" }, 404);
    }
    
    return c.json({ success: true, data: patient });
  } catch (error) {
    console.error(`Error fetching patient ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: "Failed to fetch patient record" }, 500);
  }
});

// Create or update a patient record
app.post("/make-server-ad819ece/patients", async (c) => {
  try {
    const body = await c.req.json();
    const { id, name, age, dateOfBirth, latestDiagnosis, riskLevel, confidence, imageData, symptoms } = body;
    
    if (!id || !name) {
      return c.json({ success: false, error: "Patient ID and name are required" }, 400);
    }
    
    // Check if patient exists
    const existingPatient = await kv.get(`patient:${id}`);
    
    // Create new analysis record
    const newAnalysis = {
      date: new Date().toISOString().split('T')[0],
      diagnosis: latestDiagnosis,
      riskLevel,
      confidence,
      imageData,
      symptoms,
      timestamp: new Date().toISOString(),
    };
    
    const patientRecord = {
      id,
      name,
      age,
      dateOfBirth,
      lastVisit: new Date().toISOString().split('T')[0],
      totalAnalyses: existingPatient ? existingPatient.totalAnalyses + 1 : 1,
      latestDiagnosis,
      riskLevel,
      confidence,
      imageData,
      symptoms,
      // Store array of all analyses
      analyses: existingPatient ? [...(existingPatient.analyses || []), newAnalysis] : [newAnalysis],
      createdAt: existingPatient ? existingPatient.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`patient:${id}`, patientRecord);
    
    return c.json({ success: true, data: patientRecord });
  } catch (error) {
    console.error("Error saving patient record:", error);
    return c.json({ success: false, error: "Failed to save patient record" }, 500);
  }
});

// Delete a patient record
app.delete("/make-server-ad819ece/patients/:id", async (c) => {
  try {
    const patientId = c.req.param("id");
    await kv.del(`patient:${patientId}`);
    
    return c.json({ success: true, message: "Patient record deleted" });
  } catch (error) {
    console.error(`Error deleting patient ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: "Failed to delete patient record" }, 500);
  }
});

// Get next available patient ID
app.get("/make-server-ad819ece/patients/next-id/generate", async (c) => {
  try {
    const patients = await kv.getByPrefix("patient:");
    
    // Extract all existing numeric IDs
    const existingIds: number[] = [];
    patients.forEach((patient: any) => {
      const match = patient.id.match(/PID-(\d+)/);
      if (match) {
        const numId = parseInt(match[1], 10);
        existingIds.push(numId);
      }
    });
    
    // Sort IDs to find gaps
    existingIds.sort((a, b) => a - b);
    
    // Find the first gap (missing number) in the sequence
    let nextId = 1; // Start from 1
    for (const id of existingIds) {
      if (id === nextId) {
        nextId++; // This ID exists, check next
      } else if (id > nextId) {
        // Found a gap! Use this nextId
        break;
      }
    }
    
    const patientId = `PID-${nextId.toString().padStart(5, '0')}`;
    console.log(`🆔 Generated next patient ID: ${patientId} (existing IDs: [${existingIds.join(', ')}])`);
    
    return c.json({ success: true, data: { nextId: patientId } });
  } catch (error) {
    console.error("Error generating next patient ID:", error);
    return c.json({ success: false, error: "Failed to generate patient ID" }, 500);
  }
});

Deno.serve(app.fetch);