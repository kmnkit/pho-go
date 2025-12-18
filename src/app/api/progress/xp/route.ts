import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userProgress } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// PATCH: Add experience points
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { points } = await request.json();
    
    if (!points || points <= 0) {
      return NextResponse.json(
        { error: 'Invalid points value' }, 
        { status: 400 }
      );
    }

    // Get current progress
    const progress = await db.select()
      .from(userProgress)
      .where(eq(userProgress.userId, session.user.id))
      .limit(1);

    if (progress.length === 0) {
      return NextResponse.json(
        { error: 'User progress not found' }, 
        { status: 404 }
      );
    }

    const currentXP = progress[0].experiencePoints || 0;
    const newXP = currentXP + points;
    const newLevel = Math.floor(newXP / 100) + 1;

    // Update progress
    await db.update(userProgress)
      .set({ 
        experiencePoints: newXP,
        currentLevel: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(userProgress.userId, session.user.id));

    return NextResponse.json({ 
      success: true, 
      experiencePoints: newXP,
      currentLevel: newLevel,
    });
  } catch (error) {
    console.error('XP update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}