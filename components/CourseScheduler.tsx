'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import debounce from 'lodash/debounce';
import { useLanguage } from '@/app/contexts/LanguageContext';

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
  notes: string;
  teacher:[{
    name: string;
    link: string;
    code: string;}
  ]
  ;
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
  const slots = course.time[dayKey as keyof typeof course.time] || [];
  const currentIndex = timeSlots.indexOf(slot);
  let consecutiveCount = 1;
  
  // 檢查前面的時間格
  const isStart = !slots.includes(timeSlots[currentIndex - 1]);
  
  // 檢查後面的連續時間格
  let nextIndex = currentIndex + 1;
  while (nextIndex < timeSlots.length && slots.includes(timeSlots[nextIndex])) {
    consecutiveCount++;
    nextIndex++;
  }
  
  return {
    isStart,
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

const CourseScheduler = () => {
  const { language } = useLanguage();
  
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

  // 首先添加一個檢查衝突的函數
  const checkCourseConflict = useCallback((course: Course) => {
    // 檢查是否已選
    const isSelected = selectedCourses.some(selected => selected.id === course.id);
    // 檢查是否有時間衝突
    const hasTimeConflict = selectedCourses.some(selected => 
      selected.id !== course.id && checkTimeConflict(selected, course)
    );
    
    return {
      isSelected,
      hasTimeConflict
    };
  }, [selectedCourses]);

  // We use the availableCourses state that now comes from our API.
  const filteredCourses = availableCourses.filter(course =>
    course.name.zh.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.teacher.some(teacher => 
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const days = ['一', '二', '三', '四', '五'];
  const daysInEnglish = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left side - Course selection */}
        <div className="w-full lg:w-1/4 lg:min-w-[250px] flex flex-col">
          {/* 課程選擇 Card */}
          <Card className={` mb-0 ${showAvailableCourses ? 'h-[50vh]' : ''}`}>
            <CardHeader>
              <CardTitle>{language === 'zh' ? '課程選擇' : 'Course Selection'}</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)] overflow-hidden ">
              <div className="flex flex-col h-full">
                <Input
                  type="search"
                  placeholder={
                    language === 'zh'
                      ? "搜尋課程名稱、代碼或教師姓名..."
                      : "Search course name, code or teacher..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{language === 'zh' ? '可選課程' : 'Available Courses'}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAvailableCourses(!showAvailableCourses)}
                      className="h-8 px-2"
                    >
                      {showAvailableCourses ? (language === 'zh' ? '收合' : 'Collapse') : (language === 'zh' ? '展開' : 'Expand')}
                    </Button>
                  </div>
                  {showAvailableCourses && (
                    <div className="h-full overflow-y-auto">
                      <div className="flex flex-col gap-2">
                        {filteredCourses.map(course => {
                          const { isSelected, hasTimeConflict } = checkCourseConflict(course);
                          return (
                            <Button
                              key={course.id}
                              onClick={() => addCourse(course)}
                              className={`
                                w-full justify-between 
                                ${getCourseColor(course.courseType)}
                                ${hasTimeConflict ? 'border-red-500 border-2' : ''}
                                ${isSelected ? 'border-yellow-500 border-2' : ''}
                              `}
                              variant="outline"
                              disabled={isSelected || hasTimeConflict}
                            >
                              <span className="truncate">
                                {course.name.zh} ({course.code})
                              </span>
                              <div className="flex gap-2 items-center ml-2 flex-shrink-0">
                                {isSelected && (
                                  <span className="text-yellow-500 text-xs px-1.5 py-0.5 bg-yellow-50 rounded">
                                    {language === 'zh' ? '已選' : 'Selected'}
                                  </span>
                                )}
                                {hasTimeConflict && (
                                  <span className="text-red-500 text-xs px-1.5 py-0.5 bg-red-50 rounded">
                                    {language === 'zh' ? '衝堂' : 'Conflict'}
                                  </span>
                                )}
                              </div>
                            </Button>
                          );
                        })}
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
              <CardTitle>{language === 'zh' ? '已選課程' : 'Selected Courses'}</CardTitle>
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
                <CardTitle>{language === 'zh' ? '週課表' : 'Weekly Schedule'}</CardTitle>
                {selectedCourses.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const { totalCredits, totalHours } = calculateTotals(selectedCourses);
                      return (
                        <>
                          <span className="font-bold">
                            {language === 'zh' ? '總學分' : 'Credits'}
                          </span>
                          ：{totalCredits.toFixed(1)} / 
                          <span className="font-bold">
                            {language === 'zh' ? '總時數' : 'Hours'}
                          </span>
                          ：{totalHours}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-full">
                <table className="w-full border-collapse table-fixed">
                  <thead className="sticky top-0 bg-white z-20">
                    <tr>
                      <th className="border p-1 lg:p-2 w-8 lg:w-16 text-xs lg:text-base">
                        {language === 'zh' ? '節次' : 'Period'}
                      </th>
                      {days.map((day, index) => (
                        <th key={day} className="border p-1 lg:p-2 text-xs lg:text-base w-1/5">
                          {language === 'zh' ? 
                            `週${day}` : 
                            daysInEnglish[index]
                          }
                        </th>
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
                            <td key={`${day}-${slot}`} className="border p-0 h-16 relative">
                              {selectedCourses.map(course => {
                                const slots = course.time[dayKey as keyof typeof course.time] || [];
                                if (slots.includes(slot)) {
                                  const { isStart, consecutiveCount } = getConsecutiveSlots(course, dayKey, slot, timeSlots);
                                  if (isStart) {
                                    return (
                                      <div 
                                        key={course.id} 
                                        className={`
                                          ${getCourseColor(course.courseType)} 
                                          absolute inset-0 
                                          p-1 lg:p-2 
                                          overflow-hidden 
                                          flex flex-col
                                          border-r border-b
                                          hover:bg-opacity-90
                                          transition-colors
                                        `}
                                        style={{
                                          height: `${consecutiveCount * 4}rem`,
                                          zIndex: 10,
                                          top: 0,
                                          left: 0,
                                          right: 0
                                        }}
                                      >
                                        <div className="flex flex-col justify-between h-full">
                                          <div className="space-y-0.5">
                                            <div className="font-semibold text-xs lg:text-sm line-clamp-2">
                                              {course.name.zh}
                                            </div>
                                            <div className="text-xs text-gray-600 line-clamp-1">
                                              {course.teacher.map(t => t.name).join(', ')}
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-500 truncate">
                                            {course.classroom.map(room => room.name).join(', ')}
                                          </div>
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
        <div className="text-center py-4">{language === 'zh' ? '載入中...' : 'Loading...'}</div>
      )}
    </div>
  );
};

export default CourseScheduler;
