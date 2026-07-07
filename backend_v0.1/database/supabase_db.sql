
-- ─── STEP 1: DEFINE STRICT ENUM SECURITY GUARDRAILS ───
-- These enforce database-level data validation before any row can save
CREATE TYPE transaction_type_enum AS ENUM ('TOPUP', 'WITHDRAWAL', 'DEBIT_TO_GROUP', 'CREDIT_FROM_GROUP');
CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE group_period_enum AS ENUM ('WEEKLY', 'BI_WEEKLY', 'MONTHLY');
CREATE TYPE group_lifecycle_enum AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'PROPOSED_CHANGES');

-- ─── STEP 2: CREATE THE INDIVIDUAL WALLET LEDGER ───
CREATE TABLE profiles (
    -- Maps securely to Supabase's built-in Auth authentication database UUID
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_no TEXT NOT NULL,
    
    -- Enforce exact NUMERIC decimal lengths for secure financial math
    wallet_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    
    -- Identity Verification Status
    identity_status TEXT DEFAULT 'UNVERIFIED' NOT NULL, -- 'VERIFIED' or 'FAILED'
    verified_bvn TEXT UNIQUE,
    verified_nin TEXT UNIQUE,
    verified_dob TEXT,
    
    -- Nomba Virtual Account parameters (Populated post-signup via background trigger)
    nomba_virtual_account TEXT UNIQUE, -- e.g., '9920113421'
    nomba_bank_name TEXT,              -- e.g., 'Wema Bank'
    nomba_account_ref TEXT UNIQUE,     -- e.g., 'USER_REF_uuid'
    
    -- Separately Linked Real Bank Payout Parameters (NULL at signup, filled later)
    linked_bank_code TEXT,             -- e.g., '058' for GTB
    linked_bank_name TEXT,             -- e.g., 'Guaranty Trust Bank'
    linked_account_number TEXT,        -- User's 10-digit real bank account
    linked_account_name TEXT,          -- The official name verified by Nomba Lookup
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─── STEP 3: CREATE THE UNCHANGEABLE AUDIT TRANSACTION LOG ───
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type transaction_type_enum NOT NULL,
    status transaction_status_enum DEFAULT 'PENDING' NOT NULL,
    nomba_transaction_ref TEXT UNIQUE, -- Keeps track of the upstream Nomba network receipt ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─── STEP 4: CREATE THE GROUP SAVINGS STRUCTURAL DIRECTORY ───
CREATE TABLE savings_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    contribution_amount NUMERIC(15, 2) NOT NULL,
    cycle_period group_period_enum NOT NULL,
    max_slots INT NOT NULL,
    status group_lifecycle_enum DEFAULT 'DRAFT' NOT NULL,
    current_cycle_round INT DEFAULT 1 NOT NULL,
    current_total_saved NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    
    -- All hackathon savings circles point to your single active Sub-Account ID vault
    nomba_sub_account_id TEXT NOT NULL,
    group_link TEXT UNIQUE,
    activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─── STEP 5: CREATE THE ROTATION MATRIX JUNCTION TABLE ───
CREATE TABLE group_members (
    group_id UUID REFERENCES savings_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    slot_position INT NOT NULL, -- The specific cycle round when they collect the pool
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Database Constraints to Enforce App Rules:
    PRIMARY KEY (group_id, user_id),     -- Enforces that a user can only link to a group once
    UNIQUE (group_id, rotation_position) -- Enforces that no two members can steal or share a position slot
);

-- â”€â”€â”€ STEP 6: CREATE THE GROUP CONTRIBUTION LEDGER â”€â”€â”€
CREATE TABLE group_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES savings_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);






-- â”€â”€â”€ STEP 7: CREATE THE GROUP PAYMENT SCHEDULE TABLE â”€â”€â”€
CREATE TABLE group_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES savings_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount_due NUMERIC(15, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    cycle_round INT NOT NULL,
    due_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
