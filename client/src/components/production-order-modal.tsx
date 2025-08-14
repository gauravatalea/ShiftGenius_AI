import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type ProcessStep } from "@shared/schema";

interface ProductionOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductionOrderModal({ isOpen, onClose }: ProductionOrderModalProps) {
  const [formData, setFormData] = useState({
    productName: '',
    totalQuantity: '',
    priority: 'medium',
    scheduledDate: new Date().toISOString().split('T')[0],
    selectedProcessSteps: [] as string[],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: processSteps } = useQuery<ProcessStep[]>({
    queryKey: ['/api/process-steps'],
    enabled: isOpen,
  });

  const createOrder = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest('POST', '/api/production-orders', orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders/details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success",
        description: "Production order created successfully",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create production order",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      productName: '',
      totalQuantity: '',
      priority: 'medium',
      scheduledDate: new Date().toISOString().split('T')[0],
      selectedProcessSteps: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName || !formData.totalQuantity || formData.selectedProcessSteps.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select at least one process step",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      productName: formData.productName,
      totalQuantity: parseInt(formData.totalQuantity),
      priority: formData.priority,
      scheduledDate: formData.scheduledDate,
      status: 'pending',
      processSteps: formData.selectedProcessSteps.map((stepId, index) => ({
        processStepId: stepId,
        sequence: index + 1,
      })),
    };

    createOrder.mutate(orderData);
  };

  const handleProcessStepToggle = (stepId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedProcessSteps: checked
        ? [...prev.selectedProcessSteps, stepId]
        : prev.selectedProcessSteps.filter(id => id !== stepId),
    }));
  };

  const getEstimatedDuration = (stepId: string) => {
    const step = processSteps?.find((s) => s.id === stepId);
    if (!step || !formData.totalQuantity) return '0 hrs';
    
    const totalMinutes = step.timePerKg * parseInt(formData.totalQuantity || '0');
    const hours = (totalMinutes / 60).toFixed(1);
    return `${hours} hrs`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Production Order</DialogTitle>
          <DialogDescription>
            Create a new production order with required process steps and scheduling details.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="totalQuantity">Quantity (kg) *</Label>
              <Input
                id="totalQuantity"
                type="number"
                value={formData.totalQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, totalQuantity: e.target.value }))}
                placeholder="250"
                min="1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="scheduledDate">Scheduled Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div>
            <Label>Process Steps *</Label>
            <div className="space-y-3 mt-2">
              {processSteps?.map((step) => (
                <div key={step.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <Checkbox
                    id={step.id}
                    checked={formData.selectedProcessSteps.includes(step.id)}
                    onCheckedChange={(checked) => handleProcessStepToggle(step.id, checked as boolean)}
                  />
                  <label htmlFor={step.id} className="flex-1 text-sm text-gray-900 cursor-pointer">
                    {step.name}
                  </label>
                  <span className="text-sm text-gray-500">
                    {getEstimatedDuration(step.id)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createOrder.isPending}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {createOrder.isPending ? 'Creating...' : 'Add Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
