import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  workingTimeModel: jsonb("working_time_model").$type<{
    startTime: string;
    endTime: string;
    maxHours: number;
    breakTime: number;
    availabilityWindows?: Array<{ start: string; end: string }>;
  }>().notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const productionAreas = pgTable("production_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "preparation" | "filling"
  startTime: text("start_time"), // fixed start time for preparation rooms
  endTime: text("end_time"), // fixed end time for filling room
});

export const processSteps = pgTable("process_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  requiredSkills: jsonb("required_skills").$type<string[]>().notNull().default([]),
  timePerKg: integer("time_per_kg").notNull(), // minutes per kg
  requiredEmployees: integer("required_employees").notNull().default(1),
  productionAreaId: varchar("production_area_id").references(() => productionAreas.id),
});

export const productionOrders = pgTable("production_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productName: text("product_name").notNull(),
  totalQuantity: integer("total_quantity").notNull(), // kg
  priority: text("priority").notNull().default("medium"), // "high" | "medium" | "low"
  status: text("status").notNull().default("pending"), // "pending" | "in_progress" | "completed"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  scheduledDate: timestamp("scheduled_date").notNull(),
});

export const orderProcessSteps = pgTable("order_process_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => productionOrders.id).notNull(),
  processStepId: varchar("process_step_id").references(() => processSteps.id).notNull(),
  sequence: integer("sequence").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "in_progress" | "completed"
  estimatedDuration: integer("estimated_duration").notNull(), // minutes
});

export const shiftAssignments = pgTable("shift_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  orderProcessStepId: varchar("order_process_step_id").references(() => orderProcessSteps.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  status: text("status").notNull().default("scheduled"), // "scheduled" | "in_progress" | "completed"
});

export const productionAlerts = pgTable("production_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "warning" | "info" | "success" | "error"
  title: text("title").notNull(),
  message: text("message").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

export const insertProductionAreaSchema = createInsertSchema(productionAreas).omit({
  id: true,
});

export const insertProcessStepSchema = createInsertSchema(processSteps).omit({
  id: true,
});

export const insertProductionOrderSchema = createInsertSchema(productionOrders).omit({
  id: true,
  createdAt: true,
}).extend({
  processSteps: z.array(z.object({
    processStepId: z.string(),
    sequence: z.number(),
  })),
});

export const insertShiftAssignmentSchema = createInsertSchema(shiftAssignments).omit({
  id: true,
});

export const insertProductionAlertSchema = createInsertSchema(productionAlerts).omit({
  id: true,
  createdAt: true,
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type ProductionArea = typeof productionAreas.$inferSelect;
export type InsertProductionArea = z.infer<typeof insertProductionAreaSchema>;

export type ProcessStep = typeof processSteps.$inferSelect;
export type InsertProcessStep = z.infer<typeof insertProcessStepSchema>;

export type ProductionOrder = typeof productionOrders.$inferSelect;
export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;

export type OrderProcessStep = typeof orderProcessSteps.$inferSelect;

export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type InsertShiftAssignment = z.infer<typeof insertShiftAssignmentSchema>;

export type ProductionAlert = typeof productionAlerts.$inferSelect;
export type InsertProductionAlert = z.infer<typeof insertProductionAlertSchema>;

// Extended types for frontend
export type EmployeeWithUtilization = Employee & {
  currentAssignment?: string;
  totalHours: number;
  utilizationPercentage: number;
};

export type ProductionOrderWithDetails = ProductionOrder & {
  processSteps: Array<OrderProcessStep & {
    processStep: ProcessStep;
    assignments: Array<ShiftAssignment & { employee: Employee }>;
  }>;
};

export type DashboardStats = {
  totalOrders: number;
  assignedStaff: string;
  productionHours: string;
  efficiency: number;
};
