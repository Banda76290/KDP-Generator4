import { db } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import { getTableColumns } from 'drizzle-orm';

export interface DatabaseField {
  table: string;
  field: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  description: string;
  options?: string[];
}

class DatabaseFieldsService {
  // Dynamic field extraction from database schema
  private extractFieldsFromTable(tableName: string, table: any, category: string): DatabaseField[] {
    const columns = getTableColumns(table);
    const fields: DatabaseField[] = [];
    
    Object.entries(columns).forEach(([columnName, columnDef]: [string, any]) => {
      // Skip system fields
      if (['id', 'createdAt', 'updatedAt', 'userId'].includes(columnName)) {
        return;
      }
      
      // Determine field type based on column definition
      let fieldType: 'text' | 'number' | 'date' | 'boolean' | 'select' = 'text';
      let options: string[] | undefined;
      
      if (columnDef.dataType === 'integer' || columnDef.dataType === 'real') {
        fieldType = 'number';
      } else if (columnDef.dataType === 'boolean') {
        fieldType = 'boolean';
      } else if (columnDef.dataType === 'timestamp') {
        fieldType = 'date';
      } else if (columnName === 'language') {
        fieldType = 'select';
        options = ['Français', 'English', 'Español', 'Deutsch', 'Italiano', 'Português', '中文', '日本語'];
      } else if (columnName === 'status') {
        fieldType = 'select';
        options = ['draft', 'in_progress', 'review', 'published', 'archived'];
      } else if (columnName === 'role') {
        fieldType = 'select';
        options = ['user', 'premium', 'admin', 'superadmin'];
      }
      
      // Generate display name and description
      const displayName = this.generateDisplayName(columnName);
      const description = this.generateDescription(columnName, category);
      
      fields.push({
        table: tableName,
        field: columnName,
        displayName,
        type: fieldType,
        description,
        options
      });
    });
    
    return fields;
  }
  
