import { useState } from "react";
import { Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductionOverview from "@/components/production-overview";
import ProductionAreaCard from "@/components/production-area-card";
import ProductionAlerts from "@/components/production-alerts";
import EmployeeUtilization from "@/components/employee-utilization";
import QuickActions from "@/components/quick-actions";
import ScheduleTimeline from "@/components/schedule-timeline";
import ProductionOrderModal from "@/components/production-order-modal";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleExportPlan = async () => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/export/shift-plan?date=${date}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shift-plan-${date}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export shift plan:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Production Overview */}
        <ProductionOverview />

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Production Areas Schedule */}
          <div className="xl:col-span-2 space-y-6">
            <ProductionAreaCard 
              title="Preparation Rooms"
              type="preparation"
              startTime="06:00"
            />
            <ProductionAreaCard 
              title="Filling Room"
              type="filling"
              endTime="17:00"
            />
            <ScheduleTimeline />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ProductionAlerts />
            <EmployeeUtilization />
            <QuickActions onAddOrder={() => setIsModalOpen(true)} />
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600 mt-1">Common daily operations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleExportPlan}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Plan
              </Button>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                <User className="mr-2 h-4 w-4" />
                Add Order
              </Button>
            </div>
          </div>
        </div>

      {/* Production Order Modal */}
      <ProductionOrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
