'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

interface Course {
  id: string;
  code: string;
  name: {
    zh: string;
    en: string;
  };
  courseType: string; //added 
  credit: string;  //added
  hours: string
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

const getConsecutiveSlots = (course: Course, dayKey: string, slot: string, timeSlots: string[]) => {
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

// 新增計算總學分和總時數的函數
const calculateTotals = (courses: Course[]) => {
  return courses.reduce((acc, course) => ({
    totalCredits: acc.totalCredits + parseFloat(course.credit),
    totalHours: acc.totalHours + parseInt(course.hours)
  }), { totalCredits: 0, totalHours: 0 });
};

const CourseScheduler = () => {
  const availableCourses: Course[] = [
    {
      "code": "0463023",
      "id": "339241",
      "name": {
        "zh": "土木與建築群教學實習",
        "en": "Teaching Practicum for the Area of Civil Engineering and Architecture Subjects"
      },
      "courseType": "▲",
      "credit": "3.0",
    "hours": "3",
      "time": {
        "sun": [],
        "mon": [],
        "tue": ["A", "B", "C", "D"],
        "wed": [],
        "thu": [],
        "fri": [],
        "sat": []
      },
      "classroom": []
    },
    {
      "code": "A501016",
      "id": "341857",
      "name": {
        "zh": "文化科技",
        "en": "Cultural Technology"
      },
      "courseType": "▲",
      "credit": "2.0",
      "hours": "2",
      "time": {
        "sun": [],
        "mon": [],
        "tue": [],
        "wed": [],
        "thu": ["3", "4"],
        "fri": [],
        "sat": []
      },
      "classroom": [
        {
          "name": "共同312",
          "link": "Croom.jsp?format=-3&year=113&sem=2&code=154",
          "code": "154"
        }
      ]
    }
  ];

  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  const addCourse = (course: Course) => {
    // Check if course is already selected
    const isDuplicate = selectedCourses.some(selected => selected.id === course.id);
    if (isDuplicate) {
      setConflicts([...conflicts, `重複選課：${course.name.zh}`]);
      return;
    }

    // Check for time conflicts
    const hasConflict = selectedCourses.some(selected => 
      checkTimeConflict(selected, course)
    );

    if (hasConflict) {
      setConflicts([...conflicts, `時間衝突：${course.name.zh}`]);
      return;
    }

    setSelectedCourses([...selectedCourses, course]);
    setConflicts([]);
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourses(selectedCourses.filter(course => course.id !== courseId));
    setConflicts([]);
  };

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
        {/* Left side - Course selection controls */}
        <div className="w-full lg:w-1/4 lg:min-w-[250px]">
          <Card className="mb-4 lg:sticky lg:top-0">
            <CardHeader>
              <CardTitle>課程選擇</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="search"
                  placeholder="搜尋課程名稱或代碼..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
                <div>
                  <h3 className="font-semibold mb-2">可選課程</h3>
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
                <div>
                  <h3 className="font-semibold mb-2">已選課程</h3>
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
                </div>
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
    </div>
  );
};

export default CourseScheduler;