# Query Templates

The Query Template System allows users to generate natural language prompts from reusable templates. This feature is designed to speed up common queries and help non-technical users learn query patterns.

## 🔧 Adding a Template

Templates are defined in `app/config/templates.ts`:

```ts
export const queryTemplates: QueryTemplate[] = [
  {
    id: 'recent_users',
    name: 'Users Registered in Last N Days',
    description: 'Find users registered in the last N days',
    defaultPrompt: 'Show all users who registered in the last {{days}} days',
    placeholders: ['days'],
    databasesSupported: ['sqlalchemy', 'sqlite', 'snowflake']
  }
  // ...more templates
];
```

Each template includes:

- `id`: Unique identifier
- `name`: Display name
- `description`: Shown in the UI
- `defaultPrompt`: The natural language prompt (supports `{{placeholders}}`)
- `placeholders`: Array of required variables
- `databasesSupported`: Limit where the template is shown

## 🧪 Using Templates in the UI

1. Go to `/db-console`
2. Select a template from the dropdown
3. Fill in any required variables
4. Click “Use Template” to insert the prompt
5. (Optional) Edit the prompt before clicking “Execute Query”

## 📁 Extending Templates

To add new templates, simply add objects to the `queryTemplates` array in `app/config/templates.ts` following the structure above.

## 🔄 Optional Improvements

- Allow template filtering based on selected DB type
- Support user-created or saved templates
- Add template preview in SQL (once conversion happens)
