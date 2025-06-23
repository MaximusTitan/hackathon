"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, AlertTriangle, CheckCircle, X, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { MCQQuestion, UserTestAttempt } from "@/types/screening";

interface MCQTestTakerProps {
  testId: string;
  questions: MCQQuestion[];
  timerMinutes: number;
  eventId: string;
  onTestComplete: (result: any) => void;
  onTestExit: () => void;
}

export default function MCQTestTaker({ 
  testId, 
  questions, 
  timerMinutes, 
  eventId,
  onTestComplete,
  onTestExit
}: MCQTestTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(timerMinutes * 60); // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [testStartTime, setTestStartTime] = useState<Date>(new Date());
  const [hasLeft, setHasLeft] = useState(false);
  
  // Ref for scrolling to questions
  const questionCardRef = useRef<HTMLDivElement>(null);

  // Scroll to first question when component mounts
  useEffect(() => {
    if (questionCardRef.current) {
      questionCardRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, []);

  // Scroll to question when question index changes
  useEffect(() => {
    if (questionCardRef.current) {
      questionCardRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [currentQuestionIndex]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !hasLeft) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            toast.error("Too many tab switches detected. Test will be auto-submitted.");
            handleAutoSubmit();
          } else {
            toast.warning(`Warning: Tab switch detected (${newCount}/3). Test will auto-submit after 3 switches.`);
          }
          return newCount;
        });
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasLeft) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
        return e.returnValue;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasLeft]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting || hasLeft) return;
    
    setIsSubmitting(true);
    setHasLeft(true);
    
    const timeTaken = Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000);
    
    try {
      const response = await fetch('/api/user/submit-screening-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screening_test_id: testId,
          event_id: eventId,
          answers,
          time_taken_seconds: timeTaken,
          tab_switches: tabSwitches,
          status: timeRemaining <= 0 ? 'timeout' : 'auto_submitted'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("Test submitted successfully");
        onTestComplete(result);
      } else {
        toast.error(result.error || "Failed to submit test");
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error("Error submitting test");
    }
  }, [testId, eventId, answers, tabSwitches, timeRemaining, testStartTime, isSubmitting, hasLeft, onTestComplete]);  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
    // Scroll will be handled by the useEffect for currentQuestionIndex change
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    setHasLeft(true);
    
    const timeTaken = Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000);
    
    try {
      const response = await fetch('/api/user/submit-screening-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screening_test_id: testId,
          event_id: eventId,
          answers,
          time_taken_seconds: timeTaken,
          tab_switches: tabSwitches,
          status: 'submitted'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("Test submitted successfully");
        onTestComplete(result);
      } else {
        toast.error(result.error || "Failed to submit test");
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error("Error submitting test");
    } finally {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = getAnsweredCount();

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Test Error</h2>
          <p className="text-gray-600 mb-4">Unable to load test questions.</p>
          <Button onClick={onTestExit} variant="outline">
            Exit Test
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Screening Test</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>•</span>
                <span>{answeredCount}/{questions.length} answered</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {tabSwitches > 0 && (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Tab switches: {tabSwitches}/3</span>
                </div>
              )}
              
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                timeRemaining < 300 ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="mb-6" ref={questionCardRef}>
          <CardHeader>
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1} ({currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-lg leading-relaxed">{currentQuestion.question}</p>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label 
                    key={index}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      answers[currentQuestion.id] === index 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={index}
                      checked={answers[currentQuestion.id] === index}
                      onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                      answers[currentQuestion.id] === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQuestion.id] === index && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <span className="font-medium mr-3 text-gray-700">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="flex-1">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={() => setShowSubmitDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Test
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => handleQuestionNavigation(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[q.id] !== undefined
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                <span>Unanswered</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to submit your test?</p>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-medium">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="font-medium">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Unanswered:</span>
                <span className="font-medium">{questions.length - answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
            </div>
            <p className="text-sm text-red-600">
              Once submitted, you cannot make any changes to your answers.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSubmitDialog(false)}
              disabled={isSubmitting}
            >
              Continue Test
            </Button>
            <Button 
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
