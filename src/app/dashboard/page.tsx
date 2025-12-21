import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, TrendingUp, Target, Activity, UserPlus } from 'lucide-react';
import OverviewPage from './overview/page';

export default function DashboardPage() {
  return <OverviewPage />;
}
