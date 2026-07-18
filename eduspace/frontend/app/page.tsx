"use client"
import { useEffect, useState } from 'react';

export default function Home() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // 请求我们刚才写的 API
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data.courses));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">EduSpace 课程列表</h1>
      <ul>
        {courses.map((c: any) => (
          <li key={c.id} className="border-b py-2">
            {c.name} - <span className="text-gray-500">{c.teacher}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}