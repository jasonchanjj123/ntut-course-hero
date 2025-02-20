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
    <div className="p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>課程選擇</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">可選課程</h3>
              {availableCourses.map(course => (
                <Button
                  key={course.id}
                  onClick={() => addCourse(course)}
                  className={`mr-2 mb-2 ${getCourseColor(course.courseType)}`}
                  variant="outline"
                >
                  {course.name.zh} ({course.code})
                </Button>
              ))}
            </div>
            <div>
              <h3 className="font-semibold mb-2">已選課程</h3>
              {selectedCourses.map(course => (
                <Button
                  key={course.id}
                  onClick={() => removeCourse(course.id)}
                  className={`mr-2 mb-2 ${getCourseColor(course.courseType)}`}
                  variant="secondary"
                >
                  {course.name.zh} ❌
                </Button>
              ))}
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

      <Card>
        <CardHeader>
          <CardTitle>週課表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 w-16">節次</th>
                  {days.map(day => (
                    <th key={day} className="border p-2 w-40">週{day}</th>
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
                        <td key={`${day}-${slot}`} className="border p-2 w-40 h-16">
                          {selectedCourses.map(course => {
                            if (course.time[dayKey as keyof typeof course.time].includes(slot)) {
                              return (
                                <div 
                                  key={course.id} 
                                  className={`${getCourseColor(course.courseType)} p-1 rounded mb-1 w-full break-words`}
                                >
                                  <div className="font-semibold text-sm leading-tight">{course.name.zh}</div>
                                  <div className="text-xs mt-1">
                                    {course.classroom.map(room => room.name).join(', ')}
                                  </div>
                                </div>
                              );
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
  );
};

export default CourseScheduler;