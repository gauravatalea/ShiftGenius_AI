import { 
  type Employee, 
  type InsertEmployee,
  type ProductionArea,
  type InsertProductionArea,
  type ProcessStep,
  type InsertProcessStep,
  type ProductionOrder,
  type InsertProductionOrder,
  type OrderProcessStep,
  type ShiftAssignment,
  type InsertShiftAssignment,
  type ProductionAlert,
  type InsertProductionAlert,
  type EmployeeWithUtilization,
  type ProductionOrderWithDetails,
  type DashboardStats
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee | undefined>;
  getEmployeesWithUtilization(date: Date): Promise<EmployeeWithUtilization[]>;

  // Production Areas
  getProductionAreas(): Promise<ProductionArea[]>;
  getProductionArea(id: string): Promise<ProductionArea | undefined>;
  createProductionArea(area: InsertProductionArea): Promise<ProductionArea>;

  // Process Steps
  getProcessSteps(): Promise<ProcessStep[]>;
  getProcessStep(id: string): Promise<ProcessStep | undefined>;
  createProcessStep(step: InsertProcessStep): Promise<ProcessStep>;
  getProcessStepsByArea(areaId: string): Promise<ProcessStep[]>;

  // Production Orders
  getProductionOrders(date?: Date): Promise<ProductionOrder[]>;
  getProductionOrder(id: string): Promise<ProductionOrder | undefined>;
  createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder>;
  getProductionOrdersWithDetails(date: Date): Promise<ProductionOrderWithDetails[]>;

  // Order Process Steps
  getOrderProcessSteps(orderId: string): Promise<OrderProcessStep[]>;
  createOrderProcessStep(step: Omit<OrderProcessStep, 'id'>): Promise<OrderProcessStep>;

  // Shift Assignments
  getShiftAssignments(date: Date): Promise<ShiftAssignment[]>;
  createShiftAssignment(assignment: InsertShiftAssignment): Promise<ShiftAssignment>;
  updateShiftAssignment(id: string, assignment: Partial<ShiftAssignment>): Promise<ShiftAssignment | undefined>;

  // Production Alerts
  getActiveAlerts(): Promise<ProductionAlert[]>;
  createAlert(alert: InsertProductionAlert): Promise<ProductionAlert>;
  dismissAlert(id: string): Promise<void>;

  // Dashboard
  getDashboardStats(date: Date): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private employees: Map<string, Employee> = new Map();
  private productionAreas: Map<string, ProductionArea> = new Map();
  private processSteps: Map<string, ProcessStep> = new Map();
  private productionOrders: Map<string, ProductionOrder> = new Map();
  private orderProcessSteps: Map<string, OrderProcessStep> = new Map();
  private shiftAssignments: Map<string, ShiftAssignment> = new Map();
  private productionAlerts: Map<string, ProductionAlert> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize production areas
    const prepRoom1: ProductionArea = {
      id: "prep-1",
      name: "Preparation Room 1",
      type: "preparation",
      startTime: "06:00",
      endTime: null,
    };
    
    const prepRoom2: ProductionArea = {
      id: "prep-2", 
      name: "Preparation Room 2",
      type: "preparation",
      startTime: "06:00",
      endTime: null,
    };

    const fillingRoom: ProductionArea = {
      id: "filling-1",
      name: "Filling Room",
      type: "filling",
      startTime: null,
      endTime: "17:00",
    };

    this.productionAreas.set(prepRoom1.id, prepRoom1);
    this.productionAreas.set(prepRoom2.id, prepRoom2);
    this.productionAreas.set(fillingRoom.id, fillingRoom);

    // Initialize process steps
    const processSteps: ProcessStep[] = [
      {
        id: "step-1",
        name: "Vegetable Peeling",
        requiredSkills: ["peeling", "food_prep"],
        timePerKg: 2,
        requiredEmployees: 2,
        productionAreaId: "prep-1",
      },
      {
        id: "step-2",
        name: "Cutting & Washing",
        requiredSkills: ["cutting", "washing", "food_prep"],
        timePerKg: 3,
        requiredEmployees: 2,
        productionAreaId: "prep-1",
      },
      {
        id: "step-3",
        name: "Quality Check",
        requiredSkills: ["quality_control", "food_safety"],
        timePerKg: 1,
        requiredEmployees: 1,
        productionAreaId: "prep-2",
      },
      {
        id: "step-4",
        name: "Package Assembly",
        requiredSkills: ["packaging", "assembly"],
        timePerKg: 4,
        requiredEmployees: 2,
        productionAreaId: "filling-1",
      },
      {
        id: "step-5",
        name: "Final Packaging",
        requiredSkills: ["packaging", "sealing"],
        timePerKg: 3,
        requiredEmployees: 2,
        productionAreaId: "filling-1",
      },
    ];

    processSteps.forEach(step => this.processSteps.set(step.id, step));

    // Initialize employees
    const employees: Employee[] = [
      {
        id: "emp-1",
        name: "Maria Schmidt",
        skills: ["peeling", "cutting", "food_prep", "quality_control"],
        workingTimeModel: {
          startTime: "06:00",
          endTime: "14:00",
          maxHours: 8,
          breakTime: 30,
        },
        isAvailable: true,
      },
      {
        id: "emp-2",
        name: "John Weber",
        skills: ["peeling", "washing", "food_prep"],
        workingTimeModel: {
          startTime: "06:00",
          endTime: "14:00",
          maxHours: 8,
          breakTime: 30,
        },
        isAvailable: true,
      },
      {
        id: "emp-3",
        name: "Anna Müller",
        skills: ["cutting", "washing", "food_prep", "quality_control"],
        workingTimeModel: {
          startTime: "07:00",
          endTime: "15:00",
          maxHours: 8,
          breakTime: 30,
        },
        isAvailable: true,
      },
      {
        id: "emp-4",
        name: "Peter Fischer",
        skills: ["cutting", "washing", "food_prep"],
        workingTimeModel: {
          startTime: "08:00",
          endTime: "16:00",
          maxHours: 8,
          breakTime: 30,
        },
        isAvailable: true,
      },
      {
        id: "emp-5",
        name: "Lisa Brown",
        skills: ["quality_control", "food_safety", "packaging"],
        workingTimeModel: {
          startTime: "09:00",
          endTime: "17:00",
          maxHours: 8,
          breakTime: 30,
        },
        isAvailable: true,
      },
      {
        id: "emp-6",
        name: "Michael Johnson",
        skills: ["packaging", "assembly", "sealing"],
        workingTimeModel: {
          startTime: "09:00",
          endTime: "17:00",
          maxHours: 8,
          breakTime: 30,
        },
        isAvailable: true,
      },
      {
        id: "emp-7",
        name: "Sarah Davis",
        skills: ["packaging", "sealing", "quality_control"],
        workingTimeModel: {
          startTime: "10:00",
          endTime: "18:00",
          maxHours: 8,
          breakTime: 30,
        },
        isAvailable: false,
      },
      {
        id: "emp-8",
        name: "Tom Wilson",
        skills: ["packaging", "assembly"],
        workingTimeModel: {
          startTime: "13:00",
          endTime: "21:00",
          maxHours: 8,
          breakTime: 30,
        },
        isAvailable: true,
      },
      {
        id: "emp-9",
        name: "Emma Garcia",
        skills: ["packaging", "sealing", "assembly"],
        workingTimeModel: {
          startTime: "14:00",
          endTime: "22:00",
          maxHours: 8,
          breakTime: 30,
        },
        isAvailable: true,
      },
    ];

    employees.forEach(emp => this.employees.set(emp.id, emp));

    // Initialize some sample alerts
    const alerts: ProductionAlert[] = [
      {
        id: "alert-1",
        type: "warning",
        title: "Staff Shortage",
        message: "2 additional staff needed for evening shift",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "alert-2",
        type: "info",
        title: "Dependency Alert",
        message: "Batch B waiting for Batch A completion",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "alert-3",
        type: "success",
        title: "On Track",
        message: "Morning shift completed ahead of schedule",
        isActive: true,
        createdAt: new Date(),
      },
    ];

    alerts.forEach(alert => this.productionAlerts.set(alert.id, alert));

    // Initialize some sample production orders for today
    this.initializeSampleOrders();
  }

  private async initializeSampleOrders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sample Order 1: Small batch of vegetables (150kg)
    const order1 = await this.createProductionOrder({
      productName: "Mixed Vegetable Salad",
      totalQuantity: 150,
      priority: "high",
      status: "pending",
      scheduledDate: today,
      processSteps: [
        { processStepId: "step-1", sequence: 1 }, // Vegetable Peeling (prep)
        { processStepId: "step-2", sequence: 2 }, // Cutting & Washing (prep)
        { processStepId: "step-3", sequence: 3 }, // Quality Check (prep)
        { processStepId: "step-4", sequence: 4 }, // Package Assembly (filling)
        { processStepId: "step-5", sequence: 5 }, // Final Packaging (filling)
      ],
    });

    // Sample Order 2: Medium batch of soup (300kg)
    const order2 = await this.createProductionOrder({
      productName: "Organic Vegetable Soup",
      totalQuantity: 300,
      priority: "medium", 
      status: "pending",
      scheduledDate: today,
      processSteps: [
        { processStepId: "step-1", sequence: 1 }, // Vegetable Peeling (prep)
        { processStepId: "step-2", sequence: 2 }, // Cutting & Washing (prep)
        { processStepId: "step-4", sequence: 3 }, // Package Assembly (filling)
        { processStepId: "step-5", sequence: 4 }, // Final Packaging (filling)
      ],
    });

    // Sample Order 3: Large batch of juice (500kg)  
    const order3 = await this.createProductionOrder({
      productName: "Fresh Fruit Juice Mix",
      totalQuantity: 500,
      priority: "low",
      status: "pending", 
      scheduledDate: today,
      processSteps: [
        { processStepId: "step-2", sequence: 1 }, // Cutting & Washing (prep)
        { processStepId: "step-3", sequence: 2 }, // Quality Check (prep)
        { processStepId: "step-4", sequence: 3 }, // Package Assembly (filling)
        { processStepId: "step-5", sequence: 4 }, // Final Packaging (filling)
      ],
    });
  }

  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = { 
      ...insertEmployee, 
      id,
      skills: insertEmployee.skills || [],
      isAvailable: insertEmployee.isAvailable ?? true
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee | undefined> {
    const existing = this.employees.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...employeeData };
    this.employees.set(id, updated);
    return updated;
  }

  async getEmployeesWithUtilization(date: Date): Promise<EmployeeWithUtilization[]> {
    const employees = Array.from(this.employees.values());
    const assignments = Array.from(this.shiftAssignments.values()).filter(
      assignment => {
        const assignmentDate = new Date(assignment.startTime);
        return assignmentDate.toDateString() === date.toDateString();
      }
    );

    return employees.map(employee => {
      const employeeAssignments = assignments.filter(a => a.employeeId === employee.id);
      const totalMinutes = employeeAssignments.reduce((sum, assignment) => {
        const start = new Date(assignment.startTime);
        const end = new Date(assignment.endTime);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0);
      
      const totalHours = totalMinutes / 60;
      const maxHours = employee.workingTimeModel.maxHours;
      const utilizationPercentage = Math.min((totalHours / maxHours) * 100, 100);

      const currentAssignment = employeeAssignments.find(a => a.status === 'in_progress');
      let currentAssignmentName = '';
      if (currentAssignment) {
        const orderStep = this.orderProcessSteps.get(currentAssignment.orderProcessStepId);
        if (orderStep) {
          const processStep = this.processSteps.get(orderStep.processStepId);
          currentAssignmentName = processStep?.name || '';
        }
      }

      return {
        ...employee,
        currentAssignment: currentAssignmentName || undefined,
        totalHours: Math.round(totalHours * 10) / 10,
        utilizationPercentage: Math.round(utilizationPercentage),
      };
    });
  }

  async getProductionAreas(): Promise<ProductionArea[]> {
    return Array.from(this.productionAreas.values());
  }

  async getProductionArea(id: string): Promise<ProductionArea | undefined> {
    return this.productionAreas.get(id);
  }

  async createProductionArea(insertArea: InsertProductionArea): Promise<ProductionArea> {
    const id = randomUUID();
    const area: ProductionArea = { 
      ...insertArea, 
      id,
      startTime: insertArea.startTime ?? null,
      endTime: insertArea.endTime ?? null
    };
    this.productionAreas.set(id, area);
    return area;
  }

  async getProcessSteps(): Promise<ProcessStep[]> {
    return Array.from(this.processSteps.values());
  }

  async getProcessStep(id: string): Promise<ProcessStep | undefined> {
    return this.processSteps.get(id);
  }

  async createProcessStep(insertStep: InsertProcessStep): Promise<ProcessStep> {
    const id = randomUUID();
    const step: ProcessStep = { 
      ...insertStep, 
      id,
      requiredSkills: insertStep.requiredSkills || [],
      productionAreaId: insertStep.productionAreaId || null
    };
    this.processSteps.set(id, step);
    return step;
  }

  async getProcessStepsByArea(areaId: string): Promise<ProcessStep[]> {
    return Array.from(this.processSteps.values()).filter(step => step.productionAreaId === areaId);
  }

  async getProductionOrders(date?: Date): Promise<ProductionOrder[]> {
    const orders = Array.from(this.productionOrders.values());
    if (!date) return orders;
    
    return orders.filter(order => {
      const orderDate = new Date(order.scheduledDate);
      return orderDate.toDateString() === date.toDateString();
    });
  }

  async getProductionOrder(id: string): Promise<ProductionOrder | undefined> {
    return this.productionOrders.get(id);
  }

  async createProductionOrder(insertOrder: InsertProductionOrder): Promise<ProductionOrder> {
    const id = randomUUID();
    const order: ProductionOrder = {
      id,
      productName: insertOrder.productName,
      totalQuantity: insertOrder.totalQuantity,
      priority: insertOrder.priority,
      status: insertOrder.status ?? 'pending',
      createdAt: new Date(),
      scheduledDate: insertOrder.scheduledDate,
    };
    this.productionOrders.set(id, order);

    // Create order process steps
    for (const stepData of insertOrder.processSteps) {
      const processStep = this.processSteps.get(stepData.processStepId);
      if (processStep) {
        const estimatedDuration = processStep.timePerKg * insertOrder.totalQuantity;
        await this.createOrderProcessStep({
          orderId: id,
          processStepId: stepData.processStepId,
          sequence: stepData.sequence,
          status: 'pending',
          estimatedDuration,
        });
      }
    }

    return order;
  }

  async getProductionOrdersWithDetails(date: Date): Promise<ProductionOrderWithDetails[]> {
    const orders = await this.getProductionOrders(date);
    const result: ProductionOrderWithDetails[] = [];

    for (const order of orders) {
      const orderSteps = Array.from(this.orderProcessSteps.values())
        .filter(step => step.orderId === order.id);

      const processSteps = [];
      for (const orderStep of orderSteps) {
        const processStep = this.processSteps.get(orderStep.processStepId);
        if (processStep) {
          const assignments = Array.from(this.shiftAssignments.values())
            .filter(assignment => assignment.orderProcessStepId === orderStep.id);
          
          const assignmentsWithEmployees = [];
          for (const assignment of assignments) {
            const employee = this.employees.get(assignment.employeeId);
            if (employee) {
              assignmentsWithEmployees.push({ ...assignment, employee });
            }
          }

          processSteps.push({
            ...orderStep,
            processStep,
            assignments: assignmentsWithEmployees,
          });
        }
      }

      result.push({
        ...order,
        processSteps: processSteps.sort((a, b) => a.sequence - b.sequence),
      });
    }

    return result;
  }

  async getOrderProcessSteps(orderId: string): Promise<OrderProcessStep[]> {
    return Array.from(this.orderProcessSteps.values()).filter(step => step.orderId === orderId);
  }

  async createOrderProcessStep(step: Omit<OrderProcessStep, 'id'>): Promise<OrderProcessStep> {
    const id = randomUUID();
    const orderStep: OrderProcessStep = { ...step, id };
    this.orderProcessSteps.set(id, orderStep);
    return orderStep;
  }

  async getShiftAssignments(date: Date): Promise<ShiftAssignment[]> {
    return Array.from(this.shiftAssignments.values()).filter(assignment => {
      const assignmentDate = new Date(assignment.startTime);
      return assignmentDate.toDateString() === date.toDateString();
    });
  }

  async createShiftAssignment(insertAssignment: InsertShiftAssignment): Promise<ShiftAssignment> {
    const id = randomUUID();
    const assignment: ShiftAssignment = { 
      ...insertAssignment, 
      id,
      status: insertAssignment.status ?? 'scheduled',
      actualStartTime: insertAssignment.actualStartTime ?? null,
      actualEndTime: insertAssignment.actualEndTime ?? null
    };
    this.shiftAssignments.set(id, assignment);
    return assignment;
  }

  async updateShiftAssignment(id: string, assignmentData: Partial<ShiftAssignment>): Promise<ShiftAssignment | undefined> {
    const existing = this.shiftAssignments.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...assignmentData };
    this.shiftAssignments.set(id, updated);
    return updated;
  }

  async getActiveAlerts(): Promise<ProductionAlert[]> {
    return Array.from(this.productionAlerts.values()).filter(alert => alert.isActive);
  }

  async createAlert(insertAlert: InsertProductionAlert): Promise<ProductionAlert> {
    const id = randomUUID();
    const alert: ProductionAlert = {
      ...insertAlert,
      id,
      createdAt: new Date(),
      isActive: insertAlert.isActive ?? true
    };
    this.productionAlerts.set(id, alert);
    return alert;
  }

  async dismissAlert(id: string): Promise<void> {
    const alert = this.productionAlerts.get(id);
    if (alert) {
      this.productionAlerts.set(id, { ...alert, isActive: false });
    }
  }

  async getDashboardStats(date: Date): Promise<DashboardStats> {
    const orders = await this.getProductionOrders(date);
    const assignments = await this.getShiftAssignments(date);
    
    const totalOrders = orders.length;
    const assignedEmployees = new Set(assignments.map(a => a.employeeId)).size;
    const totalEmployees = Array.from(this.employees.values()).filter(e => e.isAvailable).length;
    
    const totalMinutes = assignments.reduce((sum, assignment) => {
      const start = new Date(assignment.startTime);
      const end = new Date(assignment.endTime);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
    
    const productionHours = (totalMinutes / 60).toFixed(1) + 'hrs';
    
    const completedTasks = Array.from(this.orderProcessSteps.values()).filter(step => step.status === 'completed').length;
    const totalTasks = Array.from(this.orderProcessSteps.values()).length;
    const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalOrders,
      assignedStaff: `${assignedEmployees}/${totalEmployees}`,
      productionHours,
      efficiency,
    };
  }
}

export const storage = new MemStorage();
