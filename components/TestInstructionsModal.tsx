"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, AlertTriangle, Eye, FileText, Timer, Award } from "lucide-react";
import { TestInstructions } from "@/types/screening";

interface TestInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest: () => void;
  instructions: TestInstructions;
}

export default function TestInstructionsModal({ 
  isOpen, 
  onClose, 
  onStartTest, 
  instructions 
}: TestInstructionsModalProps) {
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [checkedRules, setCheckedRules] = useState<Record<number, boolean>>({});

  const handleRuleCheck = (index: number, checked: boolean) => {
    setCheckedRules(prev => ({ ...prev, [index]: checked }));
  };

  const allRulesChecked = Object.keys(checkedRules).length === instructions.rules.length &&
    Object.values(checkedRules).every(Boolean);

  const handleStartTest = () => {
    if (!agreedToRules || !allRulesChecked) {
      return;
    }
    onStartTest();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-6 h-6 text-blue-600" />
            {instructions.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Test Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Timer className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">{instructions.duration} Minutes</p>
                    <p className="text-sm text-blue-700">Time Limit</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">{instructions.totalQuestions} Questions</p>
                    <p className="text-sm text-green-700">Total Questions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Award className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-purple-900">{instructions.passingScore}%</p>
                    <p className="text-sm text-purple-700">Passing Score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Rules */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Important Rules & Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {instructions.rules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                    <Checkbox
                      id={`rule-${index}`}
                      checked={checkedRules[index] || false}
                      onCheckedChange={(checked) => handleRuleCheck(index, checked as boolean)}
                      className="mt-1"
                    />
                    <label 
                      htmlFor={`rule-${index}`} 
                      className="flex-1 text-sm text-gray-700 cursor-pointer leading-relaxed"
                    >
                      {rule}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Requirements */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <Eye className="w-5 h-5" />
                Technical Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Stable internet connection required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Use a desktop or laptop (mobile devices not recommended)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Keep this browser tab active throughout the test</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Disable notifications and close other applications</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Agreement */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">                <Checkbox
                  id="agree-rules"
                  checked={agreedToRules}
                  onCheckedChange={(checked) => setAgreedToRules(checked as boolean)}
                  className="mt-1"
                />
                <label 
                  htmlFor="agree-rules" 
                  className="flex-1 text-sm text-green-800 cursor-pointer leading-relaxed font-medium"
                >
                  I have read and understood all the rules and instructions above. I agree to follow them during the test and understand that any violation may result in disqualification.
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleStartTest}
            disabled={!agreedToRules || !allRulesChecked}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Clock className="w-4 h-4 mr-2" />
            Start Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
