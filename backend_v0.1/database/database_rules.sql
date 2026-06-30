-- 🚀 STEP 1: FORCE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────
-- 👤 STEP 2: SECURITY POLICIES FOR THE PROFILES TABLE
-- ───────────────────────────────────────────────────────────

-- Allow users to read ONLY their own profile data row
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Allow users to update ONLY their own profile data (e.g., updating bank details)
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- ───────────────────────────────────────────────────────────
-- 📜 STEP 3: SECURITY POLICIES FOR WALLET TRANSACTIONS
-- ───────────────────────────────────────────────────────────

-- Allow users to read ONLY their own historical transaction statements
CREATE POLICY "Users can view their own transaction history" 
ON wallet_transactions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────
-- 📦 STEP 4: SECURITY POLICIES FOR SAVINGS GROUPS
-- ───────────────────────────────────────────────────────────

-- Allow any authenticated user to view groups (Essential for previewing invite links!)
CREATE POLICY "Authenticated users can view savings groups" 
ON savings_groups FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to create a group record
CREATE POLICY "Authenticated users can create savings groups" 
ON savings_groups FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = creator_id);

-- ───────────────────────────────────────────────────────────
-- 🔗 STEP 5: SECURITY POLICIES FOR THE GROUP MEMBERS JUNCTION
-- ───────────────────────────────────────────────────────────

-- Allow members of a group to view who else is in that group
CREATE POLICY "Group members can view fellow group participants" 
ON group_members FOR SELECT 
TO authenticated 
USING (
    auth.uid() = user_id 
    OR 
    group_id IN (SELECT g.group_id FROM group_members g WHERE g.user_id = auth.uid())
);

-- Allow users to insert themselves into a group when they click 'Accept Invite'
CREATE POLICY "Users can join a group via invite" 
ON group_members FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);
