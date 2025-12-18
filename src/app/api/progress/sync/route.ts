import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userProgress, studySessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET: Fetch user's progress data
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user progress
    const progress = await db.select()
      .from(userProgress)
      .where(eq(userProgress.userId, session.user.id))
      .limit(1);

    // Get recent study sessions (last 1000)
    const sessions = await db.select()
      .from(studySessions)
      .where(eq(studySessions.userId, session.user.id))
      .orderBy(studySessions.createdAt)
      .limit(1000);

    // If no progress exists, create default
    if (progress.length === 0) {
      const defaultProgress = await db.insert(userProgress)
        .values({
          userId: session.user.id,
          learnedWords: [],
          currentLevel: 1,
          experiencePoints: 0,
          streakDays: 0,
          lastStudyDate: '',
        })
        .returning();

      return NextResponse.json({
        progress: defaultProgress[0],
        sessions: [],
      });
    }

    return NextResponse.json({
      progress: progress[0],
      sessions,
    });
  } catch (error) {
    console.error('Progress sync GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST: Upload/sync user's progress data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { progress: clientProgress, sessions: clientSessions } = body;

    // Update user progress
    if (clientProgress) {
      await db.insert(userProgress)
        .values({
          userId: session.user.id,
          learnedWords: clientProgress.learned_words || [],
          currentLevel: clientProgress.current_level || 1,
          experiencePoints: clientProgress.experience_points || 0,
          streakDays: clientProgress.streak_days || 0,
          lastStudyDate: clientProgress.last_study_date || '',
        })
        .onConflictDoUpdate({
          target: userProgress.userId,
          set: {
            learnedWords: clientProgress.learned_words || [],
            currentLevel: clientProgress.current_level || 1,
            experiencePoints: clientProgress.experience_points || 0,
            streakDays: clientProgress.streak_days || 0,
            lastStudyDate: clientProgress.last_study_date || '',
            updatedAt: new Date(),
          },
        });
    }

    // Add new study sessions
    if (clientSessions && Array.isArray(clientSessions)) {
      for (const sessionData of clientSessions) {
        await db.insert(studySessions)
          .values({
            userId: session.user.id,
            date: new Date(sessionData.date),
            durationMinutes: sessionData.duration_minutes,
            wordsPracticed: sessionData.words_practiced,
            quizScore: sessionData.quiz_score,
            activityType: sessionData.activity_type,
            xpEarned: sessionData.xp_earned,
            wordsLearned: sessionData.words_learned,
          })
          .onConflictDoNothing(); // Avoid duplicate sessions
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress sync POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}