import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductionOrderSchema, insertEmployeeSchema, insertProductionAlertSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const stats = await storage.getDashboardStats(date);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Employees
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/utilization", async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const employees = await storage.getEmployeesWithUtilization(date);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee utilization" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create employee" });
      }
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await storage.updateEmployee(id, req.body);
      if (!employee) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Production Areas
  app.get("/api/production-areas", async (req, res) => {
    try {
      const areas = await storage.getProductionAreas();
      res.json(areas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch production areas" });
    }
  });

  // Process Steps
  app.get("/api/process-steps", async (req, res) => {
    try {
      const steps = await storage.getProcessSteps();
      res.json(steps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch process steps" });
    }
  });

  app.get("/api/production-areas/:areaId/process-steps", async (req, res) => {
    try {
      const { areaId } = req.params;
      const steps = await storage.getProcessStepsByArea(areaId);
      res.json(steps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch process steps for area" });
    }
  });

  // Production Orders
  app.get("/api/production-orders", async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const orders = await storage.getProductionOrders(date);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch production orders" });
    }
  });

  app.get("/api/production-orders/details", async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const orders = await storage.getProductionOrdersWithDetails(date);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch production orders with details" });
    }
  });

  app.post("/api/production-orders", async (req, res) => {
    try {
      // Transform scheduledDate before validation
      const requestData = { 
        ...req.body, 
        scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : new Date()
      };
      const validatedData = insertProductionOrderSchema.parse(requestData);
      const order = await storage.createProductionOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid production order data", errors: error.errors });
      } else {
        console.error('Production order creation error:', error);
        res.status(500).json({ message: "Failed to create production order" });
      }
    }
  });

  // Shift Assignments
  app.get("/api/shift-assignments", async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const assignments = await storage.getShiftAssignments(date);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shift assignments" });
    }
  });

  app.patch("/api/shift-assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await storage.updateShiftAssignment(id, req.body);
      if (!assignment) {
        res.status(404).json({ message: "Shift assignment not found" });
        return;
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update shift assignment" });
    }
  });

  // Production Alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const validatedData = insertProductionAlertSchema.parse(req.body);
      const alert = await storage.createAlert(validatedData);
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid alert data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create alert" });
      }
    }
  });

  app.patch("/api/alerts/:id/dismiss", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.dismissAlert(id);
      res.json({ message: "Alert dismissed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to dismiss alert" });
    }
  });

  // Schedule generation and optimization
  app.post("/api/schedule/generate", async (req, res) => {
    try {
      const { date } = req.body;
      const targetDate = new Date(date);
      
      // Import and use the AI scheduling engine
      const { AISchedulingEngine } = await import('./scheduling-engine');
      const scheduler = new AISchedulingEngine(storage);
      
      const result = await scheduler.generateOptimalSchedule(targetDate);
      
      // Create alerts for any issues found
      for (const issue of result.issues) {
        await storage.createAlert({
          type: 'warning',
          title: 'Scheduling Issue',
          message: issue,
          isActive: true,
        });
      }

      // Create info alerts for recommendations
      for (const recommendation of result.recommendations) {
        await storage.createAlert({
          type: 'info',
          title: 'Optimization Suggestion',
          message: recommendation,
          isActive: true,
        });
      }

      res.json({
        message: result.feasible 
          ? "Schedule generated successfully" 
          : "Schedule generated with issues",
        date: targetDate,
        feasible: result.feasible,
        tasksScheduled: result.tasks.length,
        issues: result.issues.length,
        recommendations: result.recommendations.length
      });
    } catch (error) {
      console.error('Schedule generation error:', error);
      res.status(500).json({ 
        message: "Failed to generate schedule",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Export functionality
  app.get("/api/export/shift-plan", async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const orders = await storage.getProductionOrdersWithDetails(date);
      const stats = await storage.getDashboardStats(date);
      
      // Simple CSV export
      const csvData = [
        ['Date', 'Product', 'Process Step', 'Employee', 'Start Time', 'End Time', 'Status'],
        ...orders.flatMap(order => 
          order.processSteps.flatMap(step =>
            step.assignments.map(assignment => [
              date.toLocaleDateString(),
              order.productName,
              step.processStep.name,
              assignment.employee.name,
              new Date(assignment.startTime).toLocaleTimeString(),
              new Date(assignment.endTime).toLocaleTimeString(),
              assignment.status
            ])
          )
        )
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="shift-plan-${date.toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export shift plan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
