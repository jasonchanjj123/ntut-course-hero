'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import debounce from 'lodash/debounce';

interface Course {
  id: string;
  code: string;
  name: {
    zh: string;
    en: string;
  };
  courseType: string;
  credit: string;
  hours: string;
  time: {
    sun: string[];
    mon: string[];
    tue: string[];
    wed: string[];
    thu: string[];
    fri: string[];
    sat: string[];
  };
  classroom: Array<{
    name: string;
    code: string;
    link: string;
  }>;
}

const getConsecutiveSlots = (
  course: Course,
  dayKey: string,
  slot: string,
  timeSlots: string[]
) => {
  const slots = course.time[dayKey as keyof typeof course.time];
  const currentIndex = timeSlots.indexOf(slot);
  let consecutiveCount = 1;
  
  // Check next slots
  let nextIndex = currentIndex + 1;
  while (nextIndex < timeSlots.length && slots.includes(timeSlots[nextIndex])) {
    consecutiveCount++;
    nextIndex++;
  }
  
  return {
    isStart: !slots.includes(timeSlots[currentIndex - 1]),
    consecutiveCount,
  };
};

const calculateTotals = (courses: Course[]) => {
  return courses.reduce(
    (acc, course) => ({
      totalCredits: acc.totalCredits + parseFloat(course.credit),
      totalHours: acc.totalHours + parseInt(course.hours),
    }),
    { totalCredits: 0, totalHours: 0 }
  );
};

