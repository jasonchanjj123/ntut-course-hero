'use server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 秒

async function connectWithRetry(retries: number = MAX_RETRIES): Promise<MongoClient> {
  try {
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 }); // 測試連接
    return client;
  } catch (error) {
    if (retries > 0) {
      console.log(`連接失敗，${retries}秒後重試...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectWithRetry(retries - 1);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    // 取得 URL 參數
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    // 連接資料庫（使用重試機制）
    const client = await connectWithRetry();
    const db = client.db('113');
    const collection = db.collection('1-main');

    // 建立搜尋條件
    const filter = query
      ? {
          $or: [
            { 'name.zh': { $regex: new RegExp(query, 'i') } },
            { 'name.en': { $regex: new RegExp(query, 'i') } },
            { code: { $regex: new RegExp(query, 'i') } },
            { 'teacher.name': { $regex: new RegExp(query, 'i') } }
          ],
        }
      : {};

    // 計算分頁
    const skip = (page - 1) * limit;

    try {
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
    } catch (queryError) {
      throw new Error(`查詢執行失敗: ${queryError.message}`);
    }

  } catch (error) {
    console.error('Database error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { 
        error: '資料庫操作失敗',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}