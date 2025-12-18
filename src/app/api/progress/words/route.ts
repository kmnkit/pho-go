import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userProgress } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// PATCH: Update learned words
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wordId, action } = await request.json();
    
    if (!wordId || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request body' }, 
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

    const currentWords = progress[0].learnedWords || [];
    let updatedWords: string[];

    if (action === 'add' && !currentWords.includes(wordId)) {
      updatedWords = [...currentWords, wordId];
    } else if (action === 'remove') {
      updatedWords = currentWords.filter(id => id !== wordId);
    } else {
      updatedWords = currentWords; // No change needed
    }

    // Update progress
    await db.update(userProgress)
      .set({ 
        learnedWords: updatedWords,
        updatedAt: new Date(),
      })
      .where(eq(userProgress.userId, session.user.id));

    return NextResponse.json({ 
      success: true, 
      learnedWords: updatedWords 
    });
  } catch (error) {
    console.error('Words update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}