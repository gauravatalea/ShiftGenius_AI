import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { type ProductionAlert } from "@shared/schema";

export default function ProductionAlerts() {
  const queryClient = useQueryClient();
  
  const { data: alerts, isLoading } = useQuery<ProductionAlert[]>({
    queryKey: ['/api/alerts'],
  });

  const dismissAlert = useMutation({
    mutationFn: async (alertId: string) => {
      return apiRequest('PATCH', `/api/alerts/${alertId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Production Alerts</h3>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-l-4 border-gray-200 bg-gray-50 p-4 rounded animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      case 'success':
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          border: 'border-warning-500',
          bg: 'bg-warning-50',
          icon: 'text-warning-600',
          title: 'text-warning-800',
          message: 'text-warning-700',
        };
      case 'info':
        return {
          border: 'border-primary-500',
          bg: 'bg-primary-50',
          icon: 'text-primary-600',
          title: 'text-primary-800',
          message: 'text-primary-700',
        };
      case 'success':
        return {
          border: 'border-success-500',
          bg: 'bg-success-50',
          icon: 'text-success-600',
          title: 'text-success-800',
          message: 'text-success-700',
        };
      default:
        return {
          border: 'border-gray-500',
          bg: 'bg-gray-50',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          message: 'text-gray-700',
        };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Production Alerts</h3>
      </div>
      <div className="p-6 space-y-4">
        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No active alerts
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const colors = getAlertColors(alert.type);
            
            return (
              <div key={alert.id} className={`border-l-4 ${colors.border} ${colors.bg} p-4 rounded relative`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => dismissAlert.mutate(alert.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="flex items-start pr-8">
                  <Icon className={`${colors.icon} mt-1 mr-3 h-4 w-4`} />
                  <div>
                    <h4 className={`text-sm font-medium ${colors.title}`}>{alert.title}</h4>
                    <p className={`text-sm ${colors.message} mt-1`}>{alert.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
