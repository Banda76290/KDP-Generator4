# Guide des Pages IA - À quoi sert chaque page ?

## 🎯 **PAGE 1 : AI Configuration** (`/admin/ai-config`)
**QUI :** Administrateur uniquement  
**QUOI :** Configuration complète du système IA  
**OÙ :** Section Administration → AI Configuration

### Ce que vous faites ici :
1. **📝 Gérer les Templates de Prompts**
   - Créer/modifier les prompts système et utilisateur
   - Exemple : "Tu es un expert en écriture. Génère une description pour le livre {title}..."

2. **🤖 Configurer les Modèles IA**
   - Activer/désactiver GPT-4o, GPT-4o-mini, etc.
   - Définir les coûts par token
   - Contrôler l'accès par abonnement

3. **📊 Gérer les Limites d'Usage**
   - Définir combien de tokens par mois pour les utilisateurs gratuits/premium
   - Fixer les limites de requêtes

4. **📈 Voir les Statistiques**
   - Coût total des générations IA
   - Tokens utilisés ce mois
   - Utilisations par fonction

**Résumé :** Vous paramétrez TOUT le comportement de l'IA ici.

---

## 📚 **PAGE 2 : Variables IA** (`/admin/ai-variables`)
**QUI :** Administrateur uniquement  
**QUOI :** Documentation des variables disponibles  
**OÙ :** Section Administration → Variables IA

### Ce que vous voyez ici :
1. **📋 Liste de Toutes les Variables**
   - Variables Livre : `{title}`, `{language}`, `{categories}`, etc.
   - Variables Projet : `{name}`, `{description}`
   - Variables Auteur : `{firstName}`, `{lastName}`, `{email}`
   - Variables Système : `{currentDate}`, `{fullAuthorName}`

2. **📖 Documentation**
   - Comment utiliser chaque variable
   - Exemples concrets de prompts
   - Variables spéciales (calculées automatiquement)

**Résumé :** Pure documentation pour savoir quelles variables utiliser dans vos prompts.

---

## 🔄 **Comment les 2 pages travaillent ensemble :**

1. **Page Variables IA** → Je découvre que `{title}` et `{language}` existent
2. **Page AI Configuration** → Je crée un prompt : *"Génère une description du livre {title} en {language}"*
3. **Utilisateur final** → Utilise l'assistant IA qui remplace automatiquement les variables

---

## ✅ **Workflow Administrateur Typique :**

### Étape 1 - Découverte (Variables IA)
- "Quelles variables puis-je utiliser ?"
- "Comment écrire un bon prompt ?"

### Étape 2 - Configuration (AI Configuration) 
- Créer des templates de prompts avec les variables
- Configurer les modèles et limites
- Tester et ajuster

### Étape 3 - Suivi (AI Configuration)
- Voir les stats d'usage
- Ajuster les coûts si nécessaire

---

## 🎯 **EN RÉSUMÉ :**
- **Variables IA** = Manuel de référence (lecture)
- **AI Configuration** = Tableau de bord de contrôle (action)

C'est comme avoir d'un côté la documentation technique, de l'autre le panneau de configuration !