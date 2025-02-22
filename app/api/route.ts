import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    // 取得 URL 參數
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 連接資料庫
    const client = await clientPromise;
    const db = client.db('113');
    const collection = db.collection('1-main');

    // 建立搜尋條件
    const filter = query
      ? {
          $or: [
            { 'name.zh': { $regex: new RegExp(query, 'i') } },
            { 'name.en': { $regex: new RegExp(query, 'i') } },
            { code: { $regex: new RegExp(query, 'i') } },
          ],
        }
      : {};

    // 計算分頁
    const skip = (page - 1) * limit;

    // 執行查詢
    const [courses, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ code: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    // 回傳結果
    return NextResponse.json({
      courses,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { 
        error: '資料庫查詢失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}