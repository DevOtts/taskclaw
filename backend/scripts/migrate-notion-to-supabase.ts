#!/usr/bin/env ts-node

/**
 * One-time Migration Script: Notion → Supabase
 * 
 * This script migrates all existing tasks from a Notion database into the new
 * Supabase-based multi-source task management system.
 * 
 * Steps:
 * 1. Authenticate with Supabase (using service role key)
 * 2. Fetch all tasks from Notion
 * 3. Extract unique categories from Notion tasks
 * 4. Create categories in Supabase
 * 5. Create Notion sources (one per category)
 * 6. Import all tasks into Supabase with proper references
 * 
 * Usage:
 *   ts-node scripts/migrate-notion-to-supabase.ts
 * 
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - NOTION_API_KEY
 *   - NOTION_DATABASE_ID
 *   - TARGET_ACCOUNT_ID (the account to import tasks into)
 */

import { createClient } from '@supabase/supabase-js';
import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';

dotenv.config();

interface NotionTask {
  id: string;
  title: string;
  category: string | null;
  status: string | null;
  priority: string | null;
  completed: boolean;
  notes: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
  dueDate?: string;
}

async function main() {
  console.log('🚀 Starting Notion → Supabase migration...\n');

  // Validate environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NOTION_API_KEY',
    'NOTION_DATABASE_ID',
    'TARGET_ACCOUNT_ID',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  const accountId = process.env.TARGET_ACCOUNT_ID!;

  // Initialize clients
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });

  console.log('✅ Clients initialized\n');

  // Step 1: Fetch all tasks from Notion
  console.log('📥 Fetching tasks from Notion...');
  const notionTasks = await fetchAllNotionTasks(notion, process.env.NOTION_DATABASE_ID!);
  console.log(`✅ Fetched ${notionTasks.length} tasks from Notion\n`);

  // Step 2: Extract unique categories
  const uniqueCategories = new Set<string>();
  notionTasks.forEach((task) => {
    if (task.category) uniqueCategories.add(task.category);
  });

  console.log(`📊 Found ${uniqueCategories.size} unique categories:`);
  uniqueCategories.forEach((cat) => console.log(`  - ${cat}`));
  console.log();

  // Step 3: Create categories in Supabase
  console.log('📁 Creating categories in Supabase...');
  const categoryMap = new Map<string, string>(); // category name → category ID

  for (const categoryName of uniqueCategories) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        account_id: accountId,
        name: categoryName,
        color: getColorForCategory(categoryName),
        icon: getIconForCategory(categoryName),
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create category "${categoryName}": ${error.message}`);
      continue;
    }

    categoryMap.set(categoryName, data.id);
    console.log(`  ✅ Created category: ${categoryName} (${data.id})`);
  }

  // Create a default category for tasks without one
  const { data: defaultCategory, error: defaultCategoryError } = await supabase
    .from('categories')
    .insert({
      account_id: accountId,
      name: 'Uncategorized',
      color: '#94a3b8',
      icon: '📝',
    })
    .select()
    .single();

  if (defaultCategoryError) {
    console.error(`❌ Failed to create default category: ${defaultCategoryError.message}`);
    process.exit(1);
  }

  categoryMap.set('__default__', defaultCategory.id);
  console.log(`  ✅ Created default category: Uncategorized (${defaultCategory.id})\n`);

  // Step 4: Create Notion sources (one per category)
  console.log('🔗 Creating Notion sources in Supabase...');
  const sourceMap = new Map<string, string>(); // category ID → source ID

  for (const [categoryName, categoryId] of categoryMap) {
    if (categoryName === '__default__') continue; // Skip default

    const { data, error } = await supabase
      .from('sources')
      .insert({
        account_id: accountId,
        category_id: categoryId,
        provider: 'notion',
        config: {
          api_key: process.env.NOTION_API_KEY,
          database_id: process.env.NOTION_DATABASE_ID,
        },
        sync_status: 'idle',
        sync_interval_minutes: 30,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create source for "${categoryName}": ${error.message}`);
      continue;
    }

    sourceMap.set(categoryId, data.id);
    console.log(`  ✅ Created Notion source for: ${categoryName} (${data.id})`);
  }

  console.log();

  // Step 5: Import all tasks
  console.log('📝 Importing tasks into Supabase...');
  let imported = 0;
  let failed = 0;

  for (const task of notionTasks) {
    try {
      const categoryId = task.category
        ? categoryMap.get(task.category)!
        : categoryMap.get('__default__')!;

      const sourceId = sourceMap.get(categoryId) || null;

      const { error } = await supabase.from('tasks').insert({
        account_id: accountId,
        category_id: categoryId,
        source_id: sourceId,
        external_id: task.id,
        title: task.title,
        status: mapNotionStatusToOTT(task.status),
        priority: mapNotionPriorityToOTT(task.priority),
        completed: task.completed,
        notes: task.notes,
        metadata: {
          original_category: task.category,
          original_status: task.status,
          original_priority: task.priority,
        },
        external_url: task.url,
        due_date: task.dueDate || null,
        completed_at: task.completed ? task.lastEditedTime : null,
        last_synced_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`  ❌ Failed to import task "${task.title}": ${error.message}`);
        failed++;
      } else {
        imported++;
        if (imported % 50 === 0) {
          console.log(`  ⏳ Imported ${imported} tasks so far...`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error importing task "${task.title}": ${(error as Error).message}`);
      failed++;
    }
  }

  console.log();
  console.log('🎉 Migration complete!');
  console.log(`  ✅ Imported: ${imported} tasks`);
  console.log(`  ❌ Failed: ${failed} tasks`);
  console.log(`  📊 Categories created: ${categoryMap.size}`);
  console.log(`  🔗 Sources created: ${sourceMap.size}\n`);
}

async function fetchAllNotionTasks(notion: Client, databaseId: string): Promise<NotionTask[]> {
  const tasks: NotionTask[] = [];
  let cursor: string | undefined;

  do {
    const response: any = await (notion.databases as any).query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      if (page.object === 'page' && 'properties' in page) {
        tasks.push(mapNotionPageToTask(page));
      }
    }

    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return tasks;
}

function mapNotionPageToTask(page: any): NotionTask {
  const props = page.properties;

  const getTitle = (prop: any): string => {
    if (prop?.type === 'title' && prop.title?.length > 0) {
      return prop.title.map((t: any) => t.plain_text).join('');
    }
    return 'Untitled';
  };

  const getSelect = (prop: any): string | null => {
    if (prop?.type === 'select' && prop.select) {
      return prop.select.name;
    }
    return null;
  };

  const getCheckbox = (prop: any): boolean => {
    if (prop?.type === 'checkbox') return prop.checkbox;
    return false;
  };

  const getRichText = (prop: any): string => {
    if (prop?.type === 'rich_text' && prop.rich_text?.length > 0) {
      return prop.rich_text.map((t: any) => t.plain_text).join('');
    }
    return '';
  };

  const getDate = (prop: any): string | undefined => {
    if (prop?.type === 'date' && prop.date?.start) {
      return prop.date.start;
    }
    return undefined;
  };

  return {
    id: page.id,
    title: getTitle(props['Task']),
    category: getSelect(props['Category']),
    status: getSelect(props['Status']),
    priority: getSelect(props['Priority']),
    completed: getCheckbox(props['Completed']),
    notes: getRichText(props['Notes']),
    url: page.url,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    dueDate: getDate(props['Date']),
  };
}

function mapNotionStatusToOTT(notionStatus: string | null): 'todo' | 'in_progress' | 'done' | 'blocked' {
  if (!notionStatus) return 'todo';

  const normalized = notionStatus.toLowerCase();
  if (normalized.includes('progress') || normalized.includes('doing')) return 'in_progress';
  if (normalized.includes('done') || normalized.includes('complete')) return 'done';
  if (normalized.includes('block')) return 'blocked';
  return 'todo';
}

function mapNotionPriorityToOTT(notionPriority: string | null): 'low' | 'medium' | 'high' | 'urgent' {
  if (!notionPriority) return 'medium';

  const normalized = notionPriority.toLowerCase();
  if (normalized.includes('urgent') || normalized.includes('🔥')) return 'urgent';
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('low')) return 'low';
  return 'medium';
}

function getColorForCategory(category: string): string {
  const colorMap: Record<string, string> = {
    'Personal': '#3b82f6',
    'Pessoal': '#3b82f6',
    'Agency': '#8b5cf6',
    '8FAI': '#8b5cf6',
    'Microfactory': '#10b981',
    'Polen': '#f59e0b',
    'KeHE': '#ef4444',
  };

  return colorMap[category] || '#6b7280';
}

function getIconForCategory(category: string): string {
  const iconMap: Record<string, string> = {
    'Personal': '👤',
    'Pessoal': '👤',
    'Agency': '🏢',
    '8FAI': '🏢',
    'Microfactory': '🏭',
    'Polen': '🐝',
    'KeHE': '🔥',
  };

  return iconMap[category] || '📁';
}

// Run the migration
main().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
