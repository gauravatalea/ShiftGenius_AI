import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type EmployeeWithUtilization } from "@shared/schema";

export default function EmployeeUtilization() {
  const { data: employees, isLoading } = useQuery<EmployeeWithUtilization[]>({
    queryKey: ['/api/employees/utilization'],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Employee Utilization</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-8"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success-600';
    if (percentage >= 70) return 'text-warning-600';
    return 'text-gray-400';
  };

  const getAreaName = (employee: EmployeeWithUtilization) => {
    if (!employee.isAvailable) return 'Unavailable';
    if (employee.currentAssignment) {
      if (employee.currentAssignment.toLowerCase().includes('prep') || 
          employee.currentAssignment.toLowerCase().includes('peeling') ||
          employee.currentAssignment.toLowerCase().includes('cutting') ||
          employee.currentAssignment.toLowerCase().includes('washing')) {
        return 'Preparation';
      }
      if (employee.currentAssignment.toLowerCase().includes('package') ||
          employee.currentAssignment.toLowerCase().includes('filling')) {
        return 'Filling';
      }
    }
    return 'Available';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Employee Utilization</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {!employees || employees.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No employee data available
            </div>
          ) : (
            employees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    employee.isAvailable ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <span className={`text-xs font-medium ${
                      employee.isAvailable ? 'text-primary-700' : 'text-gray-500'
                    }`}>
                      {getInitials(employee.name)}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      employee.isAvailable ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {employee.name}
                    </p>
                    <p className={`text-xs ${
                      employee.isAvailable ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {getAreaName(employee)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    employee.isAvailable ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {employee.isAvailable ? `${employee.totalHours}hrs` : '0hrs'}
                  </p>
                  <p className={`text-xs ${
                    employee.isAvailable 
                      ? getUtilizationColor(employee.utilizationPercentage)
                      : 'text-gray-400'
                  }`}>
                    {employee.isAvailable ? `${employee.utilizationPercentage}%` : '-'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <Button
          variant="ghost"
          className="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View All Employees <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
