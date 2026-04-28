/*
  # Complete Admin, Subscriptions & Gift Memberships Setup

  ## Summary
  Builds on existing partial schema to complete:
  1. Admin users table
  2. Complete lock fields on dating_profiles
  3. Membership tier fields on dating_profiles
  4. Complete gift_memberships table (add missing status/code/expiry columns)
  5. Subscription plans table
  6. User subscriptions table
  7. All RLS policies
*/

-- ============================================================
-- Admin users table
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  profile_id uuid PRIMARY KEY REFERENCES dating_profiles(id) ON DELETE CASCADE,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES dating_profiles(id) ON DELETE SET NULL
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_users' AND policyname='Admins can view admin list') THEN
    CREATE POLICY "Admins can view admin list"
      ON admin_users FOR SELECT TO authenticated
      USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_users' AND policyname='Admins can insert admin users') THEN
    CREATE POLICY "Admins can insert admin users"
      ON admin_users FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_users' AND policyname='Admins can delete admin users') THEN
    CREATE POLICY "Admins can delete admin users"
      ON admin_users FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()));
  END IF;
END $$;

-- ============================================================
-- Complete lock + membership fields on dating_profiles
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dating_profiles' AND column_name='locked_by') THEN
    ALTER TABLE dating_profiles ADD COLUMN locked_by uuid REFERENCES dating_profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dating_profiles' AND column_name='locked_at') THEN
    ALTER TABLE dating_profiles ADD COLUMN locked_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dating_profiles' AND column_name='membership_tier') THEN
    ALTER TABLE dating_profiles ADD COLUMN membership_tier text NOT NULL DEFAULT 'free'
      CHECK (membership_tier IN ('free', 'basic', 'premium'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dating_profiles' AND column_name='membership_expires_at') THEN
    ALTER TABLE dating_profiles ADD COLUMN membership_expires_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- Complete gift_memberships table (add missing columns)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gift_memberships' AND column_name='status') THEN
    ALTER TABLE gift_memberships ADD COLUMN status text NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'claimed', 'expired'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gift_memberships' AND column_name='gift_code') THEN
    ALTER TABLE gift_memberships ADD COLUMN gift_code text UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex');
    -- Populate existing rows with a code
    UPDATE gift_memberships SET gift_code = encode(gen_random_bytes(8), 'hex') WHERE gift_code IS NULL;
    ALTER TABLE gift_memberships ALTER COLUMN gift_code SET NOT NULL;
    ALTER TABLE gift_memberships ALTER COLUMN gift_code SET DEFAULT encode(gen_random_bytes(8), 'hex');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gift_memberships' AND column_name='expires_at') THEN
    ALTER TABLE gift_memberships ADD COLUMN expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gift_memberships' AND column_name='claimed_at') THEN
    ALTER TABLE gift_memberships ADD COLUMN claimed_at timestamptz;
  END IF;
END $$;

ALTER TABLE gift_memberships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gift_memberships' AND policyname='Users can view own gifts') THEN
    CREATE POLICY "Users can view own gifts"
      ON gift_memberships FOR SELECT TO authenticated
      USING (sender_id = auth.uid() OR recipient_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gift_memberships' AND policyname='Users can send gifts') THEN
    CREATE POLICY "Users can send gifts"
      ON gift_memberships FOR INSERT TO authenticated
      WITH CHECK (sender_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gift_memberships' AND policyname='Recipients can claim gifts') THEN
    CREATE POLICY "Recipients can claim gifts"
      ON gift_memberships FOR UPDATE TO authenticated
      USING (recipient_id = auth.uid())
      WITH CHECK (recipient_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gift_memberships' AND policyname='Admins can view all gifts') THEN
    CREATE POLICY "Admins can view all gifts"
      ON gift_memberships FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()));
  END IF;
END $$;

-- ============================================================
-- Subscription plans
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_dkk integer NOT NULL,
  duration_days integer NOT NULL,
  features jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscription_plans' AND policyname='Anyone authenticated can view plans') THEN
    CREATE POLICY "Anyone authenticated can view plans"
      ON subscription_plans FOR SELECT TO authenticated
      USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscription_plans' AND policyname='Admins can manage plans') THEN
    CREATE POLICY "Admins can manage plans"
      ON subscription_plans FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscription_plans' AND policyname='Admins can update plans') THEN
    CREATE POLICY "Admins can update plans"
      ON subscription_plans FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()));
  END IF;
END $$;

INSERT INTO subscription_plans (id, name, price_dkk, duration_days, features, sort_order)
VALUES
  ('basic_monthly', 'Basic', 49, 30, '["Ubegrænset beskedudveksling", "Se hvem der har besøgt din profil", "Avanceret søgning", "Ingen reklamer"]'::jsonb, 1),
  ('premium_monthly', 'Premium', 99, 30, '["Alt i Basic", "Fremhævet profil i søgning", "Se hvem der kan lide dine billeder", "Prioriteret kundesupport", "Eksklusivt Premium-badge"]'::jsonb, 2),
  ('premium_yearly', 'Premium Årlig', 799, 365, '["Alt i Premium", "Spar 33% ift. månedlig", "Gratis gavemembership til én ven"]'::jsonb, 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- User subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  gifted_by uuid REFERENCES dating_profiles(id) ON DELETE SET NULL,
  payment_ref text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_subscriptions' AND policyname='Users can view own subscriptions') THEN
    CREATE POLICY "Users can view own subscriptions"
      ON user_subscriptions FOR SELECT TO authenticated
      USING (profile_id = auth.uid() OR gifted_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_subscriptions' AND policyname='Users can insert own subscriptions') THEN
    CREATE POLICY "Users can insert own subscriptions"
      ON user_subscriptions FOR INSERT TO authenticated
      WITH CHECK (profile_id = auth.uid() OR gifted_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_subscriptions' AND policyname='Users can update own subscriptions') THEN
    CREATE POLICY "Users can update own subscriptions"
      ON user_subscriptions FOR UPDATE TO authenticated
      USING (profile_id = auth.uid())
      WITH CHECK (profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_subscriptions' AND policyname='Admins can view all subscriptions') THEN
    CREATE POLICY "Admins can view all subscriptions"
      ON user_subscriptions FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()));
  END IF;
END $$;

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_dating_photos_approval_status ON dating_photos(approval_status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_profile_id ON user_subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gift_memberships_recipient_id ON gift_memberships(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_memberships_gift_code ON gift_memberships(gift_code);

-- ============================================================
-- Admin RLS additions on existing tables
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dating_profiles' AND policyname='Admins can update any dating profile') THEN
    CREATE POLICY "Admins can update any dating profile"
      ON dating_profiles FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dating_photos' AND policyname='Admins can view all photos') THEN
    CREATE POLICY "Admins can view all photos"
      ON dating_photos FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dating_photos' AND policyname='Admins can update any photo') THEN
    CREATE POLICY "Admins can update any photo"
      ON dating_photos FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.profile_id = auth.uid()));
  END IF;
END $$;
