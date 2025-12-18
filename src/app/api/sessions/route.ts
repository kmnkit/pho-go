import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { studySessions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET: Fetch user's study sessions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sessions = await db.select()
      .from(studySessions)
      .where(eq(studySessions.userId, session.user.id))
      .orderBy(desc(studySessions.date))
      .limit(Math.min(limit, 1000)) // Cap at 1000
      .offset(offset);

    return NextResponse.json({
      sessions,
      hasMore: sessions.length === limit,
    });
  } catch (error) {
    console.error('Sessions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST: Add new study session
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = await request.json();
    
    // Validate required fields
    const required = ['duration_minutes', 'words_practiced', 'activity_type', 'xp_earned', 'words_learned'];
    for (const field of required) {
      if (sessionData[field] === undefined || sessionData[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` }, 
          { status: 400 }
        );
      }
    }

    // Validate activity type
    const validTypes = ['flashcard', 'quiz', 'learning'];
    if (!validTypes.includes(sessionData.activity_type)) {
      return NextResponse.json(
        { error: 'Invalid activity type' }, 
        { status: 400 }
      );
    }

    const newSession = await db.insert(studySessions)
      .values({
        userId: session.user.id,
        date: sessionData.date ? new Date(sessionData.date) : new Date(),
        durationMinutes: sessionData.duration_minutes,
        wordsPracticed: sessionData.words_practiced,
        quizScore: sessionData.quiz_score,
        activityType: sessionData.activity_type,
        xpEarned: sessionData.xp_earned,
        wordsLearned: sessionData.words_learned,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      session: newSession[0],
    });
  } catch (error) {
    console.error('Session POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}