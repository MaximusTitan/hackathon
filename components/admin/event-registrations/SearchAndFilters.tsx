"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export function SearchAndFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  showFilters,
  onToggleFilters,
  onClearFilters,
  filteredCount,
  totalCount
}: SearchAndFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          <Button
            variant="outline"
            onClick={onToggleFilters}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="flex gap-3 items-center flex-wrap">
            <Select value={filterStatus} onValueChange={onFilterChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Participants</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="not_attended">Not Attended</SelectItem>
                <SelectItem value="screening_completed">Screening Completed</SelectItem>
                <SelectItem value="screening_pending">Screening Pending</SelectItem>
                <SelectItem value="screening_passed">Screening Passed</SelectItem>
                <SelectItem value="screening_failed">Screening Failed</SelectItem>
                <SelectItem value="presentation_submitted">Presentation Submitted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="qualification_pending">Qualification Pending</SelectItem>
                <SelectItem value="winners">Winners</SelectItem>
                <SelectItem value="runners_up">Runners-up</SelectItem>
                <SelectItem value="high_score">High Admin Score (80+)</SelectItem>
                <SelectItem value="no_admin_score">No Admin Score</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={onClearFilters}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
        Showing <span className="font-semibold">{filteredCount}</span> of <span className="font-semibold">{totalCount}</span> participants
        {(searchTerm || filterStatus !== 'all') && (
          <span className="text-blue-600 ml-2">(filtered)</span>
        )}
      </div>
    </div>
  );
}
