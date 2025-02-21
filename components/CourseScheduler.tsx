'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Course {
  id: string;
  code: string;
  name: {
    zh: string;
    en: string;
  };
  courseType: string;
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

  const days = ['一', '二', '三', '四', '五'];
  const timeSlots = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];

  return (
    <div className="h-screen p-4">
      <div className="flex flex-row gap-4 h-[calc(100vh-2rem)]">
        {/* Left side - Course selection controls */}
        <div className="w-1/4 min-w-[250px] overflow-y-auto">
          <Card className="sticky top-0">
            <CardHeader>
              <CardTitle>課程選擇</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">可選課程</h3>
                  <div className="flex flex-col gap-2">
                    {availableCourses.map(course => (
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
        <div className="flex-1 overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-none">
              <CardTitle>週課表</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <div className="h-full">
                <table className="w-full border-collapse table-fixed">
                  <thead className="sticky top-0 bg-white z-20">
                    <tr>
                      <th className="border p-2 w-16">節次</th>
                      {days.map(day => (
                        <th key={day} className="border p-2">週{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(slot => (
                      <tr key={slot}>
                        <td className="border p-2 text-center">{slot}</td>
                        {days.map((day, index) => {
                          const dayKey = ['mon', 'tue', 'wed', 'thu', 'fri'][index];
                          return (
                            <td key={`${day}-${slot}`} className="border p-0 h-16 relative">
                              {selectedCourses.map(course => {
                                if (course.time[dayKey as keyof typeof course.time].includes(slot)) {
                                  const { isStart, consecutiveCount } = getConsecutiveSlots(course, dayKey, slot, timeSlots);
                                  
                                  if (isStart) {
                                    return (
                                      <div 
                                        key={course.id} 
                                        className={`${getCourseColor(course.courseType)} absolute inset-0 p-2 overflow-hidden flex flex-col`}
                                        style={{
                                          height: `${consecutiveCount * 4}rem`,
                                          zIndex: 10
                                        }}
                                      >
                                        {/* Course name - fixed font size */}
                                        <div 
                                          className="font-semibold leading-tight text-base flex-grow"
                                        >
                                          {course.name.zh}
                                        </div>
                                        {/* Classroom info - fixed smaller font size */}
                                        <div 
                                          className="mt-1 truncate text-sm"
                                        >
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