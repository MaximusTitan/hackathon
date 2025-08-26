"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ExternalLink, CheckCircle, Clock, AlertCircle, Play, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import TestInstructionsModal from "@/components/TestInstructionsModal";
import MCQTestTaker from "@/components/MCQTestTaker";
import TestResults from "@/components/TestResults";
import { TestInstructions, MCQQuestion } from "@/types/screening";

type WorkflowData = {
  event: {
    id: string;
    title: string;
    project_instructions?: string | null;
    show_start_button?: boolean;
    event_category?: "hackathon" | "sales" | null;
  };
  registration: {
    id: string;
    attended: boolean;
    screening_status: 'pending' | 'sent' | 'completed' | 'skipped';
    presentation_status: 'pending' | 'submitted' | 'reviewed';
    github_link?: string | null;
    deployment_link?: string | null;
    presentation_link?: string | null;
    presentation_notes?: string | null;
    video_link?: string | null;
    sales_presentation_link?: string | null;
  };
  screening_test?: {
    id: string;
    mcq_link: string;
    instructions: string;
    deadline: string | null;
  } | null;
  test_result?: {
    score: number;
    total_questions: number;
    passing_score: number;
    passed: boolean;
    submitted_at: string;
  } | null;
};

export default function EventWorkflowPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId;  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [presentationForm, setPresentationForm] = useState({
    github_link: '',
    deployment_link: '',
    presentation_link: '',
    presentation_notes: '',
    video_link: '',
    sales_presentation_link: ''
  });
  
  // MCQ Test states
  const [showInstructions, setShowInstructions] = useState(false);
  const [takingTest, setTakingTest] = useState(false);
  const [testData, setTestData] = useState<{
    test: {
      id: string;
      instructions: string;
      timer_minutes: number;
      total_questions: number;
      passing_score: number;
      questions: MCQQuestion[];
    };
    registration_id: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestResults, setShowTestResults] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    async function fetchWorkflowData() {
      try {
        const res = await fetch(`/api/user/event-workflow/${eventId}`);
        const data = await res.json();
        
        if (res.ok) {
          setWorkflowData(data);
          if (data.registration) {
            setPresentationForm({
              github_link: data.registration.github_link || '',
              deployment_link: data.registration.deployment_link || '',
              presentation_link: data.registration.presentation_link || '',
              presentation_notes: data.registration.presentation_notes || '',
              video_link: data.registration.video_link || '',
              sales_presentation_link: data.registration.sales_presentation_link || ''
            });
          }
        } else {
          toast.error(data.error || "Failed to load workflow data");
        }
      } catch (error) {
        console.error("Error fetching workflow data:", error);
        toast.error("Error loading workflow data");
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchWorkflowData();
    }
  }, [eventId]);

  const handleScreeningComplete = async () => {
    try {
      const res = await fetch(`/api/user/complete-screening`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId })
      });

      if (res.ok) {
        toast.success('Screening test marked as completed');
        // Refresh workflow data
        const refreshRes = await fetch(`/api/user/event-workflow/${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setWorkflowData(refreshData);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to mark screening as complete');
      }
    } catch (error) {
      console.error('Error completing screening:', error);
      toast.error('Error completing screening');
    }
  };

  const handlePresentationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/user/submit-presentation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          event_category: workflowData?.event.event_category || 'hackathon',
          ...presentationForm
        })
      });

      if (res.ok) {
        toast.success('Submission completed successfully');
        // Refresh workflow data
        const refreshRes = await fetch(`/api/user/event-workflow/${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setWorkflowData(refreshData);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to submit presentation');
      }
    } catch (error) {
      console.error('Error submitting presentation:', error);
      toast.error('Error submitting presentation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTakeTest = async () => {
    try {
      const res = await fetch(`/api/user/get-screening-test?event_id=${eventId}`);
      const data = await res.json();
      
      if (res.ok) {
        setTestData(data);
        
        const instructions: TestInstructions = {
          title: "Screening Test Instructions",
          duration: data.test.timer_minutes,
          totalQuestions: data.test.total_questions,
          passingScore: data.test.passing_score,
          rules: [
            "You must complete the test within the allocated time limit",
            "Do not leave this browser tab or window during the test",
            "Switching tabs more than 3 times will result in automatic submission",
            "Each question must be answered before moving to the next",
            "You can navigate between questions using the navigation buttons",
            "Once submitted, you cannot retake the test",
            "Ensure you have a stable internet connection",
            "Do not refresh the page during the test"
          ]
        };
        
        setShowInstructions(true);
      } else {
        toast.error(data.error || "Failed to load test");
      }
    } catch (error) {
      console.error("Error loading test:", error);
      toast.error("Error loading test");
    }
  };

  const handleStartTest = async () => {
    if (!testData) return;
    
    try {
      const res = await fetch('/api/user/start-screening-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screening_test_id: testData.test.id,
          event_id: eventId
        })
      });

      if (res.ok) {
        setShowInstructions(false);
        setTakingTest(true);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to start test");
      }
    } catch (error) {
      console.error("Error starting test:", error);
      toast.error("Error starting test");
    }
  };

  const handleTestComplete = (result: any) => {
    setTakingTest(false);
    setTestResult(result);
    setShowTestResults(true);
    
    // Refresh workflow data
    const refreshWorkflow = async () => {
      try {
        const res = await fetch(`/api/user/event-workflow/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setWorkflowData(data);
        }
      } catch (error) {
        console.error("Error refreshing workflow:", error);
      }
    };
    
    refreshWorkflow();
  };

  const handleTestExit = () => {
    setTakingTest(false);
    setTestData(null);
    setShowInstructions(false);
  };
  const handleResultsContinue = () => {
    setShowTestResults(false);
    setTestResult(null);
  };
  // Helper function to determine if Step 2 (Presentation) should be shown
  const shouldShowStep2 = () => {
    if (!workflowData) return false;
    
    const { registration, test_result } = workflowData;
    
    // Hide Step 2 if no screening test is assigned (pending status with no test)
    if (registration.screening_status === 'pending') return false;
    
    // Show Step 2 if:
    // 1. Screening is skipped by admin
    if (registration.screening_status === 'skipped') return true;
    
    // 2. Screening is completed and user passed
    if (registration.screening_status === 'completed' && test_result?.passed) return true;
    
    // Hide Step 2 if user failed the test or test is only sent but not completed
    return false;
  };

  const getScreeningStatusMessage = () => {
    if (!workflowData) return '';
    
    const { registration, test_result } = workflowData;
    
    switch (registration.screening_status) {
      case 'pending':
        return 'Waiting for screening test assignment';
      case 'sent':
        return 'Screening test available - please complete it';      case 'completed':
        if (test_result) {
          // test_result.score is already a percentage
          const scorePercentage = Math.round(test_result.score);
          
          if (test_result.passed) {
            return `✅ Passed with ${scorePercentage}% (Required: ${test_result.passing_score}%)`;
          } else {
            return `❌ Failed with ${scorePercentage}% (Required: ${test_result.passing_score}%)`;
          }
        }
        return 'Completed';      case 'skipped':
  // Do not reveal that it was skipped; present as ready/complete
  return 'Ready to proceed to the next step';
      default:
        return String(registration.screening_status).charAt(0).toUpperCase() + String(registration.screening_status).slice(1);
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'submitted':
        // For completed screening, check if user passed
        if (status === 'completed' && workflowData?.test_result) {
          return workflowData.test_result.passed 
            ? <CheckCircle className="w-5 h-5 text-green-600" />
            : <AlertCircle className="w-5 h-5 text-red-600" />;
        }
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'skipped':
  // Treat as a success without calling out the skip
  return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'sent':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'reviewed':
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center py-12">Loading workflow...</div>
      </div>
    );
  }

  if (!workflowData) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-500">Workflow data not found or you haven't registered for this event.</p>
        <Button 
          onClick={() => router.back()}
          className="mt-4 bg-rose-600 hover:bg-rose-700 text-white"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const { event, registration, screening_test, test_result } = workflowData;

  // Check if user attended
  if (!registration.attended) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Button
          variant="ghost" 
          className="mb-6 text-rose-600 hover:text-rose-700"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Event Workflow: {event.title}</CardTitle>
            <CardDescription>Complete the post-event requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Attendance Required</h3>
              <p className="text-gray-600">
                You need to attend the event before accessing the workflow steps.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Button
        variant="ghost" 
        className="mb-6 text-rose-600 hover:text-rose-700"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Event Workflow: {event.title}</h1>
        <p className="text-gray-600">Complete the following steps as required</p>
      </div>

      <div className="space-y-6">
        {/* Step 1: Screening Test - hidden when skipped */}
        {registration.screening_status !== 'skipped' && (
        <Card>
          <CardHeader>              <div className="flex items-center gap-3">
                {getStatusIcon(registration.screening_status)}
                <div>
                  <CardTitle>
                    Step 1: Screening Test
                  </CardTitle>
                  <CardDescription>
                    {getScreeningStatusMessage()}
                  </CardDescription>
                </div>
              </div>
          </CardHeader>          <CardContent>
            {registration.screening_status === 'sent' && screening_test ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Instructions</h4>
                  <p className="text-blue-800">{screening_test.instructions}</p>
                  {screening_test.deadline && (
                    <p className="text-blue-700 mt-2">
                      <strong>Deadline:</strong> {new Date(screening_test.deadline).toLocaleString()}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  {/* Check if it's an integrated MCQ test or external link */}
                  {screening_test.mcq_link ? (
                    // External test link
                    <>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                        <a 
                          href={screening_test.mcq_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Take External Test
                        </a>
                      </Button>
                      <Button 
                        onClick={handleScreeningComplete}
                        variant="outline"
                      >
                        Mark as Completed
                      </Button>
                    </>
                  ) : (
                    // Integrated MCQ test
                    <Button 
                      onClick={handleTakeTest}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start MCQ Test
                    </Button>
                  )}
                </div>
              </div>            ) : registration.screening_status === 'completed' ? (
              <div className={`p-4 rounded-lg ${workflowData.test_result?.passed ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                {workflowData.test_result ? (
                  <div>
                    <p className="font-semibold">
                      {workflowData.test_result.passed ? '✅ Test Passed!' : '❌ Test Failed'}
                    </p>                    <p className="mt-2">
                      Score: {Math.round(workflowData.test_result.score)}% 
                      ({Math.round((workflowData.test_result.score * workflowData.test_result.total_questions) / 100)}/{workflowData.test_result.total_questions} correct)
                    </p>
                    <p>Required: {workflowData.test_result.passing_score}%</p>
                    <p className="text-sm mt-2">
                      Completed: {new Date(workflowData.test_result.submitted_at).toLocaleString()}
                    </p>
                    {workflowData.test_result.passed && (
                      <p className="mt-2 font-medium">🎉 You can now proceed to project submission!</p>
                    )}
                  </div>
                ) : (
                  <p>✅ Screening test completed successfully!</p>
                )}
              </div>
            ) : (
              <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                Waiting for admin to send the screening test.
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Project Instructions - Show after passing screening or if screening is skipped */}
        {shouldShowStep2() && event.project_instructions && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle>Project Instructions</CardTitle>
                  <CardDescription>
                    Guidelines for your project submission
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div 
                  className="prose max-w-none text-gray-900"
                  dangerouslySetInnerHTML={{ __html: event.project_instructions }}
                />
              </div>
            </CardContent>
          </Card>
        )}

  {/* Presentation Submission - Only show if user passed screening or it was skipped AND start button is enabled */}
  {(() => { 
    const baseTitle = event.event_category === "sales" ? "Sales Presentation Submission" : "Project Submission";
    const title = registration.screening_status === 'skipped' ? baseTitle : `Step 2: ${baseTitle}`;
    return (
  shouldShowStep2() && event.show_start_button && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getStatusIcon(registration.presentation_status)}
                <div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>
                    Status: {registration.presentation_status.charAt(0).toUpperCase() + registration.presentation_status.slice(1)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePresentationSubmit} className="space-y-4">
                {/* Conditional form fields based on event category */}
                {event.event_category === "sales" ? (
                  // Sales Event Form
                  <>
                    <div>
                      <Label htmlFor="video_link">Sales Pitch Video Link *</Label>
                      <Input
                        id="video_link"
                        type="url"
                        value={presentationForm.video_link}
                        onChange={(e) => setPresentationForm(prev => ({ ...prev, video_link: e.target.value }))}
                        placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/..."
                        required
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Upload your sales pitch video to YouTube, Google Drive, or any video platform and share the link
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="sales_presentation_link">Sales Presentation/Materials Link *</Label>
                      <Input
                        id="sales_presentation_link"
                        type="url"
                        value={presentationForm.sales_presentation_link}
                        onChange={(e) => setPresentationForm(prev => ({ ...prev, sales_presentation_link: e.target.value }))}
                        placeholder="https://docs.google.com/presentation/... or https://canva.com/..."
                        required
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Share your sales presentation, pitch deck, or supporting materials
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="presentation_notes">Additional Notes</Label>
                      <Textarea
                        id="presentation_notes"
                        value={presentationForm.presentation_notes}
                        onChange={(e) => setPresentationForm(prev => ({ ...prev, presentation_notes: e.target.value }))}
                        placeholder="Any additional information about your sales approach, target audience, strategy, etc..."
                        rows={4}
                      />
                    </div>
                  </>
                ) : (
                  // Hackathon Event Form (Default)
                  <>
                    <div>
                      <Label htmlFor="github_link">GitHub Repository Link *</Label>
                      <Input
                        id="github_link"
                        type="url"
                        value={presentationForm.github_link}
                        onChange={(e) => setPresentationForm(prev => ({ ...prev, github_link: e.target.value }))}
                        placeholder="https://github.com/username/repository"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="deployment_link">Deployed Application Link</Label>
                      <Input
                        id="deployment_link"
                        type="url"
                        value={presentationForm.deployment_link}
                        onChange={(e) => setPresentationForm(prev => ({ ...prev, deployment_link: e.target.value }))}
                        placeholder="https://your-app.vercel.app"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Optional: Share your live application if deployed
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="presentation_link">Documentation/Presentation Link</Label>
                      <Input
                        id="presentation_link"
                        type="url"
                        value={presentationForm.presentation_link}
                        onChange={(e) => setPresentationForm(prev => ({ ...prev, presentation_link: e.target.value }))}
                        placeholder="https://docs.google.com/presentation/... or https://canva.com/..."
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Optional: Share your project presentation or documentation
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="presentation_notes">Additional Notes</Label>
                      <Textarea
                        id="presentation_notes"
                        value={presentationForm.presentation_notes}
                        onChange={(e) => setPresentationForm(prev => ({ ...prev, presentation_notes: e.target.value }))}
                        placeholder="Any additional information about your project..."
                        rows={4}
                      />
                    </div>
                  </>
                )}

                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {submitting ? 'Submitting...' : registration.presentation_status === 'submitted' ? 'Update Submission' : 
                    event.event_category === "sales" ? 'Submit Sales Presentation' : 'Submit Project'}
                </Button>
              </form>
            </CardContent>
    </Card>
  ) ); })()}

  {/* Step 2 Disabled Message - Show when start button is disabled by admin */}
  {(() => { 
    const baseTitle = event.event_category === "sales" ? "Sales Presentation Submission" : "Project Submission";
    const title = registration.screening_status === 'skipped' ? baseTitle : `Step 2: ${baseTitle}`;
    return (
  shouldShowStep2() && !event.show_start_button && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>
                    Temporarily Disabled
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-orange-700 bg-orange-50 p-4 rounded-lg">
                <p className="font-semibold">
                  ⏸️ {event.event_category === "sales" ? "Sales Presentation Submission" : "Project Submission"} Disabled
                </p>
                <p className="mt-2">
                  {event.event_category === "sales" 
                    ? "Sales presentation submission has been temporarily disabled by the admin."
                    : "Project submission has been temporarily disabled by the admin."
                  } Please check back later or contact the admin for more information.
                </p>
              </div>
            </CardContent>
          </Card>
        ) ); })()}

  {/* Step 2 Blocked Message - Show when user failed the test */}
  {(() => { 
    const baseTitle = event.event_category === "sales" ? "Sales Presentation Submission" : "Project Submission";
    const title = registration.screening_status === 'skipped' ? baseTitle : `Step 2: ${baseTitle}`;
    return (
  !shouldShowStep2() && registration.screening_status === 'completed' && workflowData.test_result && !workflowData.test_result.passed && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>
                    Access Restricted
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-red-700 bg-red-50 p-4 rounded-lg">
                <p className="font-semibold">❌ Screening Test Required</p>
                <p className="mt-2">
                  You need to pass the screening test to access {event.event_category === "sales" ? "sales presentation submission" : "project submission"}. 
                  Your current score is below the required passing percentage.
                </p>
                {workflowData.test_result && (                  <p className="mt-2 text-sm">
                    Score: {Math.round(workflowData.test_result.score)}% 
                    (Required: {workflowData.test_result.passing_score}%)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) ); })()}

  {/* Step 2 Hidden Message - Show when no screening test is assigned */}
  {(() => { 
    const baseTitle = event.event_category === "sales" ? "Sales Presentation Submission" : "Project Submission";
    const title = registration.screening_status === 'skipped' ? baseTitle : `Step 2: ${baseTitle}`;
    return (
  !shouldShowStep2() && registration.screening_status === 'pending' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>
                    Waiting for Admin
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">
                  ⏳ {event.event_category === "sales" ? "Sales presentation submission" : "Project submission"} will be available after screening test assignment
                </p>
                <p className="mt-2">
                  The admin needs to assign and configure the screening test before {event.event_category === "sales" ? "sales presentation submission" : "project submission"} becomes available.
                  Please check back later or contact the admin for more information.
                </p>
              </div>
            </CardContent>
          </Card>
        ) ); })()}
      </div>{/* Test Instructions Modal */}
      {showInstructions && testData && (
        <TestInstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          onStartTest={handleStartTest}
          instructions={{
            title: "Screening Test Instructions",
            duration: testData.test.timer_minutes,
            totalQuestions: testData.test.total_questions,
            passingScore: testData.test.passing_score,
            rules: [
              "You must complete the test within the allocated time limit",
              "Do not leave this browser tab or window during the test",
              "Switching tabs more than 3 times will result in automatic submission",
              "Each question must be answered before moving to the next",
              "You can navigate between questions using the navigation buttons",
              "Once submitted, you cannot retake the test",
              "Ensure you have a stable internet connection",
              "Do not refresh the page during the test"
            ]
          }}
        />
      )}

      {/* MCQ Test Taker */}
      {takingTest && testData && (
        <MCQTestTaker
          testId={testData.test.id}
          questions={testData.test.questions}
          timerMinutes={testData.test.timer_minutes}
          eventId={eventId || ''}
          onTestComplete={handleTestComplete}
          onTestExit={handleTestExit}
        />
      )}

      {/* Test Results */}
      {showTestResults && testResult && (
        <TestResults
          result={testResult.result}
          onContinue={handleResultsContinue}
        />
      )}
    </div>
  );
}
