"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Eye, AlertTriangle, Trophy, Target, Calendar } from "lucide-react";

interface TestResult {
  score: number;
  total_questions: number;
  passing_score: number;
  passed: boolean;
  time_taken_seconds: number;
  tab_switches: number;
  status: string;
  submitted_at: string;
}

interface TestResultsProps {
  result: TestResult;
  onContinue: () => void;
}

export default function TestResults({ result, onContinue }: TestResultsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusInfo = () => {
    switch (result.status) {
      case 'submitted':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          title: "Test Completed Successfully",
          description: "You have successfully submitted your screening test.",
          color: "text-green-600"
        };
      case 'auto_submitted':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-orange-600" />,
          title: "Test Auto-Submitted",
          description: "Your test was automatically submitted due to tab switching violations.",
          color: "text-orange-600"
        };
      case 'timeout':
        return {
          icon: <Clock className="w-8 h-8 text-red-600" />,
          title: "Test Timed Out",
          description: "Your test was automatically submitted when the time limit was reached.",
          color: "text-red-600"
        };
      default:
        return {
          icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
          title: "Test Submitted",
          description: "Your test has been submitted for review.",
          color: "text-blue-600"
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          {statusInfo.icon}
          <h1 className={`text-2xl font-bold mt-4 ${statusInfo.color}`}>
            {statusInfo.title}
          </h1>
          <p className="text-gray-600 mt-2">{statusInfo.description}</p>
        </div>

        {/* Score Card */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {result.passed ? (
                <>
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <span className="text-green-600">Congratulations! You Passed</span>
                </>
              ) : (
                <>
                  <Target className="w-6 h-6 text-red-600" />
                  <span className="text-red-600">Test Not Passed</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold mb-2 ${
                result.passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.score}%
              </div>
              <p className="text-gray-600">
                Your Score (Passing: {result.passing_score}%)
              </p>
            </div>

            {/* Score breakdown */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className={`h-4 rounded-full transition-all duration-500 ${
                  result.passed ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(result.score, 100)}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-semibold text-blue-600">{result.total_questions}</div>
                <div className="text-sm text-blue-700">Total Questions</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-semibold text-purple-600">{result.passing_score}%</div>
                <div className="text-sm text-purple-700">Passing Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-semibold text-green-600">
                  {Math.round((result.score / 100) * result.total_questions)}
                </div>
                <div className="text-sm text-green-700">Correct Answers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Test Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-semibold">{formatTime(result.time_taken_seconds)}</div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-semibold">
                    {new Date(result.submitted_at).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Submitted At</div>
                </div>
              </div>

              {result.tab_switches > 0 && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-semibold text-orange-600">{result.tab_switches}</div>
                    <div className="text-sm text-orange-700">Tab Switches</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold capitalize">{result.status.replace('_', ' ')}</div>
                  <div className="text-sm text-blue-700">Submission Status</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            {result.passed ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Screening Test Passed</p>
                    <p className="text-sm text-green-700">
                      You have successfully passed the screening test. You can now proceed to the next stage of the event workflow.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full mt-0.5"></div>
                  <div>
                    <p className="font-medium text-blue-800">Project Submission</p>
                    <p className="text-sm text-blue-700">
                      The next step is to submit your project details including GitHub repository, deployment link, and presentation materials.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Screening Test Not Passed</p>
                    <p className="text-sm text-red-700">
                      Unfortunately, you did not achieve the minimum passing score of {result.passing_score}%. 
                      Your score was {result.score}%.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-gray-400 rounded-full mt-0.5"></div>
                  <div>
                    <p className="font-medium text-gray-800">Contact Event Organizers</p>
                    <p className="text-sm text-gray-700">
                      If you believe there was an error or have questions about your results, please contact the event organizers.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="text-center">
          <Button 
            onClick={onContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
          >
            Continue to Event Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}
