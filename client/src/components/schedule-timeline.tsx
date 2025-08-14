import { useQuery } from "@tanstack/react-query";
import { Clock, User, Package, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ShiftAssignment, type EmployeeWithUtilization } from "@shared/schema";

interface ScheduleTimelineProps {
  date?: Date;
}

export default function ScheduleTimeline({ date = new Date() }: ScheduleTimelineProps) {
  const { data: assignments, isLoading } = useQuery<ShiftAssignment[]>({
    queryKey: ['/api/shift-assignments', date.toISOString().split('T')[0]],
    queryFn: async () => {
      const response = await fetch(`/api/shift-assignments?date=${date.toISOString().split('T')[0]}`);
      return response.json();
    },
  });

  const { data: employees } = useQuery<EmployeeWithUtilization[]>({
    queryKey: ['/api/employees'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Daily Schedule Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Daily Schedule Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Generated</h3>
            <p className="text-gray-600">Click "Generate Schedule" to create today's production plan.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group assignments by time blocks (hours)
  const timeBlocks = new Map<string, ShiftAssignment[]>();
  assignments.forEach(assignment => {
    const hour = new Date(assignment.startTime).getHours();
    const timeKey = `${hour.toString().padStart(2, '0')}:00`;
    if (!timeBlocks.has(timeKey)) {
      timeBlocks.set(timeKey, []);
    }
    timeBlocks.get(timeKey)!.push(assignment);
  });

  // Sort time blocks
  const sortedTimeBlocks = Array.from(timeBlocks.entries()).sort((a, b) => 
    parseInt(a[0].split(':')[0]) - parseInt(b[0].split(':')[0])
  );

  const getEmployeeName = (employeeId: string) => {
    return employees?.find(emp => emp.id === employeeId)?.name || 'Unknown Employee';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (dateTime: Date) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getDurationMinutes = (start: Date, end: Date) => {
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60));
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Daily Schedule Timeline
          </div>
          <Badge variant="secondary" className="text-xs">
            {assignments.length} assignments
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {sortedTimeBlocks.map(([timeKey, blockAssignments]) => (
          <div key={timeKey} className="border-l-4 border-primary-200 pl-4">
            <div className="flex items-center mb-3">
              <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm font-medium">
                {timeKey}
              </div>
              <div className="ml-2 text-xs text-gray-500">
                {blockAssignments.length} task{blockAssignments.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {blockAssignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {getEmployeeName(assignment.employeeId)}
                        </span>
                        <Badge className={`ml-2 text-xs ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {formatTime(assignment.startTime)} - {formatTime(assignment.endTime)}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          ({getDurationMinutes(assignment.startTime, assignment.endTime)}min)
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Package className="h-3 w-3 mr-1" />
                        <span className="truncate">
                          Task #{assignment.orderProcessStepId.slice(-8)}
                        </span>
                      </div>
                    </div>

                    {assignment.status === 'delayed' && (
                      <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {sortedTimeBlocks.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No assignments scheduled
          </div>
        )}
      </CardContent>
    </Card>
  );
}