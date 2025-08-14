import { 
  type Employee, 
  type ProductionOrder, 
  type ProcessStep,
  type OrderProcessStep,
  type ShiftAssignment,
  type ProductionArea 
} from "@shared/schema";
import { type IStorage } from "./storage";

interface ScheduledTask {
  orderId: string;
  orderProcessStepId: string;
  processStepId: string;
  employeeId: string;
  startTime: Date;
  endTime: Date;
  estimatedDuration: number; // minutes
  productionAreaId: string;
}

interface SchedulingResult {
  tasks: ScheduledTask[];
  feasible: boolean;
  issues: string[];
  recommendations: string[];
}

export class AISchedulingEngine {
  private storage: IStorage;
  private employees: Employee[] = [];
  private productionAreas: ProductionArea[] = [];
  private processSteps: ProcessStep[] = [];

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Main scheduling algorithm based on PRD requirements
   */
  async generateOptimalSchedule(date: Date): Promise<SchedulingResult> {
    // Load required data
    await this.loadData(date);
    
    const orders = await this.storage.getProductionOrdersWithDetails(date);
    const availableEmployees = this.employees.filter(emp => emp.isAvailable);
    
    if (orders.length === 0) {
      return {
        tasks: [],
        feasible: true,
        issues: [],
        recommendations: ["No production orders scheduled for this date"]
      };
    }

    // Sort orders by quantity (ascending) as per PRD
    const sortedOrders = this.sortOrdersByQuantity(orders);
    
    const tasks: ScheduledTask[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Step 1: Schedule Preparation Rooms (start at 06:00)
      const preparationTasks = await this.schedulePreparationRooms(sortedOrders, availableEmployees);
      tasks.push(...preparationTasks.tasks);
      issues.push(...preparationTasks.issues);

      // Step 2: Schedule Filling Room (backward from 17:00)
      const fillingTasks = await this.scheduleFillingRoom(sortedOrders, availableEmployees, preparationTasks.tasks);
      tasks.push(...fillingTasks.tasks);
      issues.push(...fillingTasks.issues);

      // Step 3: Validate dependencies and constraints
      const validation = this.validateSchedule(tasks, availableEmployees);
      issues.push(...validation.issues);

      // Step 4: Generate recommendations
      recommendations.push(...this.generateRecommendations(tasks, availableEmployees, orders.length));

      // Save shift assignments
      await this.saveShiftAssignments(tasks);

      return {
        tasks,
        feasible: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      console.error('Scheduling error:', error);
      return {
        tasks: [],
        feasible: false,
        issues: [`Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ["Please review input data and try again"]
      };
    }
  }

  private async loadData(date: Date) {
    this.employees = await this.storage.getEmployees();
    this.productionAreas = await this.storage.getProductionAreas();
    this.processSteps = await this.storage.getProcessSteps();
  }

  /**
   * Sort orders by total quantity (kg) ascending - PRD requirement
   */
  private sortOrdersByQuantity(orders: any[]): any[] {
    return [...orders].sort((a, b) => a.totalQuantity - b.totalQuantity);
  }

  /**
   * Schedule preparation room tasks starting at 06:00
   */
  private async schedulePreparationRooms(orders: any[], availableEmployees: Employee[]) {
    const tasks: ScheduledTask[] = [];
    const issues: string[] = [];
    
    // Fixed start time: 06:00 as per PRD
    let currentTime = this.createDateTime(new Date(), 6, 0);
    
    const preparationAreas = this.productionAreas.filter(area => area.type === 'preparation');
    
    for (const order of orders) {
      const preparationSteps = this.getPreparationStepsForOrder(order);
      
      for (const orderStep of preparationSteps) {
        const processStep = this.processSteps.find(ps => ps.id === orderStep.processStepId);
        if (!processStep) continue;

        // Find available employees with required skills
        const suitableEmployees = this.findSuitableEmployees(
          processStep,
          currentTime,
          availableEmployees,
          tasks
        );

        if (suitableEmployees.length < processStep.requiredEmployees) {
          issues.push(
            `Insufficient skilled staff for ${processStep.name} in ${order.productName}. ` +
            `Need ${processStep.requiredEmployees}, found ${suitableEmployees.length}`
          );
          continue;
        }

        // Calculate duration based on quantity and time per kg
        const durationMinutes = processStep.timePerKg * order.totalQuantity;
        const endTime = new Date(currentTime.getTime() + durationMinutes * 60000);

        // Assign required number of employees
        for (let i = 0; i < processStep.requiredEmployees && i < suitableEmployees.length; i++) {
          tasks.push({
            orderId: order.id,
            orderProcessStepId: orderStep.id,
            processStepId: processStep.id,
            employeeId: suitableEmployees[i].id,
            startTime: new Date(currentTime),
            endTime: new Date(endTime),
            estimatedDuration: durationMinutes,
            productionAreaId: processStep.productionAreaId || '',
          });
        }

        currentTime = endTime;
      }
    }

    return { tasks, issues };
  }

  /**
   * Schedule filling room tasks backward from 17:00
   */
  private async scheduleFillingRoom(orders: any[], availableEmployees: Employee[], preparationTasks: ScheduledTask[]) {
    const tasks: ScheduledTask[] = [];
    const issues: string[] = [];
    
    // Fixed end time: 17:00 as per PRD
    let currentTime = this.createDateTime(new Date(), 17, 0);
    
    // Work backwards through orders
    const reversedOrders = [...orders].reverse();
    
    for (const order of reversedOrders) {
      const fillingSteps = this.getFillingStepsForOrder(order).reverse();
      
      for (const orderStep of fillingSteps) {
        const processStep = this.processSteps.find(ps => ps.id === orderStep.processStepId);
        if (!processStep) continue;

        // Check dependencies - ensure preparation is complete
        const dependencyMet = this.checkDependencies(order.id, processStep, preparationTasks);
        if (!dependencyMet.met) {
          issues.push(
            `Dependency not met for ${processStep.name} in ${order.productName}: ${dependencyMet.reason}`
          );
          continue;
        }

        // Calculate duration and work backwards
        const durationMinutes = processStep.timePerKg * order.totalQuantity;
        const startTime = new Date(currentTime.getTime() - durationMinutes * 60000);

        // Find available employees
        const suitableEmployees = this.findSuitableEmployees(
          processStep,
          startTime,
          availableEmployees,
          [...tasks, ...preparationTasks]
        );

        if (suitableEmployees.length < processStep.requiredEmployees) {
          issues.push(
            `Insufficient skilled staff for ${processStep.name} in ${order.productName}. ` +
            `Need ${processStep.requiredEmployees}, found ${suitableEmployees.length}`
          );
          continue;
        }

        // Assign employees
        for (let i = 0; i < processStep.requiredEmployees && i < suitableEmployees.length; i++) {
          tasks.push({
            orderId: order.id,
            orderProcessStepId: orderStep.id,
            processStepId: processStep.id,
            employeeId: suitableEmployees[i].id,
            startTime: new Date(startTime),
            endTime: new Date(currentTime),
            estimatedDuration: durationMinutes,
            productionAreaId: processStep.productionAreaId || '',
          });
        }

        currentTime = startTime;
      }
    }

    return { tasks, issues };
  }

  private getPreparationStepsForOrder(order: any): any[] {
    return order.processSteps.filter((step: any) => 
      step.processStep.productionAreaId?.includes('prep')
    ).sort((a: any, b: any) => a.sequence - b.sequence);
  }

  private getFillingStepsForOrder(order: any): any[] {
    return order.processSteps.filter((step: any) => 
      step.processStep.productionAreaId?.includes('filling')
    ).sort((a: any, b: any) => a.sequence - b.sequence);
  }

  /**
   * Find employees suitable for a process step considering skills and availability
   */
  private findSuitableEmployees(
    processStep: ProcessStep, 
    taskTime: Date, 
    allEmployees: Employee[],
    existingTasks: ScheduledTask[]
  ): Employee[] {
    return allEmployees.filter(employee => {
      // Check if employee has required skills
      const hasRequiredSkills = processStep.requiredSkills.every(skill => 
        employee.skills.includes(skill)
      );
      if (!hasRequiredSkills) return false;

      // Check working time constraints
      const taskHour = taskTime.getHours() + taskTime.getMinutes() / 60;
      const workStart = this.parseTimeString(employee.workingTimeModel.startTime);
      const workEnd = this.parseTimeString(employee.workingTimeModel.endTime);
      
      if (taskHour < workStart || taskHour > workEnd) return false;

      // Check for conflicts with existing assignments
      const hasConflict = existingTasks.some(task => {
        if (task.employeeId !== employee.id) return false;
        
        return (
          (taskTime >= task.startTime && taskTime < task.endTime) ||
          (taskTime < task.startTime && 
           new Date(taskTime.getTime() + processStep.timePerKg * 60000) > task.startTime)
        );
      });

      return !hasConflict;
    });
  }

  /**
   * Check if dependencies are met for a process step
   */
  private checkDependencies(orderId: string, processStep: ProcessStep, existingTasks: ScheduledTask[]) {
    // For filling room steps, check if preparation steps are complete
    if (processStep.productionAreaId?.includes('filling')) {
      const orderPreparationTasks = existingTasks.filter(task => 
        task.orderId === orderId && 
        task.productionAreaId?.includes('prep')
      );

      if (orderPreparationTasks.length === 0) {
        return {
          met: false,
          reason: 'Preparation steps must be completed before filling'
        };
      }
    }

    return { met: true, reason: '' };
  }

  /**
   * Validate the complete schedule for conflicts and constraints
   */
  private validateSchedule(tasks: ScheduledTask[], employees: Employee[]) {
    const issues: string[] = [];
    
    // Group tasks by employee
    const employeeTasks = new Map<string, ScheduledTask[]>();
    tasks.forEach(task => {
      if (!employeeTasks.has(task.employeeId)) {
        employeeTasks.set(task.employeeId, []);
      }
      employeeTasks.get(task.employeeId)!.push(task);
    });

    // Check each employee's schedule
    employeeTasks.forEach((empTasks, employeeId) => {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;

      // Sort tasks by start time
      const sortedTasks = empTasks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      // Check for overlaps
      for (let i = 1; i < sortedTasks.length; i++) {
        if (sortedTasks[i].startTime < sortedTasks[i - 1].endTime) {
          issues.push(`${employee.name} has overlapping assignments`);
        }
      }

      // Check total working hours
      const totalHours = empTasks.reduce((sum, task) => 
        sum + (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60 * 60), 0
      );

      if (totalHours > employee.workingTimeModel.maxHours) {
        issues.push(
          `${employee.name} exceeds maximum working hours: ${totalHours.toFixed(1)}h > ${employee.workingTimeModel.maxHours}h`
        );
      }
    });

    return { issues };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(tasks: ScheduledTask[], employees: Employee[], totalOrders: number): string[] {
    const recommendations: string[] = [];
    
    // Calculate utilization
    const assignedEmployees = new Set(tasks.map(t => t.employeeId)).size;
    const availableEmployees = employees.filter(e => e.isAvailable).length;
    const utilization = (assignedEmployees / availableEmployees) * 100;

    if (utilization < 70) {
      recommendations.push(`Low employee utilization (${utilization.toFixed(1)}%). Consider optimizing task assignments.`);
    }

    if (utilization > 95) {
      recommendations.push(`High employee utilization (${utilization.toFixed(1)}%). Consider adding staff or extending hours.`);
    }

    // Check for skill gaps
    const requiredSkills = new Set<string>();
    this.processSteps.forEach(step => {
      step.requiredSkills.forEach(skill => requiredSkills.add(skill));
    });

    const availableSkills = new Set<string>();
    employees.filter(e => e.isAvailable).forEach(emp => {
      emp.skills.forEach(skill => availableSkills.add(skill));
    });

    requiredSkills.forEach(skill => {
      if (!availableSkills.has(skill)) {
        recommendations.push(`Skill gap identified: No available employees with "${skill}" skill.`);
      }
    });

    // Time efficiency recommendations
    if (tasks.length > 0) {
      const avgTaskDuration = tasks.reduce((sum, task) => sum + task.estimatedDuration, 0) / tasks.length;
      if (avgTaskDuration > 240) { // 4 hours
        recommendations.push('Consider breaking down long tasks into smaller segments for better flexibility.');
      }
    }

    return recommendations;
  }

  /**
   * Save scheduled tasks as shift assignments
   */
  private async saveShiftAssignments(tasks: ScheduledTask[]) {
    // Clear existing assignments for the date
    const existingAssignments = await this.storage.getShiftAssignments(tasks[0]?.startTime || new Date());
    
    // Create new assignments
    for (const task of tasks) {
      await this.storage.createShiftAssignment({
        employeeId: task.employeeId,
        orderProcessStepId: task.orderProcessStepId,
        startTime: task.startTime,
        endTime: task.endTime,
        status: 'scheduled',
        actualStartTime: null,
        actualEndTime: null,
      });
    }
  }

  // Helper methods
  private createDateTime(baseDate: Date, hours: number, minutes: number): Date {
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private parseTimeString(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  }
}