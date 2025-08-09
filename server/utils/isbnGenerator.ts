import { db } from "../db";
import { books } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Generates a unique ISBN placeholder with format "PlaceHolder-XXXXXXXX"
 * where XXXXXXXX is a unique 8-digit number
 */
export async function generateUniqueIsbnPlaceholder(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Generate 8-digit random number
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
    const isbnPlaceholder = `PlaceHolder-${randomNumber}`;
    
    try {
      // Check if this placeholder already exists across all books
      const existingBook = await db
        .select({ id: books.id })
        .from(books)
        .where(sql`${books.isbnPlaceholder} = ${isbnPlaceholder}`)
        .limit(1);
      
      if (existingBook.length === 0) {
        return isbnPlaceholder;
      }
      
      attempts++;
    } catch (error) {
      console.error('Error checking ISBN placeholder uniqueness:', error);
      attempts++;
    }
  }
  
  // Fallback: use timestamp if random generation fails
  const timestamp = Date.now();
  return `PlaceHolder-${timestamp}`;
}

/**
 * Ensures a book has an ISBN placeholder if it doesn't have an official ISBN
 */
export async function ensureIsbnPlaceholder(bookId: string, currentIsbn?: string | null): Promise<string | null> {
  // If book already has an official ISBN, no placeholder needed
  if (currentIsbn && !currentIsbn.startsWith('PlaceHolder-')) {
    return null;
  }
  
  try {
    // Check if book already has a placeholder
    const book = await db
      .select({ isbnPlaceholder: books.isbnPlaceholder })
      .from(books)
      .where(sql`${books.id} = ${bookId}`)
      .limit(1);
    
    if (book[0]?.isbnPlaceholder) {
      return book[0].isbnPlaceholder;
    }
    
    // Generate new placeholder and update the book
    const newPlaceholder = await generateUniqueIsbnPlaceholder();
    
    await db
      .update(books)
      .set({ isbnPlaceholder: newPlaceholder })
      .where(sql`${books.id} = ${bookId}`);
    
    return newPlaceholder;
  } catch (error) {
    console.error('Error ensuring ISBN placeholder:', error);
    return null;
  }
}