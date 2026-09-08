"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  Search,
  Filter,
  Star,
  BookOpen,
  GraduationCap,
  Award,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  X,
} from "lucide-react";

const mockTeachers = [
  {
    id: "1",
    name: "Rahul Sharma",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul",
    subjects: ["Mathematics", "Physics"],
    grades: ["9", "10", "11", "12"],
    boards: ["CBSE", "ICSE", "JEE"],
    languages: ["English", "Hindi"],
    hourlyRate: 1200,
    monthlyRate: 8000,
    rating: 4.9,
    reviewCount: 127,
    experience: 8,
    verified: true,
    availability: ["Mon", "Wed", "Fri"],
  },
  {
    id: "2",
    name: "Priya Nair",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    subjects: ["Physics", "Chemistry"],
    grades: ["11", "12"],
    boards: ["CBSE", "NEET", "JEE"],
    languages: ["English", "Malayalam"],
    hourlyRate: 1500,
    monthlyRate: 10000,
    rating: 4.8,
    reviewCount: 89,
    experience: 6,
    verified: true,
    availability: ["Tue", "Thu", "Sat"],
  },
  {
    id: "3",
    name: "Amit Kumar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=amit",
    subjects: ["Mathematics"],
    grades: ["8", "9", "10"],
    boards: ["CBSE", "ICSE", "State Board"],
    languages: ["English", "Hindi", "Tamil"],
    hourlyRate: 800,
    monthlyRate: 6000,
    rating: 4.7,
    reviewCount: 156,
    experience: 5,
    verified: true,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
  {
    id: "4",
    name: "Sneha Reddy",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sneha",
    subjects: ["Biology", "Chemistry"],
    grades: ["11", "12"],
    boards: ["CBSE", "NEET"],
    languages: ["English", "Telugu"],
    hourlyRate: 1000,
    monthlyRate: 7000,
    rating: 4.9,
    reviewCount: 67,
    experience: 4,
    verified: true,
    availability: ["Mon", "Wed", "Fri", "Sun"],
  },
  {
    id: "5",
    name: "Vikram Singh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vikram",
    subjects: ["Physics", "Mathematics"],
    grades: ["11", "12"],
    boards: ["CBSE", "JEE"],
    languages: ["English", "Hindi", "Punjabi"],
    hourlyRate: 1800,
    monthlyRate: 12000,
    rating: 4.8,
    reviewCount: 45,
    experience: 10,
    verified: true,
    availability: ["Tue", "Thu", "Sat"],
  },
  {
    id: "6",
    name: "Anita Desai",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anita",
    subjects: ["English", "History"],
    grades: ["9", "10", "11", "12"],
    boards: ["CBSE", "ICSE", "IB"],
    languages: ["English", "Gujarati"],
    hourlyRate: 900,
    monthlyRate: 6500,
    rating: 4.6,
    reviewCount: 34,
    experience: 7,
    verified: true,
    availability: ["Mon", "Tue", "Thu", "Fri"],
  },
];

const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science", "History", "Geography"];
const grades = ["8", "9", "10", "11", "12"];
const boards = ["CBSE", "ICSE", "IB", "State Board", "JEE", "NEET"];
const languages = ["English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", "Gujarati", "Punjabi", "Bengali", "Marathi"];

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [maxRate, setMaxRate] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "hourlyRate" | "experience" | "reviewCount">("rating");

  const filteredTeachers = mockTeachers
    .filter((teacher) => {
      if (search && !teacher.name.toLowerCase().includes(search.toLowerCase()) &&
          !teacher.subjects.some(s => s.toLowerCase().includes(search.toLowerCase()))) {
        return false;
      }
      if (selectedSubjects.length && !selectedSubjects.some(s => teacher.subjects.includes(s))) return false;
      if (selectedGrades.length && !selectedGrades.some(g => teacher.grades.includes(g))) return false;
      if (selectedBoards.length && !selectedBoards.some(b => teacher.boards.includes(b))) return false;
      if (selectedLanguages.length && !selectedLanguages.some(l => teacher.languages.includes(l))) return false;
      if (maxRate && teacher.hourlyRate > parseInt(maxRate)) return false;
      if (minRating && teacher.rating < minRating) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "hourlyRate") return a.hourlyRate - b.hourlyRate;
      if (sortBy === "experience") return b.experience - a.experience;
      return b.reviewCount - a.reviewCount;
    });

  const activeFilterCount = selectedSubjects.length + selectedGrades.length + selectedBoards.length + selectedLanguages.length + (maxRate ? 1 : 0) + (minRating ? 1 : 0);

  const toggleFilter = (arr: string[], value: string, setter: (arr: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const clearAllFilters = () => {
    setSelectedSubjects([]);
    setSelectedGrades([]);
    setSelectedBoards([]);
    setSelectedLanguages([]);
    setMaxRate("");
    setMinRating(0);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Find Your Perfect Teacher</h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">Browse 500+ verified tutors across all subjects and boards</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                <Filter className="h-4 w-4" />
                Filters {activeFilterCount > 0 && (
                  <Badge variant="primary" className="ml-1">{activeFilterCount}</Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-error-600 dark:text-error-400 hover:text-error-700">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`w-full lg:w-64 transition-all duration-300 ${showFilters ? "block" : "lg:hidden"}`}>
            <div className="space-y-6">
              {/* Search */}
              <div>
                <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Search Teachers</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search by name, subject..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Subjects */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Subjects</Label>
                  {selectedSubjects.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSubjects([])} className="text-xs text-error-600 dark:text-error-400 p-0">
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {subjects.map((subject) => (
                    <Button
                      key={subject}
                      variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => toggleFilter(selectedSubjects, subject, setSelectedSubjects)}
                    >
                      {subject}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Grades */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Grades</Label>
                  {selectedGrades.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedGrades([])} className="text-xs text-error-600 dark:text-error-400 p-0">
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {grades.map((grade) => (
                    <Button
                      key={grade}
                      variant={selectedGrades.includes(grade) ? "default" : "outline"}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => toggleFilter(selectedGrades, grade, setSelectedGrades)}
                    >
                      Grade {grade}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Boards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Boards</Label>
                  {selectedBoards.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedBoards([])} className="text-xs text-error-600 dark:text-error-400 p-0">
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {boards.map((board) => (
                    <Button
                      key={board}
                      variant={selectedBoards.includes(board) ? "default" : "outline"}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => toggleFilter(selectedBoards, board, setSelectedBoards)}
                    >
                      {board}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Languages</Label>
                  {selectedLanguages.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedLanguages([])} className="text-xs text-error-600 dark:text-error-400 p-0">
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {languages.map((lang) => (
                    <Button
                      key={lang}
                      variant={selectedLanguages.includes(lang) ? "default" : "outline"}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => toggleFilter(selectedLanguages, lang, setSelectedLanguages)}
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Max Hourly Rate (₹)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Max rate"
                    value={maxRate}
                    onChange={(e) => setMaxRate(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Minimum Rating</Label>
                <div className="flex gap-1">
                  {[5, 4.5, 4, 3.5, 3].map((rating) => (
                    <Button
                      key={rating}
                      variant={minRating >= rating ? "default" : "outline"}
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      {rating}+
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="hourlyRate">Price: Low to High</SelectItem>
                    <SelectItem value="experience">Most Experienced</SelectItem>
                    <SelectItem value="reviewCount">Most Reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <Button variant="outline" className="w-full" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <p className="text-neutral-600 dark:text-neutral-400">
                Showing <span className="font-semibold text-neutral-900 dark:text-white">{filteredTeachers.length}</span> of {mockTeachers.length} teachers
              </p>
              <Select value={sortBy} onValueChange={setSortBy} className="w-auto">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="hourlyRate">Price: Low to High</SelectItem>
                  <SelectItem value="experience">Most Experienced</SelectItem>
                  <SelectItem value="reviewCount">Most Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredTeachers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Search className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No teachers found</h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">Try adjusting your filters or search terms</p>
                <Button variant="outline" onClick={clearAllFilters}>Clear All Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map((teacher) => (
                  <Link key={teacher.id} href={`/teachers/${teacher.id}`} className="group">
                    <Card className="h-full transition-all duration-300 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800">
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={teacher.avatar} alt={teacher.name} />
                            <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {teacher.name}
                              </h3>
                              {teacher.verified && (
                                <Badge variant="success" className="gap-1 text-xs">
                                  <Award className="h-3 w-3" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                              {teacher.subjects.slice(0, 3).map((subject) => (
                                <Badge key={subject} variant="outline" className="gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {subject}
                                </Badge>
                              ))}
                              {teacher.subjects.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{teacher.subjects.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5 pt-0">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Hourly Rate</p>
                            <p className="font-semibold text-neutral-900 dark:text-white">₹{teacher.hourlyRate.toLocaleString()}/hr</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Monthly (3 classes/wk)</p>
                            <p className="font-semibold text-neutral-900 dark:text-white">₹{teacher.monthlyRate.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{teacher.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            <span>{teacher.experience} yrs exp</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{teacher.reviewCount} reviews</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {teacher.languages.map((lang) => (
                            <Badge key={lang} variant="outline" className="text-xs">
                              <Globe className="h-3 w-3" />
                              {lang}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                            <Clock className="h-4 w-4" />
                            <span>Available: {teacher.availability.join(", ")}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30">
                            View Profile
                            <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {filteredTeachers.length === mockTeachers.length && filteredTeachers.length > 6 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View All Teachers
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}