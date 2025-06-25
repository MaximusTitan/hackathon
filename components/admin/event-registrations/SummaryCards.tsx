"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, FileText, Send, Trophy, Medal } from "lucide-react";

interface EventRegistration {
  id: string;
  attended?: boolean;
  screening_status?: 'pending' | 'sent' | 'completed' | 'skipped';
  presentation_status?: 'pending' | 'submitted' | 'reviewed';
  qualification_status?: 'pending' | 'qualified' | 'rejected' | null;
  award_type?: 'winner' | 'runner_up' | null;
}

interface SummaryCardsProps {
  registrations: EventRegistration[];
}

export function SummaryCards({ registrations }: SummaryCardsProps) {
  const attendedCount = registrations.filter(r => r.attended).length;
  const screeningCompletedCount = registrations.filter(r => 
    r.screening_status === 'completed' || r.screening_status === 'skipped'
  ).length;
  const projectsSubmittedCount = registrations.filter(r => 
    r.presentation_status === 'submitted' || r.presentation_status === 'reviewed'
  ).length;
  const qualifiedCount = registrations.filter(r => r.qualification_status === 'qualified').length;
  const winnersCount = registrations.filter(r => r.award_type === 'winner').length;
  const runnersUpCount = registrations.filter(r => r.award_type === 'runner_up').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{registrations.length}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Attended</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{attendedCount}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Screening Completed</CardTitle>
          <FileText className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{screeningCompletedCount}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projects Submitted</CardTitle>
          <Send className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{projectsSubmittedCount}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Qualified</CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{qualifiedCount}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Winners</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{winnersCount}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Runners-up</CardTitle>
          <Medal className="h-4 w-4 text-silver-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-silver-600">{runnersUpCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