  private generateDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      'title': 'Titre',
      'subtitle': 'Sous-titre', 
      'description': 'Description',
      'name': 'Nom',
      'firstName': 'Prénom',
      'lastName': 'Nom de famille',
      'email': 'Email',
      'language': 'Langue',
      'categories': 'Catégories',
      'keywords': 'Mots-clés',
      'targetAudience': 'Public cible',
      'ebookPrice': 'Prix eBook',
      'paperbackPrice': 'Prix broché',
      'hardcoverPrice': 'Prix relié',
      'manuscriptPages': 'Pages manuscrit',
      'expectedLength': 'Longueur attendue',
      'coverImageUrl': 'Image de couverture',
      'status': 'Statut',
      'role': 'Rôle',
      'profileImageUrl': 'Photo de profil',
      'projectId': 'ID Projet',
      'publicationDate': 'Date de publication'
    };
    
    return displayNames[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  }
  
  private generateDescription(fieldName: string, category: string): string {
    const descriptions: Record<string, string> = {
      'title': 'Le titre principal du livre',
      'subtitle': 'Le sous-titre du livre',
      'description': `Description détaillée du ${category.toLowerCase()}`,
      'name': `Nom du ${category.toLowerCase()}`,
      'firstName': 'Prénom de l\'auteur',
      'lastName': 'Nom de famille de l\'auteur',
      'email': 'Adresse email',
      'language': 'Langue principale d\'écriture',
      'categories': 'Liste des catégories du livre',
      'keywords': 'Mots-clés pour le référencement',
      'targetAudience': 'Public cible du livre',
      'ebookPrice': 'Prix de vente de l\'eBook (€)',
      'paperbackPrice': 'Prix de vente du livre broché (€)',
      'hardcoverPrice': 'Prix de vente du livre relié (€)',
      'manuscriptPages': 'Nombre de pages du manuscrit',
      'expectedLength': 'Longueur attendue en mots',
      'coverImageUrl': 'URL de l\'image de couverture',
      'status': 'Statut actuel',
      'role': 'Rôle utilisateur',
      'profileImageUrl': 'URL de la photo de profil',
      'projectId': 'Identifiant du projet parent',
      'publicationDate': 'Date de publication prévue'
    };
    
    return descriptions[fieldName] || `Champ ${fieldName} de la table ${category.toLowerCase()}`;
  }

  // Get all available database fields for AI prompt variables
  getAvailableFields(): DatabaseField[] {
    console.log('Getting available fields...');
    
    const dynamicFields: DatabaseField[] = [
      // Extract from books table
      ...this.extractFieldsFromTable('books', schema.books, 'Livre'),
      // Extract from projects table  
      ...this.extractFieldsFromTable('projects', schema.projects, 'Projet'),
      // Extract from users table
      ...this.extractFieldsFromTable('users', schema.users, 'Auteur')
    ];
    
    console.log('Extracted dynamic fields:', dynamicFields.length);
    
    // Add computed/calculated fields
    const computedFields: DatabaseField[] = [
      { 
        table: 'computed', 
        field: 'fullAuthorName', 
        displayName: 'Nom Complet Auteur', 
        type: 'text', 
        description: 'Prénom + nom de l\'auteur' 
      },
      { 
        table: 'computed', 
        field: 'bookFullTitle', 
        displayName: 'Titre Complet du Livre', 
        type: 'text', 
        description: 'Titre + sous-titre du livre' 
      },
      { 
        table: 'computed', 
        field: 'currentDate', 
        displayName: 'Date Actuelle', 
        type: 'date', 
        description: 'Date du jour au format français' 
      },
      { 
        table: 'computed', 
        field: 'currentYear', 
        displayName: 'Année Actuelle', 
        type: 'number', 
        description: 'Année en cours' 
      }
    ];

    return [...dynamicFields, ...computedFields];
  }

  // Organize fields by category for display
  getCategorizedFields(): Record<string, DatabaseField[]> {
    const fields = this.getAvailableFields();
    console.log('Total fields found:', fields.length);
    
    const categories: Record<string, DatabaseField[]> = {
      'Livre': [],
      'Projet': [],
      'Auteur': [],
      'Système': []
    };

    fields.forEach(field => {
      console.log(`Processing field: ${field.field} from table: ${field.table}`);
      if (field.table === 'books') {
        categories['Livre'].push(field);
      } else if (field.table === 'projects') {
        categories['Projet'].push(field);
      } else if (field.table === 'users') {
        categories['Auteur'].push(field);
      } else if (field.table === 'computed') {
        categories['Système'].push(field);
      }
    });

    console.log('Categories result:', Object.keys(categories).map(key => `${key}: ${categories[key].length}`));
    return categories;
  }

  // Get field values for a specific context
  async getFieldValues(context: { bookId?: string; projectId?: string }): Promise<Record<string, any>> {
    const values: Record<string, any> = {};

    try {
      // Get book data if bookId provided
      if (context.bookId) {
        const [book] = await db.select().from(schema.books).where(eq(schema.books.id, context.bookId));
        if (book) {
          Object.keys(book).forEach(key => {
            if (!['id', 'createdAt', 'updatedAt', 'userId'].includes(key)) {
              values[key] = (book as any)[key];
            }
          });
          
          // Computed fields for book
          values.bookFullTitle = `${book.title}${book.subtitle ? ' - ' + book.subtitle : ''}`;
        }
      }

      // Get project data if projectId provided
      if (context.projectId) {
        const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, context.projectId));
        if (project) {
          Object.keys(project).forEach(key => {
            if (!['id', 'createdAt', 'updatedAt', 'userId'].includes(key)) {
              values[key] = (project as any)[key];
            }
          });
        }
      }

      // Get user data (author info) - assuming we have user context
      // This would need to be enhanced with actual user context
      
      // Computed system values
      values.currentDate = new Date().toLocaleDateString('fr-FR');
      values.currentYear = new Date().getFullYear();

    } catch (error) {
      console.error('Error getting field values:', error);
    }

    return values;
  }

  // Replace variables in a text template
  replaceVariables(template: string, values: Record<string, any>): string {
    let result = template;
    
    // Replace all {variable} occurrences
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value || ''));
    });
    
    return result;
  }
}

export const databaseFieldsService = new DatabaseFieldsService();