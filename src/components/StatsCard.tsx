import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  colorClass?: string;
}

const StatsCard = ({ title, value, icon: Icon, description, colorClass = "text-primary" }: StatsCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-elevated transition-smooth animate-scale-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className={`text-3xl font-bold ${colorClass}`}>{value}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-${colorClass.split('-')[1]}/10`}>
            <Icon className={`w-6 h-6 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