const TestCourseScheduler = () => {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAvailableCourses, setShowAvailableCourses] = useState(true);

  // 實作去抖動的搜尋
  const debouncedFetch = useCallback(
    debounce(async (query: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParam = query ? `?q=${encodeURIComponent(query)}` : '';
        const res = await fetch(`/api/${queryParam}`);
        if (!res.ok) throw new Error('課程資料載入失敗');
        const data = await res.json();
        setAvailableCourses(data.courses);
      } catch (err) {
        setError(err instanceof Error ? err.message : '發生未知錯誤');
        console.error('Failed to fetch courses:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedFetch(searchQuery);
    return () => debouncedFetch.cancel();
  }, [searchQuery, debouncedFetch]);

  const getCourseColor = (courseType: string): string => {
    const colorMap: { [key: string]: string } = {
      '▲': 'bg-blue-100',
      '★': 'bg-green-100',
      '◎': 'bg-yellow-100',
      '□': 'bg-purple-100',
    };
    return colorMap[courseType] || 'bg-gray-100';
  };

  const checkTimeConflict = (course1: Course, course2: Course): boolean => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    for (const day of days) {
      const slots1 = course1.time[day as keyof typeof course1.time];
      const slots2 = course2.time[day as keyof typeof course2.time];
      
      for (const slot1 of slots1) {
        for (const slot2 of slots2) {
          if (slot1 === slot2) return true;
        }
      }
    }
    return false;
  };

  const addCourse = useCallback((course: Course) => {
    setConflicts([]);  // 清除之前的衝突
    
    // 檢查重複選課
    if (selectedCourses.some(selected => selected.id === course.id)) {
      setConflicts(prev => [...prev, `重複選課：${course.name.zh}`]);
      return;
    }

    // 檢查時間衝突
    const conflictingCourse = selectedCourses.find(selected => 
      checkTimeConflict(selected, course)
    );

    if (conflictingCourse) {
      setConflicts(prev => [...prev, 
        `時間衝突：${course.name.zh} 與 ${conflictingCourse.name.zh}`
      ]);
      return;
    }

    setSelectedCourses(prev => [...prev, course]);
  }, [selectedCourses]);

  const removeCourse = useCallback((courseId: string) => {
    setSelectedCourses(prev => prev.filter(course => course.id !== courseId));
    setConflicts([]);
  }, []);

  // We use the availableCourses state that now comes from our API.
  const filteredCourses = availableCourses.filter(course =>
    course.name.zh.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const days = ['一', '二', '三', '四', '五'];
  const timeSlots = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left side - Course selection */}
        <div className="w-full lg:w-1/4 lg:min-w-[250px] flex flex-col">
          {/* 課程選擇 Card */}
          <Card className={`mb-4 ${showAvailableCourses ? 'h-[50vh]' : ''}`}>
            <CardHeader>
              <CardTitle>課程選擇</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)] overflow-hidden">
              <div className="flex flex-col h-full">
                <Input
                  type="search"
                  placeholder="搜尋課程名稱或代碼..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">可選課程</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAvailableCourses(!showAvailableCourses)}
                      className="h-8 px-2"
                    >
                      {showAvailableCourses ? '收合' : '展開'}
                    </Button>
                  </div>
                  {showAvailableCourses && (
                    <div className="h-full overflow-y-auto">
                      <div className="flex flex-col gap-2">
                        {filteredCourses.map(course => (
                          <Button
                            key={course.id}
                            onClick={() => addCourse(course)}
                            className={`w-full justify-start ${getCourseColor(course.courseType)}`}
                            variant="outline"
                          >
                            {course.name.zh} ({course.code})
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 已選課程 Card */}
          <Card className={`mb-4 ${showAvailableCourses ? 'h-[50vh]' : ''}`}>
            <CardHeader>
              <CardTitle>已選課程</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)] overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="flex flex-col gap-2">
                  {selectedCourses.map(course => (
                    <Button
                      key={course.id}
                      onClick={() => removeCourse(course.id)}
                      className={`w-full justify-start ${getCourseColor(course.courseType)}`}
                      variant="secondary"
                    >
                      {course.name.zh} ❌
                    </Button>
                  ))}
                </div>
                {conflicts.length > 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {conflicts.map((conflict, index) => (
                        <div key={index}>{conflict}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Timetable */}
        <div className="w-full lg:flex-1">
          <Card className="lg:min-w-[640px]">
            <CardHeader className="flex-none">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle>週課表</CardTitle>
                {selectedCourses.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const { totalCredits, totalHours } = calculateTotals(selectedCourses);
                      return (
                        <>
                          <span className="font-bold">總學分</span>：{totalCredits.toFixed(1)} / <span className="font-bold">總時數</span>：{totalHours}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-full">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-20">
                    <tr>
                      <th className="border p-1 lg:p-2 w-8 lg:w-16 text-xs lg:text-base">節次</th>
                      {days.map(day => (
                        <th key={day} className="border p-1 lg:p-2 text-xs lg:text-base">週{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(slot => (
                      <tr key={slot}>
                        <td className="border p-1 lg:p-2 text-center text-xs lg:text-base">{slot}</td>
                        {days.map((day, index) => {
                          const dayKey = ['mon', 'tue', 'wed', 'thu', 'fri'][index];
                          return (
                            <td key={`${day}-${slot}`} className="border p-0 h-12 lg:h-16 relative">
                              {selectedCourses.map(course => {
                                if (course.time[dayKey as keyof typeof course.time].includes(slot)) {
                                  const { isStart, consecutiveCount } = getConsecutiveSlots(course, dayKey, slot, timeSlots);
                                  if (isStart) {
                                    return (
                                      <div 
                                        key={course.id} 
                                        className={`${getCourseColor(course.courseType)} absolute inset-0 p-1 lg:p-2 overflow-hidden flex flex-col`}
                                        style={{
                                          height: `${consecutiveCount * 3}rem`,
                                          zIndex: 10
                                        }}
                                      >
                                        <div className="font-semibold leading-tight text-xs lg:text-base flex-grow">
                                          {course.name.zh}
                                        </div>
                                        <div className="mt-0.5 lg:mt-1 truncate text-xs lg:text-sm">
                                          {course.classroom.map(room => room.name).join(', ')}
                                        </div>
                                      </div>
                                    );
                                  }
                                }
                                return null;
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading && (
        <div className="text-center py-4">載入中...</div>
      )}
    </div>
  );
};

export default TestCourseScheduler;
