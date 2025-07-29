import { db } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../shared/schema';

export interface DatabaseField {
  table: string;
  field: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  description: string;
  options?: string[];
}

class DatabaseFieldsService {
  // Get all available database fields for AI prompt variables
  getAvailableFields(): DatabaseField[] {
    const fields: DatabaseField[] = [
      // Project fields
      { 
        table: 'projects', 
        field: 'name', 
        displayName: 'Nom du Projet', 
        type: 'text', 
        description: 'Le nom/titre du projet' 
      },
      { 
        table: 'projects', 
        field: 'description', 
        displayName: 'Description du Projet', 
        type: 'text', 
        description: 'Description détaillée du projet' 
      },

      // Book fields
      { 
        table: 'books', 
        field: 'title', 
        displayName: 'Titre du Livre', 
        type: 'text', 
        description: 'Le titre principal du livre' 
      },
      { 
        table: 'books', 
        field: 'subtitle', 
        displayName: 'Sous-titre du Livre', 
        type: 'text', 
        description: 'Le sous-titre du livre' 
      },
      { 
        table: 'books', 
        field: 'description', 
        displayName: 'Description du Livre', 
        type: 'text', 
        description: 'Description marketing du livre' 
      },
      { 
        table: 'books', 
        field: 'language', 
        displayName: 'Langue du Livre', 
        type: 'select', 
        description: 'Langue principale d\'écriture',
        options: ['Français', 'English', 'Español', 'Deutsch', 'Italiano', 'Português', '中文', '日本語']
      },
      { 
        table: 'books', 
        field: 'primaryCategory', 
        displayName: 'Catégorie Principale', 
        type: 'text', 
        description: 'Catégorie principale du livre' 
      },
      { 
        table: 'books', 
        field: 'secondaryCategory', 
        displayName: 'Catégorie Secondaire', 
        type: 'text', 
        description: 'Catégorie secondaire du livre' 
      },
      { 
        table: 'books', 
        field: 'keywords', 
        displayName: 'Mots-clés', 
        type: 'text', 
        description: 'Mots-clés de recherche' 
      },
      { 
        table: 'books', 
        field: 'ebookPrice', 
        displayName: 'Prix eBook', 
        type: 'number', 
        description: 'Prix de vente de l\'eBook' 
      },
      { 
        table: 'books', 
        field: 'paperbackPrice', 
        displayName: 'Prix Livre Papier', 
        type: 'number', 
        description: 'Prix de vente du livre papier' 
      },
      { 
        table: 'books', 
        field: 'publicationStatus', 
        displayName: 'Statut de Publication', 
        type: 'select', 
        description: 'Statut actuel du livre',
        options: ['draft', 'in_review', 'published', 'discontinued']
      },
      { 
        table: 'books', 
        field: 'targetAudience', 
        displayName: 'Public Cible', 
        type: 'text', 
        description: 'Description du public cible' 
      },
      { 
        table: 'books', 
        field: 'manuscriptPages', 
        displayName: 'Nombre de Pages', 
        type: 'number', 
        description: 'Nombre de pages du manuscrit' 
      },
      { 
        table: 'books', 
        field: 'expectedLength', 
        displayName: 'Longueur Attendue', 
        type: 'number', 
        description: 'Nombre de mots attendu' 
      },

      // User fields
      { 
        table: 'users', 
        field: 'firstName', 
        displayName: 'Prénom de l\'Auteur', 
        type: 'text', 
        description: 'Prénom de l\'auteur/utilisateur' 
      },
      { 
        table: 'users', 
        field: 'lastName', 
        displayName: 'Nom de l\'Auteur', 
        type: 'text', 
        description: 'Nom de famille de l\'auteur' 
      },
      { 
        table: 'users', 
        field: 'email', 
        displayName: 'Email de l\'Auteur', 
        type: 'text', 
        description: 'Adresse email de l\'auteur' 
      },

      // Additional computed fields
      { 
        table: 'computed', 
        field: 'fullAuthorName', 
        displayName: 'Nom Complet de l\'Auteur', 
        type: 'text', 
        description: 'Prénom + Nom de l\'auteur' 
      },
      { 
        table: 'computed', 
        field: 'bookFullTitle', 
        displayName: 'Titre Complet du Livre', 
        type: 'text', 
        description: 'Titre + Sous-titre si disponible' 
      },
      { 
        table: 'computed', 
        field: 'currentDate', 
        displayName: 'Date Actuelle', 
        type: 'date', 
        description: 'Date du jour au format local' 
      },
      { 
        table: 'computed', 
        field: 'currentYear', 
        displayName: 'Année Actuelle', 
        type: 'number', 
        description: 'Année en cours' 
      }
    ];

    return fields;
  }

  // Get fields grouped by category for UI display
  getFieldsByCategory(): Record<string, DatabaseField[]> {
    const fields = this.getAvailableFields();
    const grouped: Record<string, DatabaseField[]> = {
      'Livre': [],
      'Projet': [],
      'Auteur': [],
      'Système': []
    };

    fields.forEach(field => {
      if (field.table === 'books') {
        grouped['Livre'].push(field);
      } else if (field.table === 'projects') {
        grouped['Projet'].push(field);
      } else if (field.table === 'users') {
        grouped['Auteur'].push(field);
      } else if (field.table === 'computed') {
        grouped['Système'].push(field);
      }
    });

    return grouped;
  }

  // Get actual data for a specific context (book, project, user)
  async getFieldValues(context: {
    bookId?: string;
    projectId?: string;
    userId?: string;
  }): Promise<Record<string, any>> {
    const values: Record<string, any> = {};

    try {
      // Get user data
      if (context.userId) {
        const [user] = await db.select().from(schema.users).where(eq(schema.users.id, context.userId));
        if (user) {
          values['firstName'] = user.firstName;
          values['lastName'] = user.lastName;
          values['email'] = user.email;
          values['fullAuthorName'] = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
      }

      // Get project data
      if (context.projectId) {
        const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, context.projectId));
        if (project) {
          values['projectName'] = project.name;
          values['projectDescription'] = project.description;
        }
      }

      // Get book data
      if (context.bookId) {
        const [book] = await db.select().from(schema.books).where(eq(schema.books.id, context.bookId));
        if (book) {
          values['title'] = book.title;
          values['subtitle'] = book.subtitle;
          values['description'] = book.description;
          values['language'] = book.language;
          values['primaryCategory'] = book.primaryCategory;
          values['secondaryCategory'] = book.secondaryCategory;
          values['keywords'] = book.keywords;
          values['ebookPrice'] = book.ebookPrice;
          values['paperbackPrice'] = book.paperbackPrice;
          values['publicationStatus'] = book.publicationStatus;
          values['targetAudience'] = book.targetAudience;
          values['manuscriptPages'] = book.manuscriptPages;
          values['expectedLength'] = book.expectedLength;
          values['bookFullTitle'] = book.subtitle ? `${book.title}: ${book.subtitle}` : book.title;
        }
      }

      // Add system computed fields
      values['currentDate'] = new Date().toLocaleDateString('fr-FR');
      values['currentYear'] = new Date().getFullYear();

      return values;
    } catch (error) {
      console.error('Error getting field values:', error);
      return values;
    }
  }

  // Replace variables in text with actual values
  replaceVariables(text: string, values: Record<string, any>): string {
    let result = text;
    
    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, String(value));
      }
    });

    // Remove unreplaced variables
    result = result.replace(/{[^}]+}/g, '[non défini]');

    return result;
  }
}

export const databaseFieldsService = new DatabaseFieldsService();