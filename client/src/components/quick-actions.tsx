import { Plus, Users, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsProps {
  onAddOrder: () => void;
}

export default function QuickActions({ onAddOrder }: QuickActionsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateSchedule = useMutation({
    mutationFn: async () => {
      const date = new Date().toISOString();
      return apiRequest('POST', '/api/schedule/generate', { date });
    },
    onSuccess: (data: any) => {
      // Refresh all relevant data
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders/details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shift-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees/utilization'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      
      toast({
        title: data.feasible ? "Schedule Generated Successfully" : "Schedule Generated with Issues",
        description: `${data.tasksScheduled || 0} tasks scheduled. ${data.issues || 0} issues, ${data.recommendations || 0} recommendations.`,
        variant: data.feasible ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to generate production schedule. Please check your production orders.",
        variant: "destructive",
      });
    },
  });

  const quickActions = [
    {
      label: "Add Production Order",
      icon: Plus,
      onClick: onAddOrder,
      variant: "default" as const,
      className: "bg-primary-600 hover:bg-primary-700 text-white",
    },
    {
      label: "Manage Employees",
      icon: Users,
      onClick: () => {
        toast({
          title: "Coming Soon",
          description: "Employee management feature is under development",
        });
      },
      variant: "outline" as const,
    },
    {
      label: "Generate Report",
      icon: BarChart3,
      onClick: () => {
        toast({
          title: "Coming Soon", 
          description: "Report generation feature is under development",
        });
      },
      variant: "outline" as const,
    },
    {
      label: "AI Optimize",
      icon: Sparkles,
      onClick: () => generateSchedule.mutate(),
      variant: "outline" as const,
      loading: generateSchedule.isPending,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
      </div>
      <div className="p-6 space-y-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant}
              className={`w-full justify-center ${action.className || ''}`}
              onClick={action.onClick}
              disabled={action.loading}
            >
              <Icon className="mr-2 h-4 w-4" />
              {action.loading ? 'Processing...' : action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
