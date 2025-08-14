import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Users, Clock, TrendingUp } from "lucide-react";
import { type DashboardStats } from "@shared/schema";

export default function ProductionOverview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const overviewCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ClipboardList,
      bgColor: "bg-primary-100",
      iconColor: "text-primary-600",
    },
    {
      title: "Assigned Staff",
      value: stats?.assignedStaff || "0/0",
      icon: Users,
      bgColor: "bg-success-100",
      iconColor: "text-success-600",
    },
    {
      title: "Production Hours",
      value: stats?.productionHours || "0hrs",
      icon: Clock,
      bgColor: "bg-warning-100",
      iconColor: "text-warning-600",
    },
    {
      title: "Efficiency",
      value: `${stats?.efficiency || 0}%`,
      icon: TrendingUp,
      bgColor: "bg-success-100",
      iconColor: "text-success-600",
      valueColor: "text-success-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      {overviewCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-2xl font-bold ${card.valueColor || 'text-gray-900'}`}>
                  {card.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`${card.iconColor} text-xl`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
