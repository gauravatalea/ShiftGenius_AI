import { useQuery } from "@tanstack/react-query";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ProductionOrderWithDetails } from "@shared/schema";

interface ProductionAreaCardProps {
  title: string;
  type: "preparation" | "filling";
  startTime?: string;
  endTime?: string;
}

export default function ProductionAreaCard({ title, type, startTime, endTime }: ProductionAreaCardProps) {
  const { data: orders, isLoading } = useQuery<ProductionOrderWithDetails[]>({
    queryKey: ['/api/production-orders/details'],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter orders based on production area type
  const relevantOrders = orders?.filter(order => {
    return order.processSteps.some(step => {
      const areaType = step.processStep.productionAreaId?.includes('prep') ? 'preparation' : 'filling';
      return areaType === type;
    });
  }) || [];

  // Get tasks for this area
  const tasks = relevantOrders.flatMap(order => 
    order.processSteps
      .filter(step => {
        const areaType = step.processStep.productionAreaId?.includes('prep') ? 'preparation' : 'filling';
        return areaType === type;
      })
      .map(step => ({
        id: step.id,
        title: `${step.processStep.name} - ${order.productName}`,
        quantity: `${order.totalQuantity}kg`,
        startTime: step.assignments[0]?.startTime || new Date(),
        endTime: step.assignments[0]?.endTime || new Date(),
        employees: step.assignments.map(a => a.employee.name).join(', ') || 'Unassigned',
        status: step.status,
        progress: step.status === 'completed' ? 100 : step.status === 'in_progress' ? 75 : 0,
      }))
  );

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-success-500';
    if (progress >= 33) return 'bg-warning-500';
    return 'bg-gray-300';
  };

  const getStatusText = (progress: number) => {
    if (progress >= 75) return `${progress}%`;
    if (progress >= 33) return `${progress}%`;
    return 'Pending';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {startTime && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
              <Clock className="mr-1 h-3 w-3" />
              Start: {startTime}
            </span>
          )}
          {endTime && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700">
              <Clock className="mr-1 h-3 w-3" />
              Must end: {endTime}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks scheduled for this area
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  <span className="text-sm text-gray-500">{task.quantity}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>
                    <Clock className="inline mr-1 h-3 w-3" />
                    {new Date(task.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(task.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>
                    <User className="inline mr-1 h-3 w-3" />
                    {task.employees}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn("h-2 rounded-full transition-all duration-300", getProgressColor(task.progress))}
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 min-w-max">
                      {getStatusText(task.progress)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
