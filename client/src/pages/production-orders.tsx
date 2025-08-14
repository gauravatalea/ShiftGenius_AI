import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Package, Clock, User, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type ProductionOrderWithDetails } from "@shared/schema";
import ProductionOrderModal from "@/components/production-order-modal";

export default function ProductionOrders() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<ProductionOrderWithDetails[]>({
    queryKey: ['/api/production-orders/details', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/production-orders/details?date=${selectedDate}`);
      return response.json();
    },
  });

  const generateSchedule = useMutation({
    mutationFn: async () => {
      const date = new Date(selectedDate).toISOString();
      return apiRequest('POST', '/api/schedule/generate', { date });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders/details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: data.feasible ? "Schedule Generated Successfully" : "Schedule Generated with Issues",
        description: `${data.tasksScheduled} tasks scheduled. ${data.issues} issues, ${data.recommendations} recommendations.`,
        variant: data.feasible ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to generate production schedule",
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProcessProgress = (processSteps: any[]) => {
    if (!processSteps.length) return 0;
    const completedSteps = processSteps.filter(step => step.status === 'completed').length;
    return (completedSteps / processSteps.length) * 100;
  };

  const getTotalDuration = (processSteps: any[]) => {
    return processSteps.reduce((total, step) => total + step.estimatedDuration, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Production Management</h1>
            <p className="text-gray-600">Plan and schedule your daily production requirements</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button
              onClick={() => generateSchedule.mutate()}
              disabled={generateSchedule.isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {generateSchedule.isPending ? 'Scheduling...' : 'Generate Schedule'}
            </Button>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Order
            </Button>
          </div>
        </div>

        {/* Production Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-warning-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders?.reduce((sum, order) => sum + order.totalQuantity, 0) || 0}kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders?.filter(order => order.status === 'completed').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders?.filter(order => order.priority === 'high').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production Orders List */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Orders ({orders?.length || 0})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({orders?.filter(order => order.status === 'pending').length || 0})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({orders?.filter(order => order.status === 'in_progress').length || 0})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({orders?.filter(order => order.status === 'completed').length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {!orders || orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Production Orders</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first production order.</p>
                <Button onClick={() => setIsModalOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Order
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                          {order.productName}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-semibold">{order.totalQuantity}kg</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Process Steps:</span>
                        <span className="font-semibold">{order.processSteps.length} steps</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Estimated Time:</span>
                        <span className="font-semibold">{(getTotalDuration(order.processSteps) / 60).toFixed(1)}h</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress:</span>
                          <span className="font-semibold">{getProcessProgress(order.processSteps).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${getProcessProgress(order.processSteps)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs text-gray-500 mb-2">Process Steps:</p>
                        <div className="space-y-1">
                          {order.processSteps.slice(0, 3).map((step, index) => (
                            <div key={step.id} className="flex items-center justify-between text-xs">
                              <span className="truncate text-gray-600">{step.processStep.name}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getStatusColor(step.status)}`}
                              >
                                {step.status}
                              </Badge>
                            </div>
                          ))}
                          {order.processSteps.length > 3 && (
                            <p className="text-xs text-gray-400">+{order.processSteps.length - 3} more steps</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Other tab contents with filtered orders */}
          {['pending', 'in_progress', 'completed'].map((status) => (
            <TabsContent key={status} value={status}>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {orders?.filter(order => order.status === status).map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                          {order.productName}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-semibold">{order.totalQuantity}kg</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Process Steps:</span>
                        <span className="font-semibold">{order.processSteps.length} steps</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress:</span>
                          <span className="font-semibold">{getProcessProgress(order.processSteps).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${getProcessProgress(order.processSteps)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Production Order Modal */}
      <ProductionOrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}