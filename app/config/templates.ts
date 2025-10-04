// Query Templates Configuration
// Add new templates to this array to make them available in the UI

export type QueryTemplate = {
  id: string;
  name: string;
  description: string;
  defaultPrompt: string;
  placeholders: string[];
  databasesSupported: string[];
};

export const queryTemplates: QueryTemplate[] = [
  {
    id: 'recent_users',
    name: 'Users Registered in Last N Days',
    description: 'Find users registered in the last N days',
    defaultPrompt: 'Show all users who registered in the last {{days}} days',
    placeholders: ['days'],
    databasesSupported: ['sqlalchemy', 'sqlite', 'snowflake'],
  },
  {
    id: 'top_products',
    name: 'Top 10 Products by Sales',
    description: 'Lists the top 10 selling products by total revenue',
    defaultPrompt: 'Find the top 10 products by total sales',
    placeholders: [],
    databasesSupported: ['sqlalchemy', 'sqlite'],
  },
  {
    id: 'user_orders',
    name: 'Orders for a Specific User',
    description: 'Show all orders placed by a specific user',
    defaultPrompt: 'Show all orders placed by user with ID {{user_id}}',
    placeholders: ['user_id'],
    databasesSupported: ['sqlalchemy', 'sqlite', 'snowflake'],
  },
  {
    id: 'sales_by_date',
    name: 'Sales Between Dates',
    description: 'Get total sales between two dates',
    defaultPrompt: 'Show total sales from {{start_date}} to {{end_date}}',
    placeholders: ['start_date', 'end_date'],
    databasesSupported: ['sqlalchemy', 'sqlite', 'snowflake'],
  },
  {
    id: 'active_customers',
    name: 'Active Customers in Last Month',
    description: 'List customers who made a purchase in the last month',
    defaultPrompt: 'List all customers who made a purchase in the last month',
    placeholders: [],
    databasesSupported: ['sqlalchemy', 'sqlite', 'snowflake'],
  },
  {
    id: 'inventory_below_threshold',
    name: 'Products Low in Inventory',
    description: 'Find products with inventory below a certain threshold',
    defaultPrompt: 'Show all products with inventory less than {{threshold}}',
    placeholders: ['threshold'],
    databasesSupported: ['sqlalchemy', 'sqlite'],
  },
  {
    id: 'user_login_activity',
    name: 'User Login Activity',
    description: 'Show login activity for a specific user in a date range',
    defaultPrompt: 'Show login activity for user {{user_id}} from {{start_date}} to {{end_date}}',
    placeholders: ['user_id', 'start_date', 'end_date'],
    databasesSupported: ['sqlalchemy', 'sqlite', 'snowflake'],
  },
  {
    id: 'top_customers',
    name: 'Top Customers by Purchase Amount',
    description: 'List the top N customers by total purchase amount',
    defaultPrompt: 'List the top {{n}} customers by total purchase amount',
    placeholders: ['n'],
    databasesSupported: ['sqlalchemy', 'sqlite', 'snowflake'],
  },
];
