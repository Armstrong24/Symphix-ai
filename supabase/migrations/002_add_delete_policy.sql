-- ============================================
-- Add DELETE policy for workflow_runs
-- Run this in Supabase SQL Editor
-- ============================================

-- Allow users to delete their own workflow runs
create policy "Users can delete own runs" on public.workflow_runs
  for delete using (auth.uid() = user_id);
