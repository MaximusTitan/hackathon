"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { MCQQuestion } from "@/types/screening";

interface MCQTestCreatorProps {
  eventId: string;
  existingTest?: {
    id: string;
    title?: string;
    instructions: string;
    timer_minutes: number;
    passing_score: number;
    questions: MCQQuestion[];
  } | null;
  onSave: (testData: any) => Promise<void>;
  onSend?: (testId: string) => Promise<void>;
  isSubmitting: boolean;
  mode: 'create' | 'edit' | 'send';
}

export default function MCQTestCreator({ 
  eventId, 
  existingTest, 
  onSave, 
  onSend,
  isSubmitting,
  mode 
}: MCQTestCreatorProps) {
  console.log('MCQTestCreator received existingTest:', existingTest);
  
  const [testData, setTestData] = useState({
    title: existingTest?.title || 'Screening Test',
    instructions: existingTest?.instructions || "Please read each question carefully and select the best answer. You have limited time to complete this test.",
    timer_minutes: existingTest?.timer_minutes || 30,
    passing_score: existingTest?.passing_score || 70,
    questions: Array.isArray(existingTest?.questions) ? existingTest.questions : []
  });

  console.log('Initial testData:', testData);

  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MCQQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    id: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1
  });

  const resetQuestionForm = () => {
    setQuestionForm({
      id: '',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1
    });
  };

  const handleAddQuestion = () => {
    resetQuestionForm();
    setEditingQuestion(null);
    setShowQuestionDialog(true);
  };

  const handleEditQuestion = (question: MCQQuestion) => {
    setQuestionForm({
      id: question.id,
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      points: question.points
    });
    setEditingQuestion(question);
    setShowQuestionDialog(true);
  };

  const handleSaveQuestion = () => {
    if (!questionForm.question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    if (questionForm.options.some(opt => !opt.trim())) {
      toast.error("Please fill in all options");
      return;
    }

    const newQuestion: MCQQuestion = {
      id: questionForm.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: questionForm.question.trim(),
      options: questionForm.options.map(opt => opt.trim()),
      correctAnswer: questionForm.correctAnswer,
      points: questionForm.points
    };

    if (editingQuestion) {
      // Update existing question
      setTestData(prev => ({
        ...prev,
        questions: prev.questions.map(q => 
          q.id === editingQuestion.id ? newQuestion : q
        )
      }));
    } else {
      // Add new question
      setTestData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
    }

    setShowQuestionDialog(false);
    resetQuestionForm();
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm(prev => ({ ...prev, options: newOptions }));
  };

  const handleSaveTest = async () => {
    if (testData.questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    if (testData.timer_minutes < 1) {
      toast.error("Timer must be at least 1 minute");
      return;
    }

    if (testData.passing_score < 0 || testData.passing_score > 100) {
      toast.error("Passing score must be between 0 and 100");
      return;
    }

    await onSave({
      ...testData,
      total_questions: testData.questions.length
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Test Title</Label>
            <Input
              id="title"
              value={testData.title}
              onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter test title..."
              disabled={mode === 'send'}
            />
          </div>
          
          <div>
            <Label htmlFor="instructions">Test Instructions</Label>
            <Textarea
              id="instructions"
              value={testData.instructions}
              onChange={(e) => setTestData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Enter instructions for the test..."
              rows={3}
              disabled={mode === 'send'}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timer">Time Limit (minutes)</Label>
              <Input
                id="timer"
                type="number"
                min="1"
                max="180"                value={testData.timer_minutes}
                onChange={(e) => setTestData(prev => ({ ...prev, timer_minutes: parseInt(e.target.value) || 30 }))}
                disabled={mode === 'send'}
              />
            </div>
            
            <div>
              <Label htmlFor="passing_score">Passing Score (%)</Label>
              <Input
                id="passing_score"
                type="number"
                min="0"
                max="100"                value={testData.passing_score}
                onChange={(e) => setTestData(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 70 }))}
                disabled={mode === 'send'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Questions ({testData.questions.length})</CardTitle>
          {mode !== 'send' && (
            <Button onClick={handleAddQuestion} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          )}
        </CardHeader>        <CardContent>
          {(!testData.questions || !Array.isArray(testData.questions) || testData.questions.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              No questions added yet. Click "Add Question" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {testData.questions.map((question, index) => (
                <Card key={question.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-sm text-gray-600">Question {index + 1} ({question.points} point{question.points !== 1 ? 's' : ''})</h4>
                      {mode !== 'send' && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="font-medium mb-3">{question.question}</p>
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex} 
                          className={`p-2 rounded border ${
                            optIndex === question.correctAnswer 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                          {option}
                          {optIndex === question.correctAnswer && (
                            <span className="ml-2 text-green-600 text-xs font-semibold">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>      <div className="flex justify-end gap-3">
        {mode === 'send' && existingTest ? (
          <Button 
            onClick={() => onSend && onSend(existingTest.id)}
            disabled={isSubmitting || testData.questions.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? 'Sending...' : 'Send to Participants'}
          </Button>
        ) : (
          <Button 
            onClick={handleSaveTest}
            disabled={isSubmitting || testData.questions.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? 'Saving...' : `${existingTest ? 'Update' : 'Save'} Test`}
          </Button>
        )}
      </div>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="question_text">Question</Label>
              <Textarea
                id="question_text"
                value={questionForm.question}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question here..."
                rows={3}
              />
            </div>

            <div>
              <Label>Answer Options</Label>
              <div className="space-y-3 mt-2">
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="font-medium text-sm w-6">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={questionForm.correctAnswer === index}
                        onChange={() => setQuestionForm(prev => ({ ...prev, correctAnswer: index }))}
                        className="w-4 h-4 text-green-600"
                      />
                      <Label className="ml-2 text-xs text-gray-600">Correct</Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="points">Points for this question</Label>
              <Select
                value={questionForm.points.toString()}
                onValueChange={(value) => setQuestionForm(prev => ({ ...prev, points: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Point</SelectItem>
                  <SelectItem value="2">2 Points</SelectItem>
                  <SelectItem value="3">3 Points</SelectItem>
                  <SelectItem value="5">5 Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowQuestionDialog(false);
                resetQuestionForm();
                setEditingQuestion(null);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {editingQuestion ? 'Update Question' : 'Add Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
