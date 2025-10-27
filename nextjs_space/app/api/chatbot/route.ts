
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const ABACUSAI_API_KEY = process.env.ABACUSAI_API_KEY;
const ABACUSAI_API_URL = 'https://abacus.ai/v1/chat/complete';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { message, sessionId } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message and session ID are required' }, { status: 400 });
    }

    // Get chat history for context
    const chatHistory = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // Build conversation context
    const conversationHistory = chatHistory.map((msg: { isBot: boolean; message: string; response: string }) => ({
      role: msg.isBot ? 'assistant' : 'user',
      content: msg.message || msg.response,
    }));

    // Add current message
    conversationHistory.push({
      role: 'user',
      content: message,
    });

    // System prompt for basketball e-commerce assistant
    const systemPrompt = `You are a helpful customer support assistant for a basketball apparel e-commerce platform specializing in Rise as One AAU Club and The Basketball Factory gear. 

Your responsibilities:
- Help customers find products
- Answer questions about orders, shipping, and returns
- Provide information about sizing and products
- Assist with design customization inquiries
- Be friendly, professional, and basketball-enthusiastic

Store policies:
- Standard shipping: 5-7 business days
- Express shipping: 2-3 business days
- Returns accepted within 30 days
- Custom designs require 2-3 weeks production time
- We offer youth and adult sizes for all products

Keep responses concise and helpful. If you don't know something, be honest and suggest contacting support at support@riseasonefactory.com.`;

    // Call LLM API
    const response = await fetch(ABACUSAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I am having trouble responding right now. Please try again.';

    // Analyze sentiment (simple keyword-based for now)
    const sentiment = analyzeSentiment(message);

    // Save conversation to database
    await prisma.chatMessage.create({
      data: {
        userId: session?.user?.id || null,
        sessionId,
        message,
        response: aiResponse,
        isBot: false,
        sentiment,
      },
    });

    await prisma.chatMessage.create({
      data: {
        userId: session?.user?.id || null,
        sessionId,
        message: '',
        response: aiResponse,
        isBot: true,
      },
    });

    return NextResponse.json({ 
      response: aiResponse,
      sentiment,
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({ 
      error: 'Failed to process message',
      response: 'I apologize, but I am experiencing technical difficulties. Please try again later or contact support@riseasonefactory.com for immediate assistance.'
    }, { status: 500 });
  }
}

function analyzeSentiment(text: string): string {
  const positiveWords = ['great', 'love', 'awesome', 'excellent', 'amazing', 'thanks', 'thank you', 'perfect', 'good'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'problem', 'issue', 'broken', 'wrong'];
  
  const lowerText = text.toLowerCase();
  const hasPositive = positiveWords.some(word => lowerText.includes(word));
  const hasNegative = negativeWords.some(word => lowerText.includes(word));
  
  if (hasNegative && !hasPositive) return 'NEGATIVE';
  if (hasPositive && !hasNegative) return 'POSITIVE';
  return 'NEUTRAL';
}

// GET endpoint to retrieve chat history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        message: true,
        response: true,
        isBot: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json({ error: 'Failed to get chat history' }, { status: 500 });
  }
}
