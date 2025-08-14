import { Employee, ProductionOrder, ProcessStep, OrderProcessStep } from "@shared/schema";

interface SchedulingContext {
  employees: Employee[];
  orders: ProductionOrder[];
  processSteps: ProcessStep[];
  date: Date;
}

interface ScheduledTask {
  orderId: string;
  processStepId: string;
  employeeId: string;
  startTime: Date;
  endTime: Date;
  estimatedDuration: number;
}

export class ProductionScheduler {
  private context: SchedulingContext;

  constructor(context: SchedulingContext) {
    this.context = context;
  }

  /**
   * Generate optimal schedule for production orders
   */
  generateSchedule(): ScheduledTask[] {
    const tasks: ScheduledTask[] = [];
    
    // Sort orders by priority and quantity (ascending)
    const sortedOrders = this.sortOrdersByPriority();
    
    // Schedule preparation room tasks starting at 06:00
    const preparationTasks = this.schedulePreparationTasks(sortedOrders);
    tasks.push(...preparationTasks);
    
    // Schedule filling room tasks backwards from 17:00
    const fillingTasks = this.scheduleFillingTasks(sortedOrders);
    tasks.push(...fillingTasks);
    
    return tasks;
  }

  private sortOrdersByPriority(): ProductionOrder[] {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    
    return [...this.context.orders].sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityWeight[b.priority as keyof typeof priorityWeight] - 
                          priorityWeight[a.priority as keyof typeof priorityWeight];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by quantity ascending (smaller first)
      return a.totalQuantity - b.totalQuantity;
    });
  }

  private schedulePreparationTasks(orders: ProductionOrder[]): ScheduledTask[] {
    const tasks: ScheduledTask[] = [];
    let currentTime = this.createDateTime(6, 0); // 06:00
    
    for (const order of orders) {
      const prepSteps = this.getPreparationSteps(order);
      
      for (const step of prepSteps) {
        const availableEmployees = this.findAvailableEmployees(step, currentTime);
        if (availableEmployees.length >= step.requiredEmployees) {
          const duration = step.timePerKg * order.totalQuantity;
          const endTime = new Date(currentTime.getTime() + duration * 60000);
          
          // Assign employees
          for (let i = 0; i < step.requiredEmployees; i++) {
            tasks.push({
              orderId: order.id,
              processStepId: step.id,
              employeeId: availableEmployees[i].id,
              startTime: new Date(currentTime),
              endTime: new Date(endTime),
              estimatedDuration: duration,
            });
          }
          
          currentTime = endTime;
        }
      }
    }
    
    return tasks;
  }

  private scheduleFillingTasks(orders: ProductionOrder[]): ScheduledTask[] {
    const tasks: ScheduledTask[] = [];
    let currentTime = this.createDateTime(17, 0); // 17:00 - work backwards
    
    // Reverse order for backward scheduling
    const reversedOrders = [...orders].reverse();
    
    for (const order of reversedOrders) {
      const fillingSteps = this.getFillingSteps(order).reverse();
      
      for (const step of fillingSteps) {
        const duration = step.timePerKg * order.totalQuantity;
        const startTime = new Date(currentTime.getTime() - duration * 60000);
        
        const availableEmployees = this.findAvailableEmployees(step, startTime);
        if (availableEmployees.length >= step.requiredEmployees) {
          // Assign employees
          for (let i = 0; i < step.requiredEmployees; i++) {
            tasks.push({
              orderId: order.id,
              processStepId: step.id,
              employeeId: availableEmployees[i].id,
              startTime: new Date(startTime),
              endTime: new Date(currentTime),
              estimatedDuration: duration,
            });
          }
          
          currentTime = startTime;
        }
      }
    }
    
    return tasks;
  }

  private getPreparationSteps(order: ProductionOrder): ProcessStep[] {
    return this.context.processSteps.filter(step => 
      step.productionAreaId?.includes('prep')
    );
  }

  private getFillingSteps(order: ProductionOrder): ProcessStep[] {
    return this.context.processSteps.filter(step => 
      step.productionAreaId?.includes('filling')
    );
  }

  private findAvailableEmployees(step: ProcessStep, time: Date): Employee[] {
    return this.context.employees.filter(employee => {
      // Check if employee is available
      if (!employee.isAvailable) return false;
      
      // Check if employee has required skills
      const hasSkills = step.requiredSkills.every(skill => 
        employee.skills.includes(skill)
      );
      if (!hasSkills) return false;
      
      // Check working time model
      const workingHours = this.parseTime(employee.workingTimeModel.startTime);
      const endHours = this.parseTime(employee.workingTimeModel.endTime);
      const taskHours = time.getHours() + time.getMinutes() / 60;
      
      return taskHours >= workingHours && taskHours <= endHours;
    });
  }

  private createDateTime(hours: number, minutes: number): Date {
    const date = new Date(this.context.date);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
  }

  /**
   * Validate if the schedule is feasible
   */
  validateSchedule(tasks: ScheduledTask[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for employee conflicts
    const employeeSchedules = new Map<string, ScheduledTask[]>();
    
    for (const task of tasks) {
      if (!employeeSchedules.has(task.employeeId)) {
        employeeSchedules.set(task.employeeId, []);
      }
      employeeSchedules.get(task.employeeId)!.push(task);
    }
    
    // Check for overlapping assignments
    for (const [employeeId, employeeTasks] of employeeSchedules) {
      const sortedTasks = employeeTasks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
      for (let i = 1; i < sortedTasks.length; i++) {
        if (sortedTasks[i].startTime < sortedTasks[i - 1].endTime) {
          issues.push(`Employee ${employeeId} has overlapping assignments`);
        }
      }
      
      // Check total working hours
      const totalHours = employeeTasks.reduce((sum, task) => 
        sum + (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60 * 60), 0
      );
      
      const employee = this.context.employees.find(emp => emp.id === employeeId);
      if (employee && totalHours > employee.workingTimeModel.maxHours) {
        issues.push(`Employee ${employee.name} exceeds maximum working hours (${totalHours.toFixed(1)}h > ${employee.workingTimeModel.maxHours}h)`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

/**
 * Calculate employee utilization metrics
 */
export function calculateEmployeeUtilization(
  employee: Employee,
  tasks: ScheduledTask[]
): { totalHours: number; utilizationPercentage: number } {
  const employeeTasks = tasks.filter(task => task.employeeId === employee.id);
  
  const totalMinutes = employeeTasks.reduce((sum, task) => 
    sum + (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60), 0
  );
  
  const totalHours = totalMinutes / 60;
  const maxHours = employee.workingTimeModel.maxHours;
  const utilizationPercentage = Math.min((totalHours / maxHours) * 100, 100);
  
  return {
    totalHours: Math.round(totalHours * 10) / 10,
    utilizationPercentage: Math.round(utilizationPercentage),
  };
}

/**
 * Identify production bottlenecks and dependencies
 */
export function analyzeProductionFlow(tasks: ScheduledTask[]): {
  bottlenecks: string[];
  dependencies: Array<{ from: string; to: string; delay: number }>;
} {
  const bottlenecks: string[] = [];
  const dependencies: Array<{ from: string; to: string; delay: number }> = [];
  
  // Group tasks by order
  const orderTasks = new Map<string, ScheduledTask[]>();
  
  for (const task of tasks) {
    if (!orderTasks.has(task.orderId)) {
      orderTasks.set(task.orderId, []);
    }
    orderTasks.get(task.orderId)!.push(task);
  }
  
  // Analyze each order's flow
  for (const [orderId, orderTaskList] of orderTasks) {
    const sortedTasks = orderTaskList.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    for (let i = 1; i < sortedTasks.length; i++) {
      const prevTask = sortedTasks[i - 1];
      const currentTask = sortedTasks[i];
      
      const delay = (currentTask.startTime.getTime() - prevTask.endTime.getTime()) / (1000 * 60);
      
      if (delay > 0) {
        dependencies.push({
          from: prevTask.processStepId,
          to: currentTask.processStepId,
          delay,
        });
        
        if (delay > 30) { // More than 30 minutes delay
          bottlenecks.push(`Delay between ${prevTask.processStepId} and ${currentTask.processStepId} in order ${orderId}`);
        }
      }
    }
  }
  
  return { bottlenecks, dependencies };
}
